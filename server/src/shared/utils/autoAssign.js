import ProviderProfile from '../../models/ProviderProfile.model.js';
import ProviderRequest from '../../models/ProviderRequest.model.js';
import Booking from '../../models/Booking.model.js';
import User from '../../models/User.model.js';
import { BOOKING_STATUS } from '../../config/constants.js';
import { sendBookingNotificationSMS } from './sms.js';
import logger from './logger.js';

const AUTO_ASSIGN_CONFIG = {
  defaultRadius: 15,
  maxProviders: 5,
  requestExpiryMinutes: 2,
  maxAttempts: 3,
  scoreWeights: {
    rating: 0.4,
    distance: 0.3,
    acceptanceRate: 0.3,
  },
};

function calculateDistance(coord1, coord2) {
  const R = 6371;
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[1] * Math.PI) / 180) *
      Math.cos((coord2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateProviderScore(provider, bookingLocation) {
  const weights = AUTO_ASSIGN_CONFIG.scoreWeights;

  const ratingScore = (provider.rating || 0) * 20;

  let distance = 0;
  if (provider.baseLocation?.coordinates && bookingLocation) {
    distance = calculateDistance(provider.baseLocation.coordinates, bookingLocation);
  }
  const distanceScore = Math.max(0, 100 - distance * 5);

  const acceptanceScore = provider.acceptanceRate || 100;

  return (
    ratingScore * weights.rating +
    distanceScore * weights.distance +
    acceptanceScore * weights.acceptanceRate
  );
}

function isWithinSchedule(schedule, scheduledDate, scheduledTime) {
  if (!schedule || schedule.length === 0) {
    return true;
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[new Date(scheduledDate).getDay()];

  const daySchedule = schedule.find((s) => s.day === dayName);
  if (!daySchedule || !daySchedule.isAvailable) {
    return false;
  }

  if (daySchedule.startTime && daySchedule.endTime) {
    const [bookingHour, bookingMinute] = scheduledTime.split(':').map(Number);
    const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);

    const bookingMinutes = bookingHour * 60 + bookingMinute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return bookingMinutes >= startMinutes && bookingMinutes <= endMinutes;
  }

  return true;
}

async function findAvailableProviders(booking) {
  const serviceId = booking.service._id || booking.service;
  
  const address = booking.address;
  let bookingLocation = null;
  
  if (address.location?.coordinates) {
    bookingLocation = address.location.coordinates;
  } else if (address.coordinates) {
    bookingLocation = [address.coordinates.longitude, address.coordinates.latitude];
  }

  if (!bookingLocation) {
    logger.warn('No coordinates found for booking address', { bookingId: booking._id });
    return [];
  }

  const radius = AUTO_ASSIGN_CONFIG.defaultRadius;

  const providers = await ProviderProfile.find({
    status: 'approved',
    isAvailable: true,
    isDeleted: false,
    serviceCategories: serviceId,
    baseLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: bookingLocation,
        },
        $maxDistance: radius * 1000,
      },
    },
  })
    .populate('user', 'name phone email')
    .populate('serviceCategories', 'name')
    .limit(20);

  const eligibleProviders = providers.filter((provider) => {
    if (!provider.user) return false;

    if (
      !isWithinSchedule(
        provider.availabilitySchedule,
        booking.scheduledDate,
        booking.scheduledTime
      )
    ) {
      return false;
    }

    return true;
  });

  const scoredProviders = eligibleProviders.map((provider) => ({
    provider,
    score: calculateProviderScore(provider, bookingLocation),
    distance: calculateDistance(provider.baseLocation.coordinates, bookingLocation),
  }));

  scoredProviders.sort((a, b) => b.score - a.score);

  return scoredProviders.slice(0, AUTO_ASSIGN_CONFIG.maxProviders);
}

export async function initiateAutoAssignment(booking) {
  try {
    const providers = await findAvailableProviders(booking);

    if (providers.length === 0) {
      logger.warn('No available providers found for booking', {
        bookingId: booking._id,
        serviceId: booking.service,
      });
      return {
        success: false,
        message: 'No providers available in your area at this time',
        providersFound: 0,
      };
    }

    const bookingLocation = booking.address?.location?.coordinates ||
      (booking.address?.coordinates && [
        booking.address.coordinates.longitude,
        booking.address.coordinates.latitude,
      ]);

    const requests = [];
    const expiryTime = new Date(Date.now() + AUTO_ASSIGN_CONFIG.requestExpiryMinutes * 60 * 1000);

    for (let i = 0; i < providers.length; i++) {
      const { provider, score, distance } = providers[i];

      const request = await ProviderRequest.create({
        booking: booking._id,
        provider: provider.user._id,
        providerProfile: provider._id,
        status: 'pending',
        expiresAt: expiryTime,
        distance,
        priority: Math.round(score),
        notificationSent: false,
      });

      requests.push(request);

      try {
        await sendBookingNotificationSMS(provider.user.phone, {
          bookingId: booking._id,
          service: booking.service?.name || 'Service',
          customerName: booking.customer?.name || 'Customer',
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          distance: distance.toFixed(1),
        });

        request.notificationSent = true;
        request.notificationSentAt = new Date();
        await request.save();
      } catch (smsError) {
        logger.error('Failed to send SMS notification', {
          providerId: provider.user._id,
          error: smsError.message,
        });
      }
    }

    await Booking.findByIdAndUpdate(booking._id, {
      $inc: { assignmentAttempts: 1 },
    });

    logger.info('Auto-assignment initiated', {
      bookingId: booking._id,
      providersNotified: requests.length,
      topProviderScore: providers[0]?.score,
    });

    return {
      success: true,
      message: `Request sent to ${requests.length} nearby providers`,
      providersFound: requests.length,
      expiresAt: expiryTime,
    };
  } catch (error) {
    logger.error('Auto-assignment failed', {
      bookingId: booking._id,
      error: error.message,
    });
    throw error;
  }
}

export async function handleProviderAcceptance(bookingId, providerId) {
  try {
    const acceptedRequest = await ProviderRequest.findOne({
      booking: bookingId,
      provider: providerId,
      status: 'pending',
    });

    if (!acceptedRequest) {
      return { success: false, message: 'Request not found or already processed' };
    }

    if (acceptedRequest.isExpired()) {
      acceptedRequest.status = 'expired';
      await acceptedRequest.save();
      return { success: false, message: 'Request has expired' };
    }

    await acceptedRequest.accept();

    const cancelResult = await ProviderRequest.cancelAllForBooking(bookingId, providerId);

    const providerProfile = await ProviderProfile.findById(acceptedRequest.providerProfile);
    if (providerProfile) {
      await providerProfile.updateAcceptanceRate(true);
    }

    return {
      success: true,
      message: 'Booking accepted successfully',
      cancelledRequests: cancelResult.modifiedCount,
    };
  } catch (error) {
    logger.error('Error handling provider acceptance', {
      bookingId,
      providerId,
      error: error.message,
    });
    throw error;
  }
}

export async function handleProviderRejection(bookingId, providerId, reason = null) {
  try {
    const request = await ProviderRequest.findOne({
      booking: bookingId,
      provider: providerId,
      status: 'pending',
    });

    if (!request) {
      return { success: false, message: 'Request not found or already processed' };
    }

    await request.reject(reason);

    const providerProfile = await ProviderProfile.findById(request.providerProfile);
    if (providerProfile) {
      await providerProfile.updateAcceptanceRate(false);
    }

    const remainingRequests = await ProviderRequest.countDocuments({
      booking: bookingId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (remainingRequests === 0) {
      const booking = await Booking.findById(bookingId);
      if (booking && booking.assignmentAttempts < AUTO_ASSIGN_CONFIG.maxAttempts) {
        logger.info('No pending requests, initiating new assignment round', { bookingId });
        await initiateAutoAssignment(booking);
      }
    }

    return {
      success: true,
      message: 'Booking rejected',
      remainingRequests,
    };
  } catch (error) {
    logger.error('Error handling provider rejection', {
      bookingId,
      providerId,
      error: error.message,
    });
    throw error;
  }
}

export async function checkAndExpireRequests() {
  const expiredRequests = await ProviderRequest.find({
    status: 'pending',
    expiresAt: { $lt: new Date() },
  });

  for (const request of expiredRequests) {
    await request.expire();

    const providerProfile = await ProviderProfile.findById(request.providerProfile);
    if (providerProfile) {
      await providerProfile.updateAcceptanceRate(false);
    }
  }

  const bookingsWithNoRequests = await Booking.find({
    status: BOOKING_STATUS.CONFIRMED,
    provider: { $exists: false },
    assignmentAttempts: { $lt: AUTO_ASSIGN_CONFIG.maxAttempts },
  });

  for (const booking of bookingsWithNoRequests) {
    const pendingRequests = await ProviderRequest.countDocuments({
      booking: booking._id,
      status: 'pending',
    });

    if (pendingRequests === 0) {
      await initiateAutoAssignment(booking);
    }
  }

  return {
    expiredCount: expiredRequests.length,
    reattemptCount: bookingsWithNoRequests.length,
  };
}

export async function getProvidersForService(serviceId, longitude, latitude, radius = 15) {
  const providers = await ProviderProfile.find({
    status: 'approved',
    isDeleted: false,
    serviceCategories: serviceId,
    baseLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radius * 1000,
      },
    },
  })
    .populate('user', 'name phone avatar')
    .populate('serviceCategories', 'name category')
    .limit(10);

  return providers.map((provider) => ({
    id: provider._id,
    userId: provider.user._id,
    name: provider.user.name,
    avatar: provider.user.avatar || provider.profilePhoto?.url,
    specialization: provider.specialization,
    providerType: provider.providerType,
    rating: provider.rating,
    totalReviews: provider.totalReviews,
    completionRate: provider.completionRate,
    services: provider.serviceCategories,
    isAvailable: provider.isAvailable,
    distance: provider.baseLocation?.coordinates
      ? calculateDistance(provider.baseLocation.coordinates, [longitude, latitude])
      : null,
  }));
}

export default {
  initiateAutoAssignment,
  handleProviderAcceptance,
  handleProviderRejection,
  checkAndExpireRequests,
  getProvidersForService,
  calculateDistance,
};

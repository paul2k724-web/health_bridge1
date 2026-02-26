import providerRepository from './provider.repository.js';
import bookingService from '../bookings/booking.service.js';
import User from '../../models/User.model.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../shared/errors/index.js';
import { PROVIDER_STATUS, USER_ROLES, BOOKING_STATUS } from '../../config/constants.js';
import { getPaginationParams } from '../../shared/utils/pagination.js';
import {
  generateGoogleMapsNavigationUrl,
  generateWhatsAppUrl,
  formatBookingWhatsAppMessage,
  calculateDistance,
} from '../../shared/utils/geo.js';
import AuditLog from '../../models/AuditLog.model.js';

class ProviderService {
  async registerProvider(userId, profileData) {
    const existingProfile = await providerRepository.findProfileByUser(userId);
    if (existingProfile) {
      throw new ConflictError('Provider profile already exists');
    }

    const existingLicense = await providerRepository.findAllProfiles({
      licenseNumber: profileData.licenseNumber,
    });
    if (existingLicense && existingLicense.length > 0) {
      throw new ConflictError('License number already registered');
    }

    const profile = await providerRepository.createProfile({
      user: userId,
      ...profileData,
      status: PROVIDER_STATUS.PENDING,
    });

    await AuditLog.create({
      action: 'PROVIDER_REGISTERED',
      actor: { userId, role: USER_ROLES.PROVIDER },
      target: { type: 'ProviderProfile', id: profile._id },
      metadata: { specialization: profileData.specialization },
    });

    return profile;
  }

  async getProfile(userId) {
    const profile = await providerRepository.findProfileByUser(userId);
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }
    return profile;
  }

  async updateProfile(userId, updateData) {
    const profile = await providerRepository.findProfileByUser(userId);
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    const updated = await providerRepository.updateProfile(userId, updateData);
    return updated;
  }

  async updateLocation(userId, longitude, latitude) {
    const profile = await providerRepository.findProfileByUser(userId);
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    const updated = await providerRepository.updateLocation(userId, longitude, latitude);
    return { message: 'Location updated successfully', lastUpdate: updated.lastLocationUpdate };
  }

  async getJobs(userId, query = {}) {
    const profile = await providerRepository.findProfileByUser(userId);
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    if (profile.status !== PROVIDER_STATUS.APPROVED) {
      throw new ForbiddenError('Your account is not yet approved');
    }

    const { page, limit, skip } = getPaginationParams(query);

    const filter = {};
    if (query.status) {
      filter.status = query.status;
    }

    const jobs = await providerRepository.getProviderJobs(userId, filter, { skip, limit });
    const total = await providerRepository.countJobs(userId, query.status);

    return {
      jobs,
      pagination: { page, limit, total },
    };
  }

  async getAvailableJobs(userId, query = {}) {
    const profile = await providerRepository.findProfileByUser(userId);
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    if (profile.status !== PROVIDER_STATUS.APPROVED) {
      throw new ForbiddenError('Your account is not yet approved');
    }

    const { page, limit, skip } = getPaginationParams(query);

    const jobs = await providerRepository.getAvailableJobs(userId, { skip, limit });
    const total = await providerRepository.countAvailableJobs(userId);

    return {
      jobs,
      pagination: { page, limit, total },
    };
  }

  async acceptJob(userId, jobId) {
    return await bookingService.acceptBooking(jobId, userId);
  }

  async rejectJob(userId, jobId) {
    return await bookingService.rejectBooking(jobId, userId);
  }

  async updateJobStatus(userId, jobId, newStatus) {
    return await bookingService.updateStatus(jobId, newStatus, userId, USER_ROLES.PROVIDER);
  }

  async getEarnings(userId) {
    const profile = await providerRepository.findProfileByUser(userId);
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    const earnings = await providerRepository.getProviderEarnings(userId);
    const recentBookings = await providerRepository.getRecentCompletedJobs(userId, 5);

    return {
      earnings: {
        total: earnings.total,
        pending: profile.earnings?.pending || earnings.total,
        paid: profile.earnings?.paid || 0,
      },
      recentBookings,
    };
  }

  async getNavigationUrl(userId, bookingId) {
    const profile = await providerRepository.findProfileByUser(userId);
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    const Booking = (await import('../../models/Booking.model.js')).default;
    const booking = await Booking.findById(bookingId)
      .populate('address')
      .populate('service', 'name');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.provider?.toString() !== userId) {
      throw new ForbiddenError('You are not assigned to this booking');
    }

    const address = booking.address;
    let coordinates = null;

    if (address?.location?.coordinates) {
      coordinates = address.location.coordinates;
    } else if (address?.coordinates) {
      coordinates = [address.coordinates.longitude, address.coordinates.latitude];
    }

    if (!coordinates) {
      throw new ValidationError('No coordinates available for this address');
    }

    const [longitude, latitude] = coordinates;
    const navigationUrl = generateGoogleMapsNavigationUrl(latitude, longitude);

    return {
      navigationUrl,
      destination: {
        address: `${address.addressLine1}, ${address.city}`,
        coordinates: { latitude, longitude },
      },
    };
  }

  async getWhatsAppUrl(userId, bookingId) {
    const Booking = (await import('../../models/Booking.model.js')).default;
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name phone')
      .populate('service', 'name')
      .populate('address');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.provider?.toString() !== userId) {
      throw new ForbiddenError('You are not assigned to this booking');
    }

    if (!booking.customer?.phone) {
      throw new ValidationError('Customer phone number not available');
    }

    const message = formatBookingWhatsAppMessage(booking);
    const whatsappUrl = generateWhatsAppUrl(booking.customer.phone, message);

    return {
      whatsappUrl,
      customerPhone: booking.customer.phone,
    };
  }

  async getAllProviders(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);

    const filter = {};
    if (query.status) {
      filter.status = query.status;
    }

    const providers = await providerRepository.findAllProfiles(filter, { skip, limit });
    const total = await providerRepository.countProfiles(filter);

    return {
      providers,
      pagination: { page, limit, total },
    };
  }

  async approveProvider(id, adminId, reason = null) {
    let profile = await providerRepository.findProfileById(id);
    
    if (!profile) {
      profile = await providerRepository.findProfileByUser(id);
    }
    
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    if (profile.status !== PROVIDER_STATUS.PENDING) {
      throw new ValidationError('Only pending providers can be approved');
    }

    const updated = await providerRepository.updateProfileStatus(profile._id, PROVIDER_STATUS.APPROVED, {
      approvedAt: new Date(),
      approvedBy: adminId,
    });

    await User.findByIdAndUpdate(profile.user._id || profile.user, { isVerified: true });

    await AuditLog.create({
      action: 'PROVIDER_APPROVED',
      actor: { userId: adminId, role: USER_ROLES.ADMIN },
      target: { type: 'ProviderProfile', id: profile._id },
      reason,
    });

    return updated;
  }

  async rejectProvider(id, adminId, rejectionReason) {
    let profile = await providerRepository.findProfileById(id);
    
    if (!profile) {
      profile = await providerRepository.findProfileByUser(id);
    }
    
    if (!profile) {
      throw new NotFoundError('Provider profile not found');
    }

    if (profile.status !== PROVIDER_STATUS.PENDING) {
      throw new ValidationError('Only pending providers can be rejected');
    }

    const updated = await providerRepository.updateProfileStatus(profile._id, PROVIDER_STATUS.REJECTED, {
      rejectionReason,
    });

    await AuditLog.create({
      action: 'PROVIDER_REJECTED',
      actor: { userId: adminId, role: USER_ROLES.ADMIN },
      target: { type: 'ProviderProfile', id: profile._id },
      reason: rejectionReason,
    });

    return updated;
  }
}

export default new ProviderService();

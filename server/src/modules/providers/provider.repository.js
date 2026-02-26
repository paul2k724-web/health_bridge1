import User from '../../models/User.model.js';
import ProviderProfile from '../../models/ProviderProfile.model.js';
import Booking from '../../models/Booking.model.js';
import ProviderRequest from '../../models/ProviderRequest.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import mongoose from 'mongoose';

class ProviderRepository {
  async findProfileByUser(userId) {
    return await ProviderProfile.findOne({ user: userId })
      .populate('user', 'name email phone')
      .populate('serviceCategories');
  }

  async findProfileById(id) {
    return await ProviderProfile.findById(id)
      .populate('user', 'name email phone')
      .populate('serviceCategories');
  }

  async createProfile(profileData) {
    return await ProviderProfile.create(profileData);
  }

  async updateProfile(userId, updateData) {
    return await ProviderProfile.findOneAndUpdate(
      { user: userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email phone');
  }

  async findAllProfiles(filter = {}, options = {}) {
    const query = { isDeleted: false };

    if (filter.status) {
      query.status = filter.status;
    }

    let profilesQuery = ProviderProfile.find(query)
      .populate('user', 'name email phone')
      .populate('serviceCategories', 'name')
      .sort({ createdAt: -1 });

    if (options.skip) {
      profilesQuery = profilesQuery.skip(options.skip);
    }

    if (options.limit) {
      profilesQuery = profilesQuery.limit(options.limit);
    }

    return await profilesQuery;
  }

  async findPendingProfiles(options = {}) {
    return await this.findAllProfiles({ status: 'pending' }, options);
  }

  async findApprovedProfiles(options = {}) {
    return await this.findAllProfiles({ status: 'approved' }, options);
  }

  async updateProfileStatus(profileId, status, additionalData = {}) {
    return await ProviderProfile.findByIdAndUpdate(
      profileId,
      { status, ...additionalData },
      { new: true }
    ).populate('user', 'name email phone');
  }

  async updateLocation(userId, longitude, latitude) {
    return await ProviderProfile.findOneAndUpdate(
      { user: userId },
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        lastLocationUpdate: new Date(),
      },
      { new: true }
    );
  }

  async findProvidersWithinRadius(longitude, latitude, radiusKm, serviceId = null) {
    const query = {
      status: 'approved',
      isAvailable: true,
      isDeleted: false,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000,
        },
      },
    };

    if (serviceId) {
      query.serviceCategories = serviceId;
    }

    return await ProviderProfile.find(query)
      .populate('user', 'name phone')
      .select('-currentLocation');
  }

  async getProviderJobs(providerId, filter = {}, options = {}) {
    const query = {
      provider: providerId,
      isDeleted: false,
    };

    if (filter.status) {
      query.status = filter.status;
    }

    let bookingsQuery = Booking.find(query)
      .populate('service', 'name duration')
      .populate('customer', 'name phone')
      .populate('address')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    if (options.skip) {
      bookingsQuery = bookingsQuery.skip(options.skip);
    }

    if (options.limit) {
      bookingsQuery = bookingsQuery.limit(options.limit);
    }

    return await bookingsQuery;
  }

  async getAvailableJobs(providerId, options = {}) {
    const pendingRequests = await ProviderRequest.find({
      provider: providerId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .sort({ priority: -1, createdAt: 1 })
      .skip(options.skip || 0)
      .limit(options.limit || 20);

    if (pendingRequests.length === 0) {
      return [];
    }

    const bookingIds = pendingRequests.map(r => r.booking);

    const bookings = await Booking.find({
      _id: { $in: bookingIds },
      status: 'confirmed',
      provider: { $exists: false },
    })
      .populate('service', 'name description duration basePrice')
      .populate('customer', 'name phone')
      .populate('address');

    const requestMap = new Map(pendingRequests.map(r => [r.booking.toString(), r]));

    return bookings.map(booking => {
      const request = requestMap.get(booking._id.toString());
      return {
        ...booking.toObject(),
        requestId: request?._id,
        distance: request?.distance,
        priority: request?.priority,
        expiresAt: request?.expiresAt,
      };
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  async countAvailableJobs(providerId) {
    return await ProviderRequest.countDocuments({
      provider: providerId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
  }

  async countJobs(providerId, status = null) {
    const query = { provider: providerId, isDeleted: false };
    if (status) query.status = status;
    return await Booking.countDocuments(query);
  }

  async getProviderEarnings(providerId) {
    const result = await Booking.aggregate([
      {
        $match: {
          provider: new mongoose.Types.ObjectId(providerId),
          status: 'completed',
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount.finalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return result[0] || { total: 0, count: 0 };
  }

  async getRecentCompletedJobs(providerId, limit = 5) {
    return await Booking.find({
      provider: providerId,
      status: 'completed',
      isDeleted: false,
    })
      .populate('service', 'name')
      .populate('customer', 'name')
      .sort({ completedAt: -1 })
      .limit(limit);
  }

  async countProfiles(filter = {}) {
    const query = { isDeleted: false, ...filter };
    return await ProviderProfile.countDocuments(query);
  }

  async createAuditLog(logData) {
    return await AuditLog.create(logData);
  }
}

export default new ProviderRepository();

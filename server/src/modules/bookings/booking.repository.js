import Booking from '../../models/Booking.model.js';
import ServiceCategory from '../../models/ServiceCategory.model.js';
import Address from '../../models/Address.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import mongoose from 'mongoose';

class BookingRepository {
  async findById(id) {
    return await Booking.findById(id)
      .populate('service', 'name description duration basePrice discount')
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('providerProfile')
      .populate('address');
  }

  async findByCustomer(customerId, options = {}) {
    const query = { customer: customerId, isDeleted: false };

    if (options.status) {
      query.status = options.status;
    }

    let bookingsQuery = Booking.find(query)
      .populate('service', 'name description duration')
      .populate('provider', 'name phone')
      .populate('address')
      .sort({ createdAt: -1 });

    if (options.skip) {
      bookingsQuery = bookingsQuery.skip(options.skip);
    }

    if (options.limit) {
      bookingsQuery = bookingsQuery.limit(options.limit);
    }

    return await bookingsQuery;
  }

  async findByProvider(providerId, options = {}) {
    const query = { provider: providerId, isDeleted: false };

    if (options.status) {
      if (Array.isArray(options.status)) {
        query.status = { $in: options.status };
      } else {
        query.status = options.status;
      }
    }

    let bookingsQuery = Booking.find(query)
      .populate('service', 'name description duration')
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

  async findAll(options = {}) {
    const query = { isDeleted: false };

    if (options.status) {
      query.status = options.status;
    }

    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = new Date(options.startDate);
      if (options.endDate) {
        const end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (options.serviceId) {
      query.service = options.serviceId;
    }

    if (options.providerId) {
      query.provider = options.providerId;
    }

    if (options.customerId) {
      query.customer = options.customerId;
    }

    let bookingsQuery = Booking.find(query)
      .populate('service', 'name')
      .populate('customer', 'name email phone')
      .populate('provider', 'name')
      .populate('address')
      .sort({ createdAt: -1 });

    if (options.skip) {
      bookingsQuery = bookingsQuery.skip(options.skip);
    }

    if (options.limit) {
      bookingsQuery = bookingsQuery.limit(options.limit);
    }

    return await bookingsQuery;
  }

  async findByIdempotencyKey(key) {
    return await Booking.findOne({ idempotencyKey: key });
  }

  async checkSlotConflict(customerId, serviceId, scheduledDate, scheduledTime, excludeId = null) {
    const query = {
      customer: customerId,
      service: serviceId,
      scheduledDate,
      scheduledTime,
      status: { $nin: ['cancelled', 'rejected'] },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await Booking.findOne(query);
  }

  async checkProviderConflict(providerId, scheduledDate, scheduledTime, excludeId = null) {
    const query = {
      provider: providerId,
      scheduledDate,
      scheduledTime,
      status: { $nin: ['cancelled', 'rejected', 'completed'] },
      isDeleted: false,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await Booking.findOne(query);
  }

  async create(bookingData, session = null) {
    const options = session ? { session } : {};
    if (Array.isArray(bookingData)) {
      return await Booking.create(bookingData, options);
    }
    return await Booking.create([bookingData], options);
  }

  async updateStatus(bookingId, status, additionalData = {}, session = null) {
    const update = {
      status,
      ...additionalData,
    };

    const options = { new: true, runValidators: true };
    if (session) options.session = session;

    return await Booking.findByIdAndUpdate(bookingId, update, options);
  }

  async assignProvider(bookingId, providerId, providerProfileId, session = null) {
    const options = { new: true };
    if (session) options.session = session;

    return await Booking.findByIdAndUpdate(
      bookingId,
      {
        provider: providerId,
        providerProfile: providerProfileId,
      },
      options
    );
  }

  async countByCustomer(customerId, status = null) {
    const query = { customer: customerId, isDeleted: false };
    if (status) query.status = status;
    return await Booking.countDocuments(query);
  }

  async countByProvider(providerId, status = null) {
    const query = { provider: providerId, isDeleted: false };
    if (status) query.status = status;
    return await Booking.countDocuments(query);
  }

  async countAll(filter = {}) {
    return await Booking.countDocuments({ ...filter, isDeleted: false });
  }

  async getEarningsByProvider(providerId) {
    const result = await Booking.aggregate([
      {
        $match: {
          provider: mongoose.Types.ObjectId(providerId),
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

  async findForExport(filter = {}) {
    const query = { isDeleted: false, ...filter };
    
    return Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('provider', 'name')
      .populate('service', 'name')
      .populate('address')
      .sort({ createdAt: -1 })
      .lean();
  }

  async createAuditLog(logData) {
    return await AuditLog.create(logData);
  }
}

export default new BookingRepository();

import User from '../../models/User.model.js';
import ProviderProfile from '../../models/ProviderProfile.model.js';
import Booking from '../../models/Booking.model.js';
import ServiceCategory from '../../models/ServiceCategory.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import RefreshToken from '../../models/RefreshToken.model.js';
import mongoose from 'mongoose';

class AdminRepository {
  async findAllUsers(filter = {}, options = {}) {
    const query = { isDeleted: false };

    if (filter.role) {
      query.role = filter.role;
    }

    if (filter.isBlocked !== undefined) {
      query.isBlocked = filter.isBlocked === 'true';
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
        { phone: { $regex: filter.search, $options: 'i' } },
      ];
    }

    let usersQuery = User.find(query)
      .select('-password -otp')
      .sort({ createdAt: -1 });

    if (options.skip) {
      usersQuery = usersQuery.skip(options.skip);
    }

    if (options.limit) {
      usersQuery = usersQuery.limit(options.limit);
    }

    return await usersQuery;
  }

  async countUsers(filter = {}) {
    const query = { isDeleted: false, ...filter };
    return await User.countDocuments(query);
  }

  async findUserById(id) {
    return await User.findById(id).select('-password');
  }

  async updateUser(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
  }

  async blockUser(id, reason = null) {
    const update = {
      isBlocked: true,
      blockedAt: new Date(),
      blockedReason: reason,
    };
    return await this.updateUser(id, update);
  }

  async unblockUser(id) {
    const update = {
      isBlocked: false,
      $unset: { blockedAt: 1, blockedReason: 1 },
    };
    return await this.updateUser(id, update);
  }

  async invalidateUserTokens(userId) {
    return await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'User blocked',
      }
    );
  }

  async getDashboardStats() {
    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      totalAdmins,
      blockedUsers,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      revenue,
      totalServices,
      activeServices,
      pendingProviders,
      approvedProviders,
    ] = await Promise.all([
      this.countUsers(),
      this.countUsers({ role: 'customer' }),
      this.countUsers({ role: 'provider' }),
      this.countUsers({ role: 'admin' }),
      this.countUsers({ isBlocked: true }),
      Booking.countDocuments({ isDeleted: false }),
      Booking.countDocuments({ status: 'pending', isDeleted: false }),
      Booking.countDocuments({ status: 'confirmed', isDeleted: false }),
      Booking.countDocuments({ status: 'completed', isDeleted: false }),
      Booking.countDocuments({ status: 'cancelled', isDeleted: false }),
      Booking.aggregate([
        { $match: { status: 'completed', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount.finalAmount' } } },
      ]),
      ServiceCategory.countDocuments({ isDeleted: false }),
      ServiceCategory.countDocuments({ isActive: true, isDeleted: false }),
      ProviderProfile.countDocuments({ status: 'pending', isDeleted: false }),
      ProviderProfile.countDocuments({ status: 'approved', isDeleted: false }),
    ]);

    return {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        providers: totalProviders,
        admins: totalAdmins,
        blocked: blockedUsers,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0,
      },
      revenue: {
        total: revenue[0]?.total || 0,
      },
      services: {
        total: totalServices,
        active: activeServices,
      },
      providers: {
        pending: pendingProviders,
        approved: approvedProviders,
      },
    };
  }

  async getRecentBookings(limit = 10) {
    return await Booking.find({ isDeleted: false })
      .populate('customer', 'name email')
      .populate('provider', 'name')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getBookingsForExport(filter = {}) {
    const query = { isDeleted: false };

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    return await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('provider', 'name')
      .populate('service', 'name')
      .populate('address')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getBookingsPerDay(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getProviderPerformance(limit = 10) {
    return await Booking.aggregate([
      {
        $match: {
          provider: { $ne: null },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$provider',
          totalJobs: { $sum: 1 },
          completedJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalEarnings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount.finalAmount', 0] },
          },
        },
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [{ $divide: ['$completedJobs', '$totalJobs'] }, 100],
          },
        },
      },
      { $sort: { completedJobs: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'provider',
        },
      },
      { $unwind: '$provider' },
      {
        $project: {
          _id: 1,
          name: '$provider.name',
          totalJobs: 1,
          completedJobs: 1,
          totalEarnings: 1,
          completionRate: { $round: ['$completionRate', 1] },
        },
      },
    ]);
  }

  async createAuditLog(logData) {
    return await AuditLog.create(logData);
  }
}

export default new AdminRepository();

import adminRepository from './admin.repository.js';
import { NotFoundError, ValidationError } from '../../shared/errors/index.js';
import { getPaginationParams } from '../../shared/utils/pagination.js';
import { invalidateUserTokens } from '../../shared/middleware/auth.middleware.js';
import AuditLog from '../../models/AuditLog.model.js';

class AdminService {
  async getDashboardStats() {
    const stats = await adminRepository.getDashboardStats();
    const recentBookings = await adminRepository.getRecentBookings(10);

    return {
      stats: {
        totalUsers: stats.users.total,
        totalProviders: stats.providers.approved,
        pendingApprovals: stats.providers.pending,
        totalBookings: stats.bookings.total,
        pendingBookings: stats.bookings.pending,
        completedBookings: stats.bookings.completed,
        totalRevenue: stats.revenue.total,
      },
      recentBookings,
    };
  }

  async getAllUsers(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);

    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.isBlocked) filter.isBlocked = query.isBlocked;
    if (query.search) filter.search = query.search;

    const users = await adminRepository.findAllUsers(filter, { skip, limit });
    const total = await adminRepository.countUsers(filter);

    return {
      users,
      pagination: { page, limit, total },
    };
  }

  async blockUser(userId, adminId, reason = null) {
    const user = await adminRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'admin') {
      throw new ValidationError('Cannot block admin users');
    }

    const blockedUser = await adminRepository.blockUser(userId, reason);

    await invalidateUserTokens(userId, 'User blocked by admin');

    await AuditLog.create({
      action: 'USER_BLOCKED',
      actor: { userId: adminId, role: 'admin' },
      target: { type: 'User', id: userId },
      reason,
      changes: {
        before: { isBlocked: false },
        after: { isBlocked: true },
      },
    });

    return blockedUser;
  }

  async unblockUser(userId, adminId) {
    const user = await adminRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const unblockedUser = await adminRepository.unblockUser(userId);

    await AuditLog.create({
      action: 'USER_UNBLOCKED',
      actor: { userId: adminId, role: 'admin' },
      target: { type: 'User', id: userId },
      changes: {
        before: { isBlocked: true },
        after: { isBlocked: false },
      },
    });

    return unblockedUser;
  }

  async exportBookings(filter = {}) {
    const bookings = await adminRepository.getBookingsForExport(filter);

    if (filter.format === 'csv') {
      return { bookings, format: 'csv' };
    }

    return { bookings, format: 'json' };
  }

  async getAnalytics() {
    const [bookingsPerDay, providerPerformance] = await Promise.all([
      adminRepository.getBookingsPerDay(30),
      adminRepository.getProviderPerformance(10),
    ]);

    return {
      bookingsPerDay: bookingsPerDay.map((b) => ({
        date: b._id,
        count: b.count,
      })),
      topProviders: providerPerformance,
    };
  }

  async getUserById(userId) {
    const user = await adminRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}

export default new AdminService();

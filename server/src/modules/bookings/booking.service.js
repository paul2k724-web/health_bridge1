import mongoose from 'mongoose';
import Booking from '../../models/Booking.model.js';
import bookingRepository from './booking.repository.js';
import ServiceCategory from '../../models/ServiceCategory.model.js';
import Address from '../../models/Address.model.js';
import ProviderProfile from '../../models/ProviderProfile.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import {
  BOOKING_STATUS,
  STATUS_TRANSITIONS,
  MESSAGES,
  USER_ROLES,
} from '../../config/constants.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../shared/errors/index.js';
import { getPaginationParams, getDateRangeFilter } from '../../shared/utils/pagination.js';
import { sendBookingConfirmationEmail, sendStatusUpdateEmail } from '../../shared/utils/email.js';
import { sendBookingStatusSMS } from '../../shared/utils/sms.js';
import { handleProviderAcceptance, handleProviderRejection, initiateAutoAssignment } from '../../shared/utils/autoAssign.js';
import notificationService from '../notifications/notification.service.js';
import cacheService from '../../shared/utils/cache.js';
import logger from '../../shared/utils/logger.js';

class BookingService {
  async createBooking(customerId, bookingData) {
    const { serviceId, addressId, scheduledDate, scheduledTime, notes, idempotencyKey } = bookingData;

    if (idempotencyKey) {
      const existing = await bookingRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        return { booking: existing, duplicate: true };
      }
    }

    const existingBooking = await bookingRepository.checkSlotConflict(
      customerId,
      serviceId,
      scheduledDate,
      scheduledTime
    );
    if (existingBooking) {
      throw new ConflictError('You already have a booking for this time slot');
    }

    const service = await ServiceCategory.findById(serviceId);
    if (!service || !service.isActive) {
      throw new NotFoundError('Service not found or inactive');
    }

    const address = await Address.findOne({ _id: addressId, user: customerId });
    if (!address) {
      throw new NotFoundError('Address not found or does not belong to you');
    }

    let finalAmount = service.basePrice;
    if (service.hasActiveDiscount) {
      const discountAmount = (service.basePrice * service.discount.percentage) / 100;
      finalAmount = service.basePrice - discountAmount;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [booking] = await bookingRepository.create(
        [
          {
            customer: customerId,
            service: serviceId,
            address: addressId,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            status: BOOKING_STATUS.PENDING,
            confirmationMethod: 'manual',
            isConfirmed: false,
            amount: {
              basePrice: service.basePrice,
              discount: service.discount?.percentage || 0,
              finalAmount: Math.round(finalAmount * 100) / 100,
            },
            paymentStatus: 'na',
            notes,
            idempotencyKey,
          },
        ],
        session
      );

      booking.addStatusHistory(BOOKING_STATUS.PENDING, customerId);

      await booking.save({ session });

      await AuditLog.create(
        [
          {
            action: 'BOOKING_CREATED',
            actor: { userId: customerId, role: USER_ROLES.CUSTOMER },
            target: { type: 'Booking', id: booking._id },
            metadata: {
              serviceId,
              scheduledDate,
              scheduledTime,
              amount: finalAmount,
            },
          },
        ],
        { session }
      );

      await session.commitTransaction();

      const populatedBooking = await bookingRepository.findById(booking._id);

      notificationService.notifyBookingCreated(customerId, populatedBooking).catch(err => {
        logger.error('Failed to send booking notification', { error: err.message });
      });

      return { booking: populatedBooking, duplicate: false };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getCustomerBookings(customerId, query = {}) {
    const { page, limit, skip } = getPaginationParams(query);

    const filter = {};
    if (query.status) {
      filter.status = query.status;
    }

    const bookings = await bookingRepository.findByCustomer(customerId, {
      ...filter,
      skip,
      limit,
    });

    const total = await bookingRepository.countByCustomer(customerId, query.status);

    return {
      bookings,
      pagination: { page, limit, total },
    };
  }

  async getBookingById(bookingId, userId, userRole) {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (userRole === USER_ROLES.CUSTOMER && booking.customer._id.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this booking');
    }

    if (userRole === USER_ROLES.PROVIDER && booking.provider?._id?.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this booking');
    }

    return booking;
  }

  async acceptBooking(bookingId, providerId) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (!booking.canTransitionTo(BOOKING_STATUS.ACCEPTED)) {
      const validStatuses = booking.getNextStatuses();
      throw new ValidationError(
        `Cannot accept booking with status '${booking.status}'. ` +
        `Booking must be in 'confirmed' status. Current valid transitions: ${validStatuses.join(', ')}`
      );
    }

    const acceptResult = await handleProviderAcceptance(bookingId, providerId);
    if (!acceptResult.success) {
      throw new ValidationError(acceptResult.message);
    }

    const conflictingBooking = await bookingRepository.checkProviderConflict(
      providerId,
      booking.scheduledDate,
      booking.scheduledTime,
      bookingId
    );

    if (conflictingBooking) {
      throw new ConflictError('You already have another booking at this time');
    }

    const providerProfile = await ProviderProfile.findOne({ user: providerId });
    if (!providerProfile || providerProfile.status !== 'approved') {
      throw new ForbiddenError('Your provider account is not approved');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const previousStatus = booking.status;

      booking.addStatusHistory(BOOKING_STATUS.ACCEPTED, providerId);
      booking.provider = providerId;
      booking.providerProfile = providerProfile._id;
      booking.confirmedBy = providerId;
      booking.confirmedAt = new Date();
      booking.isConfirmed = true;

      await booking.save({ session });

      await providerProfile.incrementJob();

      await AuditLog.create(
        [
          {
            action: 'BOOKING_ACCEPTED',
            actor: { userId: providerId, role: USER_ROLES.PROVIDER },
            target: { type: 'Booking', id: booking._id },
            changes: {
              before: { status: previousStatus },
              after: { status: BOOKING_STATUS.ACCEPTED },
            },
          },
        ],
        { session }
      );

      await session.commitTransaction();

      const updatedBooking = await bookingRepository.findById(bookingId);

      this.notifyCustomer(updatedBooking);

      notificationService.notifyBookingAccepted(
        updatedBooking.customer._id,
        updatedBooking,
        providerId
      ).catch(err => {
        logger.error('Failed to send acceptance notification', { error: err.message });
      });

      return updatedBooking;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async rejectBooking(bookingId, providerId) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new ValidationError('Can only reject confirmed bookings');
    }

    const rejectResult = await handleProviderRejection(bookingId, providerId);
    if (!rejectResult.success) {
      throw new ValidationError(rejectResult.message);
    }

    await AuditLog.create({
      action: 'BOOKING_REJECTED_BY_PROVIDER',
      actor: { userId: providerId, role: USER_ROLES.PROVIDER },
      target: { type: 'Booking', id: booking._id },
      changes: {
        before: { status: booking.status },
        after: { status: booking.status, remainingRequests: rejectResult.remainingRequests },
      },
    });

    return await bookingRepository.findById(bookingId);
  }

  async updateStatus(bookingId, newStatus, userId, userRole, reason = null) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (userRole === USER_ROLES.PROVIDER && booking.provider?.toString() !== userId.toString()) {
      throw new ForbiddenError('You are not assigned to this booking');
    }

    if (!booking.canTransitionTo(newStatus)) {
      const validStatuses = booking.getNextStatuses();
      throw new ValidationError(
        `Cannot transition from '${booking.status}' to '${newStatus}'. ` +
        `Valid transitions: ${validStatuses.join(', ') || 'None'}`
      );
    }

    const previousStatus = booking.status;

    const updateData = {};
    if (newStatus === BOOKING_STATUS.COMPLETED) {
      updateData.completedAt = new Date();
    }
    if (newStatus === BOOKING_STATUS.CANCELLED) {
      updateData.cancelledBy = userId;
      updateData.cancellationReason = reason;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      booking.addStatusHistory(newStatus, userId, reason);
      Object.assign(booking, updateData);
      await booking.save({ session });

      if (newStatus === BOOKING_STATUS.COMPLETED && booking.providerProfile) {
        await ProviderProfile.findByIdAndUpdate(
          booking.providerProfile,
          { $inc: { completedJobs: 1 } },
          { session }
        );
        
        const providerProfile = await ProviderProfile.findById(booking.providerProfile);
        if (providerProfile) {
          await providerProfile.addEarnings(booking.amount.finalAmount);
        }
      }

      await AuditLog.create(
        [
          {
            action: 'BOOKING_STATUS_CHANGED',
            actor: { userId, role: userRole },
            target: { type: 'Booking', id: booking._id },
            changes: {
              before: { status: previousStatus },
              after: { status: newStatus },
            },
            reason,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      const updatedBooking = await bookingRepository.findById(bookingId);

      this.notifyCustomer(updatedBooking);

      if (newStatus === BOOKING_STATUS.COMPLETED) {
        notificationService.notifyBookingCompleted(
          updatedBooking.customer._id,
          updatedBooking
        ).catch(err => {
          logger.error('Failed to send completion notification', { error: err.message });
        });
      }

      if (newStatus === BOOKING_STATUS.CANCELLED) {
        notificationService.notifyBookingCancelled(
          updatedBooking.customer._id,
          updatedBooking,
          reason
        ).catch(err => {
          logger.error('Failed to send cancellation notification', { error: err.message });
        });
      }

      return updatedBooking;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAllBookings(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.serviceId) filter.serviceId = query.serviceId;
    if (query.providerId) filter.providerId = query.providerId;
    if (query.customerId) filter.customerId = query.customerId;

    const dateFilter = getDateRangeFilter(query, 'createdAt');

    const bookings = await bookingRepository.findAll({
      ...filter,
      ...dateFilter,
      skip,
      limit,
    });

    const total = await bookingRepository.countAll({ ...filter, ...dateFilter });

    return {
      bookings,
      pagination: { page, limit, total },
    };
  }

  async confirmBooking(bookingId, adminId) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw new ValidationError('Only pending bookings can be confirmed');
    }

    const previousStatus = booking.status;

    booking.addStatusHistory(BOOKING_STATUS.CONFIRMED, adminId, 'Confirmed by admin');
    booking.isConfirmed = true;
    booking.confirmedBy = adminId;
    booking.confirmedAt = new Date();
    await booking.save();

    await AuditLog.create({
      action: 'BOOKING_CONFIRMED',
      actor: { userId: adminId, role: USER_ROLES.ADMIN },
      target: { type: 'Booking', id: booking._id },
      changes: {
        before: { status: previousStatus },
        after: { status: BOOKING_STATUS.CONFIRMED },
      },
    });

    const populatedBooking = await bookingRepository.findById(bookingId);

    try {
      const assignmentResult = await initiateAutoAssignment(populatedBooking);
      logger.info('Auto-assignment triggered', {
        bookingId: booking._id,
        success: assignmentResult.success,
        providersFound: assignmentResult.providersFound,
      });
    } catch (error) {
      logger.error('Auto-assignment failed after confirmation', {
        bookingId: booking._id,
        error: error.message,
      });
    }

    notificationService.notifyBookingConfirmed(
      populatedBooking.customer._id,
      populatedBooking
    ).catch(err => {
      logger.error('Failed to send confirmation notification', { error: err.message });
    });

    return populatedBooking;
  }

  async cancelBooking(bookingId, customerId, reason = 'Cancelled by customer') {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.customer.toString() !== customerId.toString()) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    const cancellableStatuses = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new ValidationError(`Cannot cancel booking with status '${booking.status}'`);
    }

    const hoursUntilBooking = (new Date(booking.scheduledDate) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilBooking < 24 && hoursUntilBooking > 0) {
      logger.warn('Cancellation within 24 hours', {
        bookingId: booking._id,
        hoursUntil: hoursUntilBooking.toFixed(1),
      });
    }

    return await this.updateStatus(bookingId, BOOKING_STATUS.CANCELLED, customerId, USER_ROLES.CUSTOMER, reason);
  }

  async rescheduleBooking(bookingId, customerId, newDate, newTime, reason = '') {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.customer.toString() !== customerId.toString()) {
      throw new ForbiddenError('You can only reschedule your own bookings');
    }

    const reschedulableStatuses = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED];
    if (!reschedulableStatuses.includes(booking.status)) {
      throw new ValidationError(`Cannot reschedule booking with status '${booking.status}'`);
    }

    if (booking.rescheduleCount >= 3) {
      throw new ValidationError(MESSAGES.RESCHEDULE_LIMIT_EXCEEDED);
    }

    const conflictExists = await Booking.checkCustomerSlotConflict(
      customerId,
      booking.service,
      newDate,
      newTime,
      bookingId
    );

    if (conflictExists) {
      throw new ConflictError(MESSAGES.DOUBLE_BOOKING);
    }

    if (booking.provider) {
      const providerConflict = await bookingRepository.checkProviderConflict(
        booking.provider,
        newDate,
        newTime,
        bookingId
      );

      if (providerConflict) {
        throw new ConflictError(MESSAGES.PROVIDER_NOT_AVAILABLE);
      }
    }

    const previousDate = booking.scheduledDate;
    const previousTime = booking.scheduledTime;

    booking.scheduledDate = newDate;
    booking.scheduledTime = newTime;
    booking.rescheduleCount = (booking.rescheduleCount || 0) + 1;
    booking.rescheduleHistory.push({
      previousDate,
      previousTime,
      newDate,
      newTime,
      rescheduledBy: customerId,
      rescheduledAt: new Date(),
      reason,
    });

    await booking.save();

    await AuditLog.create({
      action: 'BOOKING_RESCHEDULED',
      actor: { userId: customerId, role: USER_ROLES.CUSTOMER },
      target: { type: 'Booking', id: booking._id },
      changes: {
        before: { scheduledDate: previousDate, scheduledTime: previousTime },
        after: { scheduledDate: newDate, scheduledTime: newTime },
      },
      reason,
    });

    const updatedBooking = await bookingRepository.findById(bookingId);

    this.notifyCustomer(updatedBooking);

    notificationService.notifyBookingRescheduled(customerId, updatedBooking).catch(err => {
      logger.error('Failed to send reschedule notification', { error: err.message });
    });

    return updatedBooking;
  }

  async getStats() {
    return cacheService.getOrSet(
      cacheService.keys.bookingStats(),
      async () => {
        const [
          totalBookings,
          pendingBookings,
          completedBookings,
          cancelledBookings,
          revenue,
        ] = await Promise.all([
          bookingRepository.countAll(),
          bookingRepository.countAll({ status: BOOKING_STATUS.PENDING }),
          bookingRepository.countAll({ status: BOOKING_STATUS.COMPLETED }),
          bookingRepository.countAll({ status: BOOKING_STATUS.CANCELLED }),
          Booking.aggregate([
            { $match: { status: BOOKING_STATUS.COMPLETED, isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$amount.finalAmount' } } },
          ]),
        ]);

        return {
          totalBookings,
          pendingBookings,
          completedBookings,
          cancelledBookings,
          totalRevenue: revenue[0]?.total || 0,
          completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0,
        };
      },
      cacheService.ttl.stats
    );
  }

  async invalidateStatsCache() {
    await cacheService.del(cacheService.keys.bookingStats());
  }

  async notifyCustomer(booking) {
    try {
      if (booking.customer?.email) {
        await sendStatusUpdateEmail(booking.customer.email, booking);
      }
      if (booking.customer?.phone) {
        await sendBookingStatusSMS(booking.customer.phone, booking._id, booking.status);
      }
    } catch (error) {
      logger.error('Failed to notify customer', { error: error.message });
    }
  }
}

export default new BookingService();

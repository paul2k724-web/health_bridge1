import Notification from '../../models/Notification.model.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { getPaginationParams } from '../../shared/utils/pagination.js';
import logger from '../../shared/utils/logger.js';

class NotificationService {
  async create(data) {
    const notification = await Notification.create({
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      priority: data.priority || 'normal',
    });

    logger.info('Notification created', {
      notificationId: notification._id,
      recipient: data.recipient,
      type: data.type,
    });

    return notification;
  }

  async getNotifications(userId, query = {}) {
    const { page, limit, skip } = getPaginationParams(query);

    const filter = { recipient: userId };
    if (query.unreadOnly === 'true') {
      filter.isRead = false;
    }
    if (query.type) {
      filter.type = query.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('data.bookingId', 'status scheduledDate scheduledTime')
        .populate('data.providerId', 'name')
        .populate('data.customerId', 'name'),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId) {
    const count = await Notification.getUnreadCount(userId);
    return { unreadCount: count };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await notification.markAsRead();
    return notification;
  }

  async markAllAsRead(userId) {
    const result = await Notification.markAllAsRead(userId);
    return { modifiedCount: result.modifiedCount };
  }

  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return { success: true };
  }

  async clearAll(userId) {
    const result = await Notification.deleteMany({ recipient: userId });
    return { deletedCount: result.deletedCount };
  }

  async notifyBookingCreated(customerId, booking) {
    return this.create({
      recipient: customerId,
      type: 'BOOKING_CREATED',
      title: 'Booking Created',
      message: `Your booking for ${booking.service?.name || 'service'} has been created successfully.`,
      data: { bookingId: booking._id },
      priority: 'normal',
    });
  }

  async notifyBookingConfirmed(customerId, booking) {
    return this.create({
      recipient: customerId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed',
      message: `Your booking for ${booking.service?.name || 'service'} has been confirmed.`,
      data: { bookingId: booking._id },
      priority: 'normal',
    });
  }

  async notifyBookingAccepted(customerId, booking, providerId) {
    return this.create({
      recipient: customerId,
      type: 'BOOKING_ACCEPTED',
      title: 'Provider Assigned',
      message: `A provider has been assigned to your booking.`,
      data: { bookingId: booking._id, providerId },
      priority: 'high',
    });
  }

  async notifyBookingCancelled(customerId, booking, reason) {
    return this.create({
      recipient: customerId,
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled',
      message: `Your booking has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      data: { bookingId: booking._id },
      priority: 'high',
    });
  }

  async notifyBookingRescheduled(customerId, booking) {
    return this.create({
      recipient: customerId,
      type: 'BOOKING_RESCHEDULED',
      title: 'Booking Rescheduled',
      message: `Your booking has been rescheduled to ${new Date(booking.scheduledDate).toLocaleDateString()} at ${booking.scheduledTime}.`,
      data: { bookingId: booking._id },
      priority: 'normal',
    });
  }

  async notifyBookingCompleted(customerId, booking) {
    return this.create({
      recipient: customerId,
      type: 'BOOKING_COMPLETED',
      title: 'Service Completed',
      message: `Your service has been completed. Please rate your experience.`,
      data: { bookingId: booking._id },
      priority: 'high',
    });
  }

  async notifyReviewReceived(providerId, review) {
    return this.create({
      recipient: providerId,
      type: 'REVIEW_RECEIVED',
      title: 'New Review Received',
      message: `You received a ${review.rating}-star review.`,
      data: { reviewId: review._id, bookingId: review.booking },
      priority: 'normal',
    });
  }

  async notifyBookingReminder(customerId, booking) {
    return this.create({
      recipient: customerId,
      type: 'BOOKING_REMINDER',
      title: 'Upcoming Booking Reminder',
      message: `Your booking is scheduled for tomorrow at ${booking.scheduledTime}.`,
      data: { bookingId: booking._id },
      priority: 'high',
    });
  }
}

export default new NotificationService();

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'BOOKING_CREATED',
        'BOOKING_CONFIRMED',
        'BOOKING_ACCEPTED',
        'BOOKING_CANCELLED',
        'BOOKING_RESCHEDULED',
        'BOOKING_COMPLETED',
        'BOOKING_REMINDER',
        'REVIEW_RECEIVED',
        'SYSTEM',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
      },
      reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
      providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      additionalData: mongoose.Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

notificationSchema.statics.createNotification = async function (data) {
  const notification = await this.create(data);
  return notification;
};

notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

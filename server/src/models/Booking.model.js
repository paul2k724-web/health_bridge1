import mongoose from 'mongoose';
import { BOOKING_STATUS, STATUS_TRANSITIONS } from '../config/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    providerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(BOOKING_STATUS),
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],
    confirmationMethod: {
      type: String,
      enum: ['manual', 'auto'],
      default: 'manual',
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    confirmedAt: Date,
    amount: {
      basePrice: {
        type: Number,
        required: true,
      },
      discount: {
        type: Number,
        default: 0,
      },
      finalAmount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'na'],
      default: 'na',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    reports: [
      {
        url: String,
        publicId: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: Date,
    rescheduleHistory: [
      {
        previousDate: Date,
        previousTime: String,
        newDate: Date,
        newTime: String,
        rescheduledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rescheduledAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],
    rescheduleCount: {
      type: Number,
      default: 0,
    },
    completedAt: Date,
    assignmentMode: {
      type: String,
      enum: ['auto', 'specific', 'any'],
      default: 'auto',
    },
    requestedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignmentAttempts: {
      type: Number,
      default: 0,
    },
    providerAssignedAt: Date,
    providerArrivedAt: Date,
    rating: {
      score: { type: Number, min: 1, max: 5 },
      review: String,
      aspects: {
        punctuality: { type: Number, min: 1, max: 5 },
        professionalism: { type: Number, min: 1, max: 5 },
        quality: { type: Number, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 },
        value: { type: Number, min: 1, max: 5 },
      },
      ratedAt: Date,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ provider: 1, scheduledDate: 1, scheduledTime: 1 });
bookingSchema.index({ status: 1, scheduledDate: 1 });
bookingSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ 'status': 1, 'provider': 1, 'scheduledDate': 1 });

// Virtual for checking if booking can be cancelled
bookingSchema.virtual('isCancellable').get(function () {
  return [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED].includes(this.status);
});

// Virtual for checking if booking can be rescheduled
bookingSchema.virtual('isReschedulable').get(function () {
  return [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED].includes(this.status);
});

// Methods
bookingSchema.methods.canTransitionTo = function (newStatus) {
  return STATUS_TRANSITIONS[this.status]?.includes(newStatus) || false;
};

bookingSchema.methods.getNextStatuses = function () {
  return STATUS_TRANSITIONS[this.status] || [];
};

bookingSchema.methods.addStatusHistory = function (status, changedBy, reason = null) {
  this.statusHistory.push({
    status,
    changedBy,
    changedAt: new Date(),
    reason,
  });
  this.status = status;
};

bookingSchema.methods.isProviderAssigned = function () {
  return !!this.provider;
};

bookingSchema.methods.isSlotConflict = async function (providerId, excludeId = null) {
  const query = {
    provider: providerId,
    scheduledDate: this.scheduledDate,
    scheduledTime: this.scheduledTime,
    status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.COMPLETED] },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflictingBooking = await this.constructor.findOne(query);
  return !!conflictingBooking;
};

// Static methods
bookingSchema.statics.findByCustomer = function (customerId, options = {}) {
  const query = { customer: customerId, isDeleted: false };
  
  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate('service', 'name description duration')
    .populate('provider', 'name phone')
    .populate('address')
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

bookingSchema.statics.findByProvider = function (providerId, options = {}) {
  const query = { provider: providerId, isDeleted: false };
  
  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate('service', 'name description duration')
    .populate('customer', 'name phone')
    .populate('address')
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .skip(options.skip || 0)
    .limit(options.limit || 10);
};

bookingSchema.statics.findPendingForProvider = function (providerProfileId) {
  return this.find({
    providerProfile: providerProfileId,
    status: BOOKING_STATUS.PENDING,
    isDeleted: false,
  })
    .populate('customer', 'name phone')
    .populate('service', 'name')
    .populate('address');
};

bookingSchema.statics.checkCustomerSlotConflict = async function (customerId, serviceId, scheduledDate, scheduledTime, excludeId = null) {
  const query = {
    customer: customerId,
    service: serviceId,
    scheduledDate,
    scheduledTime,
    status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED] },
    isDeleted: false,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await this.findOne(query);
  return !!existing;
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

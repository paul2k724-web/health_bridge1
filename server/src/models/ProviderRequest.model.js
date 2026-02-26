import mongoose from 'mongoose';

const providerRequestSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderProfile',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired', 'cancelled'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    respondedAt: Date,
    responseTime: {
      type: Number,
      comment: 'Response time in seconds',
    },
    distance: {
      type: Number,
      comment: 'Distance in kilometers from provider to customer',
    },
    priority: {
      type: Number,
      default: 0,
      comment: 'Higher priority = sent first',
    },
    rejectionReason: String,
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationSentAt: Date,
  },
  {
    timestamps: true,
  }
);

providerRequestSchema.index({ booking: 1, status: 1 });
providerRequestSchema.index({ provider: 1, status: 1 });
providerRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
providerRequestSchema.index({ createdAt: -1 });

providerRequestSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

providerRequestSchema.methods.accept = async function () {
  if (this.isExpired()) {
    throw new Error('Request has expired');
  }
  if (this.status !== 'pending') {
    throw new Error(`Cannot accept request with status: ${this.status}`);
  }
  
  this.status = 'accepted';
  this.respondedAt = new Date();
  this.responseTime = Math.round((this.respondedAt - this.createdAt) / 1000);
  
  return await this.save();
};

providerRequestSchema.methods.reject = async function (reason = null) {
  if (this.isExpired()) {
    throw new Error('Request has expired');
  }
  if (this.status !== 'pending') {
    throw new Error(`Cannot reject request with status: ${this.status}`);
  }
  
  this.status = 'rejected';
  this.respondedAt = new Date();
  this.responseTime = Math.round((this.respondedAt - this.createdAt) / 1000);
  this.rejectionReason = reason;
  
  return await this.save();
};

providerRequestSchema.methods.expire = async function () {
  if (this.status === 'pending') {
    this.status = 'expired';
    return await this.save();
  }
  return this;
};

providerRequestSchema.statics.findPendingForProvider = function (providerId) {
  return this.find({
    provider: providerId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  })
    .populate({
      path: 'booking',
      populate: [
        { path: 'service', select: 'name basePrice duration' },
        { path: 'customer', select: 'name phone' },
        { path: 'address' },
      ],
    })
    .sort({ priority: -1, createdAt: 1 });
};

providerRequestSchema.statics.findActiveForBooking = function (bookingId) {
  return this.find({
    booking: bookingId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  }).populate('provider', 'name phone');
};

providerRequestSchema.statics.cancelAllForBooking = async function (bookingId, excludeProviderId = null) {
  const query = {
    booking: bookingId,
    status: 'pending',
  };
  
  if (excludeProviderId) {
    query.provider = { $ne: excludeProviderId };
  }
  
  return this.updateMany(query, { status: 'cancelled' });
};

const ProviderRequest = mongoose.model('ProviderRequest', providerRequestSchema);

export default ProviderRequest;

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      deviceType: String,
      browser: String,
      os: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: Date,
    revokedReason: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
refreshTokenSchema.index({ user: 1, isRevoked: 1 });
refreshTokenSchema.index({ token: 1 }, { unique: true });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Pre-save middleware to hash token
refreshTokenSchema.pre('save', async function (next) {
  if (!this.isModified('token')) {
    return next();
  }
  
  // Only hash if not already hashed (check if it's a plain token)
  if (this.token && !this.token.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.token = await bcrypt.hash(this.token, salt);
  }
  next();
});

// Methods
refreshTokenSchema.methods.compareToken = async function (plainToken) {
  return await bcrypt.compare(plainToken, this.token);
};

refreshTokenSchema.methods.revoke = async function (reason = 'Manual revocation') {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return await this.save();
};

// Static methods
refreshTokenSchema.statics.findActiveByUser = function (userId) {
  return this.find({
    user: userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

refreshTokenSchema.statics.revokeAllByUser = async function (userId, reason = 'User logout') {
  return await this.updateMany(
    { user: userId, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    }
  );
};

refreshTokenSchema.statics.verifyToken = async function (plainToken) {
  const activeTokens = await this.find({
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).populate('user');

  for (const stored of activeTokens) {
    if (await stored.compareToken(plainToken)) {
      return stored;
    }
  }

  return null;
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;

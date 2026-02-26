import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config/index.js';
import { USER_ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedAt: Date,
    blockedReason: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    lastLoginAt: Date,
    lastLoginIp: String,
    otp: {
      code: {
        type: String,
        select: false,
      },
      expiresAt: Date,
      attempts: {
        type: Number,
        default: 0,
      },
      lockedUntil: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
      },
    ],
    defaultAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    onboardingStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'completed'],
      default: 'not_started',
    },
    onboardingStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    emergencyContacts: [
      {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        relationship: { type: String, trim: true },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ role: 1, isBlocked: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Methods
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = config.security.maxLoginAttempts;

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + config.security.loginLockoutMinutes * 60 * 1000 };
  }

  return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Static methods
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase(), isDeleted: false });
};

userSchema.statics.findByPhone = function (phone) {
  return this.findOne({ phone, isDeleted: false });
};

const User = mongoose.model('User', userSchema);

export default User;

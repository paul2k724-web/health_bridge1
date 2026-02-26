import rateLimit from 'express-rate-limit';
import config from '../../config/index.js';
import { TooManyRequestsError } from '../errors/index.js';

const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 60000,
    max: options.max || 5,
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      errorCode: 'TOO_MANY_REQUESTS',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new TooManyRequestsError('Too many requests, please try again later'));
    },
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress;
    },
    skip: (req) => {
      if (config.server.nodeEnv === 'test') {
        return true;
      }
      return false;
    },
    ...options,
  });
};

const authLimiter = createRateLimiter({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    errorCode: 'TOO_MANY_AUTH_ATTEMPTS',
  },
});

const apiLimiter = createRateLimiter({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
});

const otpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 OTP requests per 15 minutes
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait before requesting a new OTP.',
    errorCode: 'TOO_MANY_OTP_REQUESTS',
  },
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.',
    errorCode: 'TOO_MANY_RESET_ATTEMPTS',
  },
});

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    success: false,
    message: 'Too many file uploads. Please wait before uploading more files.',
    errorCode: 'TOO_MANY_UPLOADS',
  },
});

const createBookingLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 bookings per minute
  message: {
    success: false,
    message: 'Too many booking requests. Please wait before creating more bookings.',
    errorCode: 'TOO_MANY_BOOKINGS',
  },
});

export {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  otpLimiter,
  passwordResetLimiter,
  uploadLimiter,
  createBookingLimiter,
};

export default {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  otpLimiter,
  passwordResetLimiter,
  uploadLimiter,
  createBookingLimiter,
};

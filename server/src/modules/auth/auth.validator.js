import Joi from 'joi';
import { objectId } from '../../shared/middleware/validate.middleware.js';

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
  }),
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required',
  }),
  phone: Joi.string().trim().pattern(/^[0-9+\-\s()]+$/).min(10).max(15).required().messages({
    'string.pattern.base': 'Please provide a valid phone number',
    'string.min': 'Phone number must be at least 10 digits',
    'string.empty': 'Phone number is required',
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.max': 'Password cannot exceed 50 characters',
    'string.empty': 'Password is required',
  }),
  role: Joi.string().valid('customer', 'provider').default('customer'),
  specialization: Joi.string().allow('').when('role', {
    is: 'provider',
    then: Joi.required().messages({
      'any.required': 'Specialization is required for providers',
    }),
    otherwise: Joi.optional(),
  }),
  experience: Joi.number().min(0).max(50).allow(null, '').when('role', {
    is: 'provider',
    then: Joi.required().messages({
      'any.required': 'Experience is required for providers',
    }),
    otherwise: Joi.optional(),
  }),
  licenseNumber: Joi.string().allow('').when('role', {
    is: 'provider',
    then: Joi.required().messages({
      'any.required': 'License number is required for providers',
    }),
    otherwise: Joi.optional(),
  }),
  bio: Joi.string().max(500).allow('').when('role', {
    is: 'provider',
    then: Joi.optional(),
    otherwise: Joi.optional(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

const verifyOTPSchema = Joi.object({
  userId: objectId().required().messages({
    'string.pattern.name': 'Invalid user ID',
    'string.empty': 'User ID is required',
  }),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
    'string.empty': 'OTP is required',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required',
  }),
});

const resetPasswordSchema = Joi.object({
  userId: objectId().required().messages({
    'string.pattern.name': 'Invalid user ID',
    'string.empty': 'User ID is required',
  }),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
    'string.empty': 'OTP is required',
  }),
  newPassword: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.max': 'Password cannot exceed 50 characters',
    'string.empty': 'New password is required',
  }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required',
  }),
});

const googleLoginSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'string.empty': 'Google ID token is required',
  }),
  role: Joi.string().valid('customer', 'provider').default('customer'),
});

const resendOTPSchema = Joi.object({
  userId: objectId().required().messages({
    'string.pattern.name': 'Invalid user ID',
    'string.empty': 'User ID is required',
  }),
});

export {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  googleLoginSchema,
  resendOTPSchema,
};

export default {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  googleLoginSchema,
  resendOTPSchema,
};

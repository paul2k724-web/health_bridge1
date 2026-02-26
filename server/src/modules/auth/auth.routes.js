import { Router } from 'express';
import authController from './auth.controller.js';
import { validate, validateBody } from '../../shared/middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  googleLoginSchema,
  resendOTPSchema,
} from './auth.validator.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import { authLimiter, otpLimiter, passwordResetLimiter } from '../../shared/middleware/rate-limit.middleware.js';

const router = Router();

// Public routes with rate limiting
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post(
  '/google',
  authLimiter,
  validateBody(googleLoginSchema),
  authController.googleLogin
);

router.post(
  '/verify-otp',
  otpLimiter,
  validateBody(verifyOTPSchema),
  authController.verifyOTP
);

router.post(
  '/resend-otp',
  otpLimiter,
  validateBody(resendOTPSchema),
  authController.resendOTP
);

router.post(
  '/refresh-token',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// Protected routes
router.get('/me', protect, authController.getMe);

router.post('/logout', protect, authController.logout);

export default router;

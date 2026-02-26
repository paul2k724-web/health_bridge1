import authService from './auth.service.js';
import ApiResponse from '../../shared/utils/response.js';
import asyncHandler from '../../shared/middleware/async.middleware.js';

const register = asyncHandler(async (req, res) => {
  const deviceInfo = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const result = await authService.register(req.body, deviceInfo);

  return ApiResponse.success(res, result, result.message, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const deviceInfo = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const result = await authService.login(email, password, deviceInfo);

  if (result.requiresOTP) {
    return ApiResponse.success(res, { userId: result.userId, requiresOTP: true }, result.message);
  }

  return ApiResponse.success(res, result, 'Login successful');
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const deviceInfo = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const result = await authService.verifyOTP(userId, otp, deviceInfo);

  return ApiResponse.success(res, result, 'OTP verified successfully');
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const deviceInfo = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const result = await authService.refreshToken(refreshToken, deviceInfo);

  return ApiResponse.success(res, result, 'Token refreshed successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.forgotPassword(email);

  return ApiResponse.success(res, result, result.message);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { userId, otp, newPassword } = req.body;

  const result = await authService.resetPassword(userId, otp, newPassword);

  return ApiResponse.success(res, result, result.message);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  return ApiResponse.success(res, { user });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken;

  await authService.logout(req.user._id, refreshToken);

  return ApiResponse.success(res, null, 'Logged out successfully');
});

const resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const result = await authService.resendOTP(userId);

  return ApiResponse.success(res, result, result.message);
});

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken, role } = req.body;

  const deviceInfo = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const result = await authService.googleLogin(idToken, role, deviceInfo);

  return ApiResponse.success(res, result, 'Google login successful');
});

export default {
  register,
  login,
  verifyOTP,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  resendOTP,
  googleLogin,
};

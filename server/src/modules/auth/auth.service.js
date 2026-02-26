import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import config from '../../config/index.js';
import { USER_ROLES, MESSAGES } from '../../config/constants.js';
import authRepository from './auth.repository.js';
import RefreshToken from '../../models/RefreshToken.model.js';
import { sendOTPEmail } from '../../shared/utils/email.js';
import { sendOTPSMS } from '../../shared/utils/sms.js';
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
  TooManyRequestsError,
} from '../../shared/errors/index.js';
import logger from '../../shared/utils/logger.js';

const googleClient = new OAuth2Client(config.google?.clientId);

class AuthService {
  constructor() {
    this.otpExpiryMs = config.otp.expiryMinutes * 60 * 1000;
    this.otpMaxAttempts = config.otp.maxAttempts;
    this.otpLockoutMs = config.otp.lockoutoutMinutes * 60 * 1000;
  }

  async register(userData, deviceInfo = {}) {
    const existingEmail = await authRepository.findUserByEmail(userData.email);
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    const existingPhone = await authRepository.findUserByPhone(userData.phone);
    if (existingPhone) {
      throw new ConflictError('Phone number already registered');
    }

    const user = await authRepository.createUser({
      name: userData.name,
      email: userData.email.toLowerCase(),
      phone: userData.phone,
      password: userData.password,
      role: userData.role || USER_ROLES.CUSTOMER,
    });

    if (userData.role === USER_ROLES.PROVIDER) {
      await authRepository.createProviderProfile({
        user: user._id,
        specialization: userData.specialization,
        experience: userData.experience,
        licenseNumber: userData.licenseNumber,
        bio: userData.bio || '',
      });
    }

    const otp = await this.generateAndSendOTP(user, userData.email);

    await authRepository.createAuditLog({
      action: 'USER_REGISTERED',
      actor: { userId: user._id, role: user.role },
      target: { type: 'User', id: user._id },
      metadata: { email: userData.email, role: userData.role },
    });

    const response = {
      userId: user._id,
      message: MESSAGES.REGISTER_SUCCESS,
      requiresOTP: true,
    };

    if (config.server.nodeEnv === 'development') {
      response.debugOtp = otp;
    }

    return response;
  }

  async logout(userId, refreshToken) {
    if (refreshToken) {
      const activeTokens = await RefreshToken.find({
        user: userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      });

      for (const stored of activeTokens) {
        if (await bcrypt.compare(refreshToken, stored.token)) {
          stored.isRevoked = true;
          stored.revokedAt = new Date();
          stored.revokedReason = 'User logout';
          await stored.save();
          break;
        }
      }
    }

    await authRepository.createAuditLog({
      action: 'USER_LOGOUT',
      actor: { userId },
      target: { type: 'User', id: userId },
    });

    return { message: 'Logged out successfully' };
  }

  async resendOTP(userId) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.otp?.lockedUntil && user.otp.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.otp.lockedUntil - new Date()) / 60000);
      throw new TooManyRequestsError(
        `Account locked. Try again in ${remainingMinutes} minutes.`,
        remainingMinutes * 60
      );
    }

    if (user.isVerified) {
      throw new ValidationError('User is already verified');
    }

    const otp = await this.generateAndSendOTP(user, user.email);

    await authRepository.createAuditLog({
      action: 'OTP_RESENT',
      actor: { userId: user._id, role: user.role },
      target: { type: 'User', id: user._id },
    });

    const response = {
      userId: user._id,
      message: 'OTP sent successfully',
    };

    if (config.server.nodeEnv === 'development') {
      response.debugOtp = otp;
    }

    return response;
  }

  async login(email, password, deviceInfo = {}) {
    const user = await authRepository.getUserForLogin(email);

    if (!user) {
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.isBlocked) {
      throw new ForbiddenError(MESSAGES.ACCOUNT_BLOCKED);
    }

    if (user.isLocked()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new TooManyRequestsError(
        `Account locked. Try again in ${remainingMinutes} minutes.`,
        remainingMinutes * 60
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    await user.resetLoginAttempts();

    if (user.role === USER_ROLES.PROVIDER) {
      const providerProfile = await authRepository.findProviderProfileByUser(user._id);
      if (!providerProfile || providerProfile.status !== 'approved') {
        throw new ForbiddenError('Your provider account is pending approval');
      }
    }

    if (!user.isVerified) {
      const otp = await this.generateAndSendOTP(user, email);
      const response = {
        requiresOTP: true,
        userId: user._id,
        message: 'Please verify your OTP to continue',
      };
      
      if (config.server.nodeEnv === 'development') {
        response.debugOtp = otp;
      }
      
      return response;
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = deviceInfo.ip;
    await user.save();

    const tokens = await this.generateTokens(user, deviceInfo);

    await authRepository.createAuditLog({
      action: 'USER_LOGIN',
      actor: { userId: user._id, role: user.role, ip: deviceInfo.ip },
      target: { type: 'User', id: user._id },
    });

    const userResponse = this.sanitizeUser(user);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userResponse,
    };
  }

  async verifyOTP(userId, otpCode, deviceInfo = {}) {
    const user = await authRepository.findUserWithOTP(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.otp?.lockedUntil && user.otp.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.otp.lockedUntil - new Date()) / 60000);
      throw new TooManyRequestsError(
        `Account locked. Try again in ${remainingMinutes} minutes.`,
        remainingMinutes * 60
      );
    }

    if (!user.otp?.code || !user.otp?.expiresAt || user.otp.expiresAt < new Date()) {
      throw new ValidationError(MESSAGES.OTP_EXPIRED);
    }

    if (user.otp.attempts >= this.otpMaxAttempts) {
      user.otp.lockedUntil = new Date(Date.now() + this.otpLockoutMs);
      await user.save();
      throw new TooManyRequestsError(
        `Too many failed attempts. Account locked for ${config.otp.lockoutMinutes} minutes.`
      );
    }

    const isValid = await bcrypt.compare(otpCode, user.otp.code);
    if (!isValid) {
      user.otp.attempts = (user.otp.attempts || 0) + 1;
      await user.save();
      const remaining = this.otpMaxAttempts - user.otp.attempts;
      throw new ValidationError(`Invalid OTP. ${remaining} attempts remaining.`);
    }

    user.otp = { code: null, expiresAt: null, attempts: 0 };
    user.isVerified = true;
    await user.save();

    const tokens = await this.generateTokens(user, deviceInfo);

    await authRepository.createAuditLog({
      action: 'OTP_VERIFIED',
      actor: { userId: user._id, role: user.role },
      target: { type: 'User', id: user._id },
    });

    const userResponse = this.sanitizeUser(user);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userResponse,
    };
  }

  async refreshToken(refreshTokenPlain, deviceInfo = {}) {
    const activeTokens = await RefreshToken.find({
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).populate('user');

    let matchedToken = null;
    let matchedUser = null;

    for (const stored of activeTokens) {
      if (await bcrypt.compare(refreshTokenPlain, stored.token)) {
        matchedToken = stored;
        matchedUser = stored.user;
        break;
      }
    }

    if (!matchedToken || !matchedUser) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (matchedUser.isBlocked) {
      await authRepository.revokeAllRefreshTokens(matchedUser._id, 'User blocked');
      throw new ForbiddenError(MESSAGES.ACCOUNT_BLOCKED);
    }

    matchedToken.isRevoked = true;
    matchedToken.revokedAt = new Date();
    matchedToken.revokedReason = 'Token rotation';
    await matchedToken.save();

    const tokens = await this.generateTokens(matchedUser, deviceInfo);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async forgotPassword(email) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      return { message: 'If the email exists, an OTP will be sent' };
    }

    await this.generateAndSendOTP(user, email);

    return {
      message: 'If the email exists, an OTP will be sent',
      userId: user._id,
    };
  }

  async resetPassword(userId, otpCode, newPassword) {
    const user = await authRepository.findUserWithOTP(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.otp?.lockedUntil && user.otp.lockedUntil > new Date()) {
      throw new TooManyRequestsError('Account is locked. Please try again later.');
    }

    if (!user.otp?.code || !user.otp?.expiresAt || user.otp.expiresAt < new Date()) {
      throw new ValidationError(MESSAGES.OTP_EXPIRED);
    }

    const isValid = await bcrypt.compare(otpCode, user.otp.code);
    if (!isValid) {
      user.otp.attempts = (user.otp.attempts || 0) + 1;
      await user.save();
      throw new ValidationError(MESSAGES.OTP_INVALID);
    }

    user.password = newPassword;
    user.otp = { code: null, expiresAt: null, attempts: 0 };
    await user.save();

    await authRepository.revokeAllRefreshTokens(userId, 'Password reset');
    await authRepository.createAuditLog({
      action: 'PASSWORD_RESET',
      actor: { userId: user._id },
      target: { type: 'User', id: user._id },
    });

    return { message: 'Password reset successfully' };
  }

  async getCurrentUser(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const response = this.sanitizeUser(user);

    if (user.role === USER_ROLES.PROVIDER) {
      const profile = await authRepository.findProviderProfileByUser(userId);
      response.providerProfile = profile;
    }

    return response;
  }

  async generateAndSendOTP(user, email) {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 8);

    user.otp = {
      code: otpHash,
      expiresAt: new Date(Date.now() + this.otpExpiryMs),
      attempts: 0,
    };
    await user.save();

    if (config.features.logOtpToConsole) {
      logger.info(`OTP for ${email}: ${otp}`);
    }

    try {
      await sendOTPEmail(email, otp, user.name);
    } catch (error) {
      logger.error('Failed to send OTP email', { error: error.message, email });
    }

    if (config.features.enableSms && user.phone) {
      try {
        await sendOTPSMS(user.phone, otp);
      } catch (error) {
        logger.error('Failed to send OTP SMS', { error: error.message, phone: user.phone });
      }
    }

    return otp;
  }

  async generateTokens(user, deviceInfo = {}) {
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    const refreshTokenPlain = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + this.parseExpire(config.jwt.refreshExpire));

    await authRepository.createRefreshToken({
      user: user._id,
      token: refreshTokenPlain,
      deviceInfo,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
    };
  }

  parseExpire(expire) {
    const unit = expire.slice(-1);
    const value = parseInt(expire.slice(0, -1));

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  sanitizeUser(user) {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.otp;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpire;
    delete obj.__v;
    return obj;
  }

  async googleLogin(idToken, role = USER_ROLES.CUSTOMER, deviceInfo = {}) {
    let payload;
    
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.google?.clientId,
      });
      payload = ticket.getPayload();
    } catch (error) {
      logger.error('Google token verification failed', { error: error.message });
      throw new UnauthorizedError('Invalid Google token');
    }

    if (!payload?.email) {
      throw new UnauthorizedError('Google account email not available');
    }

    let user = await authRepository.findUserByEmail(payload.email);

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await authRepository.createUser({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        phone: payload.phone || '',
        password: randomPassword,
        role: role || USER_ROLES.CUSTOMER,
        isVerified: true,
        googleId: payload.sub,
        avatar: payload.picture,
      });

      if (role === USER_ROLES.PROVIDER) {
        await authRepository.createProviderProfile({
          user: user._id,
          specialization: 'General',
          experience: 0,
          licenseNumber: `GOOGLE-${Date.now()}`,
          bio: '',
        });
      }

      await authRepository.createAuditLog({
        action: 'USER_REGISTERED_GOOGLE',
        actor: { userId: user._id, role: user.role },
        target: { type: 'User', id: user._id },
        metadata: { email: payload.email, googleId: payload.sub },
      });
    } else {
      if (user.isBlocked) {
        throw new ForbiddenError(MESSAGES.ACCOUNT_BLOCKED);
      }

      if (!user.googleId) {
        user.googleId = payload.sub;
        user.avatar = payload.picture;
        await user.save();
      }

      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    }

    if (user.role === USER_ROLES.PROVIDER) {
      const providerProfile = await authRepository.findProviderProfileByUser(user._id);
      if (!providerProfile || providerProfile.status !== 'approved') {
        throw new ForbiddenError('Your provider account is pending approval');
      }
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = deviceInfo.ip;
    await user.save();

    const tokens = await this.generateTokens(user, deviceInfo);

    await authRepository.createAuditLog({
      action: 'USER_LOGIN_GOOGLE',
      actor: { userId: user._id, role: user.role, ip: deviceInfo.ip },
      target: { type: 'User', id: user._id },
    });

    const userResponse = this.sanitizeUser(user);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userResponse,
    };
  }
}

export default new AuthService();

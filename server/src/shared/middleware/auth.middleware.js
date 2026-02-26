import jwt from 'jsonwebtoken';
import User from '../../models/User.model.js';
import RefreshToken from '../../models/RefreshToken.model.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
import config from '../../config/index.js';
import logger from '../utils/logger.js';

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(decoded.id).select('-password -otp.code');

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isBlocked) {
      throw new ForbiddenError('Your account has been blocked');
    }

    if (user.isDeleted) {
      throw new UnauthorizedError('User account has been deleted');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    }
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id).select('-password -otp.code');

    if (user && !user.isBlocked && !user.isDeleted) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' is not authorized`));
    }

    next();
  };
};

const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const allTokens = await RefreshToken.find({
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).populate('user');

    let matchedToken = null;
    for (const stored of allTokens) {
      const bcrypt = await import('bcryptjs');
      const isMatch = await bcrypt.compare(refreshToken, stored.token);
      if (isMatch) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (matchedToken.user.isBlocked) {
      matchedToken.isRevoked = true;
      matchedToken.revokedAt = new Date();
      matchedToken.revokedReason = 'User blocked';
      await matchedToken.save();
      throw new ForbiddenError('User account is blocked');
    }

    req.refreshToken = matchedToken;
    req.user = matchedToken.user;
    next();
  } catch (error) {
    next(error);
  }
};

const invalidateUserTokens = async (userId, reason = 'Token invalidation') => {
  try {
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      }
    );
    logger.info('User tokens invalidated', { userId, reason });
  } catch (error) {
    logger.error('Failed to invalidate user tokens', { error: error.message, userId });
  }
};

export {
  protect,
  optionalAuth,
  authorize,
  validateRefreshToken,
  invalidateUserTokens,
};

export default {
  protect,
  optionalAuth,
  authorize,
  validateRefreshToken,
  invalidateUserTokens,
};

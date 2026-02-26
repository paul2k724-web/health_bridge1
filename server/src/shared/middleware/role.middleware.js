import { USER_ROLES } from '../../config/constants.js';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access denied. Required role: ${allowedRoles.join(' or ')}`)
      );
    }

    next();
  };
};

const requireCustomer = requireRole(USER_ROLES.CUSTOMER);
const requireProvider = requireRole(USER_ROLES.PROVIDER);
const requireAdmin = requireRole(USER_ROLES.ADMIN);
const requireCustomerOrAdmin = requireRole(USER_ROLES.CUSTOMER, USER_ROLES.ADMIN);
const requireProviderOrAdmin = requireRole(USER_ROLES.PROVIDER, USER_ROLES.ADMIN);
const requireAnyRole = requireRole(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, USER_ROLES.ADMIN);

const requireApprovedProvider = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.PROVIDER) {
      return next();
    }

    const ProviderProfile = (await import('../../models/ProviderProfile.model.js')).default;
    
    const profile = await ProviderProfile.findOne({ user: req.user._id });

    if (!profile) {
      return next(new ForbiddenError('Provider profile not found'));
    }

    if (profile.status !== 'approved') {
      return next(new ForbiddenError('Provider account is not yet approved'));
    }

    req.providerProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
};

const checkOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    const resource = req.resource;
    
    if (!resource) {
      return next(new Error('Resource not attached to request'));
    }

    if (req.user.role === USER_ROLES.ADMIN) {
      return next();
    }

    let ownerId;
    if (typeof resourceField === 'function') {
      ownerId = resourceField(resource);
    } else {
      ownerId = resource[resourceField];
    }

    if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
};

export {
  requireRole,
  requireCustomer,
  requireProvider,
  requireAdmin,
  requireCustomerOrAdmin,
  requireProviderOrAdmin,
  requireAnyRole,
  requireApprovedProvider,
  checkOwnership,
};

export default {
  requireRole,
  requireCustomer,
  requireProvider,
  requireAdmin,
  requireCustomerOrAdmin,
  requireProviderOrAdmin,
  requireAnyRole,
  requireApprovedProvider,
  checkOwnership,
};

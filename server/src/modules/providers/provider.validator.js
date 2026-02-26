import Joi from 'joi';
import { objectId, paginationSchema } from '../../shared/middleware/validate.middleware.js';

const registerProviderSchema = Joi.object({
  specialization: Joi.string().max(100).required(),
  licenseNumber: Joi.string().max(100).required(),
  experience: Joi.number().min(0).max(50).required(),
  bio: Joi.string().max(500).optional(),
  serviceCategories: Joi.array().items(objectId()).optional(),
});

const updateProviderProfileSchema = Joi.object({
  specialization: Joi.string().max(100),
  bio: Joi.string().max(500),
  serviceCategories: Joi.array().items(objectId()),
  isAvailable: Joi.boolean(),
  availabilityRadius: Joi.number().min(1).max(100),
});

const updateLocationSchema = Joi.object({
  longitude: Joi.number().min(-180).max(180).required(),
  latitude: Joi.number().min(-90).max(90).required(),
});

const acceptRejectJobSchema = Joi.object({
  action: Joi.string().valid('accept', 'reject').required(),
});

const updateJobStatusSchema = Joi.object({
  status: Joi.string()
    .valid('provider_arriving', 'in_progress', 'completed')
    .required(),
});

const providerJobsFilterSchema = paginationSchema.keys({
  status: Joi.string().valid('pending', 'confirmed', 'accepted', 'provider_arriving', 'in_progress', 'completed'),
});

const providerFilterSchema = paginationSchema.keys({
  status: Joi.string().valid('pending', 'approved', 'rejected'),
});

const approveRejectProviderSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  rejectionReason: Joi.string().max(500).when('action', {
    is: 'reject',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

export {
  registerProviderSchema,
  updateProviderProfileSchema,
  updateLocationSchema,
  acceptRejectJobSchema,
  updateJobStatusSchema,
  providerJobsFilterSchema,
  providerFilterSchema,
  approveRejectProviderSchema,
};

export default {
  registerProviderSchema,
  updateProviderProfileSchema,
  updateLocationSchema,
  acceptRejectJobSchema,
  updateJobStatusSchema,
  providerJobsFilterSchema,
  providerFilterSchema,
  approveRejectProviderSchema,
};

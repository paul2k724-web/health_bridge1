import Joi from 'joi';
import { objectId, paginationSchema } from '../../shared/middleware/validate.middleware.js';

const blockUserSchema = Joi.object({
  isBlocked: Joi.boolean().required(),
  reason: Joi.string().max(500).when('isBlocked', {
    is: true,
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
});

const userIdSchema = Joi.object({
  userId: objectId().required(),
});

const userFilterSchema = paginationSchema.keys({
  role: Joi.string().valid('customer', 'provider', 'admin'),
  isBlocked: Joi.string().valid('true', 'false'),
  search: Joi.string().max(100),
});

const exportFilterSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  status: Joi.string().valid('pending', 'confirmed', 'accepted', 'provider_arriving', 'in_progress', 'completed', 'cancelled', 'rejected'),
  format: Joi.string().valid('json', 'csv').default('json'),
});

export {
  blockUserSchema,
  userIdSchema,
  userFilterSchema,
  exportFilterSchema,
};

export default {
  blockUserSchema,
  userIdSchema,
  userFilterSchema,
  exportFilterSchema,
};

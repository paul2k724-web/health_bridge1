import Joi from 'joi';
import { objectId, paginationSchema } from '../../shared/middleware/validate.middleware.js';

const createServiceSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().max(500).required(),
  icon: Joi.string().optional(),
  basePrice: Joi.number().min(0).required(),
  duration: Joi.number().min(15).required(),
  category: Joi.string().valid('healthcare', 'home_service', 'both').default('both'),
  discount: Joi.object({
    percentage: Joi.number().min(0).max(100),
    validUntil: Joi.date(),
  }).optional(),
  isActive: Joi.boolean().default(true),
  tags: Joi.array().items(Joi.string()).optional(),
});

const updateServiceSchema = Joi.object({
  name: Joi.string().trim().max(100),
  description: Joi.string().max(500),
  icon: Joi.string(),
  basePrice: Joi.number().min(0),
  duration: Joi.number().min(15),
  category: Joi.string().valid('healthcare', 'home_service', 'both'),
  discount: Joi.object({
    percentage: Joi.number().min(0).max(100),
    validUntil: Joi.date(),
  }),
  isActive: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),
});

const serviceIdSchema = Joi.object({
  id: objectId().required(),
});

const serviceFilterSchema = paginationSchema.keys({
  category: Joi.string().valid('healthcare', 'home_service', 'both'),
  isActive: Joi.string().valid('true', 'false'),
});

export {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  serviceFilterSchema,
};

export default {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
  serviceFilterSchema,
};

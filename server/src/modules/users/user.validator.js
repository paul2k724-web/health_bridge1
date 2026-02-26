import Joi from 'joi';
import { objectId } from '../../shared/middleware/validate.middleware.js';

const createAddressSchema = Joi.object({
  label: Joi.string().valid('Home', 'Work', 'Other').required(),
  addressLine1: Joi.string().max(200).required(),
  addressLine2: Joi.string().max(200).optional(),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(100).required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required(),
  country: Joi.string().default('India'),
  landmark: Joi.string().max(100).optional(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
  }).optional(),
});

const updateAddressSchema = Joi.object({
  label: Joi.string().valid('Home', 'Work', 'Other'),
  addressLine1: Joi.string().max(200),
  addressLine2: Joi.string().max(200).allow(''),
  city: Joi.string().max(100),
  state: Joi.string().max(100),
  pincode: Joi.string().pattern(/^\d{6}$/),
  country: Joi.string(),
  landmark: Joi.string().max(100).allow(''),
  isDefault: Joi.boolean(),
  location: Joi.object({
    type: Joi.string().valid('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2),
  }),
});

const addressIdSchema = Joi.object({
  id: objectId().required(),
});

export {
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
};

export default {
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
};

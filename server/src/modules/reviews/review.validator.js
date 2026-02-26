import Joi from 'joi';
import { objectId } from '../../shared/middleware/validate.middleware.js';

const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required',
  }),
  review: Joi.string().max(1000).optional().messages({
    'string.max': 'Review cannot exceed 1000 characters',
  }),
  aspects: Joi.object({
    punctuality: Joi.number().integer().min(1).max(5).optional(),
    professionalism: Joi.number().integer().min(1).max(5).optional(),
    quality: Joi.number().integer().min(1).max(5).optional(),
    communication: Joi.number().integer().min(1).max(5).optional(),
    value: Joi.number().integer().min(1).max(5).optional(),
  }).optional(),
});

const providerReplySchema = Joi.object({
  text: Joi.string().max(500).required().messages({
    'string.max': 'Reply cannot exceed 500 characters',
    'any.required': 'Reply text is required',
  }),
});

const bookingIdSchema = Joi.object({
  bookingId: objectId().required(),
});

const reviewIdSchema = Joi.object({
  reviewId: objectId().required(),
});

export {
  createReviewSchema,
  providerReplySchema,
  bookingIdSchema,
  reviewIdSchema,
};

export default {
  createReviewSchema,
  providerReplySchema,
  bookingIdSchema,
  reviewIdSchema,
};

import Joi from 'joi';
import { objectId, paginationSchema } from '../../shared/middleware/validate.middleware.js';

const createBookingSchema = Joi.object({
  serviceId: objectId().required().messages({
    'string.pattern.name': 'Invalid service ID',
    'any.required': 'Service ID is required',
  }),
  addressId: objectId().required().messages({
    'string.pattern.name': 'Invalid address ID',
    'any.required': 'Address ID is required',
  }),
  scheduledDate: Joi.date().min('now').required().messages({
    'date.min': 'Scheduled date must be in the future',
    'any.required': 'Scheduled date is required',
  }),
  scheduledTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'Invalid time format (use HH:MM)',
    'any.required': 'Scheduled time is required',
  }),
  notes: Joi.string().max(500).optional(),
  idempotencyKey: Joi.string().max(100).optional(),
});

const updateBookingStatusSchema = Joi.object({
  status: Joi.string()
    .valid('confirmed', 'accepted', 'provider_arriving', 'in_progress', 'completed', 'cancelled')
    .required(),
  reason: Joi.string().max(500).when('status', {
    is: 'cancelled',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
});

const acceptRejectBookingSchema = Joi.object({
  action: Joi.string().valid('accept', 'reject').required(),
});

const rescheduleBookingSchema = Joi.object({
  scheduledDate: Joi.date().min('now').required().messages({
    'date.min': 'Scheduled date must be in the future',
    'any.required': 'Scheduled date is required',
  }),
  scheduledTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'Invalid time format (use HH:MM)',
    'any.required': 'Scheduled time is required',
  }),
  reason: Joi.string().max(500).optional(),
});

const bookingIdSchema = Joi.object({
  id: objectId().required(),
});

const jobIdSchema = Joi.object({
  jobId: objectId().required(),
});

const bookingFilterSchema = paginationSchema.keys({
  status: Joi.string().valid('pending', 'confirmed', 'assigned', 'accepted', 'provider_arriving', 'in_progress', 'completed', 'cancelled', 'no_show', 'rejected', 'refunded'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  serviceId: objectId(),
  providerId: objectId(),
  customerId: objectId(),
});

export {
  createBookingSchema,
  updateBookingStatusSchema,
  acceptRejectBookingSchema,
  rescheduleBookingSchema,
  bookingIdSchema,
  jobIdSchema,
  bookingFilterSchema,
};

export default {
  createBookingSchema,
  updateBookingStatusSchema,
  acceptRejectBookingSchema,
  rescheduleBookingSchema,
  bookingIdSchema,
  jobIdSchema,
  bookingFilterSchema,
};

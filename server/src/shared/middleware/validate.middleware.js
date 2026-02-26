import Joi from 'joi';
import { ValidationError } from '../errors/index.js';

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];
    
    const options = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
    };

    const { error, value } = schema.validate(data, options);

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError('Validation failed', errors));
    }

    req[property] = value;
    next();
  };
};

const validateParams = (schema) => validate(schema, 'params');
const validateQuery = (schema) => validate(schema, 'query');
const validateBody = (schema) => validate(schema, 'body');

const objectId = () => {
  return Joi.string().pattern(/^[0-9a-fA-F]{24}$/, 'ObjectId');
};

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc'),
  search: Joi.string().allow('').max(100),
});

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
});

const commonSchemas = {
  objectId,
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
};

export {
  validate,
  validateParams,
  validateQuery,
  validateBody,
  commonSchemas,
  objectId,
  paginationSchema,
  dateRangeSchema,
};

export default {
  validate,
  validateParams,
  validateQuery,
  validateBody,
  commonSchemas,
  objectId,
  paginationSchema,
  dateRangeSchema,
};

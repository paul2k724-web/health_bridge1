import logger from '../utils/logger.js';
import { AppError } from '../errors/index.js';
import config from '../../config/index.js';

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.server.nodeEnv === 'development') {
    logger.error('Error occurred', {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user?._id,
    });
  } else {
    if (err.isOperational) {
      logger.warn('Operational error', {
        message: err.message,
        statusCode: err.statusCode,
        path: req.path,
      });
    } else {
      logger.error('Unexpected error', {
        message: err.message,
        statusCode: err.statusCode,
        path: req.path,
      });
    }
  }

  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    err = new AppError(message, 400, 'CAST_ERROR');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for ${field}. Please use another value.`;
    err = new AppError(message, 409, 'DUPLICATE_KEY');
  }

  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    err = new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    err.errors = errors;
  }

  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token. Please log in again.', 401, 'JWT_ERROR');
  }

  if (err.name === 'TokenExpiredError') {
    err = new AppError('Token expired. Please log in again.', 401, 'TOKEN_EXPIRED');
  }

  const response = {
    success: false,
    message: err.message || 'Something went wrong',
    timestamp: new Date().toISOString(),
  };

  if (err.errorCode) {
    response.errorCode = err.errorCode;
  }

  if (err.errors) {
    response.errors = err.errors;
  }

  if (config.server.nodeEnv === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(err.statusCode).json(response);
};

const notFound = (req, res, next) => {
  const err = new AppError(`Not found - ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(err);
};

export { errorHandler, notFound };

export default errorHandler;

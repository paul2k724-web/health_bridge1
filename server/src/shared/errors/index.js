class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error', errors = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict occurred') {
    super(message, 409, 'CONFLICT');
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429, 'TOO_MANY_REQUESTS');
    this.retryAfter = retryAfter;
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
  BadRequestError,
};

export default AppError;

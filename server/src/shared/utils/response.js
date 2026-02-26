class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(res, message = 'Error', statusCode = 500, errorCode = null, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errorCode) {
      response.errorCode = errorCode;
    }

    if (errors) {
      response.errors = errors;
    }

    if (process.env.NODE_ENV === 'development') {
      response.stack = new Error().stack;
    }

    return res.status(statusCode).json(response);
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page * pagination.limit < pagination.total,
        hasPrev: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401, 'UNAUTHORIZED');
  }

  static forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, 403, 'FORBIDDEN');
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404, 'NOT_FOUND');
  }

  static conflict(res, message = 'Conflict occurred') {
    return this.error(res, message, 409, 'CONFLICT');
  }

  static validationError(res, errors, message = 'Validation error') {
    return this.error(res, message, 400, 'VALIDATION_ERROR', errors);
  }

  static tooManyRequests(res, message = 'Too many requests', retryAfter = null) {
    if (retryAfter) {
      res.setHeader('Retry-After', retryAfter);
    }
    return this.error(res, message, 429, 'TOO_MANY_REQUESTS');
  }
}

export default ApiResponse;

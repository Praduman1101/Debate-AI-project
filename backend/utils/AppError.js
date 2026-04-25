/**
 * AppError — structured application error class
 *
 * Usage:
 *   throw new AppError('Topic not found', 404);
 *   throw new AppError('Invalid stance value', 400, 'INVALID_STANCE');
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name       = 'AppError';
    this.statusCode = statusCode;
    this.code       = code || httpCodeToName(statusCode);
    this.isOperational = true; // distinguishes from unexpected crashes

    // Preserve stack trace (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** Return a JSON-safe representation */
  toJSON() {
    return {
      error:      this.message,
      code:       this.code,
      statusCode: this.statusCode,
    };
  }
}

const httpCodeToName = (code) => {
  const names = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };
  return names[code] || 'ERROR';
};

// Common factory helpers
AppError.notFound     = (resource = 'Resource') => new AppError(`${resource} not found`, 404);
AppError.unauthorized = (msg = 'Not authorized')   => new AppError(msg, 401);
AppError.forbidden    = (msg = 'Access denied')    => new AppError(msg, 403);
AppError.badRequest   = (msg)                      => new AppError(msg, 400);
AppError.conflict     = (msg)                      => new AppError(msg, 409);
AppError.unavailable  = (msg)                      => new AppError(msg, 503);

module.exports = AppError;

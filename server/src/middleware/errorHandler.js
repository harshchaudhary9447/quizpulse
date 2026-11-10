const { sendError } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  if (err.name === 'ZodError') {
    return sendError(
      res,
      'Validation error',
      422,
      'VALIDATION_ERROR',
      err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    );
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired', 401, 'TOKEN_EXPIRED');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  return sendError(res, message, statusCode, code, err.details || null);
}

module.exports = errorHandler;

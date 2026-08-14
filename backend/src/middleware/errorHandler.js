const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const requestId = req.headers['x-request-id'] || req.id;

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId,
    method: req.method,
    path: req.path,
    userId: req.user?._id,
    ip: req.ip
  });

  let statusCode = err.statusCode || 500;
  let message;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const first = Object.values(err.errors || {})[0];
    message = first?.message || err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid value supplied for a required field';
  } else if (statusCode >= 400 && statusCode < 500 && err.message) {
    message = err.message;
  } else {
    message = 'Service temporarily unavailable. Please try again later.';
  }

  res.status(statusCode).json({ error: message });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };

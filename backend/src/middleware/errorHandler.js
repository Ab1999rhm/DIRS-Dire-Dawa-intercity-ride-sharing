const logger = require('../config/logger');

const sanitizeMessage = (msg) => {
  if (!msg) return 'Internal Server Error';
  const lower = msg.toLowerCase();
  if (lower.includes('mongodb') || lower.includes('mongoose') || lower.includes('connection') ||
      lower.includes('eaddrinuse') || lower.includes('enotfound') || lower.includes('ETIMEOUT') ||
      lower.includes('getaddrinfo') || lower.includes('srv') || lower.includes('replicaSet') ||
      lower.includes('tls') || lower.includes('certificate') || lower.includes('password')) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  return msg;
};

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

  const statusCode = err.statusCode || 500;
  const message = 'Service temporarily unavailable. Please try again later.';

  res.status(statusCode).json({
    error: message
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const logger = require('../config/logger');

const sanitizeOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
};

const xssMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = deepSanitize(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = deepSanitize(req.params);
  }
  next();
};

function deepSanitize(obj) {
  if (typeof obj === 'string') {
    return xss(obj, sanitizeOptions);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized;
  }
  return obj;
}

const securityMiddleware = (app) => {
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      logger.warn(`Sanitized NoSQL injection attempt on ${req.method} ${req.path}`, { key });
    }
  }));

  app.use(xssMiddleware);
};

module.exports = { securityMiddleware };

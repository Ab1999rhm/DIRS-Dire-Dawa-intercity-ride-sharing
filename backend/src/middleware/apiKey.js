const crypto = require('crypto');
const APIKey = require('../models/APIKey');

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

/**
 * Protect an endpoint with a valid API key passed via `x-api-key` header.
 * Attaches `req.apiKey` (the document) on success.
 */
async function protectApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  try {
    const apiKey = await APIKey.findOne({
      keyHash: hashKey(key),
      isActive: true
    });

    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return res.status(401).json({ error: 'API key has expired' });
    }

    apiKey.usageCount = (apiKey.usageCount || 0) + 1;
    apiKey.lastUsedAt = new Date();
    await apiKey.save().catch(() => {});

    req.apiKey = apiKey;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'API key verification failed' });
  }
}

/**
 * Allow either a valid API key OR a valid user Bearer token.
 * Attaches `req.user` (JWT) or `req.apiKey` (doc) depending on which passes.
 */
function protectOrApiKey(protect) {
  return async (req, res, next) => {
    if (req.headers['x-api-key']) {
      return protectApiKey(req, res, next);
    }
    return protect(req, res, next);
  };
}

/**
 * For endpoints that are normally public: if an `x-api-key` header is
 * present it must be valid; otherwise allow anonymous access.
 */
async function validateOptionalApiKey(req, res, next) {
  if (!req.headers['x-api-key']) {
    return next();
  }
  return protectApiKey(req, res, next);
}

module.exports = { protectApiKey, protectOrApiKey, validateOptionalApiKey, hashKey };
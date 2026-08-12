const logger = require('../config/logger');

const DEFAULT_INTERVAL_MINUTES = 10;

const resolveTargets = () => {
  const fromEnv = (process.env.KEEP_ALIVE_URLS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (fromEnv.length > 0) return fromEnv;

  const targets = [];
  const backend = process.env.BACKEND_URL || 'http://localhost:5000';
  targets.push(`${backend}/api/health`);
  if (process.env.FRONTEND_URL) targets.push(process.env.FRONTEND_URL);
  return targets;
};

const ping = async (url) => {
  const started = Date.now();
  try {
    const res = await fetch(url, { method: 'GET' });
    logger.info(`Keep-alive ping ${url} -> ${res.status} (${Date.now() - started}ms)`);
  } catch (err) {
    logger.warn(`Keep-alive ping failed for ${url}: ${err.message}`);
  }
};

const startKeepAlive = () => {
  if (process.env.KEEP_ALIVE_ENABLED === 'false') {
    logger.info('Keep-alive disabled (KEEP_ALIVE_ENABLED=false)');
    return null;
  }

  const intervalMs = (parseInt(process.env.KEEP_ALIVE_INTERVAL_MINUTES, 10) || DEFAULT_INTERVAL_MINUTES) * 60 * 1000;
  const targets = resolveTargets();

  logger.info(`Keep-alive cron started: pinging every ${intervalMs / 60000} minutes -> [${targets.join(', ')}]`);

  const timer = setInterval(() => {
    targets.forEach(ping);
  }, intervalMs);

  if (timer.unref) timer.unref();
  return timer;
};

module.exports = { startKeepAlive, ping };
const WebhookConfig = require('../models/WebhookConfig');
const logger = require('../config/logger');
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function deliverWithRetry(webhook, event, payload) {
  const { maxRetries = 3, retryDelay = 1000, exponentialBackoff = true, enabled = true } =
    webhook.retryPolicy || {};
  const attempts = enabled ? Math.max(1, Number(maxRetries) + 1) : 1;
  const timeout = webhook.timeout || 10000;

  const headers = {};
  if (Array.isArray(webhook.headers)) {
    for (const h of webhook.headers) {
      if (h && h.key) headers[h.key] = h.value;
    }
  }

  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await axios.post(webhook.url, {
        event,
        timestamp: new Date(),
        data: payload
      }, {
        headers,
        timeout
      });
      await WebhookConfig.findByIdAndUpdate(webhook._id, {
        $inc: { successCount: 1 },
        lastTriggeredAt: new Date()
      });
      logger.info('Webhook delivered', { webhookId: webhook._id, event, attempt });
      return { ok: true, status: res.status };
    } catch (error) {
      lastError = error;
      logger.warn('Webhook delivery failed', { webhookId: webhook._id, event, attempt });
      if (attempt < attempts) {
        const delay = exponentialBackoff
          ? retryDelay * Math.pow(2, attempt - 1)
          : retryDelay;
        await sleep(delay);
      }
    }
  }

  await WebhookConfig.findByIdAndUpdate(webhook._id, {
    $inc: { failureCount: 1 },
    lastTriggeredAt: new Date()
  });
  logger.error('Webhook delivery exhausted retries', { webhookId: webhook._id, event, error: lastError?.message });
  return { ok: false, error: lastError?.message };
}

/**
 * Dispatch an event to all active webhooks subscribed to it.
 * Fire-and-forget: never throws, never blocks the caller.
 */
async function dispatchWebhooks(event, payload = {}) {
  if (!event) return;
  try {
    const webhooks = await WebhookConfig.find({
      isActive: true,
      events: event
    }).lean();
    if (webhooks.length === 0) return;

    logger.info('Dispatching webhooks', { event, count: webhooks.length });

    for (const webhook of webhooks) {
      // Use setImmediate/void so failures are handled per-webhook and never crash the process
      void deliverWithRetry(webhook, event, payload);
    }
  } catch (error) {
    logger.error('dispatchWebhooks error', { event, error: error.message });
  }
}

module.exports = { dispatchWebhooks };
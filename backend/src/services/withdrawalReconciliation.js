const Payment = require('../models/Payment');
const User = require('../models/User');
const Driver = require('../models/Driver');
const chapaService = require('./chapaService');
const { notifyRideUpdate } = require('./notificationService');
const logger = require('../config/logger');

const POLL_INTERVAL_MINUTES = parseInt(process.env.WITHDRAWAL_POLL_MINUTES, 10) || 5;
const MAX_PROCESSING_AGE_HOURS = 72;

const normalizeStatus = (raw) => {
  const s = String(raw || '').toLowerCase();
  if (['success', 'successful', 'completed', 'settled', 'processed'].includes(s)) return 'completed';
  if (['failed', 'reverted', 'reversed', 'cancelled', 'rejected'].includes(s)) return 'failed';
  if (['pending', 'processing', 'queued', 'approved'].includes(s)) return 'processing';
  return 'processing';
};

async function reconcileWithdrawal(payment) {
  const reference = payment.transactionId;
  if (!reference) return;

  let verify;
  try {
    verify = await chapaService.verifyTransfer(reference);
  } catch (err) {
    logger.warn('Withdrawal reconcile: verify call failed', { reference, error: err.message });
    return;
  }

  const data = verify?.data || verify || {};
  const chapaStatus = data.status || data.transfer_status || verify?.status;
  const status = normalizeStatus(chapaStatus);

  if (status === payment.status) return;

  if (status === 'completed') {
    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.paymentGatewayResponse = { ...(payment.paymentGatewayResponse || {}), reconcile: verify };
    await payment.save();

    await notifyRideUpdate(payment.passenger, 'withdrawal_completed', {
      amount: payment.amount,
      reference,
      transactionId: payment.transactionId
    });
    logger.info('Withdrawal completed via reconciliation', { paymentId: payment._id, reference, amount: payment.amount });
  } else if (status === 'failed') {
    payment.status = 'failed';
    payment.paymentGatewayResponse = { ...(payment.paymentGatewayResponse || {}), reconcile: verify, failureReason: chapaStatus };
    await payment.save();

    await refundBalance(payment);
    await notifyRideUpdate(payment.passenger, 'withdrawal_failed', {
      amount: payment.amount,
      reference,
      reason: chapaStatus || 'Transfer failed'
    });
    logger.info('Withdrawal failed and refunded via reconciliation', { paymentId: payment._id, reference, amount: payment.amount });
  }
}

async function refundBalance(payment) {
  if (payment.driver) {
    const driver = await Driver.findById(payment.driver);
    if (driver) {
      driver.availableBalance = (driver.availableBalance || 0) + payment.amount;
      await driver.save();
      return;
    }
  }
  const user = await User.findById(payment.passenger);
  if (user) {
    user.walletBalance = (user.walletBalance || 0) + payment.amount;
    await user.save();
  }
}

async function reconcilePendingWithdrawals() {
  const cutoff = new Date(Date.now() - MAX_PROCESSING_AGE_HOURS * 60 * 60 * 1000);

  const pending = await Payment.find({
    type: 'withdrawal',
    status: { $in: ['processing'] },
    createdAt: { $gte: cutoff }
  }).limit(50);

  if (pending.length === 0) return { checked: 0, updated: 0 };

  let updated = 0;
  for (const payment of pending) {
    const before = payment.status;
    try {
      await reconcileWithdrawal(payment);
      if (before !== payment.status) updated += 1;
    } catch (err) {
      logger.error('Withdrawal reconcile error', { paymentId: payment._id, error: err.message });
    }
  }

  logger.info(`Withdrawal reconciliation run: checked=${pending.length} updated=${updated}`);
  return { checked: pending.length, updated };
}

async function reconcileUserWithdrawals(userId) {
  const pending = await Payment.find({
    type: 'withdrawal',
    passenger: userId,
    status: 'processing'
  }).limit(20);

  if (pending.length === 0) return { checked: 0, updated: 0 };

  let updated = 0;
  for (const payment of pending) {
    const before = payment.status;
    try {
      await reconcileWithdrawal(payment);
      if (before !== payment.status) updated += 1;
    } catch (err) {
      logger.error('User withdrawal reconcile error', { paymentId: payment._id, error: err.message });
    }
  }

  if (updated > 0) {
    logger.info(`User withdrawal reconciliation: user=${userId} checked=${pending.length} updated=${updated}`);
  }
  return { checked: pending.length, updated };
}

const startWithdrawalReconciliation = () => {
  if (process.env.WITHDRAWAL_POLL_ENABLED === 'false') {
    logger.info('Withdrawal reconciliation disabled (WITHDRAWAL_POLL_ENABLED=false)');
    return null;
  }

  const intervalMs = POLL_INTERVAL_MINUTES * 60 * 1000;
  logger.info(`Withdrawal reconciliation cron started: every ${POLL_INTERVAL_MINUTES} minutes`);

  const run = async () => {
    try {
      await reconcilePendingWithdrawals();
    } catch (err) {
      logger.error('Withdrawal reconciliation cron error', { error: err.message });
    }
  };

  const timer = setInterval(run, intervalMs);
  if (timer.unref) timer.unref();
  return timer;
};

module.exports = { startWithdrawalReconciliation, reconcilePendingWithdrawals, reconcileWithdrawal, reconcileUserWithdrawals };

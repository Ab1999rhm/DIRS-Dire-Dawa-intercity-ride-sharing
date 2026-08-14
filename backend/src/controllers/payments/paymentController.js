const Payment = require('../../models/Payment');
const Trip = require('../../models/Trip');
const Driver = require('../../models/Driver');
const User = require('../../models/User');
const FraudDetection = require('../../models/FraudDetection');
const { calculateCommission } = require('../../services/pricingService');
const { notifyRideUpdate } = require('../../services/notificationService');
const { calculateTotalFare } = require('../../services/pricingService');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');
const chapaService = require('../../services/chapaService');

const idempotencyStore = new Map();

function getIdempotencyKey(key, ttlMs = 60000) {
  const entry = idempotencyStore.get(key);
  if (entry && Date.now() - entry.timestamp < ttlMs) {
    return entry.result;
  }
  return null;
}

function setIdempotencyKey(key, result, ttlMs = 60000) {
  idempotencyStore.set(key, { result, timestamp: Date.now() });

  setTimeout(() => idempotencyStore.delete(key), ttlMs);
}

exports.processPayment = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { method } = req.body;

  const idempotencyKey = `payment_${tripId}_${method}_${req.user._id}`;
  const existing = getIdempotencyKey(idempotencyKey);
  if (existing) {
    return res.json(existing);
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.payment) {
    return res.status(400).json({ error: 'Trip already paid' });
  }

  if (trip.route && trip.route.distance && trip.route.duration) {
    const rideType = trip.rideType || 'intra_city';
    const serverFare = calculateTotalFare(trip.route.distance, trip.route.duration, rideType);
    const fareDifference = Math.abs(serverFare.totalFare - trip.fare.totalFare);
    if (fareDifference > serverFare.totalFare * 0.1) {
      logger.warn('Fare mismatch detected', {
        tripId,
        clientFare: trip.fare.totalFare,
        serverFare: serverFare.totalFare,
        userId: req.user._id
      });
      trip.fare = serverFare;
      await trip.save();
    }
  }

  const { platformCommission, driverEarnings } = calculateCommission(trip.fare.totalFare);

  let paymentStatus = 'pending';
  let transactionId = null;
  let gatewayResponse = null;

  if (method === 'cash') {
    paymentStatus = 'completed';
    transactionId = `CASH-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  } else if (method === 'wallet') {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const totalFare = trip.fare.totalFare;
    if ((user.walletBalance || 0) < totalFare) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }
    user.walletBalance = (user.walletBalance || 0) - totalFare;
    await user.save();
    paymentStatus = 'completed';
    transactionId = `WALLET-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  } else if (method === 'telebirr') {
    const result = await processTelebirrPayment(trip.fare.totalFare, req.user.phoneNumber);
    paymentStatus = result.success ? 'completed' : 'failed';
    transactionId = result.transactionId;
    gatewayResponse = result;
  } else if (method === 'chapa') {
    const result = await processChapaPayment(trip.fare.totalFare, req.user.email);
    paymentStatus = result.success ? 'pending' : 'failed';
    transactionId = result.transactionId;
    gatewayResponse = result;
  }

  if (paymentStatus === 'failed') {
    const recentFailed = await Payment.countDocuments({
      passenger: req.user._id,
      status: 'failed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    if (recentFailed >= 3) {
      const existingFraud = await FraudDetection.findOne({
        user: req.user._id,
        type: 'payment_fraud',
        status: { $in: ['detected', 'investigating'] }
      });
      if (!existingFraud) {
        await FraudDetection.create({
          user: req.user._id,
          type: 'payment_fraud',
          severity: 'high',
          description: `${recentFailed} failed payment attempts in 24 hours`,
          evidence: { ipAddress: req.ip, userAgent: req.get('user-agent') },
          status: 'detected',
          failedPayments: [{ attemptDate: new Date(), amount: trip.fare.totalFare, paymentMethod: method, failureReason: 'Gateway rejected' }]
        });
        logger.warn('Fraud detection: multiple failed payments', { userId: req.user._id, count: recentFailed });
      }
    }
  }

  const payment = await Payment.create({
    type: 'trip_payment',
    trip: tripId,
    passenger: req.user._id,
    driver: trip.driver,
    amount: trip.fare.totalFare,
    method,
    status: paymentStatus,
    platformCommission,
    driverEarnings,
    transactionId,
    paymentGatewayResponse: gatewayResponse,
    paidAt: paymentStatus === 'completed' ? new Date() : null
  });

  if (paymentStatus === 'completed') {
    trip.payment = payment._id;
    await trip.save();

    const driver = await Driver.findById(trip.driver);
    if (driver) {
      driver.totalEarnings += driverEarnings;
      driver.availableBalance += driverEarnings;
      await driver.save();
    }

    await notifyRideUpdate(req.user._id, 'payment_received', {
      tripId: trip._id,
      amount: trip.fare.totalFare,
      method
    });

    await notifyRideUpdate(trip.driver, 'payment_received', {
      tripId: trip._id,
      amount: driverEarnings,
      method
    });
  }

  const result = { payment, checkoutUrl: gatewayResponse?.checkoutUrl || null };
  setIdempotencyKey(idempotencyKey, result);

  logger.info('Payment processed', {
    tripId,
    method,
    status: paymentStatus,
    amount: trip.fare.totalFare
  });

  res.json(result);
});

exports.getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId)
    .populate('trip')
    .populate('passenger', 'firstName lastName phoneNumber')
    .populate('driver', 'user')
    .populate({
      path: 'driver',
      populate: { path: 'user', select: 'firstName lastName phoneNumber' }
    });

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  res.json({ payment });
});

exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { passenger: req.user._id };
  if (status) {
    query.status = status;
  }

  const payments = await Payment.find(query)
    .populate('trip', 'pickupLocation dropoffLocation createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.json({ payments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getWallet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const transactions = await Payment.find({ passenger: user._id })
    .populate('trip', 'pickupLocation dropoffLocation createdAt')
    .sort({ createdAt: -1 })
    .limit(30);

  res.json({
    balance: user.walletBalance || 0,
    currency: 'ETB',
    transactions
  });
});

exports.deleteTransaction = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findOne({ _id: paymentId, passenger: req.user._id });

  if (!payment) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (payment.status === 'completed' && payment.type === 'top_up') {
    return res.status(400).json({ error: 'Completed top-ups cannot be deleted' });
  }

  if (payment.type === 'trip_payment') {
    return res.status(400).json({ error: 'Trip payments cannot be deleted' });
  }

  await Payment.deleteOne({ _id: payment._id });

  res.json({ success: true, message: 'Transaction deleted' });
});

exports.walletTopUp = asyncHandler(async (req, res) => {
  const { amount, method } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let paymentStatus = 'pending';
  let transactionId = null;
  let gatewayResponse = null;

  if (method === 'telebirr') {
    transactionId = `TLB-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    gatewayResponse = { simulated: true, mode: process.env.PAYMENT_TEST_MODE || 'test' };
    paymentStatus = 'completed';
  } else if (method === 'chapa') {
    const result = await processChapaPayment(Number(amount), user.email);
    transactionId = result.transactionId || `CHA-${Date.now()}`;
    gatewayResponse = result;
    paymentStatus = result.success ? 'pending' : 'failed';
  } else {
    transactionId = `WAL-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    paymentStatus = 'completed';
  }

  if (paymentStatus === 'failed') {
    return res.status(400).json({ error: 'Payment gateway rejected the top-up' });
  }

  if (paymentStatus === 'completed') {
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    await user.save();
  }

  const payment = await Payment.create({
    type: 'top_up',
    passenger: user._id,
    amount: Number(amount),
    method: method || 'wallet',
    status: paymentStatus,
    transactionId,
    paymentGatewayResponse: gatewayResponse,
    paidAt: paymentStatus === 'completed' ? new Date() : null
  });

  res.json({ payment, balance: user.walletBalance, checkoutUrl: gatewayResponse?.checkoutUrl || null });
});

exports.walletWithdraw = asyncHandler(async (req, res) => {
  const { amount, method = 'telebirr', accountDetails = null } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const withdrawAmount = Number(amount);
  if (!withdrawAmount || withdrawAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (withdrawAmount < 100) {
    return res.status(400).json({ error: 'Minimum withdrawal is 100 ETB' });
  }

  if (withdrawAmount > (user.walletBalance || 0)) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  if (method === 'bank' && !accountDetails?.bankCode) {
    return res.status(400).json({ error: 'Please select a bank for withdrawal' });
  }

  if (!accountDetails?.accountNumber && !accountDetails?.accountName) {
    return res.status(400).json({ error: 'Recipient account name and number are required' });
  }

  const transfer = await chapaService.initiateTransfer({
    accountName: accountDetails?.accountName || `${user.firstName} ${user.lastName}`,
    accountNumber: accountDetails?.accountNumber || chapaService.normalizeEthiopianPhone(user.phoneNumber),
    amount: withdrawAmount,
    bankCode: accountDetails?.bankCode || await chapaService.resolveBankCode(method, accountDetails),
    reference: `WD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
  });

  if (!transfer || transfer.status === 'failed') {
    logger.warn('Chapa withdrawal rejected', { userId: user._id, amount: withdrawAmount, method, error: transfer?.error || transfer?.message });
    return res.status(400).json({ error: transfer?.error || transfer?.message || 'Withdrawal rejected by payment gateway' });
  }

  user.walletBalance = (user.walletBalance || 0) - withdrawAmount;
  await user.save();

  const payment = await Payment.create({
    type: 'withdrawal',
    passenger: user._id,
    amount: withdrawAmount,
    method,
    status: 'processing',
    transactionId: transfer.reference || `WD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    paymentGatewayResponse: { ...transfer, accountDetails }
  });

  logger.info('Wallet withdrawal initiated via Chapa', { userId: user._id, amount: withdrawAmount, method, reference: transfer.reference });
  await notifyRideUpdate(user._id, 'withdrawal_requested', {
    amount: withdrawAmount,
    method,
    reference: transfer.reference,
    estimatedProcessing: '1-3 business days'
  });

  res.json({
    message: 'Withdrawal request submitted',
    payment,
    balance: user.walletBalance,
    reference: transfer.reference,
    estimatedProcessing: '1-3 business days'
  });
});

exports.getDriverEarnings = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  const payments = await Payment.find({
    driver: driver._id,
    status: 'completed'
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEarnings = payments
    .filter(p => p.paidAt >= today)
    .reduce((sum, p) => sum + p.driverEarnings, 0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEarnings = payments
    .filter(p => p.paidAt >= weekStart)
    .reduce((sum, p) => sum + p.driverEarnings, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEarnings = payments
    .filter(p => p.paidAt >= monthStart)
    .reduce((sum, p) => sum + p.driverEarnings, 0);

  res.json({
    totalEarnings: driver.totalEarnings,
    availableBalance: driver.availableBalance,
    todayEarnings,
    weekEarnings,
    monthEarnings,
    totalTrips: driver.totalTrips
  });
});

exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, method = 'telebirr', accountDetails = null } = req.body;

  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  if (amount > driver.availableBalance) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  if (amount < 100) {
    return res.status(400).json({ error: 'Minimum withdrawal is 100 ETB' });
  }

  if (method === 'bank' && !accountDetails?.bankCode) {
    return res.status(400).json({ error: 'Please select a bank for withdrawal' });
  }

  if (!accountDetails?.accountNumber && !accountDetails?.accountName) {
    return res.status(400).json({ error: 'Recipient account name and number are required' });
  }

  const transfer = await chapaService.initiateTransfer({
    accountName: accountDetails?.accountName || driver.bankAccount?.accountName,
    accountNumber: accountDetails?.accountNumber || driver.bankAccount?.accountNumber,
    amount,
    bankCode: accountDetails?.bankCode || await chapaService.resolveBankCode(method, accountDetails),
    reference: `WD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
  });

  if (!transfer || transfer.status === 'failed') {
    logger.warn('Chapa driver withdrawal rejected', { driverId: driver._id, amount, method, error: transfer?.error || transfer?.message });
    return res.status(400).json({ error: transfer?.error || transfer?.message || 'Withdrawal rejected by payment gateway' });
  }

  driver.availableBalance -= amount;
  await driver.save();

  logger.info('Driver withdrawal initiated via Chapa', { driverId: driver._id, amount, method, reference: transfer.reference });

  res.json({
    message: 'Withdrawal request submitted',
    amount,
    method,
    reference: transfer.reference,
    estimatedProcessing: '1-3 business days'
  });
});

exports.getBanks = asyncHandler(async (req, res) => {
  const banks = await chapaService.listBanks();
  res.json({ banks });
});

exports.verifyWithdrawal = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const verify = await chapaService.verifyTransfer(reference);
  res.json({ reference, transfer: verify });
});

const processTelebirrPayment = async (amount, phoneNumber) => {
  try {
    const response = await axios.post(
      'https://api.ethiostamp.dev/v1/telebirr/payment',
      {
        appId: process.env.TELEBIRR_APP_ID,
        appKey: process.env.TELEBIRR_APP_KEY,
        shortCode: process.env.TELEBIRR_SHORT_CODE,
        phoneNumber,
        amount,
        subject: 'DIRS Ride Payment',
        body: `Payment for DIRS ride - ${amount} ETB`
      }
    );

    return {
      success: true,
      transactionId: response.data.transactionId,
      status: response.data.status
    };
  } catch (error) {
    logger.error('Telebirr payment error', { error: error.message });
    return { success: false, error: error.message };
  }
};

const processChapaPayment = async (amount, email) => {
  const tx_ref = `DIRS-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  try {
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount: amount.toString(),
        currency: 'ETB',
        email,
        tx_ref,
        callback_url: `${process.env.BACKEND_URL}/api/payments/chapa/webhook`,
        return_url: `${process.env.FRONTEND_URL}/passenger/wallet`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      transactionId: tx_ref,
      checkoutUrl: response.data.data.checkout_url
    };
  } catch (error) {
    logger.error('Chapa payment error', { error: error.message });
    return { success: false, error: error.message };
  }
};

exports.chapaApproval = asyncHandler(async (req, res) => {
  const approvalSecret = process.env.CHAPA_APPROVAL_SECRET;
  if (approvalSecret) {
    const signature = req.headers['chapa-signature'] || req.headers['x-chapa-signature'];
    const bodyString = JSON.stringify(req.body || {});
    const payloadHash = crypto.createHmac('sha256', approvalSecret).update(bodyString).digest('hex');
    if (!signature || String(signature) !== payloadHash) {
      logger.warn('Chapa approval webhook rejected: bad signature', { ip: req.ip, reference: req.body?.reference });
      return res.status(400).json({ approved: false, message: 'Invalid signature' });
    }
  }

  const { reference, amount, bank } = req.body || {};
  logger.info('Chapa transfer pending server approval', { reference, amount, bank });

  const payment = await Payment.findOne({ transactionId: reference });
  if (!payment) {
    logger.warn('Chapa approval for unknown reference', { reference });
    return res.status(400).json({ approved: false, message: 'Unknown reference' });
  }

  payment.status = 'processing';
  await payment.save();

  res.json({ approved: true });
});

exports.chapaWebhook = asyncHandler(async (req, res) => {
  logger.info('Chapa webhook received', {
    event: req.body?.event,
    status: req.body?.status,
    tx_ref: req.body?.tx_ref,
    reference: req.body?.reference,
    method: req.body?.payment_method,
    ip: req.ip,
    headers: Object.keys(req.headers).filter(h => h.toLowerCase().includes('signature'))
  });

  const secret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('CHAPA_WEBHOOK_SECRET not configured — webhook disabled');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const bodyString = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

  const payloadHash = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
  const secretHash = crypto.createHmac('sha256', secret).update(secret).digest('hex');

  const signatures = [req.headers['chapa-signature'], req.headers['x-chapa-signature']].filter(Boolean);
  const valid = signatures.some(
    s => String(s) === payloadHash || String(s) === secretHash
  );

  if (!valid) {
    logger.warn('Invalid Chapa webhook signature', { ip: req.ip, tx_ref: req.body?.tx_ref });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { tx_ref, status } = req.body;

  if (status === 'success') {
    const payment = await Payment.findOne({ transactionId: tx_ref });
    if (!payment) {
      logger.warn('Chapa webhook: payment not found for tx_ref', { tx_ref });
    }
    if (payment && payment.status !== 'completed') {
      let trusted = true;
      if (process.env.CHAPA_SECRET_KEY) {
        try {
          const verifyRes = await axios.get(
            `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
            { headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` } }
          );
          const vStatus = verifyRes.data?.data?.status;
          if (vStatus !== 'success') {
            logger.warn('Chapa webhook status success but verify API disagrees', { tx_ref, vStatus });
            trusted = false;
          }
        } catch (error) {
          logger.error('Chapa webhook re-verify failed', { tx_ref, error: error.message });
        }
      }

      if (!trusted) {
        return res.json({ status: 'ok', note: 'webhook received but verification failed, not credited' });
      }

      payment.status = 'completed';
      payment.paidAt = new Date();
      await payment.save();

      if (payment.type === 'top_up' && payment.passenger) {
        await User.findByIdAndUpdate(payment.passenger, {
          $inc: { walletBalance: payment.amount }
        });
        await notifyRideUpdate(payment.passenger, 'wallet_topup_confirmed', {
          amount: payment.amount,
          transactionId: payment.transactionId
        });
        logger.info('Wallet top-up confirmed via Chapa', { tx_ref, paymentId: payment._id });
      }

      const trip = await Trip.findById(payment.trip);
      if (trip) {
        trip.payment = payment._id;
        await trip.save();

        const driver = await Driver.findById(payment.driver);
        if (driver) {
          driver.totalEarnings += payment.driverEarnings;
          driver.availableBalance += payment.driverEarnings;
          await driver.save();
        }
      }

      logger.info('Chapa webhook payment confirmed', { tx_ref, paymentId: payment._id });
    }
  }

  res.json({ status: 'ok' });
});

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
  const { amount, method, accountDetails } = req.body;

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

  driver.availableBalance -= amount;
  await driver.save();

  logger.info('Withdrawal requested', { driverId: driver._id, amount, method });

  res.json({
    message: 'Withdrawal request submitted',
    amount,
    method,
    estimatedProcessing: '1-3 business days'
  });
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
  try {
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount: amount.toString(),
        currency: 'ETB',
        email,
        tx_ref: `DIRS-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        callback_url: `${process.env.BACKEND_URL}/api/payments/chapa/webhook`,
        return_url: `${process.env.FRONTEND_URL}`
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
      transactionId: response.data.data.tx_ref,
      checkoutUrl: response.data.data.checkout_url
    };
  } catch (error) {
    logger.error('Chapa payment error', { error: error.message });
    return { success: false, error: error.message };
  }
};

exports.chapaWebhook = asyncHandler(async (req, res) => {
  if (!process.env.CHAPA_WEBHOOK_SECRET) {
    logger.error('CHAPA_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const signature = req.headers['chapa-signature'];

  const hmac = crypto.createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET);
  const bodyString = JSON.stringify(req.body);
  const expectedSignature = hmac.update(bodyString).digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Invalid Chapa webhook signature', { ip: req.ip });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { tx_ref, status } = req.body;

  if (status === 'success') {
    const payment = await Payment.findOne({ transactionId: tx_ref });
    if (payment && payment.status !== 'completed') {
      payment.status = 'completed';
      payment.paidAt = new Date();
      await payment.save();

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

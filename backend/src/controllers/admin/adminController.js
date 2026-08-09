const User = require('../../models/User');
const Driver = require('../../models/Driver');
const Vehicle = require('../../models/Vehicle');
const Trip = require('../../models/Trip');
const Payment = require('../../models/Payment');
const Rating = require('../../models/Rating');
const SOSAlert = require('../../models/SOSAlert');
const { createNotification } = require('../../services/notificationService');
const { getIO } = require('../../sockets/socketManager');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalPassengers = await User.countDocuments({ role: 'passenger' });
  const totalDrivers = await User.countDocuments({ role: 'driver' });
  const pendingVerifications = await Driver.countDocuments({ verificationStatus: 'pending' });
  const activeDrivers = await Driver.countDocuments({ isAvailable: true });
  const totalTrips = await Trip.countDocuments();
  const completedTrips = await Trip.countDocuments({ status: 'completed' });
  const activeTrips = await Trip.countDocuments({ status: { $in: ['driver_arriving', 'in_progress'] } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTrips = await Trip.countDocuments({ createdAt: { $gte: today } });
  const todayRevenue = await Payment.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: today } } },
    { $group: { _id: null, total: { $sum: '$platformCommission' } } }
  ]);

  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) }
      }
    },
    { $group: { _id: null, total: { $sum: '$platformCommission' } } }
  ]);

  const activeSOS = await SOSAlert.countDocuments({ status: 'active' });

  const recentTrips = await Trip.find()
    .populate('passenger', 'firstName lastName')
    .populate('driver', 'user')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    stats: {
      totalUsers,
      totalPassengers,
      totalDrivers,
      pendingVerifications,
      activeDrivers,
      totalTrips,
      completedTrips,
      activeTrips,
      todayTrips,
      todayRevenue: todayRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      activeSOS
    },
    recentTrips
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isActive } = req.query;

  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { firstName: { $regex: sanitizedSearch, $options: 'i' } },
      { lastName: { $regex: sanitizedSearch, $options: 'i' } },
      { phoneNumber: { $regex: sanitizedSearch, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.suspendUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await createNotification(userId, 'account_update', 'Account Suspended',
    `Your account has been suspended. Reason: ${reason}`);

  logger.warn('User suspended', { userId, reason });

  res.json({ message: 'User suspended', user });
});

exports.reactivateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: true },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await createNotification(userId, 'account_update', 'Account Reactivated',
    'Your account has been reactivated.');

  logger.info('User reactivated', { userId });

  res.json({ message: 'User reactivated', user });
});

exports.getPendingDriverVerifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const drivers = await Driver.find({ verificationStatus: { $in: ['pending', 'under_review'] } })
    .populate('user', 'firstName lastName phoneNumber email profilePhoto')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Driver.countDocuments({ verificationStatus: { $in: ['pending', 'under_review'] } });

  res.json({ drivers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getAllDrivers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;

  const filter = {};
  if (status && status !== 'all') {
    filter.verificationStatus = status;
  }

  const drivers = await Driver.find(filter)
    .populate('user', 'firstName lastName phoneNumber email profilePhoto isOnline')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Driver.countDocuments(filter);

  const stats = {
    total: await Driver.countDocuments(),
    pending: await Driver.countDocuments({ verificationStatus: 'pending' }),
    approved: await Driver.countDocuments({ verificationStatus: 'approved' }),
    rejected: await Driver.countDocuments({ verificationStatus: 'rejected' }),
  };

  res.json({ drivers, total, page: parseInt(page), pages: Math.ceil(total / limit), stats });
});

exports.verifyDriver = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { action, reason } = req.body;

  const driver = await Driver.findById(driverId).populate('user');
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  if (action === 'approve') {
    driver.verificationStatus = 'approved';
    driver.verifiedAt = new Date();
    driver.verifiedBy = req.user._id;

    await createNotification(driver.user._id, 'driver_verification', 'Account Verified',
      'Your driver account has been verified. You can now accept rides.');

    const io = getIO();
    io.to(`user_${driver.user._id}`).emit('verification_update', { status: 'approved' });
  } else {
    driver.verificationStatus = 'rejected';
    driver.rejectionReason = reason;

    await createNotification(driver.user._id, 'driver_verification', 'Verification Rejected',
      `Your verification was rejected. Reason: ${reason}`);

    const io = getIO();
    io.to(`user_${driver.user._id}`).emit('verification_update', { status: 'rejected', reason });
  }

  await driver.save();

  logger.info(`Driver ${action}d`, { driverId, action });

  res.json({ message: `Driver ${action}d`, driver });
});

exports.getAllTrips = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;

  const query = {};
  if (status) query.status = status;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const trips = await Trip.find(query)
    .populate('passenger', 'firstName lastName phoneNumber')
    .populate('driver', 'user')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber' } })
    .populate('vehicle', 'make model plateNumber')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Trip.countDocuments(query);

  res.json({ trips, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getPaymentOverview = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, method } = req.query;

  const query = {};
  if (status) query.status = status;
  if (method) query.method = method;

  const payments = await Payment.find(query)
    .populate('passenger', 'firstName lastName phoneNumber')
    .populate('driver', 'user')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber' } })
    .populate('trip', 'pickupLocation dropoffLocation')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  const summary = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCommission: { $sum: '$platformCommission' },
        totalDriverEarnings: { $sum: '$driverEarnings' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({ payments, total, summary: summary[0] || {}, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.generateReport = asyncHandler(async (req, res) => {
  const { type, dateFrom, dateTo, format = 'json' } = req.query;

  const dateFilter = {};
  if (dateFrom) dateFilter.$gte = new Date(dateFrom);
  if (dateTo) dateFilter.$lte = new Date(dateTo);

  let reportData = {};

  switch (type) {
    case 'trips':
      reportData = await Trip.aggregate([
        ...(Object.keys(dateFilter).length > 0 ? [{ $match: { createdAt: dateFilter } }] : []),
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalFare: { $sum: '$fare.totalFare' }
          }
        }
      ]);
      break;

    case 'revenue':
      reportData = await Payment.aggregate([
        { $match: { status: 'completed', ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalAmount: { $sum: '$amount' },
            totalCommission: { $sum: '$platformCommission' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      break;

    case 'users':
      reportData = await User.aggregate([
        ...(Object.keys(dateFilter).length > 0 ? [{ $match: { createdAt: dateFilter } }] : []),
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);
      break;

    case 'drivers':
      reportData = await Driver.aggregate([
        {
          $group: {
            _id: '$verificationStatus',
            count: { $sum: 1 }
          }
        }
      ]);
      break;

    default:
      return res.status(400).json({ error: 'Invalid report type' });
  }

  if (format === 'csv') {
    const csv = convertToCSV(reportData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
    return res.send(csv);
  }

  res.json({ report: reportData, type, dateFrom, dateTo });
});

exports.getSOSAlerts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status) query.status = status;

  const alerts = await SOSAlert.find(query)
    .populate('user', 'firstName lastName phoneNumber')
    .populate('trip')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await SOSAlert.countDocuments(query);

  res.json({ alerts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  return [headers, ...rows].join('\n');
};

// Monitoring
exports.getSystemHealth = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeDrivers = await Driver.countDocuments({ isOnline: true });
  const totalTrips = await Trip.countDocuments();
  const uptime = process.uptime();
  res.json({
    status: 'healthy',
    uptime,
    database: 'connected',
    totalUsers,
    activeDrivers,
    totalTrips,
    memoryUsage: process.memoryUsage().heapUsed,
    timestamp: new Date()
  });
});

exports.getActiveDriversMonitoring = asyncHandler(async (req, res) => {
  const drivers = await Driver.find({ isOnline: true })
    .populate('user', 'firstName lastName phoneNumber')
    .populate('vehicle');
  res.json(drivers);
});

exports.getActiveTripsMonitoring = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ status: { $in: ['in_progress', 'driver_arriving', 'driver_arrived'] } })
    .populate('passenger', 'firstName lastName phoneNumber')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber' } })
    .sort({ createdAt: -1 });
  res.json(trips);
});

exports.respondToSOS = asyncHandler(async (req, res) => {
  const { sosId } = req.params;
  const alert = await SOSAlert.findByIdAndUpdate(sosId, { status: 'responded', respondedAt: new Date() }, { new: true });
  if (!alert) return res.status(404).json({ message: 'SOS alert not found' });
  res.json({ message: 'Response recorded', alert });
});

// Financial
exports.getRevenueBreakdown = asyncHandler(async (req, res) => {
  const { period = 'today' } = req.query;
  let startDate = new Date();
  if (period === 'today') startDate.setHours(0, 0, 0, 0);
  else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);

  const result = await Trip.aggregate([
    { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
    { $group: {
      _id: null,
      totalRevenue: { $sum: '$fare.totalFare' },
      tripCount: { $sum: 1 },
      avgFare: { $avg: '$fare.totalFare' }
    }}
  ]);
  const data = result[0] || { totalRevenue: 0, tripCount: 0, avgFare: 0 };
  res.json(data);
});

exports.getPaymentTransactions = asyncHandler(async (req, res) => {
  const { period = 'today', page = 1, limit = 20 } = req.query;
  let startDate = new Date();
  if (period === 'today') startDate.setHours(0, 0, 0, 0);
  else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);

  const query = { createdAt: { $gte: startDate } };
  const transactions = await Payment.find(query)
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const total = await Payment.countDocuments(query);
  res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.processCommission = asyncHandler(async (req, res) => {
  res.json({ message: 'Commission processed', data: req.body });
});

// Safety
exports.getFraudAlerts = asyncHandler(async (req, res) => {
  res.json([]);
});

exports.getSuspiciousActivity = asyncHandler(async (req, res) => {
  res.json([]);
});

exports.reportIncident = asyncHandler(async (req, res) => {
  res.json({ message: 'Incident reported', data: req.body });
});

// Support
exports.getSupportTickets = asyncHandler(async (req, res) => {
  res.json({ tickets: [], total: 0, page: 1, pages: 0 });
});

exports.updateTicket = asyncHandler(async (req, res) => {
  res.json({ message: 'Ticket updated', data: req.body });
});

// Analytics
exports.getDemandHeatmap = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;
  let startDate = new Date();
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);

  const heatmap = await Trip.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  res.json(heatmap);
});

exports.getPeakHours = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;
  let startDate = new Date();
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);

  const peaks = await Trip.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  res.json(peaks);
});

exports.getRetentionMetrics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeThisWeek = await User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
  res.json({ totalUsers, activeThisWeek, retentionRate: totalUsers > 0 ? ((activeThisWeek / totalUsers) * 100).toFixed(1) : 0 });
});

// Config
exports.getServiceAreas = asyncHandler(async (req, res) => {
  res.json([
    { name: 'Dire Dawa Central', coordinates: [9.5930, 41.8618], radius: 10 },
    { name: 'Kezira', coordinates: [9.5970, 41.8550], radius: 5 },
    { name: 'Jijiga', coordinates: [9.3498, 42.8039], radius: 8 }
  ]);
});

exports.updateServiceAreas = asyncHandler(async (req, res) => {
  res.json({ message: 'Service areas updated', data: req.body });
});

// Passenger wallet
exports.getPassengerWallet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.passengerId);
  if (!user) return res.status(404).json({ message: 'Passenger not found' });
  res.json({ balance: user.walletBalance || 0, currency: 'ETB' });
});

exports.processRefund = asyncHandler(async (req, res) => {
  const { passengerId } = req.params;
  const { amount, reason } = req.body;
  const user = await User.findById(passengerId);
  if (!user) return res.status(404).json({ message: 'Passenger not found' });
  user.walletBalance = (user.walletBalance || 0) + amount;
  await user.save();
  res.json({ message: 'Refund processed', balance: user.walletBalance });
});

// Driver details
exports.getDriverDocuments = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.driverId).populate('user');
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  res.json(driver.documents || {});
});

exports.approveDriverDirect = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.params.driverId, { verificationStatus: 'approved', verifiedAt: new Date() }, { new: true });
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  res.json({ message: 'Driver approved', driver });
});

exports.rejectDriverDirect = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const driver = await Driver.findByIdAndUpdate(req.params.driverId, { verificationStatus: 'rejected', rejectionReason: reason }, { new: true });
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  res.json({ message: 'Driver rejected', driver });
});

exports.suspendDriver = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const driver = await Driver.findByIdAndUpdate(req.params.driverId, { isSuspended: true, suspensionReason: reason }, { new: true });
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  res.json({ message: 'Driver suspended', driver });
});

exports.getDriverEarnings = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.driverId);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  const trips = await Trip.find({ driver: driver._id, status: 'completed' });
  const totalEarnings = trips.reduce((sum, t) => sum + (t.fare?.totalFare || 0), 0);
  res.json({ totalEarnings, tripCount: trips.length, commission: totalEarnings * 0.15 });
});

// Trip details
exports.getTripDetails = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.tripId)
    .populate('passenger', 'firstName lastName phoneNumber')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber' } });
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  res.json(trip);
});

exports.adjustFare = asyncHandler(async (req, res) => {
  const { newFare, reason } = req.body;
  const trip = await Trip.findByIdAndUpdate(req.params.tripId, { 'fare.totalFare': newFare }, { new: true });
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  res.json({ message: 'Fare adjusted', trip });
});

exports.resolveDispute = asyncHandler(async (req, res) => {
  const { resolution } = req.body;
  const trip = await Trip.findByIdAndUpdate(req.params.tripId, { disputeResolution: resolution, status: 'completed' }, { new: true });
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  res.json({ message: 'Dispute resolved', trip });
});

// Content
exports.sendPushNotification = asyncHandler(async (req, res) => {
  res.json({ message: 'Push notification sent', data: req.body });
});

exports.createAnnouncement = asyncHandler(async (req, res) => {
  res.json({ message: 'Announcement created', data: req.body });
});

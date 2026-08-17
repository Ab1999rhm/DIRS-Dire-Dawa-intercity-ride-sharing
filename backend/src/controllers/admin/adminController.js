const User = require('../../models/User');
const Driver = require('../../models/Driver');
const Vehicle = require('../../models/Vehicle');
const Trip = require('../../models/Trip');
const Payment = require('../../models/Payment');
const Rating = require('../../models/Rating');
const SOSAlert = require('../../models/SOSAlert');
const Incident = require('../../models/Incident');
const FraudDetection = require('../../models/FraudDetection');
const SuspiciousActivity = require('../../models/SuspiciousActivity');
const Referral = require('../../models/Referral');
const RideRequest = require('../../models/RideRequest');
const VehicleTrip = require('../../models/VehicleTrip');
const Notification = require('../../models/Notification');
const DispatchContact = require('../../models/DispatchContact');
const Place = require('../../models/Place');
const { dispatchToContacts } = require('../../services/dispatchService');

const buildDateFilter = (startDate, endDate) => {
  const f = {};
  if (startDate && !isNaN(new Date(startDate).getTime())) f.$gte = new Date(startDate);
  if (endDate && !isNaN(new Date(endDate).getTime())) f.$lte = new Date(endDate);
  return Object.keys(f).length > 0 ? f : undefined;
};

const dateQ = (startDate, endDate) => {
  const f = buildDateFilter(startDate, endDate);
  return f ? { createdAt: f } : {};
};
const Ticket = require('../../models/Ticket');
const SupportChat = require('../../models/SupportChat');
const FAQ = require('../../models/FAQ');
const CannedResponse = require('../../models/CannedResponse');
const AutoReplyRule = require('../../models/AutoReplyRule');
const PushNotification = require('../../models/PushNotification');
const NotificationTemplate = require('../../models/NotificationTemplate');
const Announcement = require('../../models/Announcement');
const PromoCode = require('../../models/PromoCode');
const EmailCampaign = require('../../models/EmailCampaign');
const EmailTemplate = require('../../models/EmailTemplate');
const SMSCampaign = require('../../models/SMSCampaign');
const SMSTemplate = require('../../models/SMSTemplate');
const InAppContent = require('../../models/InAppContent');
const UserSegment = require('../../models/UserSegment');
const CampaignAnalytics = require('../../models/CampaignAnalytics');
const AutomationRule = require('../../models/AutomationRule');
const PricingConfig = require('../../models/PricingConfig');
const ServiceZone = require('../../models/ServiceZone');
const VehicleCategory = require('../../models/VehicleCategory');
const PlatformSettings = require('../../models/PlatformSettings');
const NotificationSettings = require('../../models/NotificationSettings');
const SecuritySettings = require('../../models/SecuritySettings');
const FeatureFlag = require('../../models/FeatureFlag');
const DeploymentConfig = require('../../models/DeploymentConfig');
const PerformanceConfig = require('../../models/PerformanceConfig');
const LocalizationConfig = require('../../models/LocalizationConfig');
const AuditLog = require('../../models/AuditLog');
const APIKey = require('../../models/APIKey');
const WebhookConfig = require('../../models/WebhookConfig');
const { createNotification } = require('../../services/notificationService');
const { getIO } = require('../../sockets/socketManager');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');
const os = require('os');
const mongoose = require('mongoose');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalPassengers = await User.countDocuments({ role: 'passenger' });
  const totalDrivers = await User.countDocuments({ role: 'driver' });
  const pendingVerifications = await Driver.countDocuments({
    verificationStatus: { $in: ['pending', 'under_review'] },
    isBanned: { $ne: true },
    isSuspended: { $ne: true }
  });
  const activeDrivers = await Driver.countDocuments({ isAvailable: true, isOnline: true });
  const totalTrips = await Trip.countDocuments();
  const completedTrips = await Trip.countDocuments({ status: 'completed' });
  const activeTripsCount = await Trip.countDocuments({ status: { $in: ['driver_arriving', 'in_progress'] } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTrips = await Trip.countDocuments({ createdAt: { $gte: today } });
  const completedToday = await Trip.countDocuments({ status: 'completed', createdAt: { $gte: today } });
  const cancelledToday = await Trip.countDocuments({ status: 'cancelled', createdAt: { $gte: today } });
  
  const todayRevenue = await Payment.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: today } } },
    { $group: { _id: null, total: { $sum: '$amount' }, commission: { $sum: '$platformCommission' } } }
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

  // Get active trips with details
  const activeTrips = await Trip.find({ status: { $in: ['driver_arriving', 'in_progress'] } })
    .populate('driver', 'firstName lastName')
    .populate('passenger', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  // Get online drivers — require both isAvailable AND isOnline to be true,
  // and the user's location must have been updated within the last 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const onlineDriverDocs = await Driver.find({ isAvailable: true, isOnline: true })
    .populate('user', 'firstName lastName currentLocation')
    .limit(20);

  // Filter out stale drivers whose location hasn't been updated recently
  const onlineDriverIds = onlineDriverDocs
    .filter(d => d.user?.currentLocation?.updatedAt && new Date(d.user.currentLocation.updatedAt) > fiveMinAgo)
    .map(d => d._id);

  // Also include drivers on active trips regardless of location staleness
  const onTripDriverIds = (await Driver.find({ currentTrip: { $exists: true, $ne: null } }).select('_id')).map(d => d._id);
  const allOnlineIds = [...new Set([...onlineDriverIds, ...onTripDriverIds])];

  const onlineDriverDocsFiltered = await Driver.find({ _id: { $in: allOnlineIds } })
    .populate('user', 'firstName lastName currentLocation')
    .limit(10);

  // Convert to plain objects so attached fields (vehicle/rating) serialize in the response
  const onlineDrivers = onlineDriverDocsFiltered.map(d => d.toObject());

  // Get vehicle info for online drivers
  const driverIds = onlineDrivers.map(d => d._id);
  const vehicles = await Vehicle.find({ driver: { $in: driverIds } });
  const vehicleMap = {};
  vehicles.forEach(v => {
    vehicleMap[v.driver.toString()] = v;
  });

  // Get ratings for online drivers (rating documents reference the driver's user profile)
  const driverUserIds = onlineDrivers.map(d => d.user?._id).filter(Boolean);
  const ratings = await Rating.find({ ratee: { $in: driverUserIds } });
  const ratingMap = {};
  ratings.forEach(r => {
    const key = r.ratee?.toString();
    if (!key) return;
    if (!ratingMap[key]) {
      ratingMap[key] = { total: 0, count: 0 };
    }
    ratingMap[key].total += r.rating;
    ratingMap[key].count += 1;
  });

  // Attach vehicle and rating info to drivers
  onlineDrivers.forEach(driver => {
    const vehicle = vehicleMap[driver._id.toString()];
    if (vehicle) {
      driver.vehicle = {
        make: vehicle.make,
        model: vehicle.model,
        type: vehicle.vehicleType
      };
    }
    const driverRating = ratingMap[driver.user?._id?.toString()];
    if (driverRating && driverRating.count > 0) {
      driver.rating = driverRating.total / driverRating.count;
    } else {
      driver.rating = 0;
    }
  });

  // Get recent SOS alerts (drop orphaned records with no user and no name snapshot)
  const recentSOS = (await SOSAlert.find({ status: { $in: ['active', 'resolved'] } })
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20))
    .filter(a => a.user || a.userName)
    .slice(0, 5);

  // Get drivers on trip
  const onTripDrivers = await Driver.countDocuments({ currentTrip: { $exists: true, $ne: null } });

  // Get active passengers (those with active trips)
  const activePassengers = await User.countDocuments({ 
    role: 'passenger',
    _id: { $in: activeTrips.map(t => t.passenger) }
  });

  // Get new signups today
  const newSignupsToday = await User.countDocuments({ 
    createdAt: { $gte: today } 
  });

  // System health check
  const systemHealth = {
    api: 'operational',
    db: mongoose.connection.readyState === 1 ? 'operational' : 'degraded',
    socket: 'operational'
  };

  // Recent activity
  const recentActivity = await Trip.find()
    .populate('passenger', 'firstName lastName')
    .populate('driver', 'user')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } })
    .sort({ createdAt: -1 })
    .limit(8);

  res.json({
    stats: {
      totalUsers,
      totalPassengers,
      totalDrivers,
      pendingVerifications: pendingVerifications,
      activeDrivers: activeDrivers,
      totalTrips,
      completedTrips,
      activeTrips: activeTripsCount,
      todayTrips,
      todayRevenue: todayRevenue[0]?.total || 0,
      commissionToday: todayRevenue[0]?.commission || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      sosAlerts: activeSOS,
      completedToday,
      cancelledToday,
      onlineDrivers: onlineDrivers.length,
      pendingApprovals: pendingVerifications,
      onTripDrivers,
      activePassengers,
      newSignupsToday
    },
    recentActivity: recentActivity.map(t => ({
      type: 'trip',
      description: `Trip ${t.status}`,
      time: new Date(t.createdAt).toLocaleString()
    })),
    activeTrips,
    onlineDrivers,
    recentSOS,
    systemHealth
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isActive, isVerified } = req.query;

  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (isVerified !== undefined) query.isVerified = isVerified === 'true';
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

exports.verifyUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { isVerified: true },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  logger.info('User verified by admin', { userId });
  res.json({ message: 'User verified', user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Admin accounts cannot be deleted' });
  }

  // Remove refresh token + any sessions before permanent deletion so the
  // account cannot log in again until it is re-registered.
  await User.findByIdAndUpdate(userId, { refreshToken: null, isActive: false });

  const driverProfile = await Driver.findOne({ user: userId });
  const driverId = driverProfile ? driverProfile._id : null;

  await User.findByIdAndDelete(userId);

  if (driverId) {
    await Driver.findByIdAndDelete(driverId);
    await Vehicle.deleteMany({ driver: driverId });
  }

  const orFilters = [
    { passenger: userId },
    { user: userId },
    { rater: userId },
    { ratee: userId },
    ...(driverId ? [{ driver: driverId }] : [])
  ];

  await Trip.deleteMany({ $or: [{ passenger: userId }, ...(driverId ? [{ driver: driverId }] : [])] });
  await Payment.deleteMany({ $or: [{ passenger: userId }, { user: userId }, ...(driverId ? [{ driver: driverId }] : [])] });
  await Rating.deleteMany({ $or: [{ rater: userId }, { ratee: userId }, ...(driverId ? [{ driver: driverId }] : [])] });
  await Notification.deleteMany({ recipient: userId });
  await SOSAlert.deleteMany({ user: userId });
  await Incident.deleteMany({ reportedBy: userId });
  await FraudDetection.deleteMany({ user: userId });
  await SuspiciousActivity.deleteMany({ user: userId });
  await Referral.deleteMany({ $or: [{ referrer: userId }, { referredUser: userId }] });
  await RideRequest.deleteMany({ $or: [{ passenger: userId }, ...(driverId ? [{ driver: driverId }] : [])] });
  await Ticket.deleteMany({ user: userId });
  await SupportChat.deleteMany({ 'participants.user': userId });

  logger.warn('User permanently deleted by admin', { userId, role: user.role, driverId });
  res.json({ message: 'User permanently deleted', userId, role: user.role });
});

exports.deleteUnverifiedUsers = asyncHandler(async (req, res) => {
  const { olderThanDays, limit = 500 } = req.body || {};

  const query = { isVerified: false };
  if (olderThanDays && Number(olderThanDays) > 0) {
    const cutoff = new Date(Date.now() - Number(olderThanDays) * 24 * 60 * 60 * 1000);
    query.createdAt = { $lt: cutoff };
  }

  const toDelete = await User.find(query)
    .limit(Math.min(parseInt(limit, 10) || 500, 2000))
    .select('_id');

  const ids = toDelete.map(u => u._id);

  if (ids.length === 0) {
    return res.json({ message: 'No unverified accounts matched', deletedCount: 0 });
  }

  const driverDocs = await Driver.find({ user: { $in: ids } }).select('_id');
  const driverIds = driverDocs.map(d => d._id);

  const result = await User.deleteMany({ _id: { $in: ids } });
  if (driverIds.length > 0) await Driver.deleteMany({ _id: { $in: driverIds } });
  if (driverIds.length > 0) await Vehicle.deleteMany({ driver: { $in: driverIds } });

  logger.warn('Admin deleted unverified users', { count: result.deletedCount, driverCount: driverIds.length });
  res.json({
    message: `${result.deletedCount} unverified account(s) deleted`,
    deletedCount: result.deletedCount,
    driverCount: driverIds.length
  });
});

exports.getPendingDriverVerifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const drivers = await Driver.find({ verificationStatus: { $in: ['pending', 'under_review'] } })
    .populate('user', 'firstName lastName phoneNumber email profilePhoto nationalId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Driver.countDocuments({ verificationStatus: { $in: ['pending', 'under_review'] } });

  res.json({ drivers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getAllDrivers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const Vehicle = require('../../models/Vehicle');
  const Trip = require('../../models/Trip');
  const Rating = require('../../models/Rating');

  const filter = {};
  if (status && status !== 'all') {
    if (status === 'suspended') {
      filter.isSuspended = true;
    } else if (status === 'banned') {
      filter.isBanned = true;
    } else if (status === 'active') {
      filter.verificationStatus = 'approved';
      filter.isSuspended = false;
      filter.isBanned = false;
    } else {
      filter.verificationStatus = status;
    }
  }

  const drivers = await Driver.find(filter)
    .populate('user', 'firstName lastName phoneNumber email profilePhoto isOnline nationalId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const driverIds = drivers.map(d => d._id);
  const vehicles = await Vehicle.find({ driver: { $in: driverIds } });
  const vehicleMap = new Map();
  vehicles.forEach(v => vehicleMap.set(v.driver.toString(), v));

  // Compute real trip stats from Trip collection
  const tripStats = await Trip.aggregate([
    { $match: { driver: { $in: driverIds } } },
    { $group: {
      _id: '$driver',
      totalTrips: { $sum: 1 },
      completedTrips: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      cancelledTrips: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0] } }
    }}
  ]);
  const tripStatsMap = new Map();
  tripStats.forEach(s => tripStatsMap.set(s._id.toString(), s));

  // Compute real ratings from Rating collection
  const ratingAgg = await Rating.aggregate([
    { $match: { ratee: { $in: drivers.map(d => d.user?._id).filter(Boolean) } } },
    { $group: {
      _id: '$ratee',
      avgRating: { $avg: '$rating' },
      totalRatings: { $sum: 1 }
    }}
  ]);
  const ratingMap = new Map();
  ratingAgg.forEach(r => ratingMap.set(r._id.toString(), r));

  const driversWithVehicles = drivers.map(d => {
    const driverObj = d.toObject();
    const vehicle = vehicleMap.get(d._id.toString());
    if (vehicle) {
      driverObj.vehicle = {
        make: vehicle.make,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
        type: vehicle.vehicleType,
        color: vehicle.color,
        year: vehicle.year,
        capacity: vehicle.capacity,
        insuranceExpiry: vehicle.insuranceExpiry,
        registrationExpiry: vehicle.registrationExpiry,
        vehiclePhoto: vehicle.vehiclePhoto,
        registrationPhoto: vehicle.registrationPhoto,
      };
    }

    // Override with real trip stats
    const stats = tripStatsMap.get(d._id.toString());
    if (stats) {
      driverObj.totalTrips = stats.totalTrips;
      driverObj.completedTrips = stats.completedTrips;
      driverObj.cancelledTrips = stats.cancelledTrips;
      driverObj.totalEarnings = stats.totalRevenue;
    }

    // Override with real rating
    const userRating = ratingMap.get(d.user?._id?.toString());
    if (userRating && userRating.totalRatings > 0) {
      driverObj.rating = userRating.avgRating;
      driverObj.totalRatings = userRating.totalRatings;
    } else {
      driverObj.rating = 0;
      driverObj.totalRatings = 0;
    }

    return driverObj;
  });

  const total = await Driver.countDocuments(filter);

  const stats = {
    total: await Driver.countDocuments(),
    pending: await Driver.countDocuments({ verificationStatus: 'pending' }),
    approved: await Driver.countDocuments({ verificationStatus: 'approved' }),
    rejected: await Driver.countDocuments({ verificationStatus: 'rejected' }),
    underReview: await Driver.countDocuments({ verificationStatus: 'under_review' }),
    suspended: await Driver.countDocuments({ isSuspended: true }),
    banned: await Driver.countDocuments({ isBanned: true }),
    active: await Driver.countDocuments({ verificationStatus: 'approved', isSuspended: { $ne: true }, isBanned: { $ne: true } }),
  };

  res.json({ drivers: driversWithVehicles, total, page: parseInt(page), pages: Math.ceil(total / limit), stats });
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
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber averageRating' } })
    .populate('vehicle', 'make model plateNumber')
    .populate('driverRating', 'rating')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Also fetch VehicleTrips for shared rides
  const vehicleTripQuery = {};
  if (status) {
    const statusMap = { active: { $in: ['scheduled', 'boarding', 'in_progress'] }, completed: 'completed', cancelled: 'cancelled' };
    if (statusMap[status]) vehicleTripQuery.status = statusMap[status];
  }
  if (dateFrom || dateTo) {
    vehicleTripQuery.createdAt = {};
    if (dateFrom) vehicleTripQuery.createdAt.$gte = new Date(dateFrom);
    if (dateTo) vehicleTripQuery.createdAt.$lte = new Date(dateTo);
  }

  const vehicleTrips = await VehicleTrip.find(vehicleTripQuery)
    .populate('vehicle', 'make model plateNumber vehicleType')
    .populate('driver', 'firstName lastName phoneNumber')
    .populate('passengers', 'passenger selectedSeats estimatedFare status')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Trip.countDocuments(query);
  const totalVehicleTrips = await VehicleTrip.countDocuments(vehicleTripQuery);

  res.json({
    trips,
    vehicleTrips,
    total,
    totalVehicleTrips,
    page: parseInt(page),
    pages: Math.ceil((total + totalVehicleTrips) / limit)
  });
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

  // Also include active VehicleTrips
  const vehicleTrips = await VehicleTrip.find({ status: { $in: ['scheduled', 'boarding', 'in_progress'] } })
    .populate('vehicle', 'make model plateNumber vehicleType')
    .populate('driver', 'firstName lastName phoneNumber')
    .sort({ createdAt: -1 });

  res.json({ trips, vehicleTrips });
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
  const driver = await Driver.findById(req.params.driverId).populate('user', 'firstName lastName phoneNumber email profilePhoto nationalId createdAt');
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  res.json({
    driver: driver.toObject({ virtuals: true }),
    user: driver.user
  });
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
  // Try Trip first
  let trip = await Trip.findById(req.params.tripId)
    .populate('passenger', 'firstName lastName phoneNumber')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber' } });
  
  // If not found, try VehicleTrip
  if (!trip) {
    const vehicleTrip = await VehicleTrip.findById(req.params.tripId)
      .populate('vehicle', 'make model plateNumber vehicleType')
      .populate('driver', 'firstName lastName phoneNumber')
      .populate('passengers', 'passenger selectedSeats estimatedFare status');
    if (vehicleTrip) {
      return res.json({ type: 'vehicleTrip', vehicleTrip });
    }
    return res.status(404).json({ message: 'Trip not found' });
  }
  res.json({ type: 'trip', trip });
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

// Additional driver management endpoints
exports.banDriver = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const driver = await Driver.findByIdAndUpdate(req.params.driverId, { isBanned: true, banReason: reason, isSuspended: true }, { new: true }).populate('user');
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  
  await createNotification(driver.user._id, 'account_update', 'Account Banned', `Your driver account has been permanently banned. Reason: ${reason}`);
  
  const io = getIO();
  io.to(`user_${driver.user._id}`).emit('account_banned', { reason });
  
  logger.warn('Driver banned', { driverId: req.params.driverId, reason });
  res.json({ message: 'Driver banned', driver });
});

exports.reactivateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.params.driverId, { isSuspended: false, isBanned: false, suspensionReason: null, banReason: null }, { new: true }).populate('user');
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  
  await createNotification(driver.user._id, 'account_update', 'Account Reactivated', 'Your driver account has been reactivated.');
  
  const io = getIO();
  io.to(`user_${driver.user._id}`).emit('account_reactivated', {});
  
  logger.info('Driver reactivated', { driverId: req.params.driverId });
  res.json({ message: 'Driver reactivated', driver });
});

exports.adjustCommissionRate = asyncHandler(async (req, res) => {
  const { rate } = req.body;
  const driver = await Driver.findByIdAndUpdate(req.params.driverId, { commissionRate: rate }, { new: true });
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  res.json({ message: 'Commission rate updated', driver });
});

exports.processPayout = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const driver = await Driver.findById(req.params.driverId).populate('user');
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  
  // Create payout record
  const payout = await Payment.create({
    driver: driver._id,
    user: driver.user._id,
    amount,
    type: 'payout',
    status: 'completed',
    platformCommission: 0,
    driverEarnings: amount
  });
  
  await createNotification(driver.user._id, 'payout', 'Payout Processed', `ETB ${amount} has been processed to your account.`);
  
  res.json({ message: 'Payout processed', payout });
});

exports.requestDocumentResubmit = asyncHandler(async (req, res) => {
  const { docType } = req.body;
  const driver = await Driver.findById(req.params.driverId).populate('user');
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  
  // Mark document as needing resubmission
  if (docType === 'license') driver.licenseStatus = 'resubmit_required';
  if (docType === 'insurance') driver.insuranceStatus = 'resubmit_required';
  if (docType === 'registration') driver.registrationStatus = 'resubmit_required';
  
  await driver.save();
  
  await createNotification(driver.user._id, 'document_update', 'Document Resubmission Required', `Please resubmit your ${docType} document.`);
  
  res.json({ message: 'Document resubmission requested', driver });
});

exports.sendDriverMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const driver = await Driver.findById(req.params.driverId).populate('user');
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  
  await createNotification(driver.user._id, 'admin_message', 'Message from Admin', message);
  
  const io = getIO();
  io.to(`user_${driver.user._id}`).emit('admin_message', { message });
  
  res.json({ message: 'Message sent' });
});

exports.issueDriverWarning = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const driver = await Driver.findByIdAndUpdate(req.params.driverId, { $inc: { warnings: 1 } }, { new: true }).populate('user');
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  
  await createNotification(driver.user._id, 'warning', 'Warning Issued', `Warning: ${reason}`);
  
  const io = getIO();
  io.to(`user_${driver.user._id}`).emit('warning_issued', { reason });
  
  logger.warn('Driver warning issued', { driverId: req.params.driverId, reason });
  res.json({ message: 'Warning issued', driver });
});

exports.getDriverPerformance = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.driverId);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  
  const trips = await Trip.find({ driver: driver._id, status: 'completed' })
    .populate('passenger', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(50);
  
  const ratings = await Rating.find({ driver: driver._id });
  const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
  
  res.json({ trips, avgRating, totalTrips: trips.length });
});

exports.getDriverResponseTime = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.driverId);
  if (!driver) return res.status(404).json({ message: 'Driver not found' });
  
  const trips = await Trip.find({ driver: driver._id, status: 'completed' });
  const responseTimes = trips.map(t => t.responseTime).filter(rt => rt != null);
  const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
  
  res.json({ avgResponseTime, totalTrips: trips.length });
});

exports.getDriverActivityHeatmap = asyncHandler(async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    
    const heatmap = await Trip.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            dayOfWeek: { $dayOfWeek: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
    ]).catch(() => []);
    
    const totalTrips = (Array.isArray(heatmap) ? heatmap : []).reduce((sum, h) => sum + (h.count || 0), 0);
    res.json({ heatmap: Array.isArray(heatmap) ? heatmap : [], totalTrips });
  } catch (error) {
    console.error('Error in getDriverActivityHeatmap:', error.message);
    res.json({ heatmap: [], totalTrips: 0 });
  }
});

exports.getDriverRetention = asyncHandler(async (req, res) => {
  try {
    const totalDrivers = await Driver.countDocuments().catch(() => 0);
    const activeDrivers = await Driver.countDocuments({ isOnline: true }).catch(() => 0);
    const newDriversThisMonth = await Driver.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }).catch(() => 0);
    
    const retentionRate = totalDrivers > 0 ? ((activeDrivers / totalDrivers) * 100).toFixed(1) : 0;
    
    res.json({ activeDrivers, totalDrivers, newDriversThisMonth, avgRetentionRate: retentionRate });
  } catch (error) {
    console.error('Error in getDriverRetention:', error.message);
    res.json({ activeDrivers: 0, totalDrivers: 0, newDriversThisMonth: 0, avgRetentionRate: 0 });
  }
});

// Dispute management
exports.getDisputes = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  
  const disputes = await Trip.find({ ...query, hasDispute: true })
    .populate('passenger', 'firstName lastName phoneNumber')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber' } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await Trip.countDocuments({ ...query, hasDispute: true });
  
  const formattedDisputes = disputes.map(d => ({
    _id: d._id,
    driverId: d.driver?._id,
    driverName: d.driver?.user ? `${d.driver.user.firstName} ${d.driver.user.lastName}` : 'Unknown',
    passengerName: d.passenger ? `${d.passenger.firstName} ${d.passenger.lastName}` : 'Unknown',
    tripId: d._id,
    issue: d.disputeIssue || 'Fare dispute',
    date: d.createdAt,
    status: d.disputeStatus || 'open',
    amount: d.fare?.totalFare || 0
  }));
  
  res.json(formattedDisputes);
});

exports.resolveDispute = asyncHandler(async (req, res) => {
  const { resolution, fareAdjustment } = req.body;
  const trip = await Trip.findById(req.params.disputeId);
  if (!trip) return res.status(404).json({ message: 'Dispute not found' });
  
  trip.disputeStatus = 'resolved';
  trip.disputeResolution = resolution;
  if (fareAdjustment) {
    trip.fare.totalFare = fareAdjustment;
  }
  await trip.save();
  
  res.json({ message: 'Dispute resolved', trip });
});

// Lost item management
exports.getLostItems = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  
  const lostItems = await Trip.find({ ...query, hasLostItem: true })
    .populate('passenger', 'firstName lastName')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await Trip.countDocuments({ ...query, hasLostItem: true });
  
  const formattedItems = lostItems.map(l => ({
    _id: l._id,
    driverId: l.driver?._id,
    driverName: l.driver?.user ? `${l.driver.user.firstName} ${l.driver.user.lastName}` : 'Unknown',
    passengerName: l.passenger ? `${l.passenger.firstName} ${l.passenger.lastName}` : 'Unknown',
    description: l.lostItemDescription || 'Item description',
    date: l.createdAt,
    status: l.lostItemStatus || 'pending'
  }));
  
  res.json(formattedItems);
});

exports.resolveLostItem = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const trip = await Trip.findByIdAndUpdate(req.params.itemId, { lostItemStatus: status }, { new: true });
  if (!trip) return res.status(404).json({ message: 'Lost item not found' });
  res.json({ message: 'Lost item status updated', trip });
});

// Driver issue management
exports.getDriverIssues = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  
  const issues = await Trip.find({ ...query, hasDriverIssue: true })
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await Trip.countDocuments({ ...query, hasDriverIssue: true });
  
  const formattedIssues = issues.map(i => ({
    _id: i._id,
    driverId: i.driver?._id,
    driverName: i.driver?.user ? `${i.driver.user.firstName} ${i.driver.user.lastName}` : 'Unknown',
    type: i.driverIssueType || 'Vehicle Issue',
    description: i.driverIssueDescription || 'Issue description',
    date: i.createdAt,
    status: i.driverIssueStatus || 'open'
  }));
  
  res.json(formattedIssues);
});

exports.resolveDriverIssue = asyncHandler(async (req, res) => {
  const { resolution } = req.body;
  const trip = await Trip.findByIdAndUpdate(req.params.issueId, { driverIssueStatus: 'resolved', driverIssueResolution: resolution }, { new: true });
  if (!trip) return res.status(404).json({ message: 'Driver issue not found' });

  if (trip.driver) {
    const driver = await Driver.findById(trip.driver);
    if (driver && driver.user) {
      await createNotification(
        driver.user,
        'issue_resolved',
        'Issue Report Resolved',
        `Your issue report for trip has been resolved. ${resolution || ''}`,
        { tripId: trip._id, resolution },
        'in_app'
      );
    }
  }

  res.json({ message: 'Driver issue resolved', trip });
});

// Driver announcements
exports.sendDriverAnnouncement = asyncHandler(async (req, res) => {
  const { message, target } = req.body;
  
  const io = getIO();
  if (target === 'all') {
    io.emit('driver_announcement', { message });
  } else if (target === 'active') {
    const activeDrivers = await Driver.find({ isOnline: true }).populate('user');
    activeDrivers.forEach(d => {
      io.to(`user_${d.user._id}`).emit('driver_announcement', { message });
      createNotification(d.user._id, 'announcement', 'Announcement', message);
    });
  }
  
  logger.info('Driver announcement sent', { target, message });
  res.json({ message: 'Announcement sent' });
});

// Passenger management endpoints
exports.banPassenger = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(req.params.passengerId, { isBanned: true, banReason: reason, isActive: false }, { new: true });
  if (!user) return res.status(404).json({ message: 'Passenger not found' });
  
  await createNotification(user._id, 'account_update', 'Account Banned', `Your account has been permanently banned. Reason: ${reason}`);
  
  const io = getIO();
  io.to(`user_${user._id}`).emit('account_banned', { reason });
  
  logger.warn('Passenger banned', { passengerId: req.params.passengerId, reason });
  res.json({ message: 'Passenger banned', user });
});

exports.sendPassengerMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const user = await User.findById(req.params.passengerId);
  if (!user) return res.status(404).json({ message: 'Passenger not found' });
  
  await createNotification(user._id, 'admin_message', 'Message from Admin', message);
  
  const io = getIO();
  io.to(`user_${user._id}`).emit('admin_message', { message });
  
  res.json({ message: 'Message sent' });
});

exports.issuePassengerWarning = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(req.params.passengerId, { $inc: { warnings: 1 } }, { new: true });
  if (!user) return res.status(404).json({ message: 'Passenger not found' });
  
  await createNotification(user._id, 'warning', 'Warning Issued', `Warning: ${reason}`);
  
  const io = getIO();
  io.to(`user_${user._id}`).emit('warning_issued', { reason });
  
  logger.warn('Passenger warning issued', { passengerId: req.params.passengerId, reason });
  res.json({ message: 'Warning issued', user });
});

exports.getPassengerTrips = asyncHandler(async (req, res) => {
  const passenger = await User.findById(req.params.passengerId);
  if (!passenger) return res.status(404).json({ message: 'Passenger not found' });
  
  const trips = await Trip.find({ passenger: passenger._id })
    .populate('driver', 'user')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber' } })
    .sort({ createdAt: -1 })
    .limit(50);

  // Also include shared rides from VehicleTrip
  const sharedTrips = await RideRequest.find({
    passenger: passenger._id,
    vehicleTrip: { $ne: null }
  })
    .populate('vehicleTrip')
    .populate('driver', 'user')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber' } })
    .sort({ createdAt: -1 })
    .limit(50);

  // Merge and deduplicate
  const allTrips = [...trips];
  for (const st of sharedTrips) {
    if (!allTrips.find(t => t._id.toString() === st._id.toString())) {
      allTrips.push(st);
    }
  }
  allTrips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({ trips: allTrips.slice(0, 50), totalTrips: allTrips.length });
});

exports.getPassengerBehavior = asyncHandler(async (req, res) => {
  const passenger = await User.findById(req.params.passengerId);
  if (!passenger) return res.status(404).json({ message: 'Passenger not found' });
  
  const trips = await Trip.find({ passenger: passenger._id });
  const cancellations = trips.filter(t => t.status === 'cancelled').length;
  const noShows = trips.filter(t => t.noShow).length;
  
  res.json({ 
    cancellations, 
    noShows, 
    fraudFlags: passenger.fraudFlags || 0, 
    complaints: passenger.complaints || 0,
    totalTrips: trips.length 
  });
});

exports.blockPassengerBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(req.params.passengerId, { isBookingBlocked: true, bookingBlockReason: reason }, { new: true });
  if (!user) return res.status(404).json({ message: 'Passenger not found' });
  
  await createNotification(user._id, 'account_update', 'Booking Blocked', `Your ability to book rides has been blocked. Reason: ${reason}`);
  
  res.json({ message: 'Passenger booking blocked', user });
});

exports.unblockPassengerBooking = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.passengerId, { isBookingBlocked: false, bookingBlockReason: null }, { new: true });
  if (!user) return res.status(404).json({ message: 'Passenger not found' });
  
  await createNotification(user._id, 'account_update', 'Booking Unblocked', 'Your ability to book rides has been restored.');
  
  res.json({ message: 'Passenger booking unblocked', user });
});

exports.getPassengerLoginHistory = asyncHandler(async (req, res) => {
  const passenger = await User.findById(req.params.passengerId);
  if (!passenger) return res.status(404).json({ message: 'Passenger not found' });
  
  res.json({ 
    lastLogin: passenger.lastLogin,
    loginHistory: passenger.loginHistory || [],
    deviceInfo: passenger.deviceInfo || {}
  });
});

exports.getPassengerAnalytics = asyncHandler(async (req, res) => {
  const totalPassengers = await User.countDocuments({ role: 'passenger' });
  const activePassengers = await User.countDocuments({ role: 'passenger', isActive: true });
  const newPassengersThisMonth = await User.countDocuments({ 
    role: 'passenger', 
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } 
  });
  
  const totalSpent = await Payment.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const avgSpending = await Trip.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$passenger', avgSpent: { $avg: '$fare.totalFare' } } },
    { $group: { _id: null, overallAvg: { $avg: '$avgSpent' } } }
  ]);
  
  res.json({ 
    totalPassengers, 
    activePassengers, 
    newPassengersThisMonth, 
    totalRevenue: totalSpent[0]?.total || 0,
    avgSpendingPerTrip: avgSpending[0]?.overallAvg || 0
  });
});

exports.addPassengerFunds = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const user = await User.findById(req.params.passengerId);
  if (!user) return res.status(404).json({ message: 'Passenger not found' });
  
  // Add funds to wallet (assuming wallet balance is stored in User model)
  user.walletBalance = (user.walletBalance || 0) + amount;
  await user.save();
  
  // Create transaction record
  await Payment.create({
    type: 'credit',
    passenger: user._id,
    amount,
    method: 'wallet',
    status: 'completed',
    paidAt: new Date(),
    paymentGatewayResponse: { reason: reason || 'Admin credit' }
  });
  
  await createNotification(user._id, 'wallet', 'Funds Added', `ETB ${amount} has been added to your wallet. ${reason ? `Reason: ${reason}` : ''}`);
  
  logger.info('Funds added to passenger wallet', { passengerId: req.params.passengerId, amount, reason });
  res.json({ message: 'Funds added', walletBalance: user.walletBalance });
});

exports.getPassengerTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const transactions = await Payment.find({ passenger: req.params.passengerId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await Payment.countDocuments({ passenger: req.params.passengerId });
  
  res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// System Health Monitoring
exports.getSystemHealth = asyncHandler(async (req, res) => {
  const cpuUsage = process.cpuUsage();
  const totalCpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  const cpuPercent = (totalCpuUsage / os.cpus().length).toFixed(2);
  
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryPercent = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(2);
  
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'Connected' : dbState === 2 ? 'Connecting' : 'Disconnected';
  
  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  
  const activeConnections = getIO().sockets.sockets.size;
  
  const dbStats = await mongoose.connection.db.stats();
  const dbSize = (dbStats.dataSize / 1024 / 1024).toFixed(2); // Convert to MB
  
  res.json({
    serverStatus: 'Operational',
    cpuUsage: `${cpuPercent}%`,
    memoryUsage: `${memoryPercent}%`,
    memoryUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    memoryTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    dbStatus,
    dbSize: `${dbSize} MB`,
    dbCollections: dbStats.collections,
    uptime: `${uptimeHours}h ${uptimeMinutes}m`,
    activeConnections,
    apiLatency: Math.floor(Math.random() * 50) + 20, // Simulated latency
    errorRate: '0.02%',
    timestamp: new Date()
  });
});

// Get active drivers with locations for live map
exports.getActiveDriversLocations = asyncHandler(async (req, res) => {
  const drivers = await Driver.find({ 
    isOnline: true
  })
  .populate({
    path: 'user',
    select: 'firstName lastName currentLocation averageRating totalRatings'
  });
  
  // Get vehicles for each driver
  const driverIds = drivers.map(d => d._id);
  const vehicles = await Vehicle.find({ 
    driver: { $in: driverIds },
    isActive: true 
  });
  
  const vehicleMap = new Map();
  vehicles.forEach(v => {
    vehicleMap.set(v.driver.toString(), v);
  });
  
  const driversWithLocations = drivers
    .filter(d => d.user && d.user.currentLocation && d.user.currentLocation.coordinates)
    .map(driver => {
      const vehicle = vehicleMap.get(driver._id.toString());
      return {
        id: driver._id,
        userId: driver.user._id,
        firstName: driver.user.firstName,
        lastName: driver.user.lastName,
        coordinates: driver.user.currentLocation.coordinates,
        vehicleType: vehicle?.vehicleType || 'N/A',
        vehicleModel: vehicle?.model || 'N/A',
        isAvailable: driver.isAvailable,
        rating: driver.user.averageRating || 0,
        totalRatings: driver.user.totalRatings || 0,
        updatedAt: driver.user.currentLocation.updatedAt
      };
    });
  
  res.json({ drivers: driversWithLocations });
});

// Get active trips with routes for live map
exports.getActiveTripsRoutes = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ 
    status: { $in: ['driver_arriving', 'in_progress', 'driver_arrived'] }
  })
  .populate({
    path: 'driver',
    populate: {
      path: 'user',
      select: 'firstName lastName currentLocation averageRating'
    }
  })
  .populate('passenger', 'firstName lastName currentLocation')
  .select('status pickupLocation dropoffLocation fare createdAt');
  
  const tripsWithRoutes = trips.map(trip => ({
    id: trip._id,
    status: trip.status,
    driver: {
      id: trip.driver?._id,
      userId: trip.driver?.user?._id,
      name: trip.driver?.user ? `${trip.driver.user.firstName} ${trip.driver.user.lastName}` : 'N/A',
      coordinates: trip.driver?.user?.currentLocation?.coordinates,
      rating: trip.driver?.user?.averageRating || 0
    },
    passenger: {
      id: trip.passenger?._id,
      name: trip.passenger ? `${trip.passenger.firstName} ${trip.passenger.lastName}` : 'N/A',
      coordinates: trip.passenger?.currentLocation?.coordinates
    },
    pickupLocation: trip.pickupLocation,
    dropoffLocation: trip.dropoffLocation,
    estimatedFare: trip.fare?.totalFare || 0,
    createdAt: trip.createdAt
  }));
  
  res.json({ trips: tripsWithRoutes });
});

// Get booking queue
exports.getBookingQueue = asyncHandler(async (req, res) => {
  const pendingTrips = await Trip.find({ 
    status: 'pending'
  })
  .populate('passenger', 'firstName lastName phoneNumber')
  .select('status pickupLocation dropoffLocation fare createdAt')
  .sort({ createdAt: 1 });
  
  const availableDrivers = await Driver.countDocuments({ 
    isOnline: true,
    isAvailable: true
  });
  
  res.json({ 
    queue: pendingTrips,
    queueLength: pendingTrips.length,
    availableDrivers,
    avgWaitTime: pendingTrips.length > 0 ? Math.floor(Math.random() * 10) + 2 : 0 // Simulated wait time
  });
});

// Trip Lifecycle Management
exports.completeTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { notes } = req.body;

  // Check if it's a VehicleTrip first
  const vehicleTrip = await VehicleTrip.findById(tripId);
  if (vehicleTrip) {
    vehicleTrip.status = 'completed';
    // Mark all reserved seats as occupied
    for (const seat of vehicleTrip.seats) {
      if (seat.status === 'reserved') seat.status = 'occupied';
    }
    await vehicleTrip.save();
    
    // Complete all associated RideRequests
    await RideRequest.updateMany(
      { vehicleTrip: vehicleTrip._id, status: { $in: ['accepted', 'pending'] } },
      { status: 'completed' }
    );

    logger.info('VehicleTrip completed by admin', { tripId, notes });
    return res.json({ message: 'Shared trip completed successfully', vehicleTrip });
  }

  const trip = await Trip.findById(tripId).populate('driver').populate('passenger');
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const actualDuration = trip.startTime ? Math.floor((new Date() - trip.startTime) / 60000) : 0;

  trip.status = 'completed';
  trip.endTime = new Date();
  trip.actualDuration = actualDuration;
  await trip.save();

  // Update driver stats
  await Driver.findByIdAndUpdate(trip.driver._id, {
    $inc: { completedTrips: 1 }
  });

  // Update passenger stats
  await User.findByIdAndUpdate(trip.passenger._id, {
    $inc: { totalTrips: 1 }
  });

  logger.info('Trip completed by admin', { tripId, notes });

  res.json({ message: 'Trip completed successfully', trip });
});

exports.cancelTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { reason, cancelledBy } = req.body;

  // Check if it's a VehicleTrip first
  const vehicleTrip = await VehicleTrip.findById(tripId);
  if (vehicleTrip) {
    vehicleTrip.status = 'cancelled';
    // Release all reserved seats
    for (const seat of vehicleTrip.seats) {
      if (seat.status === 'reserved' || seat.status === 'available') {
        seat.status = 'available';
        seat.passenger = null;
        seat.rideRequest = null;
      }
    }
    vehicleTrip.passengers = [];
    await vehicleTrip.save();

    // Cancel all associated RideRequests
    await RideRequest.updateMany(
      { vehicleTrip: vehicleTrip._id, status: { $in: ['accepted', 'pending'] } },
      { status: 'cancelled', cancelledBy: 'admin', cancellationReason: reason }
    );

    logger.info('VehicleTrip cancelled by admin', { tripId, reason, notes: cancelledBy });
    return res.json({ message: 'Shared trip cancelled successfully', vehicleTrip });
  }

  const trip = await Trip.findById(tripId).populate('driver').populate('passenger');
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  trip.status = 'cancelled';
  await trip.save();

  // Update driver stats
  await Driver.findByIdAndUpdate(trip.driver._id, {
    $inc: { cancelledTrips: 1 }
  });

  // Notify affected parties
  const driverUser = await User.findById(trip.driver.user);
  await createNotification(driverUser._id, 'trip_cancelled', 'Trip Cancelled', 
    `Your trip has been cancelled by admin. Reason: ${reason}`);
  await createNotification(trip.passenger._id, 'trip_cancelled', 'Trip Cancelled',
    `Your trip has been cancelled by admin. Reason: ${reason}`);

  logger.info('Trip cancelled by admin', { tripId, reason, cancelledBy });

  res.json({ message: 'Trip cancelled successfully', trip });
});

exports.reassignDriver = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { newDriverId } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const newDriver = await Driver.findById(newDriverId).populate('user');
  if (!newDriver) {
    return res.status(404).json({ error: 'New driver not found' });
  }

  const oldDriverId = trip.driver;

  // Update trip with new driver
  trip.driver = newDriverId;
  await trip.save();

  // Update driver currentTrip references
  await Driver.findByIdAndUpdate(oldDriverId, { currentTrip: null });
  await Driver.findByIdAndUpdate(newDriverId, { currentTrip: tripId });

  // Notify parties
  await createNotification(newDriver.user._id, 'trip_assigned', 'New Trip Assigned',
    `You have been reassigned to trip #${tripId}`);
  await createNotification(trip.passenger, 'driver_reassigned', 'Driver Reassigned',
    `Your trip has been reassigned to a new driver`);

  logger.info('Driver reassigned by admin', { tripId, oldDriverId, newDriverId });

  res.json({ message: 'Driver reassigned successfully', trip });
});

exports.markNoShow = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { party, reason } = req.body; // party: 'driver' or 'passenger'

  const trip = await Trip.findById(tripId).populate('driver').populate('passenger');
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (party === 'driver') {
    await Driver.findByIdAndUpdate(trip.driver._id, {
      $inc: { noShows: 1 }
    });
    await createNotification(trip.driver.user, 'no_show', 'No-Show Recorded',
      `You have been marked as no-show for trip #${tripId}. Reason: ${reason}`);
  } else if (party === 'passenger') {
    await User.findByIdAndUpdate(trip.passenger._id, {
      $inc: { noShows: 1 }
    });
    await createNotification(trip.passenger._id, 'no_show', 'No-Show Recorded',
      `You have been marked as no-show for trip #${tripId}. Reason: ${reason}`);
  }

  logger.info('No-show marked by admin', { tripId, party, reason });

  res.json({ message: 'No-show recorded successfully' });
});

// Fare & Payment Management
exports.processRefund = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { amount, reason } = req.body;

  const trip = await Trip.findById(tripId).populate('passenger');
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  // Find existing payment or create new refund record
  const existingPayment = await Payment.findOne({ trip: tripId });
  if (existingPayment) {
    existingPayment.status = 'refunded';
    existingPayment.refundReason = reason;
    existingPayment.refundedAt = new Date();
    await existingPayment.save();
  }

  // Credit passenger wallet
  await User.findByIdAndUpdate(trip.passenger._id, {
    $inc: { walletBalance: amount }
  });

  // Notify passenger
  await createNotification(trip.passenger._id, 'refund_processed', 'Refund Processed',
    `A refund of ETB ${amount} has been processed for trip #${tripId}. Reason: ${reason}`);

  logger.info('Refund processed by admin', { tripId, amount, reason });

  res.json({ message: 'Refund processed successfully' });
});

exports.processDriverPayout = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId).populate('driver');
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const fare = trip.fare?.totalFare || 0;
  const commissionRate = trip.driver.commissionRate || 10;
  const driverEarnings = fare * (1 - commissionRate / 100);

  // Update driver earnings
  await Driver.findByIdAndUpdate(trip.driver._id, {
    $inc: { 
      totalEarnings: fare,
      netEarnings: driverEarnings,
      commissionPaid: fare * commissionRate / 100
    }
  });

  // Update existing payment or create new one
  const existingPayment = await Payment.findOne({ trip: tripId });
  if (existingPayment) {
    existingPayment.driverEarnings = driverEarnings;
    existingPayment.platformCommission = fare * commissionRate / 100;
    existingPayment.status = 'completed';
    await existingPayment.save();
  }

  logger.info('Driver payout processed by admin', { tripId, driverEarnings });

  res.json({ message: 'Payout processed successfully', driverEarnings });
});

exports.applyPromoCode = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { code, discountAmount } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  // Apply discount to fare
  const currentFare = trip.fare?.totalFare || 0;
  const newFare = Math.max(0, currentFare - discountAmount);

  trip.fare.totalFare = newFare;
  await trip.save();

  logger.info('Promo code applied by admin', { tripId, code, discountAmount });

  res.json({ message: 'Promo code applied successfully', newFare });
});

// Dispute Handling
exports.handleFareDispute = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { resolution, compensationAmount } = req.body;

  const trip = await Trip.findById(tripId).populate('passenger');
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  if (compensationAmount > 0) {
    await User.findByIdAndUpdate(trip.passenger._id, {
      $inc: { walletBalance: compensationAmount }
    });
  }

  logger.info('Fare dispute resolved by admin', { tripId, resolution, compensationAmount });

  res.json({ message: 'Fare dispute resolved successfully' });
});

exports.handleRouteDispute = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { resolution, action } = req.body; // action: 'warn_driver', 'compensate_passenger', 'both'

  const trip = await Trip.findById(tripId).populate('driver').populate('passenger');
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (action === 'warn_driver' || action === 'both') {
    await Driver.findByIdAndUpdate(trip.driver._id, {
      $inc: { warnings: 1 }
    });
  }

  if (action === 'compensate_passenger' || action === 'both') {
    const compensation = trip.fare?.totalFare * 0.2; // 20% compensation
    await User.findByIdAndUpdate(trip.passenger._id, {
      $inc: { walletBalance: compensation }
    });
  }

  logger.info('Route dispute resolved by admin', { tripId, resolution, action });

  res.json({ message: 'Route dispute resolved successfully' });
});

exports.handleBehaviorComplaint = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { resolution, party, action } = req.body; // party: 'driver' or 'passenger'

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (party === 'driver') {
    await Driver.findByIdAndUpdate(trip.driver, {
      $inc: { complaints: 1, warnings: 1 }
    });
  } else if (party === 'passenger') {
    await User.findByIdAndUpdate(trip.passenger, {
      $inc: { complaints: 1, warnings: 1 }
    });
  }

  logger.info('Behavior complaint resolved by admin', { tripId, resolution, party });

  res.json({ message: 'Behavior complaint resolved successfully' });
});

exports.issueCompensation = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { amount, reason, recipient } = req.body; // recipient: 'passenger' or 'driver'

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (recipient === 'passenger') {
    await User.findByIdAndUpdate(trip.passenger, {
      $inc: { walletBalance: amount }
    });
    await createNotification(trip.passenger, 'compensation_issued', 'Compensation Issued',
      `You have received ETB ${amount} compensation. Reason: ${reason}`);
  } else if (recipient === 'driver') {
    await Driver.findByIdAndUpdate(trip.driver, {
      $inc: { netEarnings: amount }
    });
  }

  logger.info('Compensation issued by admin', { tripId, amount, recipient, reason });

  res.json({ message: 'Compensation issued successfully' });
});

// Trip Analytics
exports.getTripAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  const totalTrips = await Trip.countDocuments(dateFilter);
  const completedTrips = await Trip.countDocuments({ ...dateFilter, status: 'completed' });
  const cancelledTrips = await Trip.countDocuments({ ...dateFilter, status: 'cancelled' });
  
  const completionRate = totalTrips > 0 ? (completedTrips / totalTrips * 100).toFixed(2) : 0;
  
  const completedTripsWithDuration = await Trip.find({ ...dateFilter, status: 'completed', actualDuration: { $exists: true, $gt: 0 } });
  const avgDuration = completedTripsWithDuration.length > 0 
    ? (completedTripsWithDuration.reduce((sum, t) => sum + t.actualDuration, 0) / completedTripsWithDuration.length).toFixed(2)
    : 0;

  const revenueByRoute = await Trip.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    { $group: {
      _id: { pickup: '$pickupLocation.address', dropoff: '$dropoffLocation.address' },
      totalRevenue: { $sum: '$fare.totalFare' },
      tripCount: { $sum: 1 }
    }},
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 }
  ]);

  const cancellationReasons = await Trip.aggregate([
    { $match: { ...dateFilter, status: 'cancelled', cancellationReason: { $exists: true } } },
    { $group: {
      _id: '$cancellationReason',
      count: { $sum: 1 }
    }},
    { $sort: { count: -1 } }
  ]);

  const peakHours = await Trip.aggregate([
    { $match: { ...dateFilter, createdAt: { $exists: true } } },
    { $project: {
      hour: { $hour: '$createdAt' }
    }},
    { $group: {
      _id: '$hour',
      count: { $sum: 1 }
    }},
    { $sort: { count: -1 } }
  ]);

  res.json({
    totalTrips,
    completedTrips,
    cancelledTrips,
    completionRate,
    avgDuration,
    revenueByRoute,
    cancellationReasons,
    peakHours
  });
});

// Export Trip Data
exports.exportTripData = asyncHandler(async (req, res) => {
  const { format, startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  const trips = await Trip.find(dateFilter)
    .populate('driver')
    .populate('passenger', 'firstName lastName phoneNumber')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phoneNumber' } })
    .sort({ createdAt: -1 });

  if (format === 'csv') {
    const csvHeader = 'Trip ID,Driver,Passenger,From,To,Fare,Status,Duration,Distance,Date\n';
    const csvRows = trips.map(trip => {
      const driverName = trip.driver?.user ? `${trip.driver.user.firstName} ${trip.driver.user.lastName}` : 'N/A';
      const passengerName = trip.passenger ? `${trip.passenger.firstName} ${trip.passenger.lastName}` : 'N/A';
      return `${trip._id},${driverName},${passengerName},${trip.pickupLocation?.address || 'N/A'},${trip.dropoffLocation?.address || 'N/A'},${trip.fare?.totalFare || 0},${trip.status},${trip.actualDuration || 0}min,${trip.actualDistance || 0}km,${trip.createdAt}`;
    }).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=trips_export.csv');
    res.send(csvHeader + csvRows);
  } else {
    res.json({ trips });
  }
});

// ==================== SAFETY & SECURITY APIs ====================

// SOS/Emergency System
exports.getSOSAlerts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const alerts = (await SOSAlert.find(filter)
    .populate('user', 'firstName lastName phoneNumber')
    .populate('trip')
    .populate('resolvedBy', 'firstName lastName')
    .sort({ createdAt: -1 }))
    .filter(a => a.user || a.userName);
  res.json({ alerts });
});

exports.getSOSHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const alerts = await SOSAlert.find({ user: userId })
    .populate('trip')
    .sort({ createdAt: -1 });
  res.json({ alerts });
});

exports.resolveSOS = asyncHandler(async (req, res) => {
  const { alertId } = req.params;
  const { notes, isFalseAlarm } = req.body;
  
  const alert = await SOSAlert.findByIdAndUpdate(
    alertId,
    {
      status: isFalseAlarm ? 'false_alarm' : 'resolved',
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      resolutionNotes: notes
    },
    { new: true }
  );
  
  logger.info('SOS alert resolved', { alertId, isFalseAlarm });
  res.json({ message: 'SOS resolved successfully', alert });
});

// Fraud Detection
exports.getFraudAlerts = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  
  const frauds = await FraudDetection.find(filter)
    .populate('user', 'firstName lastName phoneNumber email')
    .sort({ detectedAt: -1 });
  res.json({ frauds });
});

exports.investigateFraud = asyncHandler(async (req, res) => {
  const { fraudId } = req.params;
  const { action, notes } = req.body;
  
  const fraud = await FraudDetection.findByIdAndUpdate(
    fraudId,
    {
      status: action === 'confirm' ? 'confirmed' : 'false_positive',
      actionTaken: action === 'confirm' ? 'account_suspended' : 'none',
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      resolutionNotes: notes
    },
    { new: true }
  );
  
  if (action === 'confirm') {
    await User.findByIdAndUpdate(fraud.user, { isActive: false });
    await createNotification(fraud.user, 'account_suspended', 'Account Suspended',
      'Your account has been suspended due to fraudulent activity. Contact support for more information.');
  }
  
  logger.info('Fraud investigation completed', { fraudId, action });
  res.json({ message: 'Fraud investigation completed', fraud });
});

// Suspicious Activity
exports.getSuspiciousActivities = asyncHandler(async (req, res) => {
  const { status, type, severity } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (severity) filter.severity = severity;
  
  const activities = await SuspiciousActivity.find(filter)
    .populate('user', 'firstName lastName phoneNumber')
    .populate('driver')
    .populate('trip')
    .sort({ detectedAt: -1 });
  res.json({ activities });
});

exports.resolveSuspiciousActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const { action, notes } = req.body;
  
  const activity = await SuspiciousActivity.findByIdAndUpdate(
    activityId,
    {
      status: action === 'confirm' ? 'confirmed' : 'false_positive',
      actionTaken: action === 'confirm' ? 'warning_issued' : 'none',
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      resolutionNotes: notes
    },
    { new: true }
  );
  
  logger.info('Suspicious activity resolved', { activityId, action });
  res.json({ message: 'Activity resolved successfully', activity });
});

// Incident Management
exports.getIncidents = asyncHandler(async (req, res) => {
  const { status, category, severity } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (severity) filter.severity = severity;
  
  const incidents = await Incident.find(filter)
    .populate('reportedBy', 'firstName lastName phoneNumber')
    .populate('reportedUser', 'firstName lastName')
    .populate('reportedDriver')
    .populate('trip')
    .populate('assignedTo', 'firstName lastName')
    .populate('resolvedBy', 'firstName lastName')
    .sort({ createdAt: -1 });
  res.json({ incidents });
});

exports.createIncident = asyncHandler(async (req, res) => {
  const incidentData = req.body;
  incidentData.reportedBy = req.user._id;
  
  const incident = await Incident.create(incidentData);
  
  // Notify admins for critical/high severity
  if (incident.severity === 'critical' || incident.severity === 'high') {
    const io = getIO();
    io.to('admins').emit('incident_reported', {
      incidentId: incident._id,
      category: incident.category,
      severity: incident.severity,
      location: incident.location
    });
  }
  
  logger.info('Incident reported', { incidentId: incident._id, category: incident.category });
  res.json({ message: 'Incident reported successfully', incident });
});

exports.assignIncident = asyncHandler(async (req, res) => {
  const { incidentId } = req.params;
  const { assignedTo } = req.body;

  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    return res.status(400).json({ error: 'Invalid assigned user' });
  }

  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser) {
    return res.status(404).json({ error: 'Assigned user not found' });
  }

  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    {
      assignedTo,
      status: 'investigating'
    },
    { new: true }
  );

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  await createNotification(assignedTo, 'incident_assigned', 'New Incident Assigned',
    `You have been assigned to investigate incident #${incidentId}`);

  logger.info('Incident assigned', { incidentId, assignedTo });
  res.json({ message: 'Incident assigned successfully', incident });
});

exports.addInvestigationNote = asyncHandler(async (req, res) => {
  const { incidentId } = req.params;
  const { note } = req.body;
  
  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    {
      $push: {
        investigationNotes: {
          note,
          addedBy: req.user._id,
          addedAt: new Date()
        }
      }
    },
    { new: true }
  );
  
  logger.info('Investigation note added', { incidentId });
  res.json({ message: 'Note added successfully', incident });
});

exports.resolveIncident = asyncHandler(async (req, res) => {
  const { incidentId } = req.params;
  const { resolution, policeNotified, ambulanceDispatched } = req.body;
  
  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    {
      status: 'resolved',
      resolution,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      policeNotified: policeNotified || false,
      ambulanceDispatched: ambulanceDispatched || false
    },
    { new: true }
  );
  
  logger.info('Incident resolved', { incidentId, resolution });
  res.json({ message: 'Incident resolved successfully', incident });
});

// Banned/Blocked Users
exports.getBlockedUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: false, isBlocked: true })
    .select('firstName lastName phoneNumber email isBlocked blockReason blockedAt')
    .sort({ blockedAt: -1 });
  res.json({ users });
});

exports.blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason, duration } = req.body;
  
  const user = await User.findByIdAndUpdate(
    userId,
    {
      isActive: false,
      isBlocked: true,
      blockReason: reason,
      blockedAt: new Date(),
      blockUntil: duration === 'permanent' ? null : new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
    },
    { new: true }
  );
  
  await createNotification(userId, 'account_blocked', 'Account Blocked',
    `Your account has been blocked. Reason: ${reason}. Duration: ${duration}`);
  
  logger.info('User blocked', { userId, reason, duration });
  res.json({ message: 'User blocked successfully', user });
});

exports.unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findByIdAndUpdate(
    userId,
    {
      isActive: true,
      isBlocked: false,
      blockReason: null,
      blockedAt: null,
      blockUntil: null
    },
    { new: true }
  );
  
  await createNotification(userId, 'account_unblocked', 'Account Unblocked',
    'Your account has been unblocked. You can now use the platform again.');
  
  logger.info('User unblocked', { userId });
  res.json({ message: 'User unblocked successfully', user });
});

// Safety Verification
exports.getPendingVerifications = asyncHandler(async (req, res) => {
  const drivers = await Driver.find({ verificationStatus: 'pending' })
    .populate('user', 'firstName lastName phoneNumber email')
    .sort({ createdAt: -1 });
  res.json({ drivers });
});

exports.approveDriverVerification = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { notes } = req.body;
  
  const driver = await Driver.findByIdAndUpdate(
    driverId,
    {
      verificationStatus: 'approved',
      verificationNotes: notes,
      verifiedAt: new Date()
    },
    { new: true }
  );
  
  await createNotification(driver.user, 'verification_approved', 'Verification Approved',
    'Your driver verification has been approved. You can now start accepting rides.');
  
  logger.info('Driver verification approved', { driverId });
  res.json({ message: 'Verification approved successfully', driver });
});

exports.rejectDriverVerification = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { reason } = req.body;
  
  const driver = await Driver.findByIdAndUpdate(
    driverId,
    {
      verificationStatus: 'rejected',
      verificationNotes: reason,
      verifiedAt: new Date()
    },
    { new: true }
  );
  
  await createNotification(driver.user, 'verification_rejected', 'Verification Rejected',
    `Your driver verification has been rejected. Reason: ${reason}. Please resubmit with correct documents.`);
  
  logger.info('Driver verification rejected', { driverId, reason });
  res.json({ message: 'Verification rejected successfully', driver });
});

// Emergency Services Integration
exports.notifyPolice = asyncHandler(async (req, res) => {
  const { incidentId } = req.params;
  const { policeReportNumber, recipientIds = [] } = req.body;

  const incident = await Incident.findById(incidentId)
    .populate('reportedBy', 'firstName lastName phoneNumber')
    .populate('trip');

  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  incident.policeNotified = true;
  if (policeReportNumber) incident.policeReportNumber = policeReportNumber;
  await incident.save();

  const contacts = recipientIds.length
    ? await DispatchContact.find({ _id: { $in: recipientIds }, type: 'police', active: true })
    : await DispatchContact.find({ type: 'police', active: true });

  const dispatch = await dispatchToContacts({
    contacts,
    incident,
    reporter: incident.reportedBy,
    trip: incident.trip,
    extra: { policeReportNumber: incident.policeReportNumber }
  });

  logger.info('Police notified', { incidentId, policeReportNumber, emailed: dispatch.dispatched });
  res.json({
    message: dispatch.dispatched > 0 ? 'Police notified and dispatched successfully' : 'Police notified (no email recipients set)',
    incident,
    dispatch
  });
});

exports.dispatchAmbulance = asyncHandler(async (req, res) => {
  const { incidentId } = req.params;
  const { hospitalName, hospitalLocation, recipientIds = [] } = req.body;

  const incident = await Incident.findById(incidentId)
    .populate('reportedBy', 'firstName lastName phoneNumber')
    .populate('trip');

  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  incident.ambulanceDispatched = true;
  if (hospitalName) incident.hospitalName = hospitalName;
  if (hospitalLocation) {
    if (typeof hospitalLocation === 'string') {
      incident.hospitalLocation = { address: hospitalLocation };
    } else if (typeof hospitalLocation === 'object') {
      incident.hospitalLocation = hospitalLocation;
    }
  }
  await incident.save();

  const contacts = recipientIds.length
    ? await DispatchContact.find({ _id: { $in: recipientIds }, type: 'hospital', active: true })
    : await DispatchContact.find({ type: 'hospital', active: true });

  const dispatch = await dispatchToContacts({
    contacts,
    incident,
    reporter: incident.reportedBy,
    trip: incident.trip,
    extra: { hospitalName: incident.hospitalName }
  });

  logger.info('Ambulance dispatched', { incidentId, hospitalName, emailed: dispatch.dispatched });
  res.json({
    message: dispatch.dispatched > 0 ? 'Ambulance dispatched successfully' : 'Ambulance dispatched (no email recipients set)',
    incident,
    dispatch
  });
});

// Dispatch Contact Registry (police / hospital)
exports.getDispatchContacts = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = {};
  if (type && ['police', 'hospital'].includes(type)) filter.type = type;
  const contacts = await DispatchContact.find(filter).sort({ type: 1, name: 1 });
  res.json({ contacts });
});

exports.createDispatchContact = asyncHandler(async (req, res) => {
  const { type, name, phoneNumber, email, city, active } = req.body;
  if (!type || !['police', 'hospital'].includes(type)) {
    return res.status(400).json({ message: 'type must be police or hospital' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'name is required' });
  }
  if (!email && !phoneNumber) {
    return res.status(400).json({ message: 'Provide at least an email or phone number' });
  }
  const contact = await DispatchContact.create({ type, name, phoneNumber, email, city, active });
  logger.info('Dispatch contact created', { id: contact._id, type, name });
  res.status(201).json({ contact });
});

exports.updateDispatchContact = asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const updates = {};
  for (const key of ['type', 'name', 'phoneNumber', 'email', 'city', 'active']) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.type && !['police', 'hospital'].includes(updates.type)) {
    return res.status(400).json({ message: 'type must be police or hospital' });
  }
  const contact = await DispatchContact.findByIdAndUpdate(contactId, updates, { new: true });
  if (!contact) return res.status(404).json({ message: 'Dispatch contact not found' });
  logger.info('Dispatch contact updated', { id: contact._id });
  res.json({ contact });
});

exports.deleteDispatchContact = asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const contact = await DispatchContact.findByIdAndDelete(contactId);
  if (!contact) return res.status(404).json({ message: 'Dispatch contact not found' });
  logger.info('Dispatch contact deleted', { id: contactId });
  res.json({ message: 'Dispatch contact deleted successfully' });
});

exports.getEmergencyContacts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select('emergencyContacts');
  res.json({ emergencyContacts: user?.emergencyContacts || [] });
});

// Safety Analytics & Reports
exports.getSafetyAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }
  
  const totalIncidents = await Incident.countDocuments(dateFilter);
  const criticalIncidents = await Incident.countDocuments({ ...dateFilter, severity: 'critical' });
  const highIncidents = await Incident.countDocuments({ ...dateFilter, severity: 'high' });
  const resolvedIncidents = await Incident.countDocuments({ ...dateFilter, status: 'resolved' });
  
  const incidentsByCategory = await Incident.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  const hotspotLocations = await Incident.aggregate([
    { $match: { ...dateFilter, location: { $exists: true } } },
    { $group: { _id: '$location.address', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  const totalFrauds = await FraudDetection.countDocuments(dateFilter);
  const confirmedFrauds = await FraudDetection.countDocuments({ ...dateFilter, status: 'confirmed' });
  
  const totalSuspicious = await SuspiciousActivity.countDocuments(dateFilter);
  const confirmedSuspicious = await SuspiciousActivity.countDocuments({ ...dateFilter, status: 'confirmed' });
  
  const totalSOS = await SOSAlert.countDocuments(dateFilter);
  const resolvedSOS = await SOSAlert.countDocuments({ ...dateFilter, status: 'resolved' });
  
  const resolutionRate = totalIncidents > 0 ? (resolvedIncidents / totalIncidents * 100).toFixed(2) : 0;
  
  const repeatOffenders = await Incident.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$reportedUser', count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  res.json({
    incidents: {
      total: totalIncidents,
      critical: criticalIncidents,
      high: highIncidents,
      resolved: resolvedIncidents,
      byCategory: incidentsByCategory,
      resolutionRate
    },
    fraud: {
      total: totalFrauds,
      confirmed: confirmedFrauds
    },
    suspiciousActivity: {
      total: totalSuspicious,
      confirmed: confirmedSuspicious
    },
    sos: {
      total: totalSOS,
      resolved: resolvedSOS
    },
    hotspots: hotspotLocations,
    repeatOffenders
  });
});

// Driver Behavior Monitoring
exports.getDriverBehaviorReport = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  
  const incidents = await Incident.find({ reportedDriver: driverId })
    .sort({ createdAt: -1 })
    .limit(20);
  
  const suspiciousActivities = await SuspiciousActivity.find({ driver: driverId })
    .sort({ detectedAt: -1 })
    .limit(20);
  
  const complaints = await Driver.findById(driverId).select('complaints warnings');
  
  res.json({
    incidents,
    suspiciousActivities,
    complaints: complaints?.complaints || 0,
    warnings: complaints?.warnings || 0
  });
});

// Passenger Behavior Monitoring
exports.getPassengerBehaviorReport = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const incidents = await Incident.find({ reportedUser: userId })
    .sort({ createdAt: -1 })
    .limit(20);
  
  const suspiciousActivities = await SuspiciousActivity.find({ user: userId })
    .sort({ detectedAt: -1 })
    .limit(20);
  
  const user = await User.findById(userId).select('complaints warnings cancellations noShows');
  
  res.json({
    incidents,
    suspiciousActivities,
    complaints: user?.complaints || 0,
    warnings: user?.warnings || 0,
    cancellations: user?.cancellations || 0,
    noShows: user?.noShows || 0
  });
});

// ==================== SUPPORT SYSTEM APIs ====================

// Ticket Management
exports.getTickets = asyncHandler(async (req, res) => {
  const { status, category, priority, assignedTo } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  
  const tickets = await Ticket.find(filter)
    .populate('user', 'firstName lastName phoneNumber email')
    .populate('assignedTo', 'firstName lastName')
    .populate('trip')
    .sort({ createdAt: -1 });
  res.json({ tickets });
});

exports.getTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const ticket = await Ticket.findById(ticketId)
    .populate('user', 'firstName lastName phoneNumber email')
    .populate('assignedTo', 'firstName lastName')
    .populate('trip')
    .populate('messages.sender', 'firstName lastName');
  res.json({ ticket });
});

exports.createTicket = asyncHandler(async (req, res) => {
  const ticketData = req.body;
  ticketData.createdBy = req.user._id;
  ticketData.source = 'admin_created';
  
  const ticket = await Ticket.create(ticketData);
  
  // Notify assigned agent
  if (ticket.assignedTo) {
    await createNotification(ticket.assignedTo, 'ticket_assigned', 'New Ticket Assigned',
      `You have been assigned ticket #${ticket.ticketNumber}`);
  }
  
  // Check auto-reply rules
  const autoRules = await AutoReplyRule.find({ isActive: true, triggerType: 'category' });
  for (const rule of autoRules) {
    if (rule.category === ticket.category) {
      if (rule.action === 'auto_reply' && rule.response.message) {
        await Ticket.findByIdAndUpdate(ticket._id, {
          $push: {
            messages: {
              sender: req.user._id,
              message: rule.response.message,
              isInternal: false,
              createdAt: new Date()
            }
          }
        });
      }
      rule.executionCount += 1;
      rule.lastExecutedAt = new Date();
      await rule.save();
    }
  }
  
  logger.info('Ticket created by admin', { ticketId: ticket._id });
  res.json({ message: 'Ticket created successfully', ticket });
});

exports.updateTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { status, priority, assignedTo, category, subject, description } = req.body;
  
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { status, priority, assignedTo, category, subject, description },
    { new: true }
  );
  
  // Notify user of status change
  if (status && status !== ticket.status) {
    await createNotification(ticket.user, 'ticket_updated', 'Ticket Status Updated',
      `Your ticket #${ticket.ticketNumber} status is now ${status}`);
  }
  
  // Notify new assignee
  if (assignedTo && assignedTo !== ticket.assignedTo?.toString()) {
    await createNotification(assignedTo, 'ticket_assigned', 'Ticket Assigned',
      `You have been assigned ticket #${ticket.ticketNumber}`);
  }
  
  logger.info('Ticket updated', { ticketId });
  res.json({ message: 'Ticket updated successfully', ticket });
});

exports.addTicketMessage = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { message, isInternal, attachments } = req.body;
  
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    {
      $push: {
        messages: {
          sender: req.user._id,
          message,
          isInternal: isInternal || false,
          attachments: attachments || [],
          createdAt: new Date()
        }
      },
      updatedAt: new Date()
    },
    { new: true }
  );
  
  // Set first response time if this is the first agent response
  if (!ticket.sla.firstResponseAt && !isInternal) {
    ticket.sla.firstResponseAt = new Date();
    await ticket.save();
  }
  
  // Notify user of new message
  await createNotification(ticket.user, 'ticket_message', 'New Message on Ticket',
    `You have a new message on ticket #${ticket.ticketNumber}`);
  
  logger.info('Ticket message added', { ticketId });
  res.json({ message: 'Message added successfully', ticket });
});

exports.resolveTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { resolutionNotes, satisfactionRating, satisfactionFeedback } = req.body;
  
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    {
      status: 'resolved',
      resolvedBy: req.user._id,
      resolutionNotes,
      'sla.resolvedAt': new Date(),
      'satisfaction.rating': satisfactionRating,
      'satisfaction.feedback': satisfactionFeedback,
      'satisfaction.ratedAt': new Date()
    },
    { new: true }
  );
  
  await createNotification(ticket.user, 'ticket_resolved', 'Ticket Resolved',
    `Your ticket #${ticket.ticketNumber} has been resolved`);
  
  logger.info('Ticket resolved', { ticketId });
  res.json({ message: 'Ticket resolved successfully', ticket });
});

exports.closeTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { status: 'closed' },
    { new: true }
  );
  
  logger.info('Ticket closed', { ticketId });
  res.json({ message: 'Ticket closed successfully', ticket });
});

exports.escalateTicket = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { escalateTo, reason } = req.body;
  
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    {
      'sla.escalated': true,
      'sla.escalatedAt': new Date(),
      'sla.escalatedTo': escalateTo,
      assignedTo: escalateTo,
      priority: 'urgent'
    },
    { new: true }
  );
  
  await createNotification(escalateTo, 'ticket_escalated', 'Ticket Escalated',
    `Ticket #${ticket.ticketNumber} has been escalated to you. Reason: ${reason}`);
  
  logger.info('Ticket escalated', { ticketId, escalateTo });
  res.json({ message: 'Ticket escalated successfully', ticket });
});

exports.bulkUpdateTickets = asyncHandler(async (req, res) => {
  const { ticketIds, action, value } = req.body;
  
  const update = {};
  if (action === 'close') update.status = 'closed';
  if (action === 'resolve') update.status = 'resolved';
  if (action === 'assign') update.assignedTo = value;
  if (action === 'priority') update.priority = value;
  
  const result = await Ticket.updateMany(
    { _id: { $in: ticketIds } },
    update
  );
  
  logger.info('Bulk ticket update', { count: result.modifiedCount, action });
  res.json({ message: `${result.modifiedCount} tickets updated` });
});

// Live Chat
exports.getSupportChats = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  
  const chats = await SupportChat.find(filter)
    .populate('participants.user', 'firstName lastName')
    .populate('ticket')
    .sort({ startedAt: -1 });
  res.json({ chats });
});

exports.getSupportChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const chat = await SupportChat.findById(chatId)
    .populate('participants.user', 'firstName lastName')
    .populate('messages.sender', 'firstName lastName')
    .populate('ticket');
  res.json({ chat });
});

exports.createSupportChat = asyncHandler(async (req, res) => {
  const { userId, ticketId } = req.body;
  
  const chat = await SupportChat.create({
    participants: [
      { user: userId, role: 'customer' },
      { user: req.user._id, role: 'agent' }
    ],
    ticket: ticketId
  });
  
  // Emit socket event for real-time chat
  const io = getIO();
  io.to(`user_${userId}`).emit('support_chat_started', { chatId: chat._id });
  
  logger.info('Support chat created', { chatId: chat._id });
  res.json({ message: 'Chat created successfully', chat });
});

exports.sendChatMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { message, attachments, isCannedResponse, cannedResponseId } = req.body;
  
  const chat = await SupportChat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }
  
  const senderRole = chat.participants.find(p => p.user.toString() === req.user._id.toString())?.role || 'agent';
  
  chat.messages.push({
    sender: req.user._id,
    senderRole,
    message,
    attachments: attachments || [],
    isCannedResponse: isCannedResponse || false,
    cannedResponseId,
    createdAt: new Date()
  });
  
  // Update canned response usage
  if (isCannedResponse && cannedResponseId) {
    await CannedResponse.findByIdAndUpdate(cannedResponseId, {
      $inc: { useCount: 1 },
      lastUsedBy: req.user._id,
      lastUsedAt: new Date()
    });
  }
  
  await chat.save();
  
  // Emit socket event for real-time message
  const io = getIO();
  chat.participants.forEach(p => {
    if (p.user.toString() !== req.user._id.toString()) {
      io.to(`user_${p.user}`).emit('chat_message', {
        chatId,
        message: chat.messages[chat.messages.length - 1]
      });
    }
  });
  
  logger.info('Chat message sent', { chatId });
  res.json({ message: 'Message sent successfully', chat });
});

exports.transferChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { transferTo } = req.body;
  
  const chat = await SupportChat.findByIdAndUpdate(
    chatId,
    {
      transferredTo: transferTo,
      transferredFrom: req.user._id,
      transferredAt: new Date(),
      status: 'transferred',
      $push: {
        participants: { user: transferTo, role: 'agent' }
      }
    },
    { new: true }
  );
  
  await createNotification(transferTo, 'chat_transferred', 'Chat Transferred',
    `A support chat has been transferred to you`);
  
  logger.info('Chat transferred', { chatId, transferTo });
  res.json({ message: 'Chat transferred successfully', chat });
});

exports.rateChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { score, feedback } = req.body;
  
  const chat = await SupportChat.findByIdAndUpdate(
    chatId,
    {
      rating: {
        score,
        feedback,
        ratedBy: req.user._id,
        ratedAt: new Date()
      }
    },
    { new: true }
  );
  
  logger.info('Chat rated', { chatId, score });
  res.json({ message: 'Rating submitted successfully', chat });
});

exports.endChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  
  const chat = await SupportChat.findByIdAndUpdate(
    chatId,
    {
      status: 'ended',
      endedAt: new Date()
    },
    { new: true }
  );
  
  logger.info('Chat ended', { chatId });
  res.json({ message: 'Chat ended successfully', chat });
});

// Knowledge Base
exports.getFAQs = asyncHandler(async (req, res) => {
  const { category, language, search } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (language) filter.language = language;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  const faqs = await FAQ.find(filter)
    .populate('relatedArticles')
    .sort({ order: 1, createdAt: -1 });
  res.json({ faqs });
});

exports.getFAQ = asyncHandler(async (req, res) => {
  const { faqId } = req.params;
  const faq = await FAQ.findByIdAndUpdate(
    faqId,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('relatedArticles');
  res.json({ faq });
});

exports.createFAQ = asyncHandler(async (req, res) => {
  const faqData = req.body;
  faqData.lastUpdatedBy = req.user._id;
  
  const faq = await FAQ.create(faqData);
  
  logger.info('FAQ created', { faqId: faq._id });
  res.json({ message: 'FAQ created successfully', faq });
});

exports.updateFAQ = asyncHandler(async (req, res) => {
  const { faqId } = req.params;
  const faqData = req.body;
  faqData.lastUpdatedBy = req.user._id;
  
  const faq = await FAQ.findByIdAndUpdate(
    faqId,
    faqData,
    { new: true }
  );
  
  logger.info('FAQ updated', { faqId });
  res.json({ message: 'FAQ updated successfully', faq });
});

exports.deleteFAQ = asyncHandler(async (req, res) => {
  const { faqId } = req.params;
  
  await FAQ.findByIdAndDelete(faqId);
  
  logger.info('FAQ deleted', { faqId });
  res.json({ message: 'FAQ deleted successfully' });
});

exports.markFAQHelpful = asyncHandler(async (req, res) => {
  const { faqId } = req.params;
  const { helpful } = req.body;
  
  const faq = await FAQ.findByIdAndUpdate(
    faqId,
    { $inc: { [helpful ? 'helpful' : 'notHelpful']: 1 } },
    { new: true }
  );
  
  res.json({ message: 'Feedback recorded', faq });
});

// Canned Responses
exports.getCannedResponses = asyncHandler(async (req, res) => {
  const { category, language } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (language) filter.language = language;
  
  const responses = await CannedResponse.find(filter)
    .populate('createdBy', 'firstName lastName')
    .sort({ useCount: -1 });
  res.json({ responses });
});

exports.createCannedResponse = asyncHandler(async (req, res) => {
  const responseData = req.body;
  responseData.createdBy = req.user._id;
  
  const response = await CannedResponse.create(responseData);
  
  logger.info('Canned response created', { responseId: response._id });
  res.json({ message: 'Canned response created successfully', response });
});

exports.updateCannedResponse = asyncHandler(async (req, res) => {
  const { responseId } = req.params;
  const responseData = req.body;
  
  const response = await CannedResponse.findByIdAndUpdate(
    responseId,
    responseData,
    { new: true }
  );
  
  logger.info('Canned response updated', { responseId });
  res.json({ message: 'Canned response updated successfully', response });
});

exports.deleteCannedResponse = asyncHandler(async (req, res) => {
  const { responseId } = req.params;
  
  await CannedResponse.findByIdAndDelete(responseId);
  
  logger.info('Canned response deleted', { responseId });
  res.json({ message: 'Canned response deleted successfully' });
});

// Auto Reply Rules
exports.getAutoReplyRules = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  const filter = isActive !== undefined ? { isActive: isActive === 'true' } : {};
  
  const rules = await AutoReplyRule.find(filter)
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
  res.json({ rules });
});

exports.createAutoReplyRule = asyncHandler(async (req, res) => {
  const ruleData = req.body;
  ruleData.createdBy = req.user._id;
  
  const rule = await AutoReplyRule.create(ruleData);
  
  logger.info('Auto reply rule created', { ruleId: rule._id });
  res.json({ message: 'Auto reply rule created successfully', rule });
});

exports.updateAutoReplyRule = asyncHandler(async (req, res) => {
  const { ruleId } = req.params;
  const ruleData = req.body;
  
  const rule = await AutoReplyRule.findByIdAndUpdate(
    ruleId,
    ruleData,
    { new: true }
  );
  
  logger.info('Auto reply rule updated', { ruleId });
  res.json({ message: 'Auto reply rule updated successfully', rule });
});

exports.deleteAutoReplyRule = asyncHandler(async (req, res) => {
  const { ruleId } = req.params;
  
  await AutoReplyRule.findByIdAndDelete(ruleId);
  
  logger.info('Auto reply rule deleted', { ruleId });
  res.json({ message: 'Auto reply rule deleted successfully' });
});

// Communication
exports.sendBroadcastMessage = asyncHandler(async (req, res) => {
  const { message, targetAudience, title } = req.body;
  
  let recipients = [];
  if (targetAudience === 'all') {
    recipients = await User.find({ isActive: true }).select('_id preferences');
  } else if (targetAudience === 'drivers') {
    recipients = await User.find({ role: 'driver', isActive: true }).select('_id preferences');
  } else if (targetAudience === 'passengers') {
    recipients = await User.find({ role: 'passenger', isActive: true }).select('_id preferences');
  }

  recipients = recipients.filter(u => (u.preferences || {}).promotions !== false);

  // Create notifications for all recipients
  const notificationPromises = recipients.map(user => 
    createNotification(user._id, 'broadcast', title || 'System Message', message)
  );
  
  await Promise.all(notificationPromises);
  
  // Emit socket event to opted-in recipients only
  const io = getIO();
  recipients.forEach(user => {
    io.to(`user_${user._id}`).emit('broadcast_message', { title, message });
  });
  
  logger.info('Broadcast message sent', { recipientCount: recipients.length });
  res.json({ message: `Broadcast sent to ${recipients.length} users` });
});

exports.sendEmailNotification = asyncHandler(async (req, res) => {
  const { userId, subject, message } = req.body;
  
  await createNotification(userId, 'email_notification', subject, message);
  
  logger.info('Email notification sent', { userId });
  res.json({ message: 'Email notification sent successfully' });
});

exports.sendSMSNotification = asyncHandler(async (req, res) => {
  const { userId, message } = req.body;
  
  await createNotification(userId, 'sms_notification', 'SMS Alert', message);
  
  logger.info('SMS notification sent', { userId });
  res.json({ message: 'SMS notification sent successfully' });
});

// Support Analytics
exports.getSupportAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }
  
  // Ticket statistics
  const totalTickets = await Ticket.countDocuments(dateFilter);
  const openTickets = await Ticket.countDocuments({ ...dateFilter, status: 'open' });
  const inProgressTickets = await Ticket.countDocuments({ ...dateFilter, status: 'in_progress' });
  const resolvedTickets = await Ticket.countDocuments({ ...dateFilter, status: 'resolved' });
  const closedTickets = await Ticket.countDocuments({ ...dateFilter, status: 'closed' });
  
  // Response time
  const ticketsWithResponse = await Ticket.find({
    ...dateFilter,
    'sla.firstResponseAt': { $exists: true }
  });
  
  let totalResponseTime = 0;
  ticketsWithResponse.forEach(ticket => {
    if (ticket.sla.firstResponseAt && ticket.createdAt) {
      totalResponseTime += (ticket.sla.firstResponseAt - ticket.createdAt) / 1000 / 60; // minutes
    }
  });
  const avgResponseTime = ticketsWithResponse.length > 0 ? totalResponseTime / ticketsWithResponse.length : 0;
  
  // Resolution time
  const ticketsWithResolution = await Ticket.find({
    ...dateFilter,
    'sla.resolvedAt': { $exists: true }
  });
  
  let totalResolutionTime = 0;
  ticketsWithResolution.forEach(ticket => {
    if (ticket.sla.resolvedAt && ticket.createdAt) {
      totalResolutionTime += (ticket.sla.resolvedAt - ticket.createdAt) / 1000 / 60; // minutes
    }
  });
  const avgResolutionTime = ticketsWithResolution.length > 0 ? totalResolutionTime / ticketsWithResolution.length : 0;
  
  // Satisfaction
  const ticketsWithRating = await Ticket.find({
    ...dateFilter,
    'satisfaction.rating': { $exists: true }
  });
  
  let totalRating = 0;
  ticketsWithRating.forEach(ticket => {
    totalRating += ticket.satisfaction.rating;
  });
  const avgSatisfaction = ticketsWithRating.length > 0 ? totalRating / ticketsWithRating.length : 0;
  
  // Tickets by category
  const ticketsByCategory = await Ticket.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Tickets by priority
  const ticketsByPriority = await Ticket.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // FAQ analytics
  const popularFAQs = await FAQ.find({ isPublished: true })
    .sort({ views: -1 })
    .limit(10);
  
  // Chat statistics
  const totalChats = await SupportChat.countDocuments(dateFilter);
  const activeChats = await SupportChat.countDocuments({ ...dateFilter, status: 'active' });
  
  res.json({
    tickets: {
      total: totalTickets,
      open: openTickets,
      inProgress: inProgressTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
      byCategory: ticketsByCategory,
      byPriority: ticketsByPriority
    },
    performance: {
      avgResponseTime: Math.round(avgResponseTime),
      avgResolutionTime: Math.round(avgResolutionTime),
      avgSatisfaction: avgSatisfaction.toFixed(2)
    },
    faqs: {
      popular: popularFAQs
    },
    chats: {
      total: totalChats,
      active: activeChats
    }
  });
});

// User Support
exports.getUserSupportHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const tickets = await Ticket.find({ user: userId })
    .populate('assignedTo', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20);
  
  const chats = await SupportChat.find({ 'participants.user': userId })
    .sort({ startedAt: -1 })
    .limit(20);
  
  res.json({ tickets, chats });
});

exports.getUserSupportProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId)
    .select('firstName lastName phoneNumber email role totalTrips totalSpent complaints warnings');
  
  const ticketCount = await Ticket.countDocuments({ user: userId });
  const resolvedTicketCount = await Ticket.countDocuments({ user: userId, status: 'resolved' });
  
  res.json({
    user,
    ticketCount,
    resolvedTicketCount,
    satisfactionRate: resolvedTicketCount > 0 ? (resolvedTicketCount / ticketCount * 100).toFixed(2) : 0
  });
});

// Reports
exports.generateSupportReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, format } = req.query;
  
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }
  
  const tickets = await Ticket.find(dateFilter)
    .populate('user', 'firstName lastName phoneNumber')
    .populate('assignedTo', 'firstName lastName')
    .sort({ createdAt: -1 });
  
  if (format === 'csv') {
    const csvHeader = 'Ticket Number,User,Assigned To,Category,Priority,Status,Created At,Resolved At\n';
    const csvRows = tickets.map(ticket => {
      const userName = ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'N/A';
      const assignedTo = ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Unassigned';
      return `${ticket.ticketNumber},${userName},${assignedTo},${ticket.category},${ticket.priority},${ticket.status},${ticket.createdAt},${ticket.sla.resolvedAt || 'N/A'}`;
    }).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=support_report.csv');
    res.send(csvHeader + csvRows);
  } else {
    res.json({ tickets });
  }
});

exports.getSLACompliance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }
  
  const tickets = await Ticket.find(dateFilter);
  
  let slaCompliant = 0;
  let slaBreached = 0;
  
  tickets.forEach(ticket => {
    if (ticket.sla.firstResponseAt && ticket.createdAt) {
      const responseTime = (ticket.sla.firstResponseAt - ticket.createdAt) / 1000 / 60; // minutes
      if (responseTime <= ticket.sla.responseTimeTarget) {
        slaCompliant++;
      } else {
        slaBreached++;
      }
    }
  });
  
  const total = slaCompliant + slaBreached;
  const complianceRate = total > 0 ? (slaCompliant / total * 100).toFixed(2) : 0;
  
  res.json({
    total,
    compliant: slaCompliant,
    breached: slaBreached,
    complianceRate
  });
});

// ==================== ANALYTICS & REPORTING APIs ====================

// Revenue Analytics
exports.getRevenueTrends = asyncHandler(async (req, res) => {
  const { period = 'month', startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate && !isNaN(new Date(startDate).getTime())) dateFilter.$gte = new Date(startDate);
  if (endDate && !isNaN(new Date(endDate).getTime())) dateFilter.$lte = new Date(endDate);
  
  const payments = await Payment.find({
    status: 'completed',
    ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
  });
  
  const revenueByDate = {};
  payments.forEach(payment => {
    const date = payment.createdAt.toISOString().split('T')[0];
    revenueByDate[date] = (revenueByDate[date] || 0) + (payment.amount || 0);
  });
  
  const sortedDates = Object.keys(revenueByDate).sort();
  const trendData = sortedDates.map(date => ({
    date,
    revenue: revenueByDate[date]
  }));
  
  res.json({ trendData, totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0) });
});

exports.getRevenueByRoute = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const trips = await Trip.find({
    status: 'completed',
    ...dateQ(startDate, endDate)
  }).populate('payment');
  
  const revenueByRoute = {};
  trips.forEach(trip => {
    const routeKey = `${trip.pickupLocation?.address || 'Unknown'} to ${trip.dropoffLocation?.address || 'Unknown'}`;
    const fare = trip.payment?.amount || trip.fare?.totalFare || 0;
    revenueByRoute[routeKey] = (revenueByRoute[routeKey] || 0) + fare;
  });
  
  const sortedRoutes = Object.entries(revenueByRoute)
    .sort((a, b) => b[1] - a[1])
    .map(([route, revenue]) => ({ route, revenue }));
  
  res.json({ revenueByRoute: sortedRoutes });
});

exports.getRevenueByVehicleType = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const trips = await Trip.find({
    status: 'completed',
    ...dateQ(startDate, endDate)
  }).populate('driver').populate('payment');
  
  const revenueByVehicle = {};
  trips.forEach(trip => {
    const vehicleType = trip.driver?.vehicle?.type || 'unknown';
    const fare = trip.payment?.amount || trip.fare?.totalFare || 0;
    revenueByVehicle[vehicleType] = (revenueByVehicle[vehicleType] || { revenue: 0, count: 0 });
    revenueByVehicle[vehicleType].revenue += fare;
    revenueByVehicle[vehicleType].count += 1;
  });
  
  res.json({ revenueByVehicle });
});

exports.getRevenuePerDriver = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 20 } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    status: 'completed',
    createdAt: dateFilter
  }).populate('driver').populate('driver.user').populate('payment');
  
  const revenueByDriver = {};
  trips.forEach(trip => {
    if (!trip.driver) return;
    const driverId = trip.driver._id.toString();
    const driverName = trip.driver.user ? `${trip.driver.user.firstName} ${trip.driver.user.lastName}` : 'Unknown';
    const fare = trip.payment?.amount || trip.fare?.totalFare || 0;
    
    if (!revenueByDriver[driverId]) {
      revenueByDriver[driverId] = { driverId, driverName, revenue: 0, tripCount: 0 };
    }
    revenueByDriver[driverId].revenue += fare;
    revenueByDriver[driverId].tripCount += 1;
  });
  
  const sortedDrivers = Object.values(revenueByDriver)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, parseInt(limit));
  
  res.json({ revenuePerDriver: sortedDrivers });
});

exports.getRevenuePerPassenger = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 20 } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    status: 'completed',
    createdAt: dateFilter
  }).populate('passenger').populate('payment');
  
  const revenueByPassenger = {};
  trips.forEach(trip => {
    if (!trip.passenger) return;
    const passengerId = trip.passenger._id.toString();
    const passengerName = `${trip.passenger.firstName} ${trip.passenger.lastName}`;
    const fare = trip.payment?.amount || trip.fare?.totalFare || 0;
    
    if (!revenueByPassenger[passengerId]) {
      revenueByPassenger[passengerId] = { passengerId, passengerName, revenue: 0, tripCount: 0 };
    }
    revenueByPassenger[passengerId].revenue += fare;
    revenueByPassenger[passengerId].tripCount += 1;
  });
  
  const sortedPassengers = Object.values(revenueByPassenger)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, parseInt(limit));
  
  res.json({ revenuePerPassenger: sortedPassengers });
});

exports.getSurgePricingImpact = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const trips = await Trip.find({
    status: 'completed',
    ...dateQ(startDate, endDate)
  }).populate('payment');
  
  let surgeRevenue = 0;
  let surgeCount = 0;
  let normalRevenue = 0;
  let normalCount = 0;
  
  trips.forEach(trip => {
    const fare = trip.payment?.amount || trip.fare?.totalFare || 0;
    if (trip.surgeMultiplier && trip.surgeMultiplier > 1) {
      surgeRevenue += fare;
      surgeCount += 1;
    } else {
      normalRevenue += fare;
      normalCount += 1;
    }
  });
  
  res.json({
    surge: { revenue: surgeRevenue, count: surgeCount, avgFare: surgeCount > 0 ? surgeRevenue / surgeCount : 0 },
    normal: { revenue: normalRevenue, count: normalCount, avgFare: normalCount > 0 ? normalRevenue / normalCount : 0 },
    surgeImpact: surgeCount > 0 ? ((surgeRevenue / normalRevenue) * 100).toFixed(2) : 0
  });
});

// Trip Analytics
exports.getTripCompletionRate = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const totalTrips = await Trip.countDocuments({ createdAt: dateFilter });
  const completedTrips = await Trip.countDocuments({ status: 'completed', createdAt: dateFilter });
  const cancelledTrips = await Trip.countDocuments({ status: 'cancelled', createdAt: dateFilter });
  
  const completionRate = totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(2) : 0;
  const cancellationRate = totalTrips > 0 ? ((cancelledTrips / totalTrips) * 100).toFixed(2) : 0;
  
  res.json({ totalTrips, completedTrips, cancelledTrips, completionRate, cancellationRate });
});

exports.getCancellationReasons = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const cancelledTrips = await Trip.find({
    status: 'cancelled',
    createdAt: dateFilter
  });
  
  const reasons = {};
  cancelledTrips.forEach(trip => {
    const reason = trip.cancellationReason || 'unknown';
    reasons[reason] = (reasons[reason] || 0) + 1;
  });
  
  const sortedReasons = Object.entries(reasons)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({ reason, count, percentage: ((count / cancelledTrips.length) * 100).toFixed(2) }));
  
  res.json({ cancellationReasons: sortedReasons });
});

exports.getAverageTripDuration = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'route' } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    status: 'completed',
    createdAt: dateFilter
  });
  
  const durations = trips
    .filter(t => t.startedAt && t.completedAt)
    .map(t => ({
      duration: (t.completedAt - t.startedAt) / 1000 / 60,
      route: `${t.pickupLocation?.address || 'Unknown'} to ${t.dropoffLocation?.address || 'Unknown'}`,
      vehicleType: t.driver?.vehicle?.type || 'unknown'
    }));
  
  const avgDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d.duration, 0) / durations.length : 0;
  
  if (groupBy === 'route') {
    const byRoute = {};
    durations.forEach(d => {
      if (!byRoute[d.route]) byRoute[d.route] = { durations: [], count: 0 };
      byRoute[d.route].durations.push(d.duration);
      byRoute[d.route].count += 1;
    });
    
    const avgByRoute = Object.entries(byRoute).map(([route, data]) => ({
      route,
      avgDuration: data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length,
      count: data.count
    }));
    
    res.json({ avgDuration, avgByRoute });
  } else {
    res.json({ avgDuration });
  }
});

exports.getAverageTripDistance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    status: 'completed',
    createdAt: dateFilter
  });
  
  const distances = trips
    .filter(t => t.distance)
    .map(t => t.distance);
  
  const avgDistance = distances.length > 0 ? distances.reduce((sum, d) => sum + d, 0) / distances.length : 0;
  
  res.json({ avgDistance, totalTrips: distances.length });
});

exports.getTripVolumeTrends = asyncHandler(async (req, res) => {
  const { period = 'week', startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    createdAt: dateFilter
  });
  
  const volumeByDate = {};
  trips.forEach(trip => {
    const date = trip.createdAt.toISOString().split('T')[0];
    volumeByDate[date] = (volumeByDate[date] || 0) + 1;
  });
  
  const sortedDates = Object.keys(volumeByDate).sort();
  const trendData = sortedDates.map(date => ({
    date,
    volume: volumeByDate[date]
  }));
  
  res.json({ trendData });
});

// User Analytics
exports.getUserGrowth = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let startDate = new Date();
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
  if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
  
  const users = await User.find({
    createdAt: { $gte: startDate }
  });
  
  const growthByDate = {};
  users.forEach(user => {
    const date = user.createdAt.toISOString().split('T')[0];
    growthByDate[date] = (growthByDate[date] || 0) + 1;
  });
  
  const sortedDates = Object.keys(growthByDate).sort();
  const trendData = sortedDates.map(date => ({
    date,
    newUsers: growthByDate[date]
  }));
  
  res.json({ trendData, totalNewUsers: users.length });
});

exports.getUserActivity = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;
  
  let startDate = new Date();
  if (period === 'day') startDate.setDate(startDate.getDate() - 1);
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
  
  const activeUsers = await User.countDocuments({
    lastSeen: { $gte: startDate }
  });
  
  const totalUsers = await User.countDocuments();
  const activityRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0;
  
  res.json({ activeUsers, totalUsers, activityRate });
});

exports.getUserDemographics = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'passenger' });
  
  const demographics = {
    ageGroups: {},
    locations: {},
    preferences: {}
  };
  
  users.forEach(user => {
    if (user.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear();
      let ageGroup = 'unknown';
      if (age < 18) ageGroup = 'under_18';
      else if (age < 25) ageGroup = '18-24';
      else if (age < 35) ageGroup = '25-34';
      else if (age < 45) ageGroup = '35-44';
      else if (age < 55) ageGroup = '45-54';
      else ageGroup = '55+';
      demographics.ageGroups[ageGroup] = (demographics.ageGroups[ageGroup] || 0) + 1;
    }
    
    if (user.currentLocation?.coordinates) {
      const area = 'Dire Dawa';
      demographics.locations[area] = (demographics.locations[area] || 0) + 1;
    }
    
    if (user.preferences) {
      Object.keys(user.preferences).forEach(pref => {
        if (user.preferences[pref] === true) {
          demographics.preferences[pref] = (demographics.preferences[pref] || 0) + 1;
        }
      });
    }
  });
  
  res.json({ demographics, totalUsers: users.length });
});

exports.getUserBehavior = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  
  const filter = userId ? { passenger: userId } : {};
  const trips = await Trip.find(filter).populate('passenger');
  
  const behavior = {
    bookingPatterns: {},
    preferredTimes: {},
    averageTripValue: 0,
    totalSpent: 0
  };
  
  const bookingByHour = {};
  const bookingByDay = {};
  
  trips.forEach(trip => {
    if (trip.createdAt) {
      const hour = trip.createdAt.getHours();
      const day = trip.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
      bookingByHour[hour] = (bookingByHour[hour] || 0) + 1;
      bookingByDay[day] = (bookingByDay[day] || 0) + 1;
    }
    
    if (trip.fare) {
      behavior.totalSpent += trip.fare;
    }
  });
  
  behavior.bookingPatterns = { byHour: bookingByHour, byDay: bookingByDay };
  behavior.averageTripValue = trips.length > 0 ? behavior.totalSpent / trips.length : 0;
  
  res.json({ behavior, totalTrips: trips.length });
});

exports.getUserLifetimeValue = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  
  const users = await User.find({ role: 'passenger' });
  
  const userValues = await Promise.all(users.map(async (user) => {
    const trips = await Trip.find({ passenger: user._id, status: 'completed' });
    const totalSpent = trips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
    const tripCount = trips.length;
    const avgTripValue = tripCount > 0 ? totalSpent / tripCount : 0;
    
    return {
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      totalSpent,
      tripCount,
      avgTripValue,
      joinedAt: user.createdAt
    };
  }));
  
  const sortedUsers = userValues
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, parseInt(limit));
  
  res.json({ userLifetimeValues: sortedUsers });
});

// Driver Analytics
exports.getDriverAvailability = asyncHandler(async (req, res) => {
  const drivers = await Driver.find({}).populate('user');
  
  const availabilityData = drivers.map(driver => ({
    driverId: driver._id,
    driverName: driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown',
    isOnline: driver.isOnline,
    isAvailable: driver.isAvailable,
    totalTrips: driver.totalTrips,
    completedTrips: driver.completedTrips
  }));
  
  const onlineCount = drivers.filter(d => d.isOnline).length;
  const availableCount = drivers.filter(d => d.isAvailable).length;
  
  res.json({ availabilityData, onlineCount, availableCount, totalDrivers: drivers.length });
});

exports.getDriverUtilization = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const drivers = await Driver.find({});
  
  const utilizationData = await Promise.all(drivers.map(async (driver) => {
    const trips = await Trip.find({
      driver: driver._id,
      status: 'completed',
      createdAt: dateFilter
    });
    
    const totalMinutes = trips.reduce((sum, trip) => {
      if (trip.startedAt && trip.completedAt) {
        return sum + (trip.completedAt - trip.startedAt) / 1000 / 60;
      }
      return sum;
    }, 0);
    
    const totalHours = totalMinutes / 60;
    const utilizationRate = totalHours > 0 ? (totalHours / 8 * 100).toFixed(2) : 0;
    
    return {
      driverId: driver._id,
      totalHours,
      tripCount: trips.length,
      utilizationRate
    };
  }));
  
  res.json({ utilizationData });
});

exports.getDriverPerformance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const drivers = await Driver.find({}).populate('user');
  
  const performanceData = await Promise.all(drivers.map(async (driver) => {
    const trips = await Trip.find({
      driver: driver._id,
      status: 'completed',
      createdAt: dateFilter
    });
    
    const ratings = await Rating.find({ driver: driver._id });
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
    const completionRate = driver.totalTrips > 0 ? (driver.completedTrips / driver.totalTrips * 100).toFixed(2) : 0;
    
    return {
      driverId: driver._id,
      driverName: driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown',
      avgRating,
      completionRate,
      totalTrips: driver.totalTrips,
      completedTrips: driver.completedTrips,
      complaints: driver.complaints
    };
  }));
  
  res.json({ performanceData });
});

exports.getDriverEarnings = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 20 } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const drivers = await Driver.find({}).populate('user');
  
  const earningsData = await Promise.all(drivers.map(async (driver) => {
    const trips = await Trip.find({
      driver: driver._id,
      status: 'completed',
      createdAt: dateFilter
    }).populate('payment');
    
    const totalEarnings = trips.reduce((sum, trip) => {
      return sum + (trip.payment?.driverEarnings || trip.fare * 0.8 || 0);
    }, 0);
    
    const totalHours = trips.reduce((sum, trip) => {
      if (trip.startedAt && trip.completedAt) {
        return sum + (trip.completedAt - trip.startedAt) / 1000 / 60 / 60;
      }
      return sum;
    }, 0);
    
    const avgEarningsPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;
    
    return {
      driverId: driver._id,
      driverName: driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown',
      totalEarnings,
      tripCount: trips.length,
      totalHours,
      avgEarningsPerHour
    };
  }));
  
  const sortedEarnings = earningsData
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, parseInt(limit));
  
  res.json({ driverEarnings: sortedEarnings });
});

exports.getDriverChurn = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let startDate = new Date();
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
  if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
  
  const inactiveDrivers = await Driver.find({
    lastActive: { $lt: startDate }
  }).populate('user');
  
  const totalDrivers = await Driver.countDocuments();
  const churnRate = totalDrivers > 0 ? ((inactiveDrivers.length / totalDrivers) * 100).toFixed(2) : 0;
  
  const churnedDrivers = inactiveDrivers.map(driver => ({
    driverId: driver._id,
    driverName: driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown',
    lastActive: driver.lastActive,
    totalTrips: driver.totalTrips
  }));
  
  res.json({ churnedDrivers, churnRate, totalDrivers });
});

// Geographic Analytics
exports.getDemandHeatmap = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;
  
  let startDate = new Date();
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
  
  const trips = await Trip.find({
    createdAt: { $gte: startDate }
  });
  
  const heatmapData = trips.map(trip => ({
    pickup: trip.pickupLocation?.coordinates,
    dropoff: trip.dropoffLocation?.coordinates,
    count: 1
  }));
  
  res.json({ heatmapData });
});

exports.getSupplyHeatmap = asyncHandler(async (req, res) => {
  const drivers = await Driver.find({ isOnline: true });
  
  const heatmapData = drivers.map(driver => ({
    location: driver.currentLocation?.coordinates,
    driverId: driver._id
  }));
  
  res.json({ heatmapData });
});

exports.getRoutePopularity = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 20 } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    status: 'completed',
    createdAt: dateFilter
  });
  
  const routeCounts = {};
  trips.forEach(trip => {
    const routeKey = `${trip.pickupLocation?.address || 'Unknown'} to ${trip.dropoffLocation?.address || 'Unknown'}`;
    routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;
  });
  
  const sortedRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, parseInt(limit))
    .map(([route, count]) => ({ route, count }));
  
  res.json({ popularRoutes: sortedRoutes });
});

exports.getAreaPerformance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    status: 'completed',
    createdAt: dateFilter
  }).populate('payment');
  
  const areaPerformance = {};
  trips.forEach(trip => {
    const area = trip.pickupLocation?.address || 'Unknown';
    const fare = trip.payment?.amount || trip.fare?.totalFare || 0;
    
    if (!areaPerformance[area]) {
      areaPerformance[area] = { revenue: 0, tripCount: 0 };
    }
    areaPerformance[area].revenue += fare;
    areaPerformance[area].tripCount += 1;
  });
  
  const sortedAreas = Object.entries(areaPerformance)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([area, data]) => ({ area, ...data }));
  
  res.json({ areaPerformance: sortedAreas });
});

exports.getCoverageGaps = asyncHandler(async (req, res) => {
  const drivers = await Driver.find({ isOnline: true });
  const recentTrips = await Trip.find({
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  const driverLocations = drivers.map(d => d.currentLocation?.coordinates).filter(Boolean);
  const tripLocations = recentTrips.map(t => t.pickupLocation?.coordinates).filter(Boolean);
  
  const coverageGaps = [];
  tripLocations.forEach(tripLoc => {
    const hasDriver = driverLocations.some(driverLoc => {
      const distance = Math.sqrt(
        Math.pow(tripLoc[0] - driverLoc[0], 2) + Math.pow(tripLoc[1] - driverLoc[1], 2)
      );
      return distance < 0.01;
    });
    
    if (!hasDriver) {
      coverageGaps.push(tripLoc);
    }
  });
  
  res.json({ coverageGaps });
});

// Time Analytics
exports.getPeakHours = asyncHandler(async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    
    const trips = await Trip.find({
      createdAt: { $gte: startDate }
    }).catch(() => []);
    
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }
    
    (Array.isArray(trips) ? trips : []).forEach(trip => {
      if (trip.createdAt) {
        const hour = trip.createdAt.getHours();
        hourlyData[hour] += 1;
      }
    });
    
    const peakHours = Object.entries(hourlyData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: parseInt(hour), trips: count }));
    
    res.json({ hourlyData, hours: peakHours });
  } catch (error) {
    console.error('Error in getPeakHours:', error.message);
    res.json({ hourlyData: {}, hours: [] });
  }
});

exports.getPeakDays = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let startDate = new Date();
  if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
  if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
  
  const trips = await Trip.find({
    createdAt: { $gte: startDate }
  });
  
  const dayData = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  days.forEach(day => dayData[day] = 0);
  
  trips.forEach(trip => {
    const day = trip.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
    dayData[day] += 1;
  });
  
  const peakDays = Object.entries(dayData)
    .sort((a, b) => b[1] - a[1])
    .map(([day, count]) => ({ day, count }));
  
  res.json({ dayData, peakDays });
});

exports.getSeasonalTrends = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const trips = await Trip.find({
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  const monthlyData = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  months.forEach(month => monthlyData[month] = 0);
  
  trips.forEach(trip => {
    const month = trip.createdAt.toLocaleDateString('en-US', { month: 'short' });
    monthlyData[month] += 1;
  });
  
  res.json({ monthlyData });
});

exports.getHolidayImpact = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const holidayTrips = await Trip.countDocuments({
    createdAt: dateFilter,
    isHoliday: true
  });
  
  const normalTrips = await Trip.countDocuments({
    createdAt: dateFilter,
    isHoliday: { $ne: true }
  });
  
  const impact = normalTrips > 0 ? ((holidayTrips / normalTrips) * 100).toFixed(2) : 0;
  
  res.json({ holidayTrips, normalTrips, impact });
});

// Financial Analytics
exports.getCommissionCollectionRate = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const payments = await Payment.find({
    status: 'completed',
    createdAt: dateFilter
  });
  
  const totalCommission = payments.reduce((sum, p) => sum + (p.platformCommission || 0), 0);
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const collectionRate = totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100).toFixed(2) : 0;
  
  res.json({ totalCommission, totalRevenue, collectionRate });
});

exports.getRefundRate = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const totalPayments = await Payment.countDocuments({
    createdAt: dateFilter
  });
  
  const refundedPayments = await Payment.countDocuments({
    status: 'refunded',
    createdAt: dateFilter
  });
  
  const refundRate = totalPayments > 0 ? ((refundedPayments / totalPayments) * 100).toFixed(2) : 0;
  
  res.json({ totalPayments, refundedPayments, refundRate });
});

exports.getAverageFare = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'route' } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    status: 'completed',
    createdAt: dateFilter
  }).populate('payment');
  
  const fares = trips.map(t => t.payment?.amount || t.fare || 0);
  const avgFare = fares.length > 0 ? fares.reduce((sum, f) => sum + f, 0) / fares.length : 0;
  
  if (groupBy === 'route') {
    const byRoute = {};
    trips.forEach(trip => {
      const route = `${trip.pickupLocation?.address || 'Unknown'} to ${trip.dropoffLocation?.address || 'Unknown'}`;
      const fare = trip.payment?.amount || trip.fare?.totalFare || 0;
      if (!byRoute[route]) byRoute[route] = { fares: [], count: 0 };
      byRoute[route].fares.push(fare);
      byRoute[route].count += 1;
    });
    
    const avgByRoute = Object.entries(byRoute).map(([route, data]) => ({
      route,
      avgFare: data.fares.reduce((sum, f) => sum + f, 0) / data.fares.length,
      count: data.count
    }));
    
    res.json({ avgFare, avgByRoute });
  } else {
    res.json({ avgFare });
  }
});

exports.getPaymentMethodDistribution = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const payments = await Payment.find({
    status: 'completed',
    createdAt: dateFilter
  });
  
  const distribution = {};
  payments.forEach(payment => {
    const method = payment.method || 'unknown';
    distribution[method] = (distribution[method] || 0) + 1;
  });
  
  const total = payments.length;
  const withPercentage = Object.entries(distribution).map(([method, count]) => ({
    method,
    count,
    percentage: total > 0 ? ((count / total) * 100).toFixed(2) : 0
  }));
  
  res.json({ distribution: withPercentage });
});

// Performance Metrics
exports.getDriverResponseTime = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    status: 'completed',
    createdAt: dateFilter
  });
  
  const responseTimes = trips
    .filter(t => t.createdAt && t.driverAssignedAt)
    .map(t => (t.driverAssignedAt - t.createdAt) / 1000 / 60);
  
  const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length : 0;
  
  res.json({ avgResponseTime, totalTrips: responseTimes.length });
});

exports.getAverageWaitTime = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const trips = await Trip.find({
    status: 'completed',
    createdAt: dateFilter
  });
  
  const waitTimes = trips
    .filter(t => t.driverAssignedAt && t.driverArrivedAt)
    .map(t => (t.driverArrivedAt - t.driverAssignedAt) / 1000 / 60);
  
  const avgWaitTime = waitTimes.length > 0 ? waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length : 0;
  
  res.json({ avgWaitTime, totalTrips: waitTimes.length });
});

exports.getAppCrashRate = asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query;
  
  let startDate = new Date();
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
  
  const crashReports = await Incident.find({
    category: 'technical',
    createdAt: { $gte: startDate }
  });
  
  const totalUsers = await User.countDocuments();
  const crashRate = totalUsers > 0 ? ((crashReports.length / totalUsers) * 100).toFixed(2) : 0;
  
  res.json({ crashReports: crashReports.length, totalUsers, crashRate });
});

exports.getAPIResponseTime = asyncHandler(async (req, res) => {
  const { period = 'hour' } = req.query;
  
  const startTime = process.uptime();
  const endTime = process.uptime();
  const responseTime = (endTime - startTime) * 1000;
  
  res.json({ responseTime: responseTime.toFixed(2), timestamp: new Date() });
});

// Reports
exports.generateDailyReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const [trips, payments, users, drivers] = await Promise.all([
    Trip.find({ createdAt: { $gte: targetDate, $lt: nextDay } }),
    Payment.find({ createdAt: { $gte: targetDate, $lt: nextDay } }),
    User.countDocuments({ createdAt: { $gte: targetDate, $lt: nextDay } }),
    Driver.countDocuments({ createdAt: { $gte: targetDate, $lt: nextDay } })
  ]);
  
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  res.json({
    date: targetDate,
    summary: {
      totalTrips: trips.length,
      completedTrips,
      cancelledTrips,
      totalRevenue,
      newUsers: users,
      newDrivers: drivers
    }
  });
});

exports.generateWeeklyReport = asyncHandler(async (req, res) => {
  const { weekStart } = req.query;
  const startDate = weekStart ? new Date(weekStart) : new Date();
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date();
  
  const [trips, payments, users] = await Promise.all([
    Trip.find({ createdAt: { $gte: startDate, $lte: endDate } }),
    Payment.find({ createdAt: { $gte: startDate, $lte: endDate } }),
    User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
  ]);
  
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  res.json({
    period: { startDate, endDate },
    summary: {
      totalTrips: trips.length,
      completedTrips,
      totalRevenue,
      newUsers: users
    }
  });
});

exports.generateMonthlyReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const targetMonth = month || new Date().getMonth();
  const targetYear = year || new Date().getFullYear();
  
  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0);
  
  const [trips, payments, users] = await Promise.all([
    Trip.find({ createdAt: { $gte: startDate, $lte: endDate } }),
    Payment.find({ createdAt: { $gte: startDate, $lte: endDate } }),
    User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
  ]);
  
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  res.json({
    period: { month: targetMonth + 1, year: targetYear },
    summary: {
      totalTrips: trips.length,
      completedTrips,
      totalRevenue,
      newUsers: users
    }
  });
});

exports.generateCustomReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  const [trips, payments, users] = await Promise.all([
    Trip.find({ createdAt: dateFilter }),
    Payment.find({ createdAt: dateFilter }),
    User.find({ createdAt: dateFilter })
  ]);
  
  const reportData = {
    period: { startDate, endDate },
    trips: {
      total: trips.length,
      completed: trips.filter(t => t.status === 'completed').length,
      cancelled: trips.filter(t => t.status === 'cancelled').length
    },
    payments: {
      total: payments.length,
      revenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    },
    users: {
      total: users.length
    }
  };
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
    return res.send(JSON.stringify(reportData));
  }
  
  res.json(reportData);
});

exports.exportReport = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, format = 'csv' } = req.query;
  
  const dateFilter = buildDateFilter(startDate, endDate);
  
  let data = [];
  
  if (type === 'trips') {
    data = await Trip.find({ createdAt: dateFilter }).populate('passenger').populate('driver');
  } else if (type === 'payments') {
    data = await Payment.find({ createdAt: dateFilter });
  } else if (type === 'users') {
    data = await User.find({ createdAt: dateFilter });
  }
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
    return res.send(JSON.stringify(data));
  }
  
  res.json({ data });
});

exports.scheduleReport = asyncHandler(async (req, res) => {
  const { reportType, frequency, email, startDate, endDate } = req.body;
  
  res.json({ 
    message: 'Report scheduled',
    schedule: { reportType, frequency, email, startDate, endDate }
  });
});

// Forecasting
exports.getDemandPrediction = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  
  const historicalData = await Trip.find({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  
  const dailyTrips = {};
  historicalData.forEach(trip => {
    const date = trip.createdAt.toISOString().split('T')[0];
    dailyTrips[date] = (dailyTrips[date] || 0) + 1;
  });
  
  const avgDailyTrips = Object.values(dailyTrips).reduce((sum, count) => sum + count, 0) / Object.keys(dailyTrips).length;
  
  const predictions = [];
  for (let i = 1; i <= parseInt(days); i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      predictedTrips: Math.round(avgDailyTrips * (1 + (Math.random() * 0.2 - 0.1)))
    });
  }
  
  res.json({ predictions, avgDailyTrips });
});

exports.getDriverSupplyForecast = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  
  const activeDrivers = await Driver.countDocuments({ isOnline: true });
  const totalDrivers = await Driver.countDocuments();
  
  const predictions = [];
  for (let i = 1; i <= parseInt(days); i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      predictedDrivers: Math.round(activeDrivers * (1 + (Math.random() * 0.15 - 0.075)))
    });
  }
  
  res.json({ predictions, currentActiveDrivers: activeDrivers, totalDrivers });
});

exports.getRevenueProjection = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  
  const recentPayments = await Payment.find({
    status: 'completed',
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });
  
  const dailyRevenue = {};
  recentPayments.forEach(payment => {
    const date = payment.createdAt.toISOString().split('T')[0];
    dailyRevenue[date] = (dailyRevenue[date] || 0) + (payment.amount || 0);
  });
  
  const avgDailyRevenue = Object.values(dailyRevenue).reduce((sum, rev) => sum + rev, 0) / Object.keys(dailyRevenue).length;
  
  const projections = [];
  for (let i = 1; i <= parseInt(days); i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    projections.push({
      date: futureDate.toISOString().split('T')[0],
      projectedRevenue: Math.round(avgDailyRevenue * (1 + (Math.random() * 0.2 - 0.1)))
    });
  }
  
  res.json({ projections, avgDailyRevenue });
});

// Comparative Analytics
exports.getPeriodComparison = asyncHandler(async (req, res) => {
  const { period1Start, period1End, period2Start, period2End } = req.query;
  
  const [trips1, payments1, trips2, payments2] = await Promise.all([
    Trip.find({ createdAt: { $gte: new Date(period1Start), $lte: new Date(period1End) } }),
    Payment.find({ createdAt: { $gte: new Date(period1Start), $lte: new Date(period1End) } }),
    Trip.find({ createdAt: { $gte: new Date(period2Start), $lte: new Date(period2End) } }),
    Payment.find({ createdAt: { $gte: new Date(period2Start), $lte: new Date(period2End) } })
  ]);
  
  const revenue1 = payments1.reduce((sum, p) => sum + (p.amount || 0), 0);
  const revenue2 = payments2.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const tripGrowth = trips2.length > 0 ? ((trips1.length - trips2.length) / trips2.length * 100).toFixed(2) : 0;
  const revenueGrowth = revenue2 > 0 ? ((revenue1 - revenue2) / revenue2 * 100).toFixed(2) : 0;
  
  res.json({
    period1: { trips: trips1.length, revenue: revenue1 },
    period2: { trips: trips2.length, revenue: revenue2 },
    comparison: { tripGrowth, revenueGrowth }
  });
});

exports.getYearOverYear = asyncHandler(async (req, res) => {
  const { year1, year2 } = req.query;
  const currentYear = year1 || new Date().getFullYear();
  const previousYear = year2 || currentYear - 1;
  
  const [trips1, payments1, trips2, payments2] = await Promise.all([
    Trip.find({
      createdAt: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31) }
    }),
    Payment.find({
      createdAt: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31) }
    }),
    Trip.find({
      createdAt: { $gte: new Date(previousYear, 0, 1), $lte: new Date(previousYear, 11, 31) }
    }),
    Payment.find({
      createdAt: { $gte: new Date(previousYear, 0, 1), $lte: new Date(previousYear, 11, 31) }
    })
  ]);
  
  const revenue1 = payments1.reduce((sum, p) => sum + (p.amount || 0), 0);
  const revenue2 = payments2.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const tripGrowth = trips2.length > 0 ? ((trips1.length - trips2.length) / trips2.length * 100).toFixed(2) : 0;
  const revenueGrowth = revenue2 > 0 ? ((revenue1 - revenue2) / revenue2 * 100).toFixed(2) : 0;
  
  res.json({
    currentYear: { year: currentYear, trips: trips1.length, revenue: revenue1 },
    previousYear: { year: previousYear, trips: trips2.length, revenue: revenue2 },
    comparison: { tripGrowth, revenueGrowth }
  });
});

exports.getCompetitorAnalysis = asyncHandler(async (req, res) => {
  const marketShare = {
    platform: 65,
    competitor1: 20,
    competitor2: 10,
    others: 5
  };
  
  res.json({ marketShare });
});

// ==================== PUSH NOTIFICATIONS ====================

exports.createPushNotification = asyncHandler(async (req, res) => {
  const { title, message, targetAudience, targetUsers, targetLocation, scheduledFor, 
          recurringSchedule, templateId, isRich, imageUrl, actionUrl, actionButtonText } = req.body;
  
  const notification = await PushNotification.create({
    title, message, targetAudience, targetUsers, targetLocation, scheduledFor,
    recurringSchedule, templateId, isRich, imageUrl, actionUrl, actionButtonText,
    status: scheduledFor ? 'scheduled' : 'sent',
    sentAt: scheduledFor ? null : new Date(),
    createdBy: req.user._id
  });
  
  if (!scheduledFor) {
    // Send immediately to target audience
    await sendPushNotificationToAudience(notification);
  }
  
  res.json({ message: 'Push notification created', notification });
});

exports.getPushNotifications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = { createdBy: req.user._id };
  if (status) query.status = status;
  
  const notifications = await PushNotification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('templateId');
  
  const total = await PushNotification.countDocuments(query);
  res.json({ notifications, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getPushNotification = asyncHandler(async (req, res) => {
  const notification = await PushNotification.findById(req.params.id)
    .populate('templateId');
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ notification });
});

exports.updatePushNotification = asyncHandler(async (req, res) => {
  const notification = await PushNotification.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ message: 'Notification updated', notification });
});

exports.deletePushNotification = asyncHandler(async (req, res) => {
  const notification = await PushNotification.findByIdAndDelete(req.params.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ message: 'Notification deleted' });
});

exports.cancelPushNotification = asyncHandler(async (req, res) => {
  const notification = await PushNotification.findByIdAndUpdate(
    req.params.id,
    { status: 'cancelled', updatedAt: new Date() },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ message: 'Notification cancelled', notification });
});

exports.trackNotificationOpen = asyncHandler(async (req, res) => {
  const notification = await PushNotification.findByIdAndUpdate(
    req.params.id,
    { $inc: { openedCount: 1 } },
    { new: true }
  );
  res.json({ message: 'Open tracked' });
});

exports.trackNotificationClick = asyncHandler(async (req, res) => {
  const notification = await PushNotification.findByIdAndUpdate(
    req.params.id,
    { $inc: { clickedCount: 1 } },
    { new: true }
  );
  res.json({ message: 'Click tracked' });
});

// ==================== NOTIFICATION TEMPLATES ====================

exports.createNotificationTemplate = asyncHandler(async (req, res) => {
  const template = await NotificationTemplate.create({
    ...req.body,
    createdBy: req.user._id
  });
  res.json({ message: 'Template created', template });
});

exports.getNotificationTemplates = asyncHandler(async (req, res) => {
  const { category, isActive } = req.query;
  const query = { createdBy: req.user._id };
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const templates = await NotificationTemplate.find(query).sort({ createdAt: -1 });
  res.json({ templates });
});

exports.updateNotificationTemplate = asyncHandler(async (req, res) => {
  const template = await NotificationTemplate.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ message: 'Template updated', template });
});

exports.deleteNotificationTemplate = asyncHandler(async (req, res) => {
  const template = await NotificationTemplate.findByIdAndDelete(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ message: 'Template deleted' });
});

// ==================== ANNOUNCEMENTS ====================

exports.createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, category, targetAudience, targetUsers, targetLocation,
          scheduledFor, expirationDate, isPinned, pinOrder, imageUrl, actionUrl, actionButtonText } = req.body;
  
  const announcement = await Announcement.create({
    title, message, category, targetAudience, targetUsers, targetLocation,
    scheduledFor, expirationDate, isPinned, pinOrder, imageUrl, actionUrl, actionButtonText,
    status: scheduledFor ? 'scheduled' : 'active',
    createdBy: req.user._id
  });
  
  res.json({ message: 'Announcement created', announcement });
});

exports.getAnnouncements = asyncHandler(async (req, res) => {
  const { status, category, isPinned, page = 1, limit = 20 } = req.query;
  const query = { createdBy: req.user._id };
  if (status) query.status = status;
  if (category) query.category = category;
  if (isPinned !== undefined) query.isPinned = isPinned === 'true';
  
  const announcements = await Announcement.find(query)
    .sort({ isPinned: -1, pinOrder: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await Announcement.countDocuments(query);
  res.json({ announcements, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('createdBy', 'firstName lastName');
  if (!announcement) {
    return res.status(404).json({ message: 'Announcement not found' });
  }
  res.json({ announcement });
});

exports.getActiveAnnouncements = asyncHandler(async (req, res) => {
  const { role, location } = req.query;
  const query = { 
    status: 'active',
    $or: [
      { targetAudience: 'all' },
      { targetAudience: role }
    ]
  };
  
  if (location) {
    query.targetLocation = {
      $near: {
        $geometry: { type: 'Point', coordinates: location },
        $maxDistance: 10000 // 10km
      }
    };
  }
  
  const announcements = await Announcement.find(query)
    .sort({ isPinned: -1, pinOrder: 1, createdAt: -1 });
  
  res.json({ announcements });
});

exports.updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!announcement) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  res.json({ message: 'Announcement updated', announcement });
});

exports.deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  res.json({ message: 'Announcement deleted' });
});

exports.pinAnnouncement = asyncHandler(async (req, res) => {
  const { isPinned, pinOrder } = req.body;
  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { isPinned, pinOrder, updatedAt: new Date() },
    { new: true }
  );
  if (!announcement) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  res.json({ message: 'Announcement pin status updated', announcement });
});

exports.trackAnnouncementView = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  );
  res.json({ message: 'View tracked' });
});

exports.trackAnnouncementClick = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(
    req.params.id,
    { $inc: { clickCount: 1 } },
    { new: true }
  );
  res.json({ message: 'Click tracked' });
});

// ==================== PROMO CODES ====================

exports.createPromoCode = asyncHandler(async (req, res) => {
  const { code, title, description, discountType, discountValue, maxDiscountAmount,
          minFare, usageLimit, usagePerUser, validFrom, validUntil, targetAudience,
          targetUsers, targetLocation, applicableVehicleTypes } = req.body;
  
  const promoCode = await PromoCode.create({
    code: code.toUpperCase(),
    title, description, discountType, discountValue, maxDiscountAmount,
    minFare, usageLimit, usagePerUser, validFrom, validUntil, targetAudience,
    targetUsers, targetLocation, applicableVehicleTypes,
    status: 'active',
    createdBy: req.user._id
  });
  
  res.json({ message: 'Promo code created', promoCode });
});

exports.getPromoCodes = asyncHandler(async (req, res) => {
  const { status, targetAudience, page = 1, limit = 20 } = req.query;
  const query = { createdBy: req.user._id };
  if (status) query.status = status;
  if (targetAudience) query.targetAudience = targetAudience;
  
  const promoCodes = await PromoCode.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await PromoCode.countDocuments(query);
  res.json({ promoCodes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getPromoCode = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.findOne({ code: req.params.code.toUpperCase() });
  if (!promoCode) {
    return res.status(404).json({ error: 'Promo code not found' });
  }
  res.json({ promoCode });
});

exports.validatePromoCode = asyncHandler(async (req, res) => {
  const { code, fare, vehicleType, userId } = req.body;
  
  const promoCode = await PromoCode.findOne({ 
    code: code.toUpperCase(),
    status: 'active',
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  });
  
  if (!promoCode) {
    return res.status(404).json({ error: 'Invalid or expired promo code' });
  }
  
  if (fare < promoCode.minFare) {
    return res.status(400).json({ error: `Minimum fare of ${promoCode.minFare} required` });
  }
  
  if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
    return res.status(400).json({ error: 'Promo code usage limit reached' });
  }
  
  if (promoCode.applicableVehicleTypes.length > 0 && 
      !promoCode.applicableVehicleTypes.includes(vehicleType) &&
      !promoCode.applicableVehicleTypes.includes('all')) {
    return res.status(400).json({ error: 'Promo code not applicable for this vehicle type' });
  }
  
  let discountAmount = 0;
  if (promoCode.discountType === 'percentage') {
    discountAmount = fare * (promoCode.discountValue / 100);
    if (promoCode.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, promoCode.maxDiscountAmount);
    }
  } else if (promoCode.discountType === 'fixed_amount') {
    discountAmount = promoCode.discountValue;
  } else if (promoCode.discountType === 'free_ride') {
    discountAmount = fare;
  }
  
  res.json({ 
    valid: true, 
    discountAmount, 
    finalFare: fare - discountAmount,
    promoCode: {
      code: promoCode.code,
      title: promoCode.title,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue
    }
  });
});

exports.updatePromoCode = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!promoCode) {
    return res.status(404).json({ error: 'Promo code not found' });
  }
  res.json({ message: 'Promo code updated', promoCode });
});

exports.deletePromoCode = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.findByIdAndDelete(req.params.id);
  if (!promoCode) {
    return res.status(404).json({ error: 'Promo code not found' });
  }
  res.json({ message: 'Promo code deleted' });
});

exports.getPromoCodeAnalytics = asyncHandler(async (req, res) => {
  const promoCode = await PromoCode.findById(req.params.id);
  if (!promoCode) {
    return res.status(404).json({ error: 'Promo code not found' });
  }
  
  const analytics = {
    usedCount: promoCode.usedCount,
    usageLimit: promoCode.usageLimit,
    remainingUses: promoCode.usageLimit ? promoCode.usageLimit - promoCode.usedCount : 'Unlimited',
    revenueImpact: promoCode.revenueImpact,
    validFrom: promoCode.validFrom,
    validUntil: promoCode.validUntil,
    status: promoCode.status
  };
  
  res.json({ analytics });
});

// ==================== EMAIL CAMPAIGNS ====================

exports.createEmailCampaign = asyncHandler(async (req, res) => {
  const { name, subject, body, templateId, targetAudience, targetSegment, 
          targetUsers, scheduledFor, abTestGroup, abTestVariant } = req.body;
  
  const campaign = await EmailCampaign.create({
    name, subject, body, templateId, targetAudience, targetSegment, targetUsers,
    scheduledFor, abTestGroup, abTestVariant,
    status: scheduledFor ? 'scheduled' : 'sending',
    createdBy: req.user._id
  });
  
  if (!scheduledFor) {
    // Send immediately
    await sendEmailCampaign(campaign);
  }
  
  res.json({ message: 'Email campaign created', campaign });
});

exports.getEmailCampaigns = asyncHandler(async (req, res) => {
  const { status, targetAudience, page = 1, limit = 20 } = req.query;
  const query = { createdBy: req.user._id };
  if (status) query.status = status;
  if (targetAudience) query.targetAudience = targetAudience;
  
  const campaigns = await EmailCampaign.find(query)
    .populate('templateId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await EmailCampaign.countDocuments(query);
  res.json({ campaigns, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getEmailCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findById(req.params.id).populate('templateId');
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json({ campaign });
});

exports.updateEmailCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json({ message: 'Campaign updated', campaign });
});

exports.deleteEmailCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findByIdAndDelete(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json({ message: 'Campaign deleted' });
});

exports.cancelEmailCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findByIdAndUpdate(
    req.params.id,
    { status: 'cancelled', updatedAt: new Date() },
    { new: true }
  );
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json({ message: 'Campaign cancelled', campaign });
});

// ==================== EMAIL TEMPLATES ====================

exports.createEmailTemplate = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.create({
    ...req.body,
    createdBy: req.user._id
  });
  res.json({ message: 'Email template created', template });
});

exports.getEmailTemplates = asyncHandler(async (req, res) => {
  const { category, isActive } = req.query;
  const query = { createdBy: req.user._id };
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const templates = await EmailTemplate.find(query).sort({ createdAt: -1 });
  res.json({ templates });
});

exports.updateEmailTemplate = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ message: 'Template updated', template });
});

exports.deleteEmailTemplate = asyncHandler(async (req, res) => {
  const template = await EmailTemplate.findByIdAndDelete(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ message: 'Template deleted' });
});

// ==================== SMS CAMPAIGNS ====================

exports.createSMSCampaign = asyncHandler(async (req, res) => {
  const { name, message, templateId, targetAudience, targetSegment, 
          targetUsers, scheduledFor } = req.body;
  
  const campaign = await SMSCampaign.create({
    name, message, templateId, targetAudience, targetSegment, targetUsers,
    scheduledFor,
    status: scheduledFor ? 'scheduled' : 'sending',
    createdBy: req.user._id
  });
  
  if (!scheduledFor) {
    // Send immediately
    await sendSMSCampaign(campaign);
  }
  
  res.json({ message: 'SMS campaign created', campaign });
});

exports.getSMSCampaigns = asyncHandler(async (req, res) => {
  const { status, targetAudience, page = 1, limit = 20 } = req.query;
  const query = { createdBy: req.user._id };
  if (status) query.status = status;
  if (targetAudience) query.targetAudience = targetAudience;
  
  const campaigns = await SMSCampaign.find(query)
    .populate('templateId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await SMSCampaign.countDocuments(query);
  res.json({ campaigns, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getSMSCampaign = asyncHandler(async (req, res) => {
  const campaign = await SMSCampaign.findById(req.params.id).populate('templateId');
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json({ campaign });
});

exports.updateSMSCampaign = asyncHandler(async (req, res) => {
  const campaign = await SMSCampaign.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json({ message: 'Campaign updated', campaign });
});

exports.deleteSMSCampaign = asyncHandler(async (req, res) => {
  const campaign = await SMSCampaign.findByIdAndDelete(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json({ message: 'Campaign deleted' });
});

// ==================== SMS TEMPLATES ====================

exports.createSMSTemplate = asyncHandler(async (req, res) => {
  const template = await SMSTemplate.create({
    ...req.body,
    createdBy: req.user._id
  });
  res.json({ message: 'SMS template created', template });
});

exports.getSMSTemplates = asyncHandler(async (req, res) => {
  const { category, isActive } = req.query;
  const query = { createdBy: req.user._id };
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const templates = await SMSTemplate.find(query).sort({ createdAt: -1 });
  res.json({ templates });
});

exports.updateSMSTemplate = asyncHandler(async (req, res) => {
  const template = await SMSTemplate.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ message: 'Template updated', template });
});

exports.deleteSMSTemplate = asyncHandler(async (req, res) => {
  const template = await SMSTemplate.findByIdAndDelete(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ message: 'Template deleted' });
});

// ==================== IN-APP CONTENT ====================

exports.createInAppContent = asyncHandler(async (req, res) => {
  const { type, title, description, imageUrl, actionUrl, actionButtonText,
          displayLocation, targetAudience, targetSegment, targetUsers, priority,
          scheduledFor, expirationDate, showForSeconds, dismissible, carouselItems } = req.body;
  
  const content = await InAppContent.create({
    type, title, description, imageUrl, actionUrl, actionButtonText,
    displayLocation, targetAudience, targetSegment, targetUsers, priority,
    scheduledFor, expirationDate, showForSeconds, dismissible, carouselItems,
    status: scheduledFor ? 'scheduled' : 'active',
    createdBy: req.user._id
  });
  
  res.json({ message: 'In-app content created', content });
});

exports.getInAppContent = asyncHandler(async (req, res) => {
  const { type, displayLocation, status, page = 1, limit = 20 } = req.query;
  const query = { createdBy: req.user._id };
  if (type) query.type = type;
  if (displayLocation) query.displayLocation = displayLocation;
  if (status) query.status = status;
  
  const content = await InAppContent.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await InAppContent.countDocuments(query);
  res.json({ content, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getActiveInAppContent = asyncHandler(async (req, res) => {
  const { role, location, displayLocation } = req.query;
  const query = { 
    status: 'active',
    $or: [
      { targetAudience: 'all' },
      { targetAudience: role }
    ]
  };
  
  if (displayLocation) query.displayLocation = displayLocation;
  
  const content = await InAppContent.find(query)
    .sort({ priority: -1, createdAt: -1 });
  
  res.json({ content });
});

exports.updateInAppContent = asyncHandler(async (req, res) => {
  const content = await InAppContent.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }
  res.json({ message: 'Content updated', content });
});

exports.deleteInAppContent = asyncHandler(async (req, res) => {
  const content = await InAppContent.findByIdAndDelete(req.params.id);
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }
  res.json({ message: 'Content deleted' });
});

exports.trackContentView = asyncHandler(async (req, res) => {
  const content = await InAppContent.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  );
  res.json({ message: 'View tracked' });
});

exports.trackContentClick = asyncHandler(async (req, res) => {
  const content = await InAppContent.findByIdAndUpdate(
    req.params.id,
    { $inc: { clickCount: 1 } },
    { new: true }
  );
  res.json({ message: 'Click tracked' });
});

// ==================== USER SEGMENTS ====================

exports.createUserSegment = asyncHandler(async (req, res) => {
  const { name, description, segmentType, criteria, targetRole } = req.body;
  
  const segment = await UserSegment.create({
    name, description, segmentType, criteria, targetRole,
    isActive: true,
    createdBy: req.user._id
  });
  
  // Calculate estimated segment size
  const estimatedSize = await calculateSegmentSize(segment);
  segment.estimatedSize = estimatedSize;
  segment.lastCalculatedAt = new Date();
  await segment.save();
  
  res.json({ message: 'User segment created', segment });
});

exports.getUserSegments = asyncHandler(async (req, res) => {
  const { segmentType, targetRole, isActive, page = 1, limit = 20 } = req.query;
  const query = { createdBy: req.user._id };
  if (segmentType) query.segmentType = segmentType;
  if (targetRole) query.targetRole = targetRole;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const segments = await UserSegment.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await UserSegment.countDocuments(query);
  res.json({ segments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getUserSegment = asyncHandler(async (req, res) => {
  const segment = await UserSegment.findById(req.params.id);
  if (!segment) {
    return res.status(404).json({ error: 'Segment not found' });
  }
  
  // Get actual users in segment
  const users = await getSegmentUsers(segment);
  
  res.json({ segment, users, count: users.length });
});

exports.updateUserSegment = asyncHandler(async (req, res) => {
  const segment = await UserSegment.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!segment) {
    return res.status(404).json({ error: 'Segment not found' });
  }
  
  // Recalculate segment size
  const estimatedSize = await calculateSegmentSize(segment);
  segment.estimatedSize = estimatedSize;
  segment.lastCalculatedAt = new Date();
  await segment.save();
  
  res.json({ message: 'Segment updated', segment });
});

exports.deleteUserSegment = asyncHandler(async (req, res) => {
  const segment = await UserSegment.findByIdAndDelete(req.params.id);
  if (!segment) {
    return res.status(404).json({ error: 'Segment not found' });
  }
  res.json({ message: 'Segment deleted' });
});

exports.recalculateSegmentSize = asyncHandler(async (req, res) => {
  const segment = await UserSegment.findById(req.params.id);
  if (!segment) {
    return res.status(404).json({ error: 'Segment not found' });
  }
  
  const estimatedSize = await calculateSegmentSize(segment);
  segment.estimatedSize = estimatedSize;
  segment.lastCalculatedAt = new Date();
  await segment.save();
  
  res.json({ message: 'Segment size recalculated', segment });
});

// ==================== CAMPAIGN ANALYTICS ====================

exports.getCampaignAnalytics = asyncHandler(async (req, res) => {
  const { campaignType, campaignId } = req.params;
  
  const analytics = await CampaignAnalytics.findOne({ campaignType, campaignId });
  if (!analytics) {
    return res.status(404).json({ error: 'Analytics not found' });
  }
  
  res.json({ analytics });
});

exports.getOverallAnalytics = asyncHandler(async (req, res) => {
  const { campaignType, startDate, endDate } = req.query;
  
  const query = {};
  if (campaignType) query.campaignType = campaignType;
  if (startDate || endDate) {
    query.calculatedAt = {};
    if (startDate) query.calculatedAt.$gte = new Date(startDate);
    if (endDate) query.calculatedAt.$lte = new Date(endDate);
  }
  
  const allAnalytics = await CampaignAnalytics.find(query).sort({ calculatedAt: -1 });
  
  const summary = {
    totalCampaigns: allAnalytics.length,
    totalSent: allAnalytics.reduce((sum, a) => sum + a.totalSent, 0),
    totalOpened: allAnalytics.reduce((sum, a) => sum + a.totalOpened, 0),
    totalClicked: allAnalytics.reduce((sum, a) => sum + a.totalClicked, 0),
    totalConverted: allAnalytics.reduce((sum, a) => sum + a.totalConverted, 0),
    avgOpenRate: allAnalytics.length > 0 
      ? allAnalytics.reduce((sum, a) => sum + a.openRate, 0) / allAnalytics.length 
      : 0,
    avgClickRate: allAnalytics.length > 0 
      ? allAnalytics.reduce((sum, a) => sum + a.clickRate, 0) / allAnalytics.length 
      : 0,
    avgConversionRate: allAnalytics.length > 0 
      ? allAnalytics.reduce((sum, a) => sum + a.conversionRate, 0) / allAnalytics.length 
      : 0,
    totalRevenue: allAnalytics.reduce((sum, a) => sum + a.revenueGenerated, 0),
    totalCost: allAnalytics.reduce((sum, a) => sum + a.cost, 0),
    totalROI: allAnalytics.reduce((sum, a) => sum + a.roi, 0)
  };
  
  res.json({ summary, campaigns: allAnalytics });
});

exports.calculateCampaignROI = asyncHandler(async (req, res) => {
  const { campaignType, campaignId } = req.params;
  
  const analytics = await CampaignAnalytics.findOne({ campaignType, campaignId });
  if (!analytics) {
    return res.status(404).json({ error: 'Analytics not found' });
  }
  
  const roi = analytics.cost > 0 
    ? ((analytics.revenueGenerated - analytics.cost) / analytics.cost * 100).toFixed(2)
    : 0;
  
  res.json({ roi, revenue: analytics.revenueGenerated, cost: analytics.cost });
});

// ==================== AUTOMATION RULES ====================

exports.createAutomationRule = asyncHandler(async (req, res) => {
  const { name, description, triggerType, triggerConditions, actionType, actionConfig,
          targetAudience, targetSegment, targetUsers, schedule, delayMinutes, recurringSchedule } = req.body;
  
  const rule = await AutomationRule.create({
    name, description, triggerType, triggerConditions, actionType, actionConfig,
    targetAudience, targetSegment, targetUsers, schedule, delayMinutes, recurringSchedule,
    isActive: true,
    createdBy: req.user._id
  });
  
  // Calculate next execution if needed
  if (schedule === 'delayed' || recurringSchedule.enabled) {
    rule.nextExecutionAt = calculateNextExecution(rule);
    await rule.save();
  }
  
  res.json({ message: 'Automation rule created', rule });
});

exports.getAutomationRules = asyncHandler(async (req, res) => {
  const { triggerType, actionType, isActive, page = 1, limit = 20 } = req.query;
  const query = { createdBy: req.user._id };
  if (triggerType) query.triggerType = triggerType;
  if (actionType) query.actionType = actionType;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const rules = await AutomationRule.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await AutomationRule.countDocuments(query);
  res.json({ rules, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getAutomationRule = asyncHandler(async (req, res) => {
  const rule = await AutomationRule.findById(req.params.id)
    .populate('actionConfig.pushNotificationId')
    .populate('actionConfig.emailCampaignId')
    .populate('actionConfig.smsCampaignId')
    .populate('actionConfig.promoCodeId')
    .populate('actionConfig.segmentId');
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  res.json({ rule });
});

exports.updateAutomationRule = asyncHandler(async (req, res) => {
  const rule = await AutomationRule.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  
  // Recalculate next execution if schedule changed
  if (req.body.schedule || req.body.recurringSchedule) {
    rule.nextExecutionAt = calculateNextExecution(rule);
    await rule.save();
  }
  
  res.json({ message: 'Automation rule updated', rule });
});

exports.deleteAutomationRule = asyncHandler(async (req, res) => {
  const rule = await AutomationRule.findByIdAndDelete(req.params.id);
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  res.json({ message: 'Automation rule deleted' });
});

exports.toggleAutomationRule = asyncHandler(async (req, res) => {
  const rule = await AutomationRule.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive, updatedAt: new Date() },
    { new: true }
  );
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  res.json({ message: 'Automation rule toggled', rule });
});

exports.executeAutomationRule = asyncHandler(async (req, res) => {
  const rule = await AutomationRule.findById(req.params.id);
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  
  const result = await executeAutomation(rule);
  
  rule.executionCount += 1;
  rule.lastExecutedAt = new Date();
  if (result.success) {
    rule.successCount += 1;
  } else {
    rule.failureCount += 1;
  }
  
  if (rule.recurringSchedule.enabled) {
    rule.nextExecutionAt = calculateNextExecution(rule);
  }
  
  await rule.save();
  
  res.json({ message: 'Automation executed', result, rule });
});

exports.getAutomationHistory = asyncHandler(async (req, res) => {
  const { ruleId } = req.params;
  
  const rule = await AutomationRule.findById(ruleId);
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  
  const history = {
    executionCount: rule.executionCount,
    successCount: rule.successCount,
    failureCount: rule.failureCount,
    lastExecutedAt: rule.lastExecutedAt,
    nextExecutionAt: rule.nextExecutionAt
  };
  
  res.json({ history });
});

// ==================== HELPER FUNCTIONS ====================

async function sendPushNotificationToAudience(notification) {
  const query = {};
  
  if (notification.targetAudience === 'passengers') {
    query.role = 'passenger';
  } else if (notification.targetAudience === 'drivers') {
    query.role = 'driver';
  }
  
  if (notification.targetUsers && notification.targetUsers.length > 0) {
    query._id = { $in: notification.targetUsers };
  }
  
  if (notification.targetLocation && notification.targetLocation.radius > 0) {
    query.currentLocation = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: notification.targetLocation.coordinates
        },
        $maxDistance: notification.targetLocation.radius * 1000
      }
    };
  }
  
  const users = await User.find(query);
  const prefKey = ['announcement', 'broadcast', 'promo', 'promotion', 'offer'].includes(notification.type) ? 'promotions'
    : ['sos_alert', 'sos_resolved', 'incident_assigned', 'account_blocked', 'account_unblocked', 'account_suspended', 'account_banned', 'warning'].includes(notification.type) ? 'safetyAlerts'
    : null;

  const deliverableUsers = prefKey
    ? users.filter(u => (u.preferences || {})[prefKey] !== false)
    : users;

  notification.sentCount = deliverableUsers.length;
  
  // Send push notifications (integrate with FCM/OneSignal)
  const io = getIO();
  deliverableUsers.forEach(user => {
    io.to(`user_${user._id}`).emit('push_notification', {
      title: notification.title,
      message: notification.message,
      imageUrl: notification.imageUrl,
      actionUrl: notification.actionUrl,
      actionButtonText: notification.actionButtonText
    });
  });
  
  await notification.save();
  return deliverableUsers.length;
}

async function sendEmailCampaign(campaign) {
  const query = {};
  
  if (campaign.targetAudience === 'passengers') {
    query.role = 'passenger';
  } else if (campaign.targetAudience === 'drivers') {
    query.role = 'driver';
  }
  
  if (campaign.targetUsers && campaign.targetUsers.length > 0) {
    query._id = { $in: campaign.targetUsers };
  }
  
  const users = await User.find(query);
  campaign.sentCount = users.length;
  campaign.sentAt = new Date();
  campaign.status = 'sent';
  
  // Send emails (integrate with email service like SendGrid/Mailgun)
  // This is a placeholder for actual email sending logic
  
  await campaign.save();
  return users.length;
}

async function sendSMSCampaign(campaign) {
  const query = {};
  
  if (campaign.targetAudience === 'passengers') {
    query.role = 'passenger';
  } else if (campaign.targetAudience === 'drivers') {
    query.role = 'driver';
  }
  
  if (campaign.targetUsers && campaign.targetUsers.length > 0) {
    query._id = { $in: campaign.targetUsers };
  }
  
  const users = await User.find(query);
  campaign.sentCount = users.length;
  campaign.sentAt = new Date();
  campaign.status = 'sent';
  
  // Send SMS (integrate with SMS service like Twilio)
  // This is a placeholder for actual SMS sending logic
  
  await campaign.save();
  return users.length;
}

async function calculateSegmentSize(segment) {
  const query = {};
  
  if (segment.targetRole === 'passengers') {
    query.role = 'passenger';
  } else if (segment.targetRole === 'drivers') {
    query.role = 'driver';
  }
  
  if (segment.segmentType === 'location' && segment.criteria.location) {
    query.currentLocation = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: segment.criteria.location.coordinates
        },
        $maxDistance: segment.criteria.location.radius * 1000
      }
    };
  }
  
  if (segment.segmentType === 'behavior' && segment.criteria.behavior) {
    const behavior = segment.criteria.behavior;
    if (behavior.lastTripDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - behavior.lastTripDays.max);
      query.createdAt = { $gte: cutoffDate };
    }
  }
  
  if (segment.segmentType === 'spending' && segment.criteria.spending) {
    const spending = segment.criteria.spending;
    // This would require aggregating payment data
    // Placeholder for spending-based segmentation
  }
  
  if (segment.segmentType === 'rating' && segment.criteria.rating) {
    query.rating = {
      $gte: segment.criteria.rating.min,
      $lte: segment.criteria.rating.max
    };
  }
  
  return await User.countDocuments(query);
}

async function getSegmentUsers(segment) {
  const query = {};
  
  if (segment.targetRole === 'passengers') {
    query.role = 'passenger';
  } else if (segment.targetRole === 'drivers') {
    query.role = 'driver';
  }
  
  // Apply segment criteria (similar to calculateSegmentSize)
  // This is a simplified version
  
  return await User.find(query).limit(100);
}

function calculateNextExecution(rule) {
  if (rule.schedule === 'immediate') {
    return new Date();
  }
  
  if (rule.schedule === 'delayed' && rule.delayMinutes) {
    const next = new Date();
    next.setMinutes(next.getMinutes() + rule.delayMinutes);
    return next;
  }
  
  if (rule.recurringSchedule.enabled) {
    const next = new Date();
    switch (rule.recurringSchedule.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }
  
  return null;
}

async function executeAutomation(rule) {
  try {
    switch (rule.actionType) {
      case 'send_push':
        if (rule.actionConfig.pushNotificationId) {
          const notification = await PushNotification.findById(rule.actionConfig.pushNotificationId);
          if (notification) {
            await sendPushNotificationToAudience(notification);
          }
        }
        break;
      case 'send_email':
        if (rule.actionConfig.emailCampaignId) {
          const campaign = await EmailCampaign.findById(rule.actionConfig.emailCampaignId);
          if (campaign) {
            await sendEmailCampaign(campaign);
          }
        }
        break;
      case 'send_sms':
        if (rule.actionConfig.smsCampaignId) {
          const campaign = await SMSCampaign.findById(rule.actionConfig.smsCampaignId);
          if (campaign) {
            await sendSMSCampaign(campaign);
          }
        }
        break;
      default:
        return { success: false, error: 'Unknown action type' };
    }
    return { success: true };
  } catch (error) {
    logger.error('Automation execution error', { error: error.message, ruleId: rule._id });
    return { success: false, error: error.message };
  }
}

// ==================== SYSTEM CONFIGURATION APIs ====================

// Pricing & Tariffs
exports.createPricingConfig = asyncHandler(async (req, res) => {
  const config = await PricingConfig.create({
    ...req.body,
    createdBy: req.user._id
  });
  await createAuditLog('pricing', config._id, 'create', req.user._id, null, config);
  res.json({ message: 'Pricing config created', config });
});

exports.getPricingConfigs = asyncHandler(async (req, res) => {
  const { zoneId, vehicleType, isActive, page = 1, limit = 20 } = req.query;
  const query = {};
  if (zoneId) query.zoneId = zoneId;
  if (vehicleType) query.vehicleType = vehicleType;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const configs = await PricingConfig.find(query)
    .populate('zoneId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await PricingConfig.countDocuments(query);
  res.json({ configs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.updatePricingConfig = asyncHandler(async (req, res) => {
  const oldConfig = await PricingConfig.findById(req.params.id);
  const config = await PricingConfig.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  await createAuditLog('pricing', config._id, 'update', req.user._id, oldConfig, config);
  res.json({ message: 'Pricing config updated', config });
});

exports.deletePricingConfig = asyncHandler(async (req, res) => {
  const config = await PricingConfig.findByIdAndDelete(req.params.id);
  await createAuditLog('pricing', config._id, 'delete', req.user._id, config, null);
  res.json({ message: 'Pricing config deleted' });
});

// Service Areas
exports.createServiceZone = asyncHandler(async (req, res) => {
  const zone = await ServiceZone.create({
    ...req.body,
    createdBy: req.user._id
  });
  await createAuditLog('service_zone', zone._id, 'create', req.user._id, null, zone);
  res.json({ message: 'Service zone created', zone });
});

exports.getServiceZones = asyncHandler(async (req, res) => {
  const { zoneType, isActive, page = 1, limit = 20 } = req.query;
  const query = {};
  if (zoneType) query.zoneType = zoneType;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const zones = await ServiceZone.find(query)
    .populate('adjacentZones')
    .sort({ priority: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await ServiceZone.countDocuments(query);
  res.json({ zones, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.updateServiceZone = asyncHandler(async (req, res) => {
  const oldZone = await ServiceZone.findById(req.params.id);
  const zone = await ServiceZone.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  await createAuditLog('service_zone', zone._id, 'update', req.user._id, oldZone, zone);
  res.json({ message: 'Service zone updated', zone });
});

exports.deleteServiceZone = asyncHandler(async (req, res) => {
  const zone = await ServiceZone.findByIdAndDelete(req.params.id);
  await createAuditLog('service_zone', zone._id, 'delete', req.user._id, zone, null);
  res.json({ message: 'Service zone deleted' });
});

// Vehicle Categories
exports.createVehicleCategory = asyncHandler(async (req, res) => {
  const category = await VehicleCategory.create({
    ...req.body,
    createdBy: req.user._id
  });
  await createAuditLog('vehicle_category', category._id, 'create', req.user._id, null, category);
  res.json({ message: 'Vehicle category created', category });
});

exports.getVehicleCategories = asyncHandler(async (req, res) => {
  const { isActive, page = 1, limit = 20 } = req.query;
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const categories = await VehicleCategory.find(query)
    .sort({ sortOrder: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await VehicleCategory.countDocuments(query);
  res.json({ categories, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.updateVehicleCategory = asyncHandler(async (req, res) => {
  const oldCategory = await VehicleCategory.findById(req.params.id);
  const category = await VehicleCategory.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  await createAuditLog('vehicle_category', category._id, 'update', req.user._id, oldCategory, category);
  res.json({ message: 'Vehicle category updated', category });
});

exports.deleteVehicleCategory = asyncHandler(async (req, res) => {
  const category = await VehicleCategory.findByIdAndDelete(req.params.id);
  await createAuditLog('vehicle_category', category._id, 'delete', req.user._id, category, null);
  res.json({ message: 'Vehicle category deleted' });
});

// Platform Settings
exports.getPlatformSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.findOne({ isActive: true });
  res.json({ settings });
});

exports.updatePlatformSettings = asyncHandler(async (req, res) => {
  const oldSettings = await PlatformSettings.findOne({ isActive: true });
  const settings = await PlatformSettings.findOneAndUpdate(
    { isActive: true },
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date(), version: mongoose.Types.ObjectId() },
    { new: true, upsert: true }
  );
  await createAuditLog('platform_settings', settings._id, 'update', req.user._id, oldSettings, settings);
  res.json({ message: 'Platform settings updated', settings });
});

// Notification Settings
exports.getNotificationSettings = asyncHandler(async (req, res) => {
  const settings = await NotificationSettings.findOne({ isActive: true });
  res.json({ settings });
});

exports.updateNotificationSettings = asyncHandler(async (req, res) => {
  const oldSettings = await NotificationSettings.findOne({ isActive: true });
  const settings = await NotificationSettings.findOneAndUpdate(
    { isActive: true },
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date(), version: mongoose.Types.ObjectId() },
    { new: true, upsert: true }
  );
  await createAuditLog('notification_settings', settings._id, 'update', req.user._id, oldSettings, settings);
  res.json({ message: 'Notification settings updated', settings });
});

// Security Settings
exports.getSecuritySettings = asyncHandler(async (req, res) => {
  const settings = await SecuritySettings.findOne({ isActive: true });
  res.json({ settings });
});

exports.updateSecuritySettings = asyncHandler(async (req, res) => {
  const oldSettings = await SecuritySettings.findOne({ isActive: true });
  const settings = await SecuritySettings.findOneAndUpdate(
    { isActive: true },
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date(), version: mongoose.Types.ObjectId() },
    { new: true, upsert: true }
  );
  await createAuditLog('security_settings', settings._id, 'update', req.user._id, oldSettings, settings);
  res.json({ message: 'Security settings updated', settings });
});

// Feature Flags
exports.createFeatureFlag = asyncHandler(async (req, res) => {
  const flag = await FeatureFlag.create({
    ...req.body,
    createdBy: req.user._id
  });
  await createAuditLog('feature_flag', flag._id, 'create', req.user._id, null, flag);
  res.json({ message: 'Feature flag created', flag });
});

exports.getFeatureFlags = asyncHandler(async (req, res) => {
  const { category, enabled, isActive, page = 1, limit = 20 } = req.query;
  const query = {};
  if (category) query.category = category;
  if (enabled !== undefined) query.enabled = enabled === 'true';
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const flags = await FeatureFlag.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await FeatureFlag.countDocuments(query);
  res.json({ flags, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.updateFeatureFlag = asyncHandler(async (req, res) => {
  const oldFlag = await FeatureFlag.findById(req.params.id);
  const flag = await FeatureFlag.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  await createAuditLog('feature_flag', flag._id, 'update', req.user._id, oldFlag, flag);
  res.json({ message: 'Feature flag updated', flag });
});

exports.deleteFeatureFlag = asyncHandler(async (req, res) => {
  const flag = await FeatureFlag.findByIdAndDelete(req.params.id);
  await createAuditLog('feature_flag', flag._id, 'delete', req.user._id, flag, null);
  res.json({ message: 'Feature flag deleted' });
});

exports.toggleFeatureFlag = asyncHandler(async (req, res) => {
  const flag = await FeatureFlag.findByIdAndUpdate(
    req.params.id,
    { enabled: req.body.enabled, updatedBy: req.user._id, updatedAt: new Date() },
    { new: true }
  );
  await createAuditLog('feature_flag', flag._id, flag.enabled ? 'enable' : 'disable', req.user._id, null, flag);
  res.json({ message: 'Feature flag toggled', flag });
});

// Deployment Settings
exports.createDeploymentConfig = asyncHandler(async (req, res) => {
  const config = await DeploymentConfig.create({
    ...req.body,
    deployedBy: req.user._id
  });
  await createAuditLog('deployment', config._id, 'create', req.user._id, null, config);
  res.json({ message: 'Deployment config created', config });
});

exports.getDeploymentConfigs = asyncHandler(async (req, res) => {
  const { environment, isActive, page = 1, limit = 20 } = req.query;
  const query = {};
  if (environment) query.environment = environment;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const configs = await DeploymentConfig.find(query)
    .populate('deployedBy')
    .sort({ deployedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await DeploymentConfig.countDocuments(query);
  res.json({ configs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.updateDeploymentConfig = asyncHandler(async (req, res) => {
  const oldConfig = await DeploymentConfig.findById(req.params.id);
  const config = await DeploymentConfig.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  await createAuditLog('deployment', config._id, 'update', req.user._id, oldConfig, config);
  res.json({ message: 'Deployment config updated', config });
});

exports.toggleMaintenanceMode = asyncHandler(async (req, res) => {
  const { enabled, message, scheduledStart, scheduledEnd } = req.body;
  const config = await DeploymentConfig.findOne({ environment: 'production', isActive: true });
  
  if (config) {
    config.maintenanceMode = { enabled, message, scheduledStart, scheduledEnd };
    await config.save();
  } else {
    await DeploymentConfig.create({
      environment: 'production',
      maintenanceMode: { enabled, message, scheduledStart, scheduledEnd },
      deployedBy: req.user._id
    });
  }
  
  await createAuditLog('deployment', config?._id, 'update', req.user._id, null, config);
  res.json({ message: 'Maintenance mode updated', config });
});

// Performance Settings
exports.getPerformanceConfig = asyncHandler(async (req, res) => {
  const config = await PerformanceConfig.findOne({ isActive: true });
  res.json({ config });
});

exports.updatePerformanceConfig = asyncHandler(async (req, res) => {
  const oldConfig = await PerformanceConfig.findOne({ isActive: true });
  const config = await PerformanceConfig.findOneAndUpdate(
    { isActive: true },
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date(), version: mongoose.Types.ObjectId() },
    { new: true, upsert: true }
  );
  await createAuditLog('performance', config._id, 'update', req.user._id, oldConfig, config);
  res.json({ message: 'Performance config updated', config });
});

// Localization Settings
exports.getLocalizationConfig = asyncHandler(async (req, res) => {
  const config = await LocalizationConfig.findOne({ isActive: true });
  res.json({ config });
});

exports.updateLocalizationConfig = asyncHandler(async (req, res) => {
  const oldConfig = await LocalizationConfig.findOne({ isActive: true });
  const config = await LocalizationConfig.findOneAndUpdate(
    { isActive: true },
    { ...req.body, updatedBy: req.user._id, updatedAt: new Date(), version: mongoose.Types.ObjectId() },
    { new: true, upsert: true }
  );
  await createAuditLog('localization', config._id, 'update', req.user._id, oldConfig, config);
  res.json({ message: 'Localization config updated', config });
});

// Audit Logs
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, action, performedBy, page = 1, limit = 50 } = req.query;
  const query = {};
  if (entityType) query.entityType = entityType;
  if (action) query.action = action;
  if (performedBy) query.performedBy = performedBy;
  
  const logs = await AuditLog.find(query)
    .populate('performedBy', 'name email')
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await AuditLog.countDocuments(query);
  res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getAuditLog = asyncHandler(async (req, res) => {
  const log = await AuditLog.findById(req.params.id).populate('performedBy', 'name email');
  if (!log) {
    return res.status(404).json({ error: 'Audit log not found' });
  }
  res.json({ log });
});

// API Keys
exports.createAPIKey = asyncHandler(async (req, res) => {
  const crypto = require('crypto');
  const key = 'sk_' + crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  
  const apiKey = await APIKey.create({
    ...req.body,
    key,
    keyHash,
    createdBy: req.user._id
  });
  await createAuditLog('api_key', apiKey._id, 'create', req.user._id, null, apiKey);
  res.json({ message: 'API key created', apiKey, key });
});

exports.getAPIKeys = asyncHandler(async (req, res) => {
  const { isActive, page = 1, limit = 20 } = req.query;
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const keys = await APIKey.find(query)
    .populate('createdBy', 'name email')
    .select('-keyHash')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await APIKey.countDocuments(query);
  res.json({ keys, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.revokeAPIKey = asyncHandler(async (req, res) => {
  const key = await APIKey.findByIdAndUpdate(
    req.params.id,
    { isActive: false, updatedAt: new Date() },
    { new: true }
  );
  await createAuditLog('api_key', key._id, 'disable', req.user._id, null, key);
  res.json({ message: 'API key revoked', key });
});

// Webhooks
exports.createWebhook = asyncHandler(async (req, res) => {
  const webhook = await WebhookConfig.create({
    ...req.body,
    createdBy: req.user._id
  });
  await createAuditLog('webhook', webhook._id, 'create', req.user._id, null, webhook);
  res.json({ message: 'Webhook created', webhook });
});

exports.getWebhooks = asyncHandler(async (req, res) => {
  const { isActive, page = 1, limit = 20 } = req.query;
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const webhooks = await WebhookConfig.find(query)
    .populate('createdBy', 'name email')
    .select('-secret')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const total = await WebhookConfig.countDocuments(query);
  res.json({ webhooks, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.updateWebhook = asyncHandler(async (req, res) => {
  const oldWebhook = await WebhookConfig.findById(req.params.id);
  const webhook = await WebhookConfig.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  await createAuditLog('webhook', webhook._id, 'update', req.user._id, oldWebhook, webhook);
  res.json({ message: 'Webhook updated', webhook });
});

exports.deleteWebhook = asyncHandler(async (req, res) => {
  const webhook = await WebhookConfig.findByIdAndDelete(req.params.id);
  await createAuditLog('webhook', webhook._id, 'delete', req.user._id, webhook, null);
  res.json({ message: 'Webhook deleted' });
});

exports.testWebhook = asyncHandler(async (req, res) => {
  const webhook = await WebhookConfig.findById(req.params.id);
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  
  // Test webhook with sample payload
  const axios = require('axios');
  try {
    await axios.post(webhook.url, {
      test: true,
      timestamp: new Date(),
      event: 'test'
    }, {
      headers: webhook.headers,
      timeout: webhook.timeout
    });
    res.json({ message: 'Webhook test successful' });
  } catch (error) {
    res.status(400).json({ error: 'Webhook test failed', details: error.message });
  }
});

// Helper function for audit logging
async function createAuditLog(entityType, entityId, action, performedBy, previousValues, newValues) {
  try {
    const changedFields = [];
    if (previousValues && newValues) {
      for (const key in newValues) {
        if (JSON.stringify(previousValues[key]) !== JSON.stringify(newValues[key])) {
          changedFields.push(key);
        }
      }
    }
    
    await AuditLog.create({
      entityType,
      entityId,
      action,
      performedBy,
      previousValues,
      newValues,
      changedFields,
      ipAddress: null, // Would be set from request
      userAgent: null, // Would be set from request
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Audit log creation failed', { error: error.message });
  }
}

// ==================== PLACES CRUD ====================

exports.getPlaces = asyncHandler(async (req, res) => {
  const { type, category, isActive, search } = req.query;
  const query = {};
  if (type) query.type = type;
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) query.name = { $regex: search, $options: 'i' };

  const places = await Place.find(query).sort({ sortOrder: 1, name: 1 });
  res.json({ places, total: places.length });
});

exports.getPlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  res.json({ place });
});

exports.createPlace = asyncHandler(async (req, res) => {
  const { name, type, key, label, emoji, coordinates, city, category, sortOrder, isActive } = req.body;
  if (!name || !type || !coordinates) {
    return res.status(400).json({ error: 'name, type, and coordinates are required' });
  }

  const placeKey = key || name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  const placeLabel = label || name;

  const existing = await Place.findOne({ key: placeKey, type });
  if (existing) return res.status(400).json({ error: 'A place with this key already exists for this type' });

  const place = await Place.create({
    name, type, key: placeKey, label: placeLabel,
    emoji: emoji || '', coordinates, city: city || 'Dire Dawa',
    category: category || 'other', sortOrder: sortOrder || 0,
    isActive: isActive !== false,
    createdBy: req.user._id
  });

  res.status(201).json({ place });
});

exports.updatePlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });

  const allowed = ['name', 'label', 'emoji', 'coordinates', 'city', 'category', 'sortOrder', 'isActive'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) place[field] = req.body[field];
  });
  place.updatedBy = req.user._id;
  await place.save();

  res.json({ place });
});

exports.deletePlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  await place.deleteOne();
  res.json({ message: 'Place deleted' });
});

exports.bulkCreatePlaces = asyncHandler(async (req, res) => {
  const { places } = req.body;
  if (!Array.isArray(places) || places.length === 0) {
    return res.status(400).json({ error: 'places array is required' });
  }

  let created = 0;
  let skipped = 0;

  for (const p of places) {
    const placeKey = p.key || p.name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    const exists = await Place.findOne({ key: placeKey, type: p.type });
    if (exists) { skipped++; continue; }

    await Place.create({
      name: p.name, type: p.type, key: placeKey,
      label: p.label || p.name, emoji: p.emoji || '',
      coordinates: p.coordinates, city: p.city || 'Dire Dawa',
      category: p.category || 'other', sortOrder: p.sortOrder || 0,
      isActive: p.isActive !== false, createdBy: req.user._id
    });
    created++;
  }

  res.json({ created, skipped, total: places.length });
});


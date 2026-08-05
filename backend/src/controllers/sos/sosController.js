const SOSAlert = require('../../models/SOSAlert');
const User = require('../../models/User');
const Trip = require('../../models/Trip');
const Driver = require('../../models/Driver');
const { sendRideNotification } = require('../../services/smsService');
const { notifyRideUpdate, createNotification } = require('../../services/notificationService');
const { getIO } = require('../../sockets/socketManager');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');

exports.triggerSOS = asyncHandler(async (req, res) => {
  const { tripId, message, coordinates } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let trip = null;
  if (tripId) {
    trip = await Trip.findById(tripId);
  }

  const sosAlert = await SOSAlert.create({
    user: req.user._id,
    trip: tripId || null,
    message: message || 'Emergency SOS Alert',
    location: {
      type: 'Point',
      coordinates: coordinates || user.currentLocation.coordinates,
      address: 'Current Location'
    }
  });

  const io = getIO();
  io.to('admins').emit('sos_alert', {
    alertId: sosAlert._id,
    userId: req.user._id,
    userName: `${user.firstName} ${user.lastName}`,
    phoneNumber: user.phoneNumber,
    location: coordinates || user.currentLocation.coordinates,
    message: sosAlert.message,
    tripId: tripId || null,
    timestamp: new Date()
  });

  if (user.emergencyContacts && user.emergencyContacts.length > 0) {
    for (const contact of user.emergencyContacts) {
      await sendRideNotification(contact.phoneNumber, 'sos_alert', {
        userName: `${user.firstName} ${user.lastName}`,
        location: 'Current Location',
        message: sosAlert.message
      });

      sosAlert.notifiedContacts.push({
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        notifiedAt: new Date()
      });
    }
  }

  sosAlert.notifiedAdmin = true;
  sosAlert.adminNotifiedAt = new Date();
  await sosAlert.save();

  if (trip && trip.driver) {
    const driver = await Driver.findById(trip.driver);
    if (driver) {
      await createNotification(driver.user, 'sos_alert', 'Emergency Alert',
        `Passenger has triggered an SOS alert`, { alertId: sosAlert._id });
    }
  }

  logger.warn('SOS Alert triggered', { userId: req.user._id, alertId: sosAlert._id });

  res.status(201).json({
    message: 'SOS alert triggered',
    alertId: sosAlert._id
  });
});

exports.resolveSOS = asyncHandler(async (req, res) => {
  const { alertId } = req.params;
  const { resolution, notes } = req.body;

  const sosAlert = await SOSAlert.findById(alertId);
  if (!sosAlert) {
    return res.status(404).json({ error: 'SOS alert not found' });
  }

  sosAlert.status = resolution;
  sosAlert.resolvedBy = req.user._id;
  sosAlert.resolvedAt = new Date();
  sosAlert.resolutionNotes = notes;
  await sosAlert.save();

  if (sosAlert.user) {
    await createNotification(sosAlert.user, 'sos_alert', 'Alert Resolved',
      `Your SOS alert has been ${resolution}`, { alertId: sosAlert._id });
  }

  const io = getIO();
  io.to('admins').emit('sos_resolved', {
    alertId: sosAlert._id,
    status: resolution,
    resolvedBy: req.user._id
  });

  logger.info('SOS Alert resolved', { alertId, resolution });

  res.json({ message: 'SOS alert resolved', sosAlert });
});

exports.getActiveSOSAlerts = asyncHandler(async (req, res) => {
  const alerts = await SOSAlert.find({ status: 'active' })
    .populate('user', 'firstName lastName phoneNumber')
    .populate('trip')
    .sort({ createdAt: -1 });

  res.json({ alerts });
});

exports.getUserSOSHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const alerts = await SOSAlert.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await SOSAlert.countDocuments({ user: req.user._id });

  res.json({ alerts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.shareTrip = asyncHandler(async (req, res) => {
  const { tripId, contactPhoneNumbers } = req.body;

  const trip = await Trip.findById(tripId)
    .populate('passenger', 'firstName lastName phoneNumber')
    .populate('driver', 'user')
    .populate({
      path: 'driver',
      populate: { path: 'user', select: 'firstName lastName phoneNumber' }
    })
    .populate('vehicle', 'make model color plateNumber');

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  for (const phone of contactPhoneNumbers) {
    await sendRideNotification(phone, 'ride_request', {
      message: `${trip.passenger.firstName} is sharing their trip. Driver: ${trip.driver.user.firstName} ${trip.driver.user.lastName}, Vehicle: ${trip.vehicle.plateNumber}`
    });
  }

  res.json({ message: 'Trip shared successfully' });
});

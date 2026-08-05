const RideRequest = require('../../models/RideRequest');
const Trip = require('../../models/Trip');
const Driver = require('../../models/Driver');
const Vehicle = require('../../models/Vehicle');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const { findNearbyDrivers } = require('../../services/rideMatchingService');
const { calculateFare } = require('../../services/pricingService');
const { notifyRideUpdate } = require('../../services/notificationService');
const { getIO } = require('../../sockets/socketManager');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');

exports.createRideRequest = asyncHandler(async (req, res) => {
  const {
    rideType, pickupLocation, dropoffLocation,
    route, estimatedFare, passengersCount,
    scheduledTime, isScheduled, promoCode, notes
  } = req.body;

  const rideRequest = await RideRequest.create({
    passenger: req.user._id,
    rideType,
    pickupLocation: {
      address: pickupLocation.address,
      coordinates: {
        type: 'Point',
        coordinates: pickupLocation.coordinates
      },
      placeId: pickupLocation.placeId
    },
    dropoffLocation: {
      address: dropoffLocation.address,
      coordinates: {
        type: 'Point',
        coordinates: dropoffLocation.coordinates
      },
      placeId: dropoffLocation.placeId
    },
    route,
    estimatedFare,
    passengersCount,
    scheduledTime,
    isScheduled,
    promoCode,
    notes
  });

  const nearbyDrivers = await findNearbyDrivers(
    pickupLocation.coordinates,
    rideType,
    15000
  );

  if (nearbyDrivers.length > 0) {
    const io = getIO();
    io.to('drivers').emit('new_ride_request', {
      rideRequest: rideRequest.toObject(),
      nearbyDriversCount: nearbyDrivers.length
    });
  }

  logger.info('Ride request created', { rideRequestId: rideRequest._id, rideType });

  res.status(201).json({
    message: 'Ride request created',
    rideRequest,
    nearbyDriversCount: nearbyDrivers.length
  });
});

exports.acceptRideRequest = asyncHandler(async (req, res) => {
  const { rideRequestId } = req.params;

  const rideRequest = await RideRequest.findById(rideRequestId);
  if (!rideRequest) {
    return res.status(404).json({ error: 'Ride request not found' });
  }

  if (rideRequest.status !== 'pending') {
    return res.status(400).json({ error: 'Ride request no longer available' });
  }

  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver || driver.verificationStatus !== 'approved') {
    return res.status(403).json({ error: 'Driver not verified' });
  }

  const vehicle = await Vehicle.findOne({ driver: driver._id, isActive: true });
  if (!vehicle) {
    return res.status(400).json({ error: 'No active vehicle found' });
  }

  rideRequest.driver = driver._id;
  rideRequest.vehicle = vehicle._id;
  rideRequest.status = 'accepted';
  await rideRequest.save();

  driver.isAvailable = false;
  driver.currentTrip = rideRequest._id;
  await driver.save();

  const trip = await Trip.create({
    rideRequest: rideRequest._id,
    passenger: rideRequest.passenger,
    driver: driver._id,
    vehicle: vehicle._id,
    status: 'driver_arriving',
    pickupLocation: {
      address: rideRequest.pickupLocation.address,
      coordinates: rideRequest.pickupLocation.coordinates.coordinates
    },
    dropoffLocation: {
      address: rideRequest.dropoffLocation.address,
      coordinates: rideRequest.dropoffLocation.coordinates.coordinates
    },
    fare: calculateFare(
      rideRequest.rideType,
      rideRequest.route.distance / 1000,
      rideRequest.route.duration / 60
    )
  });

  const io = getIO();
  io.to(`user_${rideRequest.passenger}`).emit('ride_accepted', {
    rideRequestId: rideRequest._id,
    tripId: trip._id,
    driver: {
      name: `${req.user.firstName} ${req.user.lastName}`,
      phone: req.user.phoneNumber,
      rating: req.user.averageRating,
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        plateNumber: vehicle.plateNumber
      }
    }
  });

  await notifyRideUpdate(rideRequest.passenger, 'ride_accepted', {
    driverName: `${req.user.firstName} ${req.user.lastName}`,
    vehicleInfo: `${vehicle.color} ${vehicle.make} ${vehicle.model}`,
    tripId: trip._id
  });

  logger.info('Ride accepted', { rideRequestId, tripId: trip._id, driverId: driver._id });

  res.json({ message: 'Ride accepted', trip });
});

exports.declineRideRequest = asyncHandler(async (req, res) => {
  const { rideRequestId } = req.params;

  const rideRequest = await RideRequest.findById(rideRequestId);
  if (!rideRequest) {
    return res.status(404).json({ error: 'Ride request not found' });
  }

  res.json({ message: 'Ride declined' });
});

exports.cancelRideRequest = asyncHandler(async (req, res) => {
  const { rideRequestId } = req.params;
  const { cancellationReason } = req.body;

  const rideRequest = await RideRequest.findOne({
    _id: rideRequestId,
    passenger: req.user._id
  });

  if (!rideRequest) {
    return res.status(404).json({ error: 'Ride request not found' });
  }

  if (!['pending', 'accepted'].includes(rideRequest.status)) {
    return res.status(400).json({ error: 'Cannot cancel this ride' });
  }

  rideRequest.status = 'cancelled';
  rideRequest.cancellationReason = cancellationReason;
  rideRequest.cancelledBy = 'passenger';
  rideRequest.cancelledAt = new Date();
  await rideRequest.save();

  if (rideRequest.driver) {
    const driver = await Driver.findById(rideRequest.driver);
    if (driver) {
      driver.isAvailable = true;
      driver.currentTrip = null;
      await driver.save();
    }

    await notifyRideUpdate(driver.user, 'ride_cancelled', {
      rideRequestId: rideRequest._id,
      reason: cancellationReason
    });
  }

  logger.info('Ride cancelled', { rideRequestId, reason: cancellationReason });

  res.json({ message: 'Ride cancelled' });
});

exports.getAvailableRides = asyncHandler(async (req, res) => {
  const { pickup, dropoff, rideType } = req.query;

  const query = { status: 'pending' };

  if (rideType) {
    query.rideType = rideType;
  }

  if (pickup && dropoff) {
    query.$and = [
      { 'pickupLocation.coordinates': { $near: { $geometry: { type: 'Point', coordinates: JSON.parse(pickup) }, $maxDistance: 10000 } } },
      { 'dropoffLocation.coordinates': { $near: { $geometry: { type: 'Point', coordinates: JSON.parse(dropoff) }, $maxDistance: 10000 } } }
    ];
  }

  const rides = await RideRequest.find(query)
    .populate('passenger', 'firstName lastName averageRating')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ rides });
});

exports.getRideRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const rideRequest = await RideRequest.findById(id)
    .populate('passenger', 'firstName lastName phoneNumber averageRating')
    .populate('driver', 'user licenseNumber')
    .populate({
      path: 'driver',
      populate: { path: 'user', select: 'firstName lastName phoneNumber averageRating' }
    });

  if (!rideRequest) {
    return res.status(404).json({ error: 'Ride request not found' });
  }

  res.json({ rideRequest });
});

exports.startTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  trip.status = 'in_progress';
  trip.startTime = new Date();
  await trip.save();

  await notifyRideUpdate(trip.passenger, 'trip_started', {
    tripId: trip._id
  });

  const io = getIO();
  io.to(`trip_${tripId}`).emit('trip_status', {
    tripId: trip._id,
    status: 'in_progress'
  });

  logger.info('Trip started', { tripId });

  res.json({ message: 'Trip started', trip });
});

exports.completeTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  trip.status = 'completed';
  trip.endTime = new Date();
  trip.actualDuration = Math.round((trip.endTime - trip.startTime) / 60000);
  await trip.save();

  const driver = await Driver.findById(trip.driver);
  if (driver) {
    driver.isAvailable = true;
    driver.currentTrip = null;
    driver.totalTrips += 1;
    await driver.save();
  }

  const rideRequest = await RideRequest.findById(trip.rideRequest);
  if (rideRequest) {
    rideRequest.status = 'completed';
    await rideRequest.save();
  }

  await notifyRideUpdate(trip.passenger, 'trip_completed', {
    tripId: trip._id,
    fare: trip.fare.totalFare
  });

  const io = getIO();
  io.to(`trip_${tripId}`).emit('trip_status', {
    tripId: trip._id,
    status: 'completed',
    fare: trip.fare
  });

  logger.info('Trip completed', { tripId, fare: trip.fare.totalFare });

  res.json({ message: 'Trip completed', trip });
});

exports.getPassengerTrips = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { passenger: req.user._id };
  if (status) {
    query.status = status;
  }

  const trips = await Trip.find(query)
    .populate('driver', 'user')
    .populate({
      path: 'driver',
      populate: { path: 'user', select: 'firstName lastName averageRating' }
    })
    .populate('vehicle', 'make model color plateNumber')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Trip.countDocuments(query);

  res.json({ trips, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getDriverTrips = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }

  const query = { driver: driver._id };
  if (status) {
    query.status = status;
  }

  const trips = await Trip.find(query)
    .populate('passenger', 'firstName lastName averageRating')
    .populate('vehicle', 'make model color plateNumber')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Trip.countDocuments(query);

  res.json({ trips, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.getTripDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trip = await Trip.findById(id)
    .populate('passenger', 'firstName lastName phoneNumber averageRating profilePhoto')
    .populate('driver', 'user licenseNumber averageRating')
    .populate({
      path: 'driver',
      populate: { path: 'user', select: 'firstName lastName phoneNumber averageRating profilePhoto' }
    })
    .populate('vehicle', 'make model color plateNumber vehicleType capacity')
    .populate('payment');

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  res.json({ trip });
});

exports.confirmArrival = asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  trip.status = 'driver_arriving';
  await trip.save();

  await notifyRideUpdate(trip.passenger, 'driver_arriving', {
    tripId: trip._id
  });

  const io = getIO();
  io.to(`trip_${tripId}`).emit('trip_status', {
    tripId: trip._id,
    status: 'driver_arriving'
  });

  res.json({ message: 'Arrival confirmed' });
});

exports.cancelTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { reason } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (trip.status === 'completed' || trip.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot cancel this trip' });
  }

  trip.status = 'cancelled';
  await trip.save();

  const driver = await Driver.findById(trip.driver);
  if (driver) {
    driver.isAvailable = true;
    driver.currentTrip = null;
    await driver.save();
  }

  const rideRequest = await RideRequest.findById(trip.rideRequest);
  if (rideRequest) {
    rideRequest.status = 'cancelled';
    rideRequest.cancelledBy = 'driver';
    rideRequest.cancellationReason = reason;
    await rideRequest.save();
  }

  await notifyRideUpdate(trip.passenger, 'ride_cancelled', {
    tripId: trip._id,
    reason: reason || 'Driver cancelled'
  });

  const io = getIO();
  io.to(`trip_${tripId}`).emit('trip_status', {
    tripId: trip._id,
    status: 'cancelled'
  });

  logger.info('Trip cancelled by driver', { tripId, reason });

  res.json({ message: 'Trip cancelled' });
});

exports.getDriverStats = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTrips = await Trip.countDocuments({
    driver: driver._id,
    status: 'completed',
    createdAt: { $gte: today }
  });

  const allTimeTrips = await Trip.countDocuments({
    driver: driver._id,
    status: 'completed'
  });

  const todayPayments = await Payment.aggregate([
    {
      $match: {
        driver: driver._id,
        status: 'completed',
        paidAt: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        todayEarnings: { $sum: '$driverEarnings' }
      }
    }
  ]);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekPayments = await Payment.aggregate([
    {
      $match: {
        driver: driver._id,
        status: 'completed',
        paidAt: { $gte: weekStart }
      }
    },
    {
      $group: {
        _id: null,
        weekEarnings: { $sum: '$driverEarnings' }
      }
    }
  ]);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthPayments = await Payment.aggregate([
    {
      $match: {
        driver: driver._id,
        status: 'completed',
        paidAt: { $gte: monthStart }
      }
    },
    {
      $group: {
        _id: null,
        monthEarnings: { $sum: '$driverEarnings' }
      }
    }
  ]);

  const recentTrips = await Trip.find({ driver: driver._id })
    .populate('passenger', 'firstName lastName averageRating phoneNumber')
    .sort({ createdAt: -1 })
    .limit(5);

  const vehicle = await Vehicle.findOne({ driver: driver._id, isActive: true });

  res.json({
    todayTrips,
    allTimeTrips,
    todayEarnings: todayPayments[0]?.todayEarnings || 0,
    weekEarnings: weekPayments[0]?.weekEarnings || 0,
    monthEarnings: monthPayments[0]?.monthEarnings || 0,
    totalEarnings: driver.totalEarnings,
    availableBalance: driver.availableBalance,
    averageRating: driver.user?.averageRating || 0,
    totalTrips: driver.totalTrips,
    vehicle: vehicle ? {
      type: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      plateNumber: vehicle.plateNumber
    } : null,
    recentTrips
  });
});

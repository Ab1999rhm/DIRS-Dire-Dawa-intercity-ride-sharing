const RideRequest = require('../../models/RideRequest');
const Trip = require('../../models/Trip');
const Driver = require('../../models/Driver');
const Vehicle = require('../../models/Vehicle');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const SuspiciousActivity = require('../../models/SuspiciousActivity');
const { findNearbyDrivers } = require('../../services/rideMatchingService');
const { calculateFare } = require('../../services/pricingService');
const { notifyRideUpdate } = require('../../services/notificationService');
const { getIO } = require('../../sockets/socketManager');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');

const haversineDistance = (coords1, coords2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  // Frontend sends [lat, lon]
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

exports.estimateFare = asyncHandler(async (req, res) => {
  const { pickup, dropoff, vehicleType } = req.body;

  if (!pickup || !pickup.coordinates || !dropoff || !dropoff.coordinates) {
    return res.status(400).json({ error: 'Pickup and dropoff coordinates are required' });
  }

  const distanceKm = haversineDistance(pickup.coordinates, dropoff.coordinates);
  const avgSpeedKmh = vehicleType === 'intercity' ? 60 : 30;
  const durationMinutes = Math.max((distanceKm / avgSpeedKmh) * 60, 5);

  const rideType = vehicleType || 'intra_city';
  const fareResult = calculateFare(rideType, distanceKm, durationMinutes);

  const estimatedFare = fareResult.totalFare;

  res.json({
    distance: Math.round(distanceKm * 100) / 100,
    duration: Math.round(durationMinutes),
    estimatedFare,
    breakdown: {
      baseFare: fareResult.baseFare,
      distanceFare: fareResult.distanceFare,
      timeFare: fareResult.timeFare,
      total: estimatedFare
    }
  });
});

exports.createRideRequest = asyncHandler(async (req, res) => {
  const {
    rideType, pickupLocation, dropoffLocation,
    route: routeInput, estimatedFare, passengersCount,
    scheduledTime, isScheduled, promoCode, notes,
    vehicleType, paymentMethod
  } = req.body;

  let route = routeInput;
  if (!route || !route.distance) {
    const distKm = haversineDistance(
      pickupLocation.coordinates,
      dropoffLocation.coordinates
    );
    const avgSpeedKmh = rideType === 'intercity' ? 60 : 30;
    const durationMin = Math.max((distKm / avgSpeedKmh) * 60, 5);
    route = {
      distance: Math.round(distKm * 1000),
      duration: Math.round(durationMin * 60)
    };
  }

  const normalizedRideType = rideType === 'intraCity' ? 'intra_city' : (rideType || 'intra_city');

  // Frontend sends [lat, lon], MongoDB GeoJSON needs [lng, lat]
  const toLngLat = (coords) => coords && coords.length === 2 ? [coords[1], coords[0]] : coords;

  const rideRequest = await RideRequest.create({
    passenger: req.user._id,
    rideType: normalizedRideType,
    pickupLocation: {
      address: pickupLocation.address,
      coordinates: {
        type: 'Point',
        coordinates: toLngLat(pickupLocation.coordinates)
      },
      placeId: pickupLocation.placeId
    },
    dropoffLocation: {
      address: dropoffLocation.address,
      coordinates: {
        type: 'Point',
        coordinates: toLngLat(dropoffLocation.coordinates)
      },
      placeId: dropoffLocation.placeId
    },
    route,
    estimatedFare,
    passengersCount,
    scheduledTime,
    isScheduled: isScheduled || !!scheduledTime,
    promoCode,
    notes,
    vehicleType,
    paymentMethod
  });

  const recentBookings = await RideRequest.countDocuments({
    passenger: req.user._id,
    createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
  });
  if (recentBookings >= 5) {
    const existing = await SuspiciousActivity.findOne({
      user: req.user._id,
      type: 'rapid_bookings',
      status: { $in: ['detected', 'investigating'] },
      detectedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    });
    if (!existing) {
      await SuspiciousActivity.create({
        user: req.user._id,
        type: 'rapid_bookings',
        severity: 'medium',
        description: `${recentBookings} ride requests in 10 minutes`,
        status: 'detected'
      });
    }
  }

  const matchResult = await findNearbyDrivers(
    toLngLat(pickupLocation.coordinates),
    normalizedRideType,
    15000,
    dropoffLocation,
    vehicleType
  );

  const nearbyDrivers = matchResult.drivers || [];
  const noDriverReason = matchResult.noDriverReason || null;
  const availableVehicles = matchResult.availableVehicles || [];

  const io = getIO();

  if (nearbyDrivers.length > 0) {
    const populated = await RideRequest.findById(rideRequest._id).populate('passenger', 'firstName lastName phoneNumber rating');
    const rr = populated.toObject();
    io.to('drivers').emit('new_ride_request', {
      rideRequest: {
        ...rr,
        _id: rr._id,
        passenger: rr.passenger,
        pickup: rr.pickupLocation,
        dropoff: rr.dropoffLocation,
        fare: { totalFare: rr.estimatedFare, currency: 'ETB' },
        distance: rr.route?.distance ? rr.route.distance / 1000 : 0,
        duration: rr.route?.duration ? rr.route.duration / 60 : 0,
      },
      nearbyDriversCount: nearbyDrivers.length
    });
  }

  logger.info('Ride request created', {
    rideRequestId: rideRequest._id,
    rideType: normalizedRideType,
    vehicleType,
    nearbyDriversCount: nearbyDrivers.length,
    noDriverReason,
    availableVehiclesCount: availableVehicles.length
  });

  res.status(201).json({
    message: noDriverReason || 'Ride request created',
    rideRequest,
    nearbyDriversCount: nearbyDrivers.length,
    noDriverReason,
    availableVehicles
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

  const distanceKm = rideRequest.route?.distance
    ? rideRequest.route.distance / 1000
    : haversineDistance(
        [...rideRequest.pickupLocation.coordinates.coordinates].reverse(),
        [...rideRequest.dropoffLocation.coordinates.coordinates].reverse()
      );
  const durationMin = rideRequest.route?.duration
    ? rideRequest.route.duration / 60
    : Math.max((distanceKm / 30) * 60, 5);

  const trip = await Trip.create({
    rideRequest: rideRequest._id,
    passenger: rideRequest.passenger,
    driver: driver._id,
    vehicle: vehicle._id,
    status: 'driver_arriving',
    rideType: rideRequest.rideType,
    pickupLocation: {
      address: rideRequest.pickupLocation.address,
      coordinates: rideRequest.pickupLocation.coordinates.coordinates
    },
    dropoffLocation: {
      address: rideRequest.dropoffLocation.address,
      coordinates: rideRequest.dropoffLocation.coordinates.coordinates
    },
    fare: calculateFare(
      rideRequest.rideType || 'intra_city',
      distanceKm,
      durationMin
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
      profilePhoto: req.user.profilePhoto,
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
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

  const recentCancellations = await RideRequest.countDocuments({
    passenger: req.user._id,
    status: 'cancelled',
    cancelledAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  if (recentCancellations >= 3) {
    const existing = await SuspiciousActivity.findOne({
      user: req.user._id,
      type: 'multiple_cancellations',
      status: { $in: ['detected', 'investigating'] },
      detectedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });
    if (!existing) {
      await SuspiciousActivity.create({
        user: req.user._id,
        type: 'multiple_cancellations',
        severity: 'medium',
        description: `${recentCancellations} cancellations in 24 hours`,
        status: 'detected',
        cancellationCount: recentCancellations,
        timeWindow: '1day'
      });
    }
  }

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

    const io = getIO();
    io.to(`user_${driver.user}`).emit('ride_cancelled', {
      rideRequestId: rideRequest._id,
      passengerId: req.user._id,
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
    const parsedPickup = JSON.parse(pickup);
    const parsedDropoff = JSON.parse(dropoff);
    // Frontend sends [lat, lon], MongoDB needs [lng, lat]
    const toLngLat = (c) => c && c.length === 2 ? [c[1], c[0]] : c;
    query.$and = [
      { 'pickupLocation.coordinates': { $near: { $geometry: { type: 'Point', coordinates: toLngLat(parsedPickup) }, $maxDistance: 10000 } } },
      { 'dropoffLocation.coordinates': { $near: { $geometry: { type: 'Point', coordinates: toLngLat(parsedDropoff) }, $maxDistance: 10000 } } }
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
  io.to(`user_${trip.passenger}`).emit('trip_status', {
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
  if (trip.startTime) {
    trip.actualDuration = Math.round((trip.endTime - trip.startTime) / 60000);
  }
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
    fare: trip.fare
  });

  const io = getIO();
  io.to(`trip_${tripId}`).emit('trip_status', {
    tripId: trip._id,
    status: 'completed',
    fare: trip.fare
  });
  io.to(`user_${trip.passenger}`).emit('trip_status', {
    tripId: trip._id,
    status: 'completed',
    fare: trip.fare,
    ride: trip
  });

  logger.info('Trip completed', { tripId, fare: trip.fare?.totalFare });

  try {
    const referralController = require('../referrals/referralController');
    await referralController.completeReferral(trip.passenger);
  } catch (err) {
    logger.warn('Failed to process referral completion', { error: err.message });
  }

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

  trip.status = 'driver_arrived';
  await trip.save();

  await notifyRideUpdate(trip.passenger, 'driver_arrived', {
    tripId: trip._id
  });

  const io = getIO();
  io.to(`trip_${tripId}`).emit('trip_status', {
    tripId: trip._id,
    status: 'driver_arrived'
  });
  io.to(`user_${trip.passenger}`).emit('trip_status', {
    tripId: trip._id,
    status: 'driver_arrived'
  });

  logger.info('Driver arrived at pickup', { tripId });

  res.json({ message: 'Arrival confirmed' });
});

exports.cancelTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { reason, cancelledBy } = req.body;

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
    
    // Also update the user's online status
    const User = require('../models/User');
    await User.findByIdAndUpdate(driver.user, { isOnline: true });
  }

  const rideRequest = await RideRequest.findById(trip.rideRequest);
  if (rideRequest) {
    rideRequest.status = 'cancelled';
    rideRequest.cancelledBy = cancelledBy || 'driver';
    rideRequest.cancellationReason = reason;
    await rideRequest.save();
  }

  await notifyRideUpdate(trip.passenger, 'ride_cancelled', {
    tripId: trip._id,
    reason: reason || 'Trip cancelled'
  });

  const io = getIO();
  io.to(`trip_${tripId}`).emit('trip_status', {
    tripId: trip._id,
    status: 'cancelled'
  });
  io.to(`user_${trip.passenger}`).emit('trip_status', {
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

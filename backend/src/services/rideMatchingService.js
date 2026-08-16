const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

const INTERCITY_DESTINATIONS = {
  'harar':        { label: 'Harar',        coordinates: [42.1200, 9.3110] },
  'addis ababa':  { label: 'Addis Ababa',  coordinates: [38.7578, 9.0192] },
  'jijiga':       { label: 'Jijiga',       coordinates: [42.8000, 9.3500] },
  'combolcha':    { label: 'Combolcha',    coordinates: [39.8700, 8.9300] },
  'awash':        { label: 'Awash',        coordinates: [40.1500, 8.9833] },
  'debre markos': { label: 'Debre Markos', coordinates: [37.7300, 10.3400] },
  'adama':        { label: 'Adama',        coordinates: [39.2700, 8.5400] },
  'hawassa':      { label: 'Hawassa',      coordinates: [38.4763, 7.0621] },
  'bahir dar':    { label: 'Bahir Dar',    coordinates: [37.3909, 11.5938] },
  'mekelle':      { label: 'Mekelle',      coordinates: [39.4753, 13.4967] },
  'jimma':        { label: 'Jimma',        coordinates: [36.8340, 7.6789] },
  'dessie':       { label: 'Dessie',       coordinates: [39.6353, 11.1321] },
  'chiro':        { label: 'Chiro',        coordinates: [40.8667, 9.0667] },
  'asebe teferi': { label: 'Asebe Teferi', coordinates: [40.8667, 9.0667] },
};

const matchDestinationCity = (dropoffAddress) => {
  if (!dropoffAddress) return null;
  const lower = dropoffAddress.toLowerCase();
  for (const [key, dest] of Object.entries(INTERCITY_DESTINATIONS)) {
    if (lower.includes(key)) return { key, ...dest };
  }
  return null;
};

const findNearbyDrivers = async (pickupCoordinates, rideType, maxDistance = 15000, dropoffInfo = null) => {
  const logger = require('../config/logger');
  
  // pickupCoordinates should already be [lng, lat] from the controller
  const query = {
    role: 'driver',
    isActive: true,
    isOnline: true,
    'currentLocation.updatedAt': {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  };

  // Filter by serviceType - driver must support the requested ride type
  if (rideType === 'intra_city') {
    query.serviceType = { $in: ['intra_city', 'both'] };
  } else if (rideType === 'intercity') {
    query.serviceType = { $in: ['intercity', 'both'] };
  }

  // For intercity rides, ONLY match drivers whose destination matches — strict matching
  if (rideType === 'intercity' && dropoffInfo) {
    const destCity = matchDestinationCity(dropoffInfo.address);
    if (!destCity) {
      // Destination not in our supported cities list — no drivers can serve this
      logger.info('Intercity ride - unsupported destination', { dropoffAddress: dropoffInfo.address });
      return { drivers: [], noDriverReason: `No drivers available for this destination` };
    }
    query['intendedDestination.city'] = destCity.key;
    logger.info('Intercity ride - filtering by destination', { destCity: destCity.key, dropoffAddress: dropoffInfo.address });
  }

  logger.info('Finding nearby drivers', { pickupCoordinates, rideType, maxDistance, query });

  const nearbyUsers = await User.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: pickupCoordinates },
        distanceField: 'distance',
        maxDistance: maxDistance,
        spherical: true,
        query
      }
    },
    { $limit: 50 }
  ]);

  logger.info('Nearby users found', { count: nearbyUsers.length });

  if (!nearbyUsers.length) {
    const reason = rideType === 'intercity' && dropoffInfo
      ? `No drivers available heading to ${matchDestinationCity(dropoffInfo.address)?.label || dropoffInfo.address}`
      : 'No nearby drivers found';
    return { drivers: [], noDriverReason: reason };
  }

  const driverUserIds = nearbyUsers.map(u => u._id);

  const drivers = await Driver.find({
    user: { $in: driverUserIds },
    verificationStatus: 'approved',
    isAvailable: true,
    currentTrip: null
  }).populate('user');

  logger.info('Drivers after filtering', { 
    totalNearbyUsers: nearbyUsers.length, 
    driversFound: drivers.length,
    filterCriteria: { verificationStatus: 'approved', isAvailable: true, currentTrip: null }
  });

  const nearbyDrivers = [];

  for (const driver of drivers) {
    if (!driver.user || !driver.user.currentLocation || !driver.user.currentLocation.coordinates) {
      logger.warn('Driver missing location data', { driverId: driver._id, hasUser: !!driver.user, hasLocation: !!driver.user?.currentLocation });
      continue;
    }

    const vehicle = await Vehicle.findOne({ driver: driver._id, isActive: true });

    if (!vehicle) {
      logger.warn('Driver has no active vehicle', { driverId: driver._id });
      continue;
    }

    if (!isVehicleCompatible(vehicle, rideType)) {
      logger.warn('Vehicle not compatible', { driverId: driver._id, vehicleType: vehicle.vehicleType, serviceType: vehicle.serviceType, rideType });
      continue;
    }

    // Check availability time window
    if (driver.settings?.availabilityStart && driver.settings?.availabilityEnd) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = (driver.settings.availabilityStart || '08:00').split(':').map(Number);
      const [endH, endM] = (driver.settings.availabilityEnd || '18:00').split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (startMinutes <= endMinutes) {
        // Normal shift (e.g., 08:00 - 18:00)
        if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
          logger.info('Driver outside availability window', { driverId: driver._id, start: driver.settings.availabilityStart, end: driver.settings.availabilityEnd });
          continue;
        }
      } else {
        // Overnight shift (e.g., 22:00 - 06:00)
        if (currentMinutes < startMinutes && currentMinutes > endMinutes) {
          logger.info('Driver outside availability window', { driverId: driver._id, start: driver.settings.availabilityStart, end: driver.settings.availabilityEnd });
          continue;
        }
      }
    }

    const userAgg = nearbyUsers.find(u => u._id.toString() === driver.user._id.toString());
    const distance = userAgg?.distance || 0;

    nearbyDrivers.push({
      driver,
      vehicle,
      distance,
      eta: calculateETA(distance)
    });
  }

  logger.info('Final nearby drivers count', { count: nearbyDrivers.length });

  nearbyDrivers.sort((a, b) => {
    const ratingWeight = 0.4;
    const distanceWeight = 0.6;

    const aScore = (a.driver.user.averageRating || 4) * ratingWeight - (a.distance / 1000) * distanceWeight;
    const bScore = (b.driver.user.averageRating || 4) * ratingWeight - (b.distance / 1000) * distanceWeight;

    return bScore - aScore;
  });

  if (nearbyDrivers.length === 0) {
    const reason = rideType === 'intercity' && dropoffInfo
      ? `No drivers available heading to ${matchDestinationCity(dropoffInfo.address)?.label || dropoffInfo.address}`
      : 'No nearby drivers found';
    return { drivers: [], noDriverReason: reason };
  }

  return { drivers: nearbyDrivers, noDriverReason: null };
};

const isVehicleCompatible = (vehicle, rideType) => {
  if (rideType === 'intra_city') {
    return ['car', 'minivan', 'bajaj'].includes(vehicle.vehicleType);
  }
  return ['minibus', 'bus', 'car', 'minivan'].includes(vehicle.vehicleType);
};

const calculateETA = (distanceMeters) => {
  const avgSpeedKmh = 25;
  const avgSpeedMs = avgSpeedKmh / 3.6;
  return Math.ceil(distanceMeters / avgSpeedMs / 60);
};

module.exports = { findNearbyDrivers, calculateETA, INTERCITY_DESTINATIONS, matchDestinationCity };

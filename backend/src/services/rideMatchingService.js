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

const findNearbyDrivers = async (pickupCoordinates, rideType, maxDistance = 15000, dropoffInfo = null, requestedVehicleType = null) => {
  const logger = require('../config/logger');
  
  const query = {
    role: 'driver',
    isActive: true,
    isOnline: true,
    'currentLocation.updatedAt': {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  };

  if (rideType === 'intra_city') {
    query.serviceType = { $in: ['intra_city', 'both'] };
  } else if (rideType === 'intercity') {
    query.serviceType = { $in: ['intercity', 'both'] };
  }

  let destCityLabel = null;
  if (rideType === 'intercity' && dropoffInfo) {
    const destCity = matchDestinationCity(dropoffInfo.address);
    if (!destCity) {
      logger.info('Intercity ride - unsupported destination', { dropoffAddress: dropoffInfo.address });
      return { drivers: [], noDriverReason: `No drivers available for this destination`, availableVehicles: [] };
    }
    destCityLabel = destCity.label;
    query['intendedDestination.city'] = destCity.key;
    logger.info('Intercity ride - filtering by destination', { destCity: destCity.key, dropoffAddress: dropoffInfo.address });
  }

  logger.info('Finding nearby drivers', { pickupCoordinates, rideType, maxDistance, requestedVehicleType, query });

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
    const reason = rideType === 'intercity' && destCityLabel
      ? `No drivers available heading to ${destCityLabel}`
      : 'No nearby drivers found';
    return { drivers: [], noDriverReason: reason, availableVehicles: [] };
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
    driversFound: drivers.length
  });

  const allCompatibleDrivers = [];

  for (const driver of drivers) {
    if (!driver.user || !driver.user.currentLocation || !driver.user.currentLocation.coordinates) {
      continue;
    }

    const vehicle = await Vehicle.findOne({ driver: driver._id, isActive: true });
    if (!vehicle) continue;
    if (!isVehicleCompatible(vehicle, rideType)) continue;

    if (driver.settings?.availabilityStart && driver.settings?.availabilityEnd) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = (driver.settings.availabilityStart || '08:00').split(':').map(Number);
      const [endH, endM] = (driver.settings.availabilityEnd || '18:00').split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (startMinutes <= endMinutes) {
        if (currentMinutes < startMinutes || currentMinutes > endMinutes) continue;
      } else {
        if (currentMinutes < startMinutes && currentMinutes > endMinutes) continue;
      }
    }

    const userAgg = nearbyUsers.find(u => u._id.toString() === driver.user._id.toString());
    const distance = userAgg?.distance || 0;

    allCompatibleDrivers.push({
      driver,
      vehicle,
      distance,
      eta: calculateETA(distance)
    });
  }

  allCompatibleDrivers.sort((a, b) => {
    const ratingWeight = 0.4;
    const distanceWeight = 0.6;
    const aScore = (a.driver.user.averageRating || 4) * ratingWeight - (a.distance / 1000) * distanceWeight;
    const bScore = (b.driver.user.averageRating || 4) * ratingWeight - (b.distance / 1000) * distanceWeight;
    return bScore - aScore;
  });

  logger.info('All compatible drivers found', { count: allCompatibleDrivers.length, requestedVehicleType });

  // Two-pass matching: first try exact vehicle type, then fall back
  if (requestedVehicleType) {
    const exactMatches = allCompatibleDrivers.filter(d => d.vehicle.vehicleType === requestedVehicleType);
    
    if (exactMatches.length > 0) {
      return { drivers: exactMatches, noDriverReason: null, availableVehicles: [] };
    }

    // No exact match — build available vehicles list from what IS available
    const vehicleCounts = {};
    for (const d of allCompatibleDrivers) {
      const type = d.vehicle.vehicleType;
      vehicleCounts[type] = (vehicleCounts[type] || 0) + 1;
    }

    const VEHICLE_LABELS = {
      bajaj: 'Bajaj', car: 'Car', minivan: 'Minivan', minibus: 'Minibus', bus: 'Bus'
    };

    const availableVehicles = Object.entries(vehicleCounts).map(([type, count]) => ({
      type,
      label: VEHICLE_LABELS[type] || type,
      count
    }));

    const requestedLabel = VEHICLE_LABELS[requestedVehicleType] || requestedVehicleType;
    const destLabel = destCityLabel || 'this destination';
    const reason = `No ${requestedLabel} drivers available heading to ${destLabel}`;

    return { drivers: [], noDriverReason: reason, availableVehicles };
  }

  return { drivers: allCompatibleDrivers, noDriverReason: null, availableVehicles: [] };
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

const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

const INTERCITY_DESTINATIONS = {
  'harar': { label: 'Harar', coordinates: [42.1200, 9.3110] },
  'addis ababa': { label: 'Addis Ababa', coordinates: [38.7578, 9.0192] },
  'combolcha': { label: 'Combolcha', coordinates: [39.8700, 8.9300] },
  'jijiga': { label: 'Jijiga', coordinates: [42.8000, 9.3500] },
  'dire dawa': { label: 'Dire Dawa', coordinates: [41.8500, 9.6000] },
  'awash': { label: 'Awash', coordinates: [40.1500, 8.9833] },
  'debre markos': { label: 'Debre Markos', coordinates: [37.7300, 10.3400] },
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
  // pickupCoordinates should already be [lng, lat] from the controller
  const query = {
    role: 'driver',
    isActive: true,
    isOnline: true,
    'currentLocation.updatedAt': {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  };

  // For intercity rides, only match drivers whose destination matches
  if (rideType === 'intercity' && dropoffInfo) {
    const destCity = matchDestinationCity(dropoffInfo.address);
    if (destCity) {
      query['intendedDestination.city'] = destCity.key;
    }
  }

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

  if (!nearbyUsers.length) return [];

  const driverUserIds = nearbyUsers.map(u => u._id);

  const drivers = await Driver.find({
    user: { $in: driverUserIds },
    verificationStatus: 'approved',
    isAvailable: true,
    currentTrip: null
  }).populate('user');

  const nearbyDrivers = [];

  for (const driver of drivers) {
    if (!driver.user || !driver.user.currentLocation || !driver.user.currentLocation.coordinates) continue;

    const vehicle = await Vehicle.findOne({ driver: driver._id, isActive: true });

    if (vehicle && isVehicleCompatible(vehicle, rideType)) {
      const userAgg = nearbyUsers.find(u => u._id.toString() === driver.user._id.toString());
      const distance = userAgg?.distance || 0;

      nearbyDrivers.push({
        driver,
        vehicle,
        distance,
        eta: calculateETA(distance)
      });
    }
  }

  nearbyDrivers.sort((a, b) => {
    const ratingWeight = 0.4;
    const distanceWeight = 0.6;

    const aScore = (a.driver.user.averageRating || 4) * ratingWeight - (a.distance / 1000) * distanceWeight;
    const bScore = (b.driver.user.averageRating || 4) * ratingWeight - (b.distance / 1000) * distanceWeight;

    return bScore - aScore;
  });

  return nearbyDrivers;
};

const isVehicleCompatible = (vehicle, rideType) => {
  if (rideType === 'intra_city') {
    return ['car', 'minivan', 'bajaj'].includes(vehicle.vehicleType);
  }
  return vehicle.serviceType === 'intercity' || vehicle.serviceType === 'both';
};

const calculateETA = (distanceMeters) => {
  const avgSpeedKmh = 25;
  const avgSpeedMs = avgSpeedKmh / 3.6;
  return Math.ceil(distanceMeters / avgSpeedMs / 60);
};

module.exports = { findNearbyDrivers, calculateETA, INTERCITY_DESTINATIONS, matchDestinationCity };

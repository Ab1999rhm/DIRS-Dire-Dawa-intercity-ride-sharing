const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

const findNearbyDrivers = async (pickupCoordinates, rideType, maxDistance = 10000) => {
  const [lng, lat] = pickupCoordinates;

  const nearbyUsers = await User.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        maxDistance: maxDistance,
        spherical: true,
        query: {
          role: 'driver',
          isActive: true,
          'currentLocation.updatedAt': {
            $gte: new Date(Date.now() - 30 * 60 * 1000)
          }
        }
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

module.exports = { findNearbyDrivers, calculateETA };

const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Place = require('../models/Place');

// Fallback hardcoded destinations (used if DB is empty)
const FALLBACK_DESTINATIONS = {
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

// Common aliases → canonical city key
const CITY_ALIASES = {
  'dire dawa': 'chiro',
  'dire': 'chiro',
  'addis': 'addis ababa',
  'bahirdar': 'bahir dar',
  'bahirdar': 'bahir dar',
  'bahri dar': 'bahir dar',
  'debremarkos': 'debre markos',
  'debre markos': 'debre markos',
  'mekelle': 'mekelle',
  'mekelle': 'mekelle',
  'awash': 'awash',
  'hawassa': 'hawassa',
  'hawasa': 'hawassa',
  'combolcha': 'combolcha',
  'combolacha': 'combolcha',
  'asebe teferi': 'asebe teferi',
  'asabe': 'asebe teferi',
  'aseba': 'asebe teferi',
};

const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
};

let cachedDestinations = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

const getDestinations = async () => {
  const now = Date.now();
  if (cachedDestinations && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedDestinations;
  }
  try {
    const places = await Place.find({ type: 'intercity', isActive: true });
    if (places.length > 0) {
      const map = {};
      for (const p of places) {
        map[p.key] = { label: p.label || p.name, coordinates: [p.coordinates.lon, p.coordinates.lat] };
      }
      cachedDestinations = map;
      cacheTimestamp = now;
      return map;
    }
  } catch (_) {}
  cachedDestinations = FALLBACK_DESTINATIONS;
  cacheTimestamp = now;
  return FALLBACK_DESTINATIONS;
};

const matchDestinationCity = async (dropoffAddress, placeId) => {
  if (!dropoffAddress && !placeId) return null;
  const destinations = await getDestinations();

  // 1. Direct placeId match (highest confidence)
  if (placeId) {
    try {
      const place = await Place.findOne({ _id: placeId, type: 'intercity', isActive: true });
      if (place && destinations[place.key]) {
        return { key: place.key, ...destinations[place.key] };
      }
    } catch (_) {}
  }

  const lower = dropoffAddress.toLowerCase().trim();

  // 2. Exact key match
  if (destinations[lower]) return { key: lower, ...destinations[lower] };

  // 3. Alias match
  if (CITY_ALIASES[lower]) {
    const key = CITY_ALIASES[lower];
    if (destinations[key]) return { key, ...destinations[key] };
  }

  // 4. Substring match (existing behavior)
  for (const [key, dest] of Object.entries(destinations)) {
    if (lower.includes(key) || key.includes(lower)) return { key, ...dest };
  }

  // 5. Fuzzy match — Levenshtein distance ≤ 2 for short names, ≤ 3 for longer
  let bestKey = null;
  let bestDist = Infinity;
  const words = lower.split(/\s+/);
  for (const [key, dest] of Object.entries(destinations)) {
    const keyWords = key.split(/\s+/);
    // Check individual words
    for (const w of words) {
      if (w.length < 3) continue;
      for (const kw of keyWords) {
        if (kw.length < 3) continue;
        const maxDist = Math.min(2, Math.floor(kw.length / 3) + 1);
        const dist = levenshteinDistance(w, kw);
        if (dist <= maxDist && dist < bestDist) {
          bestDist = dist;
          bestKey = key;
        }
      }
    }
    // Also check full string
    const maxFullDist = lower.length <= 5 ? 1 : 2;
    const fullDist = levenshteinDistance(lower, key);
    if (fullDist <= maxFullDist && fullDist < bestDist) {
      bestDist = fullDist;
      bestKey = key;
    }
  }
  if (bestKey) return { key: bestKey, ...destinations[bestKey] };

  // 6. Partial word overlap — user typed part of the city name
  for (const [key, dest] of Object.entries(destinations)) {
    const keyParts = key.split(/\s+/);
    for (const part of keyParts) {
      if (part.length >= 4 && lower.includes(part)) return { key, ...dest };
    }
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
    const destCity = await matchDestinationCity(dropoffInfo.address, dropoffInfo.placeId);
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
      eta: calculateETA(distance),
      currentArea: driver.user.currentArea?.name || null
    });
  }

  const pickupAreaName = dropoffInfo?.pickupAreaName || null;

  allCompatibleDrivers.sort((a, b) => {
    const ratingWeight = 0.4;
    const distanceWeight = 0.5;
    const areaWeight = 0.1;
    const aAreaBonus = (pickupAreaName && a.currentArea && a.currentArea.toLowerCase() === pickupAreaName.toLowerCase()) ? 1 : 0;
    const bAreaBonus = (pickupAreaName && b.currentArea && b.currentArea.toLowerCase() === pickupAreaName.toLowerCase()) ? 1 : 0;
    const aScore = (a.driver.user.averageRating || 4) * ratingWeight - (a.distance / 1000) * distanceWeight + aAreaBonus * areaWeight;
    const bScore = (b.driver.user.averageRating || 4) * ratingWeight - (b.distance / 1000) * distanceWeight + bAreaBonus * areaWeight;
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

module.exports = { findNearbyDrivers, calculateETA, matchDestinationCity, getDestinations };

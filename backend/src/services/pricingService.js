const PricingConfig = {
  intra_city: {
    baseFare: parseFloat(process.env.BASE_FARE_INTRA_CITY) || 50,
    perKmRate: parseFloat(process.env.PER_KM_RATE_INTRA_CITY) || 15,
    perMinuteRate: 2,
    minimumFare: 30,
    surgeThreshold: 0.8,
    surgeMultiplier: parseFloat(process.env.SURGE_MULTIPLIER) || 1.5
  },
  intraCity: {
    baseFare: parseFloat(process.env.BASE_FARE_INTRA_CITY) || 50,
    perKmRate: parseFloat(process.env.PER_KM_RATE_INTRA_CITY) || 15,
    perMinuteRate: 2,
    minimumFare: 30,
    surgeThreshold: 0.8,
    surgeMultiplier: parseFloat(process.env.SURGE_MULTIPLIER) || 1.5
  },
  intercity: {
    baseFare: parseFloat(process.env.BASE_FARE_INTER_CITY) || 150,
    perKmRate: parseFloat(process.env.PER_KM_RATE_INTER_CITY) || 20,
    perMinuteRate: 3,
    minimumFare: 100,
    surgeThreshold: 0.85,
    surgeMultiplier: parseFloat(process.env.SURGE_MULTIPLIER) || 1.5
  },
  commission: parseFloat(process.env.PLATFORM_COMMISSION) || 15
};

const calculateFare = (rideType, distanceKm, durationMinutes, surgeMultiplier = 1) => {
  const config = PricingConfig[rideType];

  const baseFare = config.baseFare;
  const distanceFare = distanceKm * config.perKmRate;
  const timeFare = durationMinutes * config.perMinuteRate;
  const subtotal = baseFare + distanceFare + timeFare;
  const totalFare = Math.max(subtotal * surgeMultiplier, config.minimumFare);

  return {
    baseFare,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    surgeMultiplier,
    totalFare: Math.round(totalFare * 100) / 100,
    minimumFare: config.minimumFare,
    currency: 'ETB'
  };
};

const calculateCommission = (totalFare) => {
  const commissionRate = PricingConfig.commission / 100;
  const commission = totalFare * commissionRate;
  const driverEarnings = totalFare - commission;

  return {
    platformCommission: Math.round(commission * 100) / 100,
    driverEarnings: Math.round(driverEarnings * 100) / 100,
    commissionRate: PricingConfig.commission
  };
};

const getSurgeMultiplier = (rideType, activeRequestsCount, availableDriversCount) => {
  const config = PricingConfig[rideType];
  const ratio = activeRequestsCount / Math.max(availableDriversCount, 1);

  if (ratio >= config.surgeThreshold) {
    return config.surgeMultiplier;
  }
  return 1;
};

const calculateTotalFare = (distanceMeters, durationSeconds, rideType) => {
  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;
  return calculateFare(rideType, distanceKm, durationMinutes);
};

module.exports = { PricingConfig, calculateFare, calculateTotalFare, calculateCommission, getSurgeMultiplier };

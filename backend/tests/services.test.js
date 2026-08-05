const { calculateFare, calculateCommission, getSurgeMultiplier } = require('../services/pricingService');
const { findNearbyDrivers, calculateDistance, calculateETA } = require('../services/rideMatchingService');
const { generateOTP } = require('../services/smsService');

describe('Pricing Service', () => {
  describe('calculateFare', () => {
    it('should calculate intra-city fare', () => {
      const fare = calculateFare('intra_city', 5, 10);
      expect(fare.baseFare).toEqual(50);
      expect(fare.distanceFare).toEqual(75);
      expect(fare.timeFare).toEqual(20);
      expect(fare.totalFare).toBeGreaterThan(0);
    });

    it('should calculate intercity fare', () => {
      const fare = calculateFare('intercity', 50, 60);
      expect(fare.baseFare).toEqual(150);
      expect(fare.distanceFare).toEqual(1000);
      expect(fare.totalFare).toBeGreaterThan(0);
    });

    it('should apply surge pricing', () => {
      const fare = calculateFare('intra_city', 5, 10, 1.5);
      expect(fare.surgeMultiplier).toEqual(1.5);
      expect(fare.totalFare).toBeGreaterThan(0);
    });

    it('should enforce minimum fare', () => {
      const fare = calculateFare('intra_city', 0.1, 1);
      expect(fare.totalFare).toBeGreaterThanOrEqual(fare.minimumFare);
    });
  });

  describe('calculateCommission', () => {
    it('should calculate commission correctly', () => {
      const result = calculateCommission(100);
      expect(result.platformCommission).toEqual(15);
      expect(result.driverEarnings).toEqual(85);
    });

    it('should handle zero amount', () => {
      const result = calculateCommission(0);
      expect(result.platformCommission).toEqual(0);
      expect(result.driverEarnings).toEqual(0);
    });
  });

  describe('getSurgeMultiplier', () => {
    it('should return 1 when demand is low', () => {
      const multiplier = getSurgeMultiplier('intra_city', 5, 10);
      expect(multiplier).toEqual(1);
    });

    it('should return surge when demand is high', () => {
      const multiplier = getSurgeMultiplier('intra_city', 10, 5);
      expect(multiplier).toBeGreaterThan(1);
    });
  });
});

describe('Ride Matching Service', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const distance = calculateDistance(9.58, 41.85, 9.59, 41.86);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(5000);
    });
  });

  describe('calculateETA', () => {
    it('should calculate ETA based on distance', () => {
      const eta = calculateETA(5000);
      expect(eta).toBeGreaterThan(0);
      expect(eta).toBeLessThan(60);
    });
  });
});

describe('SMS Service', () => {
  describe('generateOTP', () => {
    it('should generate 6-digit OTP', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(/^\d+$/.test(otp)).toBe(true);
    });

    it('should generate unique OTPs', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      expect(otp1).not.toEqual(otp2);
    });
  });
});

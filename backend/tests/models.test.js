const mongoose = require('mongoose');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const RideRequest = require('../models/RideRequest');
const Trip = require('../models/Trip');
const Payment = require('../models/Payment');
const Rating = require('../models/Rating');
const Notification = require('../models/Notification');
const SOSAlert = require('../models/SOSAlert');

describe('Database Models', () => {
  beforeAll(async () => {
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/dirs_test';
    await mongoose.connect(url);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('User Model', () => {
    it('should create a new user', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+251911111111',
        password: 'password123',
        role: 'passenger'
      });

      const savedUser = await user.save();
      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toEqual('John');
      expect(savedUser.phoneNumber).toEqual('+251911111111');
    });

    it('should hash password', async () => {
      const user = await User.findOne({ phoneNumber: '+251911111111' }).select('+password');
      expect(user.password).not.toEqual('password123');
    });

    it('should compare password', async () => {
      const user = await User.findOne({ phoneNumber: '+251911111111' }).select('+password');
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should not save without required fields', async () => {
      const user = new User({});
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Vehicle Model', () => {
    let driverId;

    beforeAll(async () => {
      const driver = await Driver.create({
        user: new mongoose.Types.ObjectId(),
        licenseNumber: 'DL123456',
        licenseExpiry: new Date('2025-12-31'),
        nationalId: 'ID123456'
      });
      driverId = driver._id;
    });

    it('should create a vehicle', async () => {
      const vehicle = new Vehicle({
        driver: driverId,
        vehicleType: 'car',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'White',
        plateNumber: 'A123456',
        registrationExpiry: new Date('2025-12-31'),
        capacity: 4
      });

      const savedVehicle = await vehicle.save();
      expect(savedVehicle._id).toBeDefined();
      expect(savedVehicle.make).toEqual('Toyota');
    });
  });

  describe('RideRequest Model', () => {
    it('should create a ride request', async () => {
      const rideRequest = new RideRequest({
        passenger: new mongoose.Types.ObjectId(),
        rideType: 'intra_city',
        pickupLocation: {
          address: 'Test Pickup',
          coordinates: {
            type: 'Point',
            coordinates: [41.85, 9.58]
          }
        },
        dropoffLocation: {
          address: 'Test Dropoff',
          coordinates: {
            type: 'Point',
            coordinates: [41.86, 9.59]
          }
        },
        route: {
          distance: 5000,
          duration: 600
        },
        estimatedFare: 125
      });

      const savedRideRequest = await rideRequest.save();
      expect(savedRideRequest._id).toBeDefined();
      expect(savedRideRequest.status).toEqual('pending');
    });
  });

  describe('Payment Model', () => {
    it('should generate receipt number', async () => {
      const payment = new Payment({
        trip: new mongoose.Types.ObjectId(),
        passenger: new mongoose.Types.ObjectId(),
        driver: new mongoose.Types.ObjectId(),
        amount: 150,
        method: 'cash',
        status: 'completed'
      });

      const savedPayment = await payment.save();
      expect(savedPayment.receiptNumber).toBeDefined();
      expect(savedPayment.receiptNumber).toMatch(/^DIRS-/);
    });
  });
});

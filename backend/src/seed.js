const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    tls: true,
    tlsAllowInvalidCertificates: true,
  });
  console.log('Connected to MongoDB Atlas');
};

// Simple schemas for seeding
const userSchema = new mongoose.Schema({
  firstName: String, lastName: String, phoneNumber: String, email: String,
  password: String, role: String, isVerified: Boolean, isActive: Boolean,
  preferredLanguage: String, averageRating: Number,
  emergencyContacts: [{ name: String, phone: String, relationship: String }],
  favoriteLocations: [{ name: String, address: String, coordinates: [Number] }]
}, { timestamps: true });

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  licenseNumber: String, licenseExpiry: Date, nationalId: String,
  verificationStatus: String, isAvailable: Boolean,
  totalTrips: Number, totalEarnings: Number, availableBalance: Number
}, { timestamps: true });

const vehicleSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicleType: String, make: String, model: String, year: Number,
  color: String, plateNumber: String, capacity: Number, serviceType: String
}, { timestamps: true });

const rideRequestSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rideType: String,
  pickupLocation: { type: { type: String }, coordinates: [Number], address: String },
  dropoffLocation: { type: { type: String }, coordinates: [Number], address: String },
  status: String, fare: { base: Number, distance: Number, total: Number, driverEarnings: Number, platformCommission: Number }
}, { timestamps: true });

const tripSchema = new mongoose.Schema({
  rideRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'RideRequest' },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  status: String,
  pickupLocation: { type: { type: String }, coordinates: [Number], address: String },
  dropoffLocation: { type: { type: String }, coordinates: [Number], address: String },
  actualDistance: Number, actualDuration: Number,
  fare: { total: Number, driverEarnings: Number, platformCommission: Number }
}, { timestamps: true });

const paymentSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  amount: Number, method: String, status: String,
  platformCommission: Number, driverEarnings: Number
}, { timestamps: true });

const ratingSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ratee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: Number, comment: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Driver = mongoose.model('Driver', driverSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const RideRequest = mongoose.model('RideRequest', rideRequestSchema);
const Trip = mongoose.model('Trip', tripSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Rating = mongoose.model('Rating', ratingSchema);

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Driver.deleteMany({});
    await Vehicle.deleteMany({});
    await RideRequest.deleteMany({});
    await Trip.deleteMany({});
    await Payment.deleteMany({});
    await Rating.deleteMany({});
    console.log('Cleared existing data');

    const hashPassword = async (pw) => await bcrypt.hash(pw, 10);

    // Create Users
    const admin = await User.create({
      firstName: 'Admin', lastName: 'DIRS', phoneNumber: '+251933333333',
      email: 'admin@dirs.com', password: await hashPassword('password123'),
      role: 'admin', isVerified: true, isActive: true, preferredLanguage: 'en'
    });

    const passenger1 = await User.create({
      firstName: 'Sara', lastName: 'Ahmed', phoneNumber: '+251911111111',
      email: 'sara@email.com', password: await hashPassword('password123'),
      role: 'passenger', isVerified: true, isActive: true, preferredLanguage: 'en',
      averageRating: 4.9,
      emergencyContacts: [{ name: 'Ahmed Hassan', phone: '+251922222222', relationship: 'Brother' }],
      favoriteLocations: [
        { name: 'Home', address: 'Kezira, Dire Dawa', coordinates: [9.1895, 41.8600] },
        { name: 'University', address: 'Dire Dawa University', coordinates: [9.2010, 41.8550] }
      ]
    });

    const passenger2 = await User.create({
      firstName: 'Fatima', lastName: 'Berhanu', phoneNumber: '+251944444444',
      email: 'fatima@email.com', password: await hashPassword('password123'),
      role: 'passenger', isVerified: true, isActive: true, preferredLanguage: 'am',
      averageRating: 4.7
    });

    const passenger3 = await User.create({
      firstName: 'John', lastName: 'Dawit', phoneNumber: '+251955555555',
      email: 'john@email.com', password: await hashPassword('password123'),
      role: 'passenger', isVerified: true, isActive: true, preferredLanguage: 'en',
      averageRating: 4.5
    });

    const driverUser1 = await User.create({
      firstName: 'Ahmed', lastName: 'Hassan', phoneNumber: '+251922222222',
      email: 'ahmed@email.com', password: await hashPassword('password123'),
      role: 'driver', isVerified: true, isActive: true, preferredLanguage: 'en',
      averageRating: 4.8
    });

    const driverUser2 = await User.create({
      firstName: 'Mohan', lastName: 'Gebremedhin', phoneNumber: '+251966666666',
      email: 'mohan@email.com', password: await hashPassword('password123'),
      role: 'driver', isVerified: true, isActive: true, preferredLanguage: 'am',
      averageRating: 4.6
    });

    const driverUser3 = await User.create({
      firstName: 'Abel', lastName: 'Tadesse', phoneNumber: '+251977777777',
      email: 'abel@email.com', password: await hashPassword('password123'),
      role: 'driver', isVerified: false, isActive: true, preferredLanguage: 'en'
    });

    console.log('Users created');

    // Create Drivers
    const driver1 = await Driver.create({
      user: driverUser1._id, licenseNumber: 'DIR-2024-001',
      licenseExpiry: new Date('2027-12-31'), nationalId: 'ID-123456',
      verificationStatus: 'verified', isAvailable: true,
      totalTrips: 342, totalEarnings: 45000, availableBalance: 8500
    });

    const driver2 = await Driver.create({
      user: driverUser2._id, licenseNumber: 'DIR-2024-002',
      licenseExpiry: new Date('2027-06-30'), nationalId: 'ID-789012',
      verificationStatus: 'verified', isAvailable: true,
      totalTrips: 189, totalEarnings: 28000, availableBalance: 4200
    });

    const driver3 = await Driver.create({
      user: driverUser3._id, licenseNumber: 'DIR-2024-003',
      licenseExpiry: new Date('2028-03-15'), nationalId: 'ID-345678',
      verificationStatus: 'pending', isAvailable: false,
      totalTrips: 0, totalEarnings: 0, availableBalance: 0
    });

    console.log('Drivers created');

    // Create Vehicles
    const vehicle1 = await Vehicle.create({
      driver: driver1._id, vehicleType: 'car', make: 'Toyota', model: 'Vitz',
      year: 2021, color: 'Blue', plateNumber: 'D1-2345', capacity: 4, serviceType: 'both'
    });

    const vehicle2 = await Vehicle.create({
      driver: driver2._id, vehicleType: 'car', make: 'Toyota', model: 'Corolla',
      year: 2020, color: 'Silver', plateNumber: 'D2-3456', capacity: 4, serviceType: 'intra_city'
    });

    console.log('Vehicles created');

    // Create Ride Requests & Trips
    const rideData = [
      { passenger: passenger1._id, pickup: [9.1895, 41.8600], pickupAddr: 'Kezira, Dire Dawa', dropoff: [9.2010, 41.8550], dropoffAddr: 'Dire Dawa Airport', dist: 4.2, dur: 12, fare: 65 },
      { passenger: passenger1._id, pickup: [9.1950, 41.8620], pickupAddr: 'Dire Dawa Market', dropoff: [9.1800, 41.8580], dropoffAddr: 'University Campus', dist: 2.8, dur: 8, fare: 45 },
      { passenger: passenger2._id, pickup: [9.1920, 41.8640], pickupAddr: 'Abbay Hotel', dropoff: [9.1980, 41.8560], dropoffAddr: 'City Center', dist: 1.5, dur: 5, fare: 35 },
      { passenger: passenger2._id, pickup: [9.1870, 41.8610], pickupAddr: 'Bus Station', dropoff: [9.2050, 41.8530], dropoffAddr: 'Industrial Zone', dist: 5.1, dur: 15, fare: 80 },
      { passenger: passenger3._id, pickup: [9.1940, 41.8590], pickupAddr: 'Mekelle Square', dropoff: [9.1860, 41.8650], dropoffAddr: 'Shoa Supermarket', dist: 1.8, dur: 6, fare: 38 },
    ];

    const driverUsers = [driverUser1, driverUser2];
    const drivers = [driver1, driver2];
    const vehicles = [vehicle1, vehicle2];

    for (let i = 0; i < rideData.length; i++) {
      const d = rideData[i];
      const idx = i % 2;
      
      const rr = await RideRequest.create({
        passenger: d.passenger, rideType: 'standard',
        pickupLocation: { type: 'Point', coordinates: d.pickup, address: d.pickupAddr },
        dropoffLocation: { type: 'Point', coordinates: d.dropoff, address: d.dropoffAddr },
        status: 'completed',
        fare: { base: 35, distance: d.dist * 15, total: d.fare, driverEarnings: Math.round(d.fare * 0.85), platformCommission: Math.round(d.fare * 0.15) }
      });

      const trip = await Trip.create({
        rideRequest: rr._id, passenger: d.passenger, driver: drivers[idx]._id, vehicle: vehicles[idx]._id,
        status: 'completed',
        pickupLocation: { type: 'Point', coordinates: d.pickup, address: d.pickupAddr },
        dropoffLocation: { type: 'Point', coordinates: d.dropoff, address: d.dropoffAddr },
        actualDistance: d.dist, actualDuration: d.dur,
        fare: { total: d.fare, driverEarnings: Math.round(d.fare * 0.85), platformCommission: Math.round(d.fare * 0.15) }
      });

      await Payment.create({
        trip: trip._id, passenger: d.passenger, driver: drivers[idx]._id,
        amount: d.fare, method: i % 3 === 0 ? 'cash' : i % 3 === 1 ? 'telebirr' : 'chapa',
        status: 'completed',
        platformCommission: Math.round(d.fare * 0.15), driverEarnings: Math.round(d.fare * 0.85)
      });

      await Rating.create({
        trip: trip._id, rater: d.passenger, ratee: driverUsers[idx]._id,
        rating: 4 + Math.floor(Math.random() * 2), comment: 'Great ride!'
      });
    }

    console.log('Trips, Payments, Ratings created');
    console.log('\n--- SEED COMPLETE ---');
    console.log('\nTest Accounts:');
    console.log('Passenger: +251911111111 / password123');
    console.log('Driver:    +251922222222 / password123');
    console.log('Admin:     +251933333333 / password123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();

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

const userSchema = new mongoose.Schema({
  firstName: String, lastName: String, phoneNumber: String, email: String,
  password: String, role: String, isVerified: Boolean, isActive: Boolean, isOnline: Boolean,
  preferredLanguage: String, averageRating: Number, totalRatings: Number,
  currentLocation: { type: { type: String }, coordinates: [Number], updatedAt: Date },
  emergencyContacts: [{ name: String, phoneNumber: String, relationship: String }],
  favoriteLocations: [{ name: String, address: String, location: { type: { type: String }, coordinates: [Number] } }],
  referralCode: String, referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  credits: Number, totalCreditsEarned: Number
}, { timestamps: true });

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  licenseNumber: String, licenseExpiry: Date, licensePhoto: String,
  nationalId: String, nationalIdPhoto: String,
  verificationStatus: String, isAvailable: Boolean,
  currentTrip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
  totalTrips: Number, totalEarnings: Number, availableBalance: Number
}, { timestamps: true });

const vehicleSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicleType: String, make: String, model: String, year: Number,
  color: String, plateNumber: String, capacity: Number, serviceType: String,
  registrationExpiry: Date, registrationPhoto: String, vehiclePhoto: String, isActive: Boolean
}, { timestamps: true });

const rideRequestSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rideType: String,
  pickupLocation: { address: String, coordinates: { type: { type: String }, coordinates: [Number] } },
  dropoffLocation: { address: String, coordinates: { type: { type: String }, coordinates: [Number] } },
  route: { distance: Number, duration: Number },
  estimatedFare: Number, status: String,
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  paymentMethod: String,
  cancelledBy: { type: String, enum: ['passenger', 'driver', 'system', null], default: null },
  cancellationReason: String
}, { timestamps: true });

const tripSchema = new mongoose.Schema({
  rideRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'RideRequest' },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  status: String,
  rideType: String,
  pickupLocation: { address: String, coordinates: [Number] },
  dropoffLocation: { address: String, coordinates: [Number] },
  actualDistance: Number, actualDuration: Number,
  startTime: Date, endTime: Date,
  fare: { baseFare: Number, distanceFare: Number, timeFare: Number, totalFare: Number, currency: String }
}, { timestamps: true });

const paymentSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  amount: Number, currency: String, method: String, status: String,
  platformCommission: Number, driverEarnings: Number,
  receiptNumber: String, paidAt: Date
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

const referralSchema = new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCode: String,
  bonusAwarded: Number,
  friendBonusAwarded: Number,
  status: String,
  referredUserCompletedFirstTrip: Boolean,
  completedAt: Date
}, { timestamps: true });

const Referral = mongoose.model('Referral', referralSchema);

const seed = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Driver.deleteMany({});
    await Vehicle.deleteMany({});
    await RideRequest.deleteMany({});
    await Trip.deleteMany({});
    await Payment.deleteMany({});
    await Rating.deleteMany({});
    await Referral.deleteMany({});
    console.log('Cleared existing data');

    const hash = async (pw) => await bcrypt.hash(pw, 10);

    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    // ── USERS ───────────────────────────────────────────────────
    const passenger1 = await User.create({
      firstName: 'Sara', lastName: 'Ahmed', phoneNumber: '+251911111111',
      email: 'sara@email.com', password: await hash('password123'),
      role: 'passenger', isVerified: true, isActive: true, preferredLanguage: 'en',
      averageRating: 4.9, totalRatings: 12,
      currentLocation: { type: 'Point', coordinates: [9.6009, 41.8508], updatedAt: now },
      emergencyContacts: [{ name: 'Ahmed Hassan', phoneNumber: '+251922222222', relationship: 'Brother' }],
      favoriteLocations: [
        { name: 'Home', address: 'Kezira, Dire Dawa', location: { type: 'Point', coordinates: [9.6009, 41.8508] } },
        { name: 'Work', address: 'Dire Dawa University', location: { type: 'Point', coordinates: [9.6150, 41.8600] } }
      ],
      referralCode: 'DIRS-SARA2026', credits: 100, totalCreditsEarned: 100
    });

    const passenger2 = await User.create({
      firstName: 'Fatima', lastName: 'Berhanu', phoneNumber: '+251944444444',
      email: 'fatima@email.com', password: await hash('password123'),
      role: 'passenger', isVerified: true, isActive: true, preferredLanguage: 'am',
      averageRating: 4.7, totalRatings: 8,
      currentLocation: { type: 'Point', coordinates: [9.6020, 41.8560], updatedAt: now },
      referralCode: 'DIRS-FATI2026', credits: 30, totalCreditsEarned: 30
    });

    const passenger3 = await User.create({
      firstName: 'John', lastName: 'Dawit', phoneNumber: '+251955555555',
      email: 'john@email.com', password: await hash('password123'),
      role: 'passenger', isVerified: true, isActive: true, preferredLanguage: 'en',
      averageRating: 4.5, totalRatings: 5,
      currentLocation: { type: 'Point', coordinates: [9.6050, 41.8620], updatedAt: now },
      referralCode: 'DIRS-JOHN2026', referredBy: null, credits: 0, totalCreditsEarned: 0
    });

    const driverUser1 = await User.create({
      firstName: 'Ahmed', lastName: 'Hassan', phoneNumber: '+251922222222',
      email: 'ahmed@email.com', password: await hash('password123'),
      role: 'driver', isVerified: true, isActive: true, isOnline: true, preferredLanguage: 'en',
      averageRating: 4.8, totalRatings: 156,
      currentLocation: { type: 'Point', coordinates: [9.6050, 41.8530], updatedAt: now },
      referralCode: 'DIRS-AHME2026', credits: 0, totalCreditsEarned: 0
    });

    const driverUser2 = await User.create({
      firstName: 'Mohan', lastName: 'Gebremedhin', phoneNumber: '+251966666666',
      email: 'mohan@email.com', password: await hash('password123'),
      role: 'driver', isVerified: true, isActive: true, isOnline: true, preferredLanguage: 'am',
      averageRating: 4.6, totalRatings: 98,
      currentLocation: { type: 'Point', coordinates: [9.5980, 41.8550], updatedAt: now },
      referralCode: 'DIRS-MOHA2026', credits: 0, totalCreditsEarned: 0
    });

    const driverUser3 = await User.create({
      firstName: 'Abel', lastName: 'Tadesse', phoneNumber: '+251977777777',
      email: 'abel@email.com', password: await hash('password123'),
      role: 'driver', isVerified: true, isActive: true, isOnline: true, preferredLanguage: 'en',
      averageRating: 4.3, totalRatings: 45,
      currentLocation: { type: 'Point', coordinates: [9.6100, 41.8480], updatedAt: now },
      referralCode: 'DIRS-ABEL2026', credits: 0, totalCreditsEarned: 0
    });

    const driverUser4 = await User.create({
      firstName: 'Hana', lastName: 'Mekonnen', phoneNumber: '+251988888888',
      email: 'hana@email.com', password: await hash('password123'),
      role: 'driver', isVerified: true, isActive: true, isOnline: true, preferredLanguage: 'en',
      averageRating: 4.9, totalRatings: 210,
      currentLocation: { type: 'Point', coordinates: [9.5920, 41.8620], updatedAt: now },
      referralCode: 'DIRS-HANA2026', credits: 0, totalCreditsEarned: 0
    });

    const admin = await User.create({
      firstName: 'Admin', lastName: 'DIRS', phoneNumber: '+251933333333',
      email: 'admin@dirs.com', password: await hash('password123'),
      role: 'admin', isVerified: true, isActive: true, preferredLanguage: 'en',
      currentLocation: { type: 'Point', coordinates: [9.6009, 41.8508], updatedAt: now },
      referralCode: 'DIRS-ADMI2026', credits: 0, totalCreditsEarned: 0
    });

    console.log('Users created');

    // ── DRIVERS ─────────────────────────────────────────────────
    const driver1 = await Driver.create({
      user: driverUser1._id, licenseNumber: 'DIR-2024-001',
      licenseExpiry: new Date('2027-12-31'), licensePhoto: 'https://example.com/license1.jpg',
      nationalId: 'ID-123456', nationalIdPhoto: 'https://example.com/id1.jpg',
      verificationStatus: 'approved', isAvailable: true,
      totalTrips: 342, totalEarnings: 45000, availableBalance: 8500
    });

    const driver2 = await Driver.create({
      user: driverUser2._id, licenseNumber: 'DIR-2024-002',
      licenseExpiry: new Date('2027-06-30'), licensePhoto: 'https://example.com/license2.jpg',
      nationalId: 'ID-789012', nationalIdPhoto: 'https://example.com/id2.jpg',
      verificationStatus: 'approved', isAvailable: true,
      totalTrips: 189, totalEarnings: 28000, availableBalance: 4200
    });

    const driver3 = await Driver.create({
      user: driverUser3._id, licenseNumber: 'DIR-2024-003',
      licenseExpiry: new Date('2028-03-15'), licensePhoto: 'https://example.com/license3.jpg',
      nationalId: 'ID-345678', nationalIdPhoto: 'https://example.com/id3.jpg',
      verificationStatus: 'approved', isAvailable: true,
      totalTrips: 45, totalEarnings: 6800, availableBalance: 1200
    });

    const driver4 = await Driver.create({
      user: driverUser4._id, licenseNumber: 'DIR-2024-004',
      licenseExpiry: new Date('2027-09-30'), licensePhoto: 'https://example.com/license4.jpg',
      nationalId: 'ID-901234', nationalIdPhoto: 'https://example.com/id4.jpg',
      verificationStatus: 'approved', isAvailable: true,
      totalTrips: 210, totalEarnings: 32000, availableBalance: 5600
    });

    console.log('Drivers created');

    // ── VEHICLES ────────────────────────────────────────────────
    const vehicle1 = await Vehicle.create({
      driver: driver1._id, vehicleType: 'car', make: 'Toyota', model: 'Vitz',
      year: 2021, color: 'Blue', plateNumber: 'D1-2345', capacity: 4,
      serviceType: 'both', registrationExpiry: new Date('2027-12-31'),
      registrationPhoto: 'https://example.com/reg1.jpg', vehiclePhoto: 'https://example.com/veh1.jpg',
      isActive: true
    });

    const vehicle2 = await Vehicle.create({
      driver: driver2._id, vehicleType: 'car', make: 'Toyota', model: 'Corolla',
      year: 2020, color: 'Silver', plateNumber: 'D2-3456', capacity: 4,
      serviceType: 'both', registrationExpiry: new Date('2027-06-30'),
      registrationPhoto: 'https://example.com/reg2.jpg', vehiclePhoto: 'https://example.com/veh2.jpg',
      isActive: true
    });

    const vehicle3 = await Vehicle.create({
      driver: driver3._id, vehicleType: 'bajaj', make: 'Bajaj', model: 'RE',
      year: 2022, color: 'Yellow', plateNumber: 'D3-4567', capacity: 3,
      serviceType: 'intra_city', registrationExpiry: new Date('2028-03-15'),
      registrationPhoto: 'https://example.com/reg3.jpg', vehiclePhoto: 'https://example.com/veh3.jpg',
      isActive: true
    });

    const vehicle4 = await Vehicle.create({
      driver: driver4._id, vehicleType: 'minivan', make: 'Hyundai', model: 'H1',
      year: 2023, color: 'White', plateNumber: 'D4-5678', capacity: 7,
      serviceType: 'both', registrationExpiry: new Date('2027-09-30'),
      registrationPhoto: 'https://example.com/reg4.jpg', vehiclePhoto: 'https://example.com/veh4.jpg',
      isActive: true
    });

    console.log('Vehicles created');

    // ── RIDE REQUESTS + TRIPS + PAYMENTS + RATINGS ──────────────
    const driverUsers = [driverUser1, driverUser2, driverUser3, driverUser4];
    const drivers = [driver1, driver2, driver3, driver4];
    const vehicles = [vehicle1, vehicle2, vehicle3, vehicle4];

    const rideData = [
      { passenger: passenger1, pickup: [9.6009, 41.8508], pickupAddr: 'Kezira, Dire Dawa', dropoff: [9.6150, 41.8600], dropoffAddr: 'Dire Dawa University', dist: 2.1, dur: 8, fare: 55, method: 'cash', daysAgo: 1, rating: 5, comment: 'Great driving, very friendly!' },
      { passenger: passenger1, pickup: [9.5980, 41.8550], pickupAddr: 'Dire Dawa Market', dropoff: [9.6200, 41.8450], dropoffAddr: 'Dire Dawa Airport', dist: 4.5, dur: 14, fare: 95, method: 'telebirr', daysAgo: 2, rating: 4, comment: 'Good ride, on time' },
      { passenger: passenger1, pickup: [9.6050, 41.8600], pickupAddr: 'Abbay Hotel', dropoff: [9.3115, 42.1199], dropoffAddr: 'Harar Jugol', dist: 52.0, dur: 55, fare: 1200, method: 'chapa', daysAgo: 3, rating: 5, comment: 'Comfortable intercity trip' },
      { passenger: passenger1, pickup: [9.5920, 41.8620], pickupAddr: 'Bus Station', dropoff: [9.6009, 41.8508], dropoffAddr: 'Kezira, Dire Dawa', dist: 1.8, dur: 6, fare: 40, method: 'cash', daysAgo: 4, rating: 4, comment: 'Nice and clean' },
      { passenger: passenger1, pickup: [9.6100, 41.8480], pickupAddr: 'Industrial Zone', dropoff: [9.5800, 41.8700], dropoffAddr: 'Hawelwala', dist: 3.5, dur: 10, fare: 70, method: 'telebirr', daysAgo: 5, rating: 5, comment: 'Fast and safe ride' },
      { passenger: passenger1, pickup: [9.6080, 41.8530], pickupAddr: 'Sheikh Hassan', dropoff: [9.6200, 41.8650], dropoffAddr: 'Addis Ketema', dist: 2.8, dur: 9, fare: 60, method: 'cash', daysAgo: 7, rating: 4, comment: 'Good trip' },
      { passenger: passenger1, pickup: [9.5950, 41.8570], pickupAddr: 'Shoa Supermarket', dropoff: [9.3115, 42.1199], dropoffAddr: 'Harar', dist: 51.5, dur: 52, fare: 1150, method: 'chapa', daysAgo: 10, rating: 5, comment: 'Excellent service' },
      { passenger: passenger1, pickup: [9.6120, 41.8590], pickupAddr: 'Mekelle Square', dropoff: [9.5980, 41.8480], dropoffAddr: 'Ras Mekonnen', dist: 1.5, dur: 5, fare: 35, method: 'cash', daysAgo: 12, rating: 3, comment: 'Average ride' },
      // Some trips for passenger2
      { passenger: passenger2, pickup: [9.6020, 41.8560], pickupAddr: 'Dire Dawa Hotel', dropoff: [9.6150, 41.8600], dropoffAddr: 'University Campus', dist: 2.5, dur: 7, fare: 50, method: 'telebirr', daysAgo: 1, rating: 5, comment: 'Very polite driver' },
      { passenger: passenger2, pickup: [9.5980, 41.8530], pickupAddr: 'Market Area', dropoff: [9.6200, 41.8450], dropoffAddr: 'Airport Road', dist: 3.8, dur: 12, fare: 80, method: 'cash', daysAgo: 3, rating: 4, comment: 'Good' },
      // Some trips for passenger3
      { passenger: passenger3, pickup: [9.6050, 41.8620], pickupAddr: 'Edna Mall', dropoff: [9.5920, 41.8500], dropoffAddr: 'Kezira', dist: 2.0, dur: 7, fare: 45, method: 'chapa', daysAgo: 2, rating: 4, comment: 'Nice ride' },
      { passenger: passenger3, pickup: [9.6100, 41.8480], pickupAddr: 'Dillu', dropoff: [9.3115, 42.1199], dropoffAddr: 'Harar', dist: 53.0, dur: 58, fare: 1250, method: 'telebirr', daysAgo: 6, rating: 5, comment: 'Perfect intercity ride' },
    ];

    for (let i = 0; i < rideData.length; i++) {
      const d = rideData[i];
      const driverIdx = i % 4;
      const driverUser = driverUsers[driverIdx];
      const driverDoc = drivers[driverIdx];
      const vehicleDoc = vehicles[driverIdx];

      const distMeters = Math.round(d.dist * 1000);
      const durSeconds = d.dur * 60;
      const baseFare = 25 + Math.round(d.dist * 5);
      const distFare = Math.round(d.dist * 15);
      const timeFare = Math.round(d.dur * 2);
      const totalFare = d.fare;
      const platformFee = Math.round(totalFare * 0.15);
      const driverEarnings = totalFare - platformFee;

      const createdAt = daysAgo(d.daysAgo);

      const rr = await RideRequest.create({
        passenger: d.passenger._id,
        rideType: d.dist > 20 ? 'intercity' : 'intra_city',
        pickupLocation: {
          address: d.pickupAddr,
          coordinates: { type: 'Point', coordinates: d.pickup }
        },
        dropoffLocation: {
          address: d.dropoffAddr,
          coordinates: { type: 'Point', coordinates: d.dropoff }
        },
        route: { distance: distMeters, duration: durSeconds },
        estimatedFare: totalFare,
        status: 'completed',
        driver: driverDoc._id,
        vehicle: vehicleDoc._id,
        paymentMethod: d.method,
        createdAt
      });

      const trip = await Trip.create({
        rideRequest: rr._id,
        passenger: d.passenger._id,
        driver: driverDoc._id,
        vehicle: vehicleDoc._id,
        status: 'completed',
        rideType: d.dist > 20 ? 'intercity' : 'intra_city',
        pickupLocation: { address: d.pickupAddr, coordinates: d.pickup },
        dropoffLocation: { address: d.dropoffAddr, coordinates: d.dropoff },
        actualDistance: d.dist,
        actualDuration: d.dur,
        startTime: new Date(createdAt.getTime() + 2 * 60 * 1000),
        endTime: new Date(createdAt.getTime() + d.dur * 60 * 1000),
        fare: { baseFare, distanceFare: distFare, timeFare, totalFare, currency: 'ETB' },
        createdAt
      });

      await Payment.create({
        trip: trip._id,
        passenger: d.passenger._id,
        driver: driverDoc._id,
        amount: totalFare,
        currency: 'ETB',
        method: d.method,
        status: 'completed',
        platformCommission: platformFee,
        driverEarnings,
        receiptNumber: `DIRS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        paidAt: new Date(createdAt.getTime() + d.dur * 60 * 1000),
        createdAt
      });

      await Rating.create({
        trip: trip._id,
        rater: d.passenger._id,
        ratee: driverUser._id,
        rating: d.rating,
        comment: d.comment,
        createdAt
      });
    }

    // Create a few completed ride requests for history
    const activeRR = await RideRequest.create({
      passenger: passenger2._id,
      rideType: 'intra_city',
      pickupLocation: { address: 'Kezira, Dire Dawa', coordinates: { type: 'Point', coordinates: [9.6009, 41.8508] } },
      dropoffLocation: { address: 'Dire Dawa Market', coordinates: { type: 'Point', coordinates: [9.5980, 41.8550] } },
      route: { distance: 1200, duration: 360 },
      estimatedFare: 45,
      status: 'completed',
      driver: driver1._id,
      vehicle: vehicle1._id,
      paymentMethod: 'cash'
    });

    await Trip.create({
      rideRequest: activeRR._id,
      passenger: passenger2._id,
      driver: driver1._id,
      vehicle: vehicle1._id,
      status: 'completed',
      rideType: 'intra_city',
      pickupLocation: { address: 'Kezira, Dire Dawa', coordinates: [9.6009, 41.8508] },
      dropoffLocation: { address: 'Dire Dawa Market', coordinates: [9.5980, 41.8550] },
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
      fare: { baseFare: 25, distanceFare: 18, timeFare: 2, totalFare: 45, currency: 'ETB' }
    });

    console.log('Trips, Payments, Ratings created');

    // ── REFERRALS ─────────────────────────────────────────────
    await Referral.create({
      referrer: passenger1._id,
      referredUser: passenger2._id,
      referralCode: 'DIRS-SARA2026',
      bonusAwarded: 50,
      friendBonusAwarded: 30,
      status: 'completed',
      referredUserCompletedFirstTrip: true,
      completedAt: daysAgo(5)
    });
    console.log('Referrals created');

    console.log(`\n--- SEED COMPLETE ---`);
    console.log(`\nTest Accounts:`);
    console.log(`Passenger: +251911111111 / password123 (Sara - 8 trips, code: DIRS-SARA2026)`);
    console.log(`Passenger: +251944444444 / password123 (Fatima - 3 trips, code: DIRS-FATI2026)`);
    console.log(`Passenger: +251955555555 / password123 (John - 2 trips, code: DIRS-JOHN2026)`);
    console.log(`Driver:    +251922222222 / password123 (Ahmed - Toyota Vitz, code: DIRS-AHME2026)`);
    console.log(`Driver:    +251966666666 / password123 (Mohan - Toyota Corolla, code: DIRS-MOHA2026)`);
    console.log(`Driver:    +251977777777 / password123 (Abel - Bajaj, code: DIRS-ABEL2026)`);
    console.log(`Driver:    +251988888888 / password123 (Hana - Hyundai H1, code: DIRS-HANA2026)`);
    console.log(`Admin:     +251933333333 / password123`);
    console.log(`\nReferral: Sara referred Fatima → both earned credits`);
    console.log(`4 drivers online and available near Dire Dawa`);
    console.log(`8 completed trips for Sara (passenger1)`);
    console.log(`1 active trip in progress (Fatima → Dire Dawa Market)`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();

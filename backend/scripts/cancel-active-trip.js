const mongoose = require('mongoose');
const Trip = require('../src/models/Trip');
const RideRequest = require('../src/models/RideRequest');
const Driver = require('../src/models/Driver');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cancelActiveTrip = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find active trips (not completed or cancelled)
    const activeTrips = await Trip.find({
      status: { $in: ['driver_arriving', 'driver_arrived', 'in_progress', 'accepted'] }
    }).populate('passenger driver');

    console.log(`Found ${activeTrips.length} active trips:`);
    
    for (const trip of activeTrips) {
      console.log(`- Trip ID: ${trip._id}`);
      console.log(`  Status: ${trip.status}`);
      console.log(`  Passenger: ${trip.passenger?.firstName} ${trip.passenger?.lastName}`);
      console.log(`  Driver: ${trip.driver?.user ? 'Has driver' : 'No driver'}`);
      console.log(`  Pickup: ${trip.pickup?.address}`);
      console.log(`  Dropoff: ${trip.dropoff?.address}`);
      console.log('');

      // Cancel the trip
      trip.status = 'cancelled';
      await trip.save();
      console.log(`✓ Cancelled trip ${trip._id}`);

      // Also cancel the ride request if exists
      if (trip.rideRequest) {
        const rideRequest = await RideRequest.findById(trip.rideRequest);
        if (rideRequest) {
          rideRequest.status = 'cancelled';
          rideRequest.cancelledBy = 'admin';
          rideRequest.cancellationReason = 'Cancelled by admin';
          rideRequest.cancelledAt = new Date();
          await rideRequest.save();
          console.log(`✓ Cancelled ride request ${rideRequest._id}`);
        }
      }

      // Update driver availability
      if (trip.driver) {
        const driver = await Driver.findById(trip.driver);
        if (driver) {
          driver.isAvailable = true;
          driver.currentTrip = null;
          await driver.save();
          console.log(`✓ Updated driver availability`);
        }
      }
    }

    console.log('\nAll active trips cancelled successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

cancelActiveTrip();

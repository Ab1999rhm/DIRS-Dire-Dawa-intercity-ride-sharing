require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('../src/models/Driver');
const Vehicle = require('../src/models/Vehicle');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function listDrivers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const drivers = await Driver.find()
      .populate('user', 'firstName lastName phoneNumber isOnline isActive currentLocation')
      .populate('vehicle');

    console.log('='.repeat(80));
    console.log('EXISTING DRIVERS AND THEIR VEHICLES');
    console.log('='.repeat(80));
    console.log(`Total drivers found: ${drivers.length}\n`);

    for (const driver of drivers) {
      console.log('─'.repeat(80));
      console.log(`Driver ID: ${driver._id}`);
      console.log(`Name: ${driver.user?.firstName || 'N/A'} ${driver.user?.lastName || ''}`);
      console.log(`Phone: ${driver.user?.phoneNumber || 'N/A'}`);
      console.log(`Verification Status: ${driver.verificationStatus}`);
      console.log(`Is Available: ${driver.isAvailable}`);
      console.log(`Current Trip: ${driver.currentTrip || 'None'}`);
      console.log(`Service Type: ${driver.serviceType || 'Not set'}`);
      console.log(`Intended Destination: ${driver.intendedDestination?.city || 'Not set'}`);
      console.log(`User Online: ${driver.user?.isOnline || false}`);
      console.log(`User Active: ${driver.user?.isActive || false}`);
      console.log(`User Location: ${driver.user?.currentLocation?.coordinates ? 
        `[${driver.user.currentLocation.coordinates[0]}, ${driver.user.currentLocation.coordinates[1]}]` : 'Not set'}`);
      console.log(`Location Updated: ${driver.user?.currentLocation?.updatedAt || 'Never'}`);
      
      if (driver.vehicle) {
        console.log('\nVehicle:');
        console.log(`  Type: ${driver.vehicle.vehicleType}`);
        console.log(`  Make: ${driver.vehicle.make}`);
        console.log(`  Model: ${driver.vehicle.model}`);
        console.log(`  Color: ${driver.vehicle.color}`);
        console.log(`  Plate: ${driver.vehicle.plateNumber}`);
        console.log(`  Capacity: ${driver.vehicle.capacity}`);
        console.log(`  Service Type: ${driver.vehicle.serviceType}`);
        console.log(`  Is Active: ${driver.vehicle.isActive}`);
      } else {
        console.log('\nVehicle: No vehicle assigned');
      }
      
      console.log('\n');
    }

    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    
    const onlineDrivers = drivers.filter(d => d.user?.isOnline);
    const availableDrivers = drivers.filter(d => d.isAvailable);
    const verifiedDrivers = drivers.filter(d => d.verificationStatus === 'approved');
    const withVehicle = drivers.filter(d => d.vehicle);
    const intercityDrivers = drivers.filter(d => d.serviceType === 'intercity' || d.serviceType === 'both');
    const intraCityDrivers = drivers.filter(d => d.serviceType === 'intra_city' || d.serviceType === 'both');
    
    console.log(`Online drivers: ${onlineDrivers.length}`);
    console.log(`Available drivers: ${availableDrivers.length}`);
    console.log(`Verified drivers: ${verifiedDrivers.length}`);
    console.log(`Drivers with vehicles: ${withVehicle.length}`);
    console.log(`Intercity-capable drivers: ${intercityDrivers.length}`);
    console.log(`Intra-city-capable drivers: ${intraCityDrivers.length}`);
    
    console.log('\nVehicle Types:');
    const vehicleTypes = {};
    drivers.forEach(d => {
      if (d.vehicle) {
        vehicleTypes[d.vehicle.vehicleType] = (vehicleTypes[d.vehicle.vehicleType] || 0) + 1;
      }
    });
    Object.entries(vehicleTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

listDrivers();

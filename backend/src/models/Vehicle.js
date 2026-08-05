const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['car', 'minivan', 'minibus', 'bajaj', 'bus'],
    required: [true, 'Vehicle type is required']
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required']
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required']
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
    min: 2000,
    max: new Date().getFullYear() + 1
  },
  color: {
    type: String,
    required: [true, 'Vehicle color is required']
  },
  plateNumber: {
    type: String,
    required: [true, 'Plate number is required'],
    unique: true
  },
  registrationExpiry: {
    type: Date,
    required: [true, 'Registration expiry date is required']
  },
  registrationPhoto: {
    type: String,
    required: [true, 'Registration document photo is required']
  },
  vehiclePhoto: {
    type: String,
    required: [true, 'Vehicle photo is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Seating capacity is required'],
    min: 1,
    max: 16
  },
  serviceType: {
    type: String,
    enum: ['intra_city', 'intercity', 'both'],
    default: 'both'
  },
  insuranceExpiry: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

vehicleSchema.index({ driver: 1 });
vehicleSchema.index({ plateNumber: 1 });
vehicleSchema.index({ vehicleType: 1, serviceType: 1 });

vehicleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);

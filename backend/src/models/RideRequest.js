const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema({
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rideType: {
    type: String,
    enum: ['intra_city', 'intercity'],
    required: [true, 'Ride type is required']
  },
  pickupLocation: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    placeId: String
  },
  dropoffLocation: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    placeId: String
  },
  route: {
    distance: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    polyline: String
  },
  estimatedFare: {
    type: Number,
    required: true
  },
  finalFare: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'driver_arriving', 'driver_arrived', 'in_progress', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  passengersCount: {
    type: Number,
    default: 1,
    min: 1,
    max: 6
  },
  scheduledTime: {
    type: Date,
    default: null
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['passenger', 'driver', 'system', null],
    default: null
  },
  cancelledAt: Date,
  expiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 5 * 60 * 1000);
    }
  },
  promoCode: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

rideRequestSchema.index({ passenger: 1, status: 1 });
rideRequestSchema.index({ status: 1, rideType: 1 });
rideRequestSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
rideRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

rideRequestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RideRequest', rideRequestSchema);

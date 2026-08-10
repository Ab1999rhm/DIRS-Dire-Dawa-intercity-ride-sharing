const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  rideRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RideRequest',
    required: true
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  status: {
    type: String,
    enum: ['driver_arriving', 'driver_arrived', 'in_progress', 'completed', 'cancelled'],
    default: 'driver_arriving'
  },
  pickupLocation: {
    address: String,
    coordinates: [Number]
  },
  dropoffLocation: {
    address: String,
    coordinates: [Number]
  },
  actualRoute: [{
    coordinates: [Number],
    timestamp: Date,
    speed: Number
  }],
  actualDistance: {
    type: Number,
    default: 0
  },
  actualDuration: {
    type: Number,
    default: 0
  },
  startTime: Date,
  endTime: Date,
  rideType: {
    type: String,
    enum: ['intra_city', 'intercity'],
    default: 'intra_city'
  },
  fare: {
    baseFare: Number,
    distanceFare: Number,
    timeFare: Number,
    surgeMultiplier: { type: Number, default: 1 },
    totalFare: Number,
    currency: { type: String, default: 'ETB' }
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  passengerRating: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating',
    default: null
  },
  driverRating: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating',
    default: null
  },
  responseTime: {
    type: Number,
    default: 0
  },
  hasDispute: {
    type: Boolean,
    default: false
  },
  disputeIssue: {
    type: String,
    default: null
  },
  disputeStatus: {
    type: String,
    enum: ['open', 'investigating', 'resolved'],
    default: 'open'
  },
  disputeResolution: {
    type: String,
    default: null
  },
  hasLostItem: {
    type: Boolean,
    default: false
  },
  lostItemDescription: {
    type: String,
    default: null
  },
  lostItemStatus: {
    type: String,
    enum: ['pending', 'in_transit', 'returned'],
    default: 'pending'
  },
  hasDriverIssue: {
    type: Boolean,
    default: false
  },
  driverIssueType: {
    type: String,
    default: null
  },
  driverIssueDescription: {
    type: String,
    default: null
  },
  driverIssueStatus: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  },
  driverIssueResolution: {
    type: String,
    default: null
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

tripSchema.index({ passenger: 1, createdAt: -1 });
tripSchema.index({ driver: 1, createdAt: -1 });
tripSchema.index({ status: 1 });
tripSchema.index({ createdAt: -1 });

tripSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Trip', tripSchema);

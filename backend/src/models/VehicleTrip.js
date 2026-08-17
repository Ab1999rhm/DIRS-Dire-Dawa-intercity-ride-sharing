const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatId: { type: String, required: true },
  status: {
    type: String,
    enum: ['available', 'reserved', 'occupied'],
    default: 'available'
  },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rideRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'RideRequest', default: null }
}, { _id: false });

const vehicleTripSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rideType: {
    type: String,
    enum: ['intra_city', 'intercity'],
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['car', 'minivan', 'minibus', 'bajaj', 'bus'],
    required: true
  },
  destinationCity: {
    type: String,
    default: null
  },
  departureTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['scheduled', 'boarding', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  capacity: {
    type: Number,
    required: true
  },
  seats: [seatSchema],
  farePerSeat: {
    type: Number,
    default: 0
  },
  passengers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RideRequest'
  }],
  totalCollected: {
    type: Number,
    default: 0
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

vehicleTripSchema.index({ status: 1, rideType: 1, vehicleType: 1 });
vehicleTripSchema.index({ destinationCity: 1, status: 1 });
vehicleTripSchema.index({ driver: 1, status: 1 });
vehicleTripSchema.index({ vehicle: 1, status: 1 });
vehicleTripSchema.index({ vehicle: 1, departureTime: 1, status: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['scheduled', 'boarding'] } } });

vehicleTripSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('VehicleTrip', vehicleTripSchema);

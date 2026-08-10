const mongoose = require('mongoose');

const suspiciousActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  type: {
    type: String,
    enum: ['route_deviation', 'gps_spoofing', 'speed_violation', 'unusual_booking', 'multiple_cancellations', 'no_show', 'location_jump', 'offline_long_period', 'rapid_bookings'],
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  description: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number],
    address: String
  },
  // Route deviation specific
  expectedRoute: [Number],
  actualRoute: [Number],
  deviationDistance: Number,
  // Speed violation specific
  recordedSpeed: Number,
  speedLimit: Number,
  // GPS spoofing specific
  previousLocation: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number]
  },
  distanceTraveled: Number,
  timeElapsed: Number,
  impossibleSpeed: Boolean,
  // Cancellation specific
  cancellationCount: Number,
  timeWindow: String, // '1hour', '1day', '1week'
  // No-show specific
  noShowCount: Number,
  status: {
    type: String,
    enum: ['detected', 'investigating', 'confirmed', 'false_positive', 'resolved'],
    default: 'detected'
  },
  actionTaken: {
    type: String,
    enum: ['none', 'warning_issued', 'account_suspended', 'trip_blocked', 'driver_deactivated'],
    default: 'none'
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String
});

suspiciousActivitySchema.index({ user: 1, detectedAt: -1 });
suspiciousActivitySchema.index({ driver: 1, detectedAt: -1 });
suspiciousActivitySchema.index({ status: 1 });
suspiciousActivitySchema.index({ type: 1 });
suspiciousActivitySchema.index({ severity: 1 });
suspiciousActivitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SuspiciousActivity', suspiciousActivitySchema);

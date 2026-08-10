const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reportedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  category: {
    type: String,
    enum: ['assault', 'theft', 'accident', 'harassment', 'reckless_driving', 'substance_abuse', 'vehicle_safety', 'passenger_misbehavior', 'vehicle_damage', 'fake_emergency', 'payment_evasion', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
    address: String
  },
  status: {
    type: String,
    enum: ['reported', 'investigating', 'resolved', 'escalated', 'dismissed'],
    default: 'reported'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  investigationNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  resolution: String,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  evidence: [{
    type: String, // 'image', 'video', 'audio', 'document'
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  witnesses: [{
    name: String,
    phoneNumber: String,
    statement: String
  }],
  policeReportNumber: String,
  policeNotified: {
    type: Boolean,
    default: false
  },
  ambulanceDispatched: {
    type: Boolean,
    default: false
  },
  hospitalName: String,
  hospitalLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number],
    address: String
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

incidentSchema.index({ reportedBy: 1, createdAt: -1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ category: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ location: '2dsphere' });

incidentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);

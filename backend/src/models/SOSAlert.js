const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'false_alarm'],
    default: 'active'
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: String
  },
  message: {
    type: String,
    default: 'Emergency SOS Alert'
  },
  userName: {
    type: String,
    default: ''
  },
  userPhone: {
    type: String,
    default: ''
  },
  notifiedContacts: [{
    name: String,
    phoneNumber: String,
    notifiedAt: Date,
    acknowledged: { type: Boolean, default: false }
  }],
  notifiedAdmin: {
    type: Boolean,
    default: false
  },
  adminNotifiedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

sosAlertSchema.index({ user: 1, createdAt: -1 });
sosAlertSchema.index({ status: 1 });
sosAlertSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);

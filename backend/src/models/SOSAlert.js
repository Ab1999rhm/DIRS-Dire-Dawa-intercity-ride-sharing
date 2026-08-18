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
    enum: ['active', 'responded', 'dispatched', 'resolved', 'false_alarm'],
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
  type: {
    type: String,
    enum: ['accident', 'medical', 'harassment', 'theft', 'fire', 'breakdown', 'other', 'general'],
    default: 'general'
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
  respondedAt: Date,
  dispatchedAt: Date,
  adminActions: [{
    action: { type: String, enum: ['acknowledged', 'called_user', 'dispatched_police', 'dispatched_ambulance', 'contacted_emergency_contact', 'located_user', 'other'] },
    notes: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedAt: { type: Date, default: Date.now }
  }],
  dispatchType: {
    type: String,
    enum: ['police', 'ambulance', null],
    default: null
  },
  dispatchReportNumber: {
    type: String,
    default: ''
  },
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

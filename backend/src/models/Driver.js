const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true
  },
  licenseExpiry: {
    type: Date,
    required: [true, 'License expiry date is required']
  },
  licensePhoto: {
    type: String,
    required: [true, 'License photo is required']
  },
  nationalId: {
    type: String,
    required: [true, 'National ID is required']
  },
  nationalIdPhoto: {
    type: String,
    required: [true, 'National ID photo is required']
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  documents: {
    licensePhoto: { data: String, status: { type: String, default: 'pending' }, updatedAt: Date },
    librePhoto: { data: String, status: { type: String, default: 'pending' }, updatedAt: Date },
    insurancePhoto: { data: String, status: { type: String, default: 'pending' }, updatedAt: Date },
    policeClearancePhoto: { data: String, status: { type: String, default: 'pending' }, updatedAt: Date },
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  currentTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  totalTrips: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  availableBalance: {
    type: Number,
    default: 0
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  telebirrNumber: {
    type: String
  },
  settings: {
    notifications: { type: Boolean, default: true },
    availabilityStart: { type: String, default: '08:00' },
    availabilityEnd: { type: String, default: '18:00' }
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

driverSchema.index({ user: 1 });
driverSchema.index({ verificationStatus: 1 });
driverSchema.index({ isAvailable: 1 });

driverSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Driver', driverSchema);

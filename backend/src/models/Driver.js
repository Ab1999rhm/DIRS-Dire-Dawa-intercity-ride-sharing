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
  verificationNotes: {
    type: String,
    default: null
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
  backgroundCheckStatus: {
    type: String,
    enum: ['pending', 'cleared', 'failed', 'not_required'],
    default: 'pending'
  },
  backgroundCheckDate: Date,
  safetyTrainingCompleted: {
    type: Boolean,
    default: false
  },
  safetyTrainingDate: Date,
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
  isOnline: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  suspensionReason: {
    type: String,
    default: null
  },
  banReason: {
    type: String,
    default: null
  },
  commissionRate: {
    type: Number,
    default: 10
  },
  warnings: {
    type: Number,
    default: 0
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
  completedTrips: {
    type: Number,
    default: 0
  },
  cancelledTrips: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  commissionPaid: {
    type: Number,
    default: 0
  },
  netEarnings: {
    type: Number,
    default: 0
  },
  monthlyEarnings: {
    type: Number,
    default: 0
  },
  avgResponseTime: {
    type: Number,
    default: 0
  },
  complaints: {
    type: Number,
    default: 0
  },
  warnings: {
    type: Number,
    default: 0
  },
  lostItemReports: {
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

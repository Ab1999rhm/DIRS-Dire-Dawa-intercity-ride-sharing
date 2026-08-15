const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_ride'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  maxDiscountAmount: {
    type: Number,
    default: null
  },
  minFare: {
    type: Number,
    default: 0
  },
  usageLimit: {
    type: Number,
    default: null // null = unlimited
  },
  usagePerUser: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'new_users', 'specific_users', 'inactive_users'],
    default: 'all'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    radius: {
      type: Number,
      default: 0
    }
  },
  applicableVehicleTypes: [{
    type: String,
    enum: ['car', 'minivan', 'minibus', 'bajaj', 'bus', 'all'],
    default: 'all'
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'expired', 'disabled'],
    default: 'draft'
  },
  revenueImpact: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ status: 1, validUntil: 1 });
promoCodeSchema.index({ targetAudience: 1 });
promoCodeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PromoCode', promoCodeSchema);

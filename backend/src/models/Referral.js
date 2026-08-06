const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true
  },
  bonusAwarded: {
    type: Number,
    default: 50
  },
  friendBonusAwarded: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired'],
    default: 'pending'
  },
  referredUserCompletedFirstTrip: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

referralSchema.index({ referrer: 1 });
referralSchema.index({ referredUser: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ status: 1 });

module.exports = mongoose.model('Referral', referralSchema);

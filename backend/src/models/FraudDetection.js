const mongoose = require('mongoose');

const fraudDetectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['payment_fraud', 'account_takeover', 'identity_fraud', 'promo_abuse', 'refund_abuse', 'multiple_accounts'],
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  description: String,
  evidence: {
    ipAddress: String,
    deviceFingerprint: String,
    userAgent: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
      address: String
    },
    relatedAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  status: {
    type: String,
    enum: ['detected', 'investigating', 'confirmed', 'false_positive', 'resolved'],
    default: 'detected'
  },
  actionTaken: {
    type: String,
    enum: ['none', 'account_suspended', 'account_blocked', 'payment_blocked', 'warning_issued'],
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
  resolutionNotes: String,
  // Payment fraud specific
  failedPayments: [{
    attemptDate: Date,
    amount: Number,
    paymentMethod: String,
    failureReason: String
  }],
  // Account takeover specific
  suspiciousLogins: [{
    loginTime: Date,
    ipAddress: String,
    device: String,
    location: String
  }],
  // Promo abuse specific
  promoCodesUsed: [{
    code: String,
    usedAt: Date,
    discountAmount: Number
  }],
  // Refund abuse specific
  refundRequests: [{
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    requestedAt: Date,
    amount: Number,
    reason: String,
    approved: Boolean
  }]
});

fraudDetectionSchema.index({ user: 1, detectedAt: -1 });
fraudDetectionSchema.index({ status: 1 });
fraudDetectionSchema.index({ type: 1 });
fraudDetectionSchema.index({ severity: 1 });

module.exports = mongoose.model('FraudDetection', fraudDetectionSchema);

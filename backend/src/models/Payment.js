const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['trip_payment', 'top_up', 'withdrawal', 'credit'],
    default: 'trip_payment'
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'ETB'
  },
  method: {
    type: String,
    enum: ['cash', 'telebirr', 'cbe_birr', 'bank', 'chapa', 'wallet'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  platformCommission: {
    type: Number,
    default: 0
  },
  driverEarnings: {
    type: Number,
    default: 0
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  paidAt: Date,
  refundReason: String,
  refundedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.index({ type: 1 });
paymentSchema.index({ trip: 1 });
paymentSchema.index({ passenger: 1, createdAt: -1 });
paymentSchema.index({ driver: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ receiptNumber: 1 });

paymentSchema.pre('save', function (next) {
  if (!this.receiptNumber) {
    this.receiptNumber = `DIRS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);

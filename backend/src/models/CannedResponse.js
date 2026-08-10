const mongoose = require('mongoose');

const cannedResponseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['greeting', 'payment', 'trip', 'account', 'technical', 'safety', 'closing', 'other'],
    required: true
  },
  tags: [String],
  language: {
    type: String,
    enum: ['en', 'am', 'om', 'so'],
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  useCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUsedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUsedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

cannedResponseSchema.index({ category: 1 });
cannedResponseSchema.index({ tags: 1 });
cannedResponseSchema.index({ isActive: 1 });
cannedResponseSchema.index({ language: 1 });

cannedResponseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CannedResponse', cannedResponseSchema);

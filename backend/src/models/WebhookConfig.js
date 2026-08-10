const mongoose = require('mongoose');

const webhookConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  url: {
    type: String,
    required: true
  },
  events: [{
    type: String,
    enum: ['ride_created', 'ride_accepted', 'ride_started', 'ride_completed', 
           'ride_cancelled', 'payment_processed', 'driver_registered', 
           'passenger_registered', 'sos_triggered', 'rating_submitted']
  }],
  headers: [{
    key: String,
    value: String
  }],
  secret: String,
  retryPolicy: {
    enabled: {
      type: Boolean,
      default: true
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    retryDelay: {
      type: Number,
      default: 1000 // ms
    },
    exponentialBackoff: {
      type: Boolean,
      default: true
    }
  },
  timeout: {
    type: Number,
    default: 10000 // ms
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastTriggeredAt: Date,
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
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

webhookConfigSchema.index({ url: 1 });
webhookConfigSchema.index({ isActive: 1 });
webhookConfigSchema.index({ events: 1 });
webhookConfigSchema.index({ createdBy: 1 });

module.exports = mongoose.model('WebhookConfig', webhookConfigSchema);

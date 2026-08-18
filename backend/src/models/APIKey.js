const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  keyHash: {
    type: String,
    required: true
  },
  description: String,
  permissions: [{
    resource: String,
    actions: [{
      type: String,
      enum: ['read', 'write', 'delete', 'admin']
    }]
  }],
  rateLimits: {
    requestsPerMinute: {
      type: Number,
      default: 100
    },
    requestsPerHour: {
      type: Number,
      default: 1000
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },
  ipWhitelist: [String],
  allowedEndpoints: [String],
  scopes: [{
    type: String,
    enum: ['public', 'read', 'write', 'admin']
  }],
  expiresAt: {
    type: Date,
    default: null
  },
  lastUsedAt: Date,
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

apiKeySchema.index({ keyHash: 1 });
apiKeySchema.index({ isActive: 1 });
apiKeySchema.index({ expiresAt: 1 });
apiKeySchema.index({ createdBy: 1 });

module.exports = mongoose.model('APIKey', apiKeySchema);

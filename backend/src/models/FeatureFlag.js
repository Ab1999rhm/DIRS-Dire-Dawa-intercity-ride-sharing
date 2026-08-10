const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['core', 'marketing', 'analytics', 'security', 'ui', 'experimental'],
    default: 'core'
  },
  enabled: {
    type: Boolean,
    required: true,
    default: false
  },
  targetType: {
    type: String,
    enum: ['all', 'percentage', 'users', 'roles'],
    default: 'all'
  },
  targetConfig: {
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    targetUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    targetRoles: [{
      type: String,
      enum: ['admin', 'driver', 'passenger']
    }]
  },
  abTesting: {
    enabled: {
      type: Boolean,
      default: false
    },
    variants: [{
      name: String,
      percentage: Number,
      config: mongoose.Schema.Types.Mixed
    }]
  },
  isBeta: {
    type: Boolean,
    default: false
  },
  rolloutStrategy: {
    type: String,
    enum: ['immediate', 'gradual', 'scheduled'],
    default: 'immediate'
  },
  scheduledFor: Date,
  conditions: {
    minAppVersion: String,
    maxAppVersion: String,
    platform: [{
      type: String,
      enum: ['ios', 'android', 'web']
    }]
  },
  metadata: mongoose.Schema.Types.Mixed,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

featureFlagSchema.index({ key: 1 });
featureFlagSchema.index({ enabled: 1 });
featureFlagSchema.index({ category: 1 });
featureFlagSchema.index({ isActive: 1 });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);

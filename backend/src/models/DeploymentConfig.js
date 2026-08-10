const mongoose = require('mongoose');

const deploymentConfigSchema = new mongoose.Schema({
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    required: true
  },
  version: {
    type: String,
    required: true
  },
  buildNumber: String,
  deployedAt: {
    type: Date,
    default: Date.now
  },
  deployedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollbackVersion: String,
  rollbackEnabled: {
    type: Boolean,
    default: true
  },
  rollbackHistory: [{
    version: String,
    deployedAt: Date,
    rolledBackAt: Date,
    reason: String
  }],
  config: {
    apiUrl: String,
    databaseUrl: String,
    redisUrl: String,
    environmentVariables: [{
      key: String,
      value: String,
      isSecret: {
        type: Boolean,
        default: false
      }
    }]
  },
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: String,
    scheduledStart: Date,
    scheduledEnd: Date,
    bypassUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  healthChecks: {
    enabled: {
      type: Boolean,
      default: true
    },
    endpoints: [String],
    interval: {
      type: Number,
      default: 60 // seconds
    }
  },
  databaseMigrations: {
    pending: [String],
    completed: [{
      version: String,
      executedAt: Date
    }]
  },
  isActive: {
    type: Boolean,
    default: true
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

deploymentConfigSchema.index({ environment: 1 });
deploymentConfigSchema.index({ version: 1 });
deploymentConfigSchema.index({ deployedAt: -1 });
deploymentConfigSchema.index({ isActive: 1 });

module.exports = mongoose.model('DeploymentConfig', deploymentConfigSchema);

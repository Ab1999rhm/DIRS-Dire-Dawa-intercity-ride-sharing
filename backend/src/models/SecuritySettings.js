const mongoose = require('mongoose');

const securitySettingsSchema = new mongoose.Schema({
  otp: {
    expiryTime: {
      type: Number,
      default: 300 // seconds
    },
    length: {
      type: Number,
      default: 6
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    resendInterval: {
      type: Number,
      default: 60 // seconds
    }
  },
  session: {
    duration: {
      type: Number,
      default: 86400 // seconds (24 hours)
    },
    refreshDuration: {
      type: Number,
      default: 604800 // seconds (7 days)
    },
    maxConcurrentSessions: {
      type: Number,
      default: 5
    }
  },
  rateLimiting: {
    enabled: {
      type: Boolean,
      default: true
    },
    endpoints: [{
      path: String,
      requestsPerMinute: Number,
      requestsPerHour: Number
    }],
    global: {
      requestsPerMinute: {
        type: Number,
        default: 1000
      },
      requestsPerHour: {
        type: Number,
        default: 10000
      }
    }
  },
  password: {
    minLength: {
      type: Number,
      default: 8
    },
    requireUppercase: {
      type: Boolean,
      default: true
    },
    requireLowercase: {
      type: Boolean,
      default: true
    },
    requireNumbers: {
      type: Boolean,
      default: true
    },
    requireSpecialChars: {
      type: Boolean,
      default: true
    },
    expiryDays: {
      type: Number,
      default: 90
    },
    historyCount: {
      type: Number,
      default: 5
    }
  },
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    requiredFor: [{
      type: String,
      enum: ['admin', 'driver', 'passenger', 'all']
    }],
    methods: [{
      type: String,
      enum: ['sms', 'email', 'authenticator_app']
    }]
  },
  ipWhitelist: {
    enabled: {
      type: Boolean,
      default: false
    },
    allowedIPs: [String]
  },
  auditLogging: {
    enabled: {
      type: Boolean,
      default: true
    },
    logLevel: {
      type: String,
      enum: ['error', 'warn', 'info', 'debug'],
      default: 'info'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

securitySettingsSchema.index({ isActive: 1 });

module.exports = mongoose.model('SecuritySettings', securitySettingsSchema);

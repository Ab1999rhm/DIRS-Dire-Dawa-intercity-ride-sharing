const mongoose = require('mongoose');

const performanceConfigSchema = new mongoose.Schema({
  cache: {
    enabled: {
      type: Boolean,
      default: true
    },
    provider: {
      type: String,
      enum: ['redis', 'memcached', 'memory'],
      default: 'redis'
    },
    ttl: {
      default: {
        type: Number,
        default: 3600 // seconds
      },
      user: {
        type: Number,
        default: 1800
      },
      trip: {
        type: Number,
        default: 600
      },
      pricing: {
        type: Number,
        default: 7200
      }
    },
    maxSize: {
      type: Number,
      default: 1000 // MB
    }
  },
  rateLimits: {
    enabled: {
      type: Boolean,
      default: true
    },
    global: {
      requestsPerMinute: {
        type: Number,
        default: 1000
      },
      requestsPerHour: {
        type: Number,
        default: 10000
      }
    },
    perUser: {
      requestsPerMinute: {
        type: Number,
        default: 60
      },
      requestsPerHour: {
        type: Number,
        default: 1000
      }
    },
    perIP: {
      requestsPerMinute: {
        type: Number,
        default: 120
      },
      requestsPerHour: {
        type: Number,
        default: 2000
      }
    }
  },
  cdn: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: {
      type: String,
      enum: ['cloudflare', 'aws_cloudfront', 'azure_cdn', 'custom'],
      default: 'cloudflare'
    },
    config: {
      domain: String,
      apiKey: String,
      distributionId: String
    },
    assetUrls: {
      images: String,
      videos: String,
      documents: String
    }
  },
  compression: {
    enabled: {
      type: Boolean,
      default: true
    },
    level: {
      type: Number,
      default: 6,
      min: 1,
      max: 9
    },
    mimeTypes: [String]
  },
  responseTime: {
    target: {
      type: Number,
      default: 200 // ms
    },
    warningThreshold: {
      type: Number,
      default: 500 // ms
    },
    criticalThreshold: {
      type: Number,
      default: 1000 // ms
    }
  },
  connectionPool: {
    min: {
      type: Number,
      default: 2
    },
    max: {
      type: Number,
      default: 10
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

performanceConfigSchema.index({ isActive: 1 });

module.exports = mongoose.model('PerformanceConfig', performanceConfigSchema);

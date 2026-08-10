const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  pushNotifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    provider: {
      type: String,
      enum: ['firebase', 'onesignal', 'apns', 'custom'],
      default: 'firebase'
    },
    config: {
      apiKey: String,
      authDomain: String,
      projectId: String,
      storageBucket: String,
      messagingSenderId: String,
      appId: String,
      serverKey: String
    },
    batching: {
      enabled: {
        type: Boolean,
        default: false
      },
      batchSize: {
        type: Number,
        default: 100
      }
    }
  },
  sms: {
    enabled: {
      type: Boolean,
      default: true
    },
    provider: {
      type: String,
      enum: ['twilio', 'nexmo', 'messagebird', 'custom'],
      default: 'twilio'
    },
    config: {
      apiKey: String,
      apiSecret: String,
      senderId: String,
      webhookUrl: String
    },
    rateLimit: {
      perMinute: {
        type: Number,
        default: 60
      },
      perHour: {
        type: Number,
        default: 1000
      }
    }
  },
  email: {
    enabled: {
      type: Boolean,
      default: true
    },
    provider: {
      type: String,
      enum: ['sendgrid', 'mailgun', 'ses', 'smtp', 'custom'],
      default: 'smtp'
    },
    smtp: {
      host: String,
      port: Number,
      secure: {
        type: Boolean,
        default: true
      },
      auth: {
        user: String,
        pass: String
      }
    },
    sendgrid: {
      apiKey: String
    },
    mailgun: {
      apiKey: String,
      domain: String
    }
  },
  alertThresholds: {
    sos: {
      enabled: {
        type: Boolean,
        default: true
      },
      notifyAdmins: {
        type: Boolean,
        default: true
      },
      notifyEmergencyContacts: {
        type: Boolean,
        default: true
      }
    },
    speed: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 120 // km/h
      }
    },
    geofence: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    offline: {
      enabled: {
        type: Boolean,
        default: true
      },
      timeoutMinutes: {
        type: Number,
        default: 5
      }
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

notificationSettingsSchema.index({ isActive: 1 });

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);

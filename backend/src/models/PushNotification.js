const mongoose = require('mongoose');

const pushNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'passengers', 'drivers', 'specific_users'],
    default: 'all'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    radius: {
      type: Number,
      default: 0 // in kilometers
    }
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  recurringSchedule: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    endDate: Date
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NotificationTemplate'
  },
  isRich: {
    type: Boolean,
    default: false
  },
  imageUrl: String,
  actionUrl: String,
  actionButtonText: String,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'cancelled'],
    default: 'draft'
  },
  sentAt: Date,
  sentCount: {
    type: Number,
    default: 0
  },
  openedCount: {
    type: Number,
    default: 0
  },
  clickedCount: {
    type: Number,
    default: 0
  },
  abTestGroup: {
    type: String,
    enum: ['A', 'B', null],
    default: null
  },
  abTestVariant: String,
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

pushNotificationSchema.index({ status: 1, scheduledFor: 1 });
pushNotificationSchema.index({ targetAudience: 1 });
pushNotificationSchema.index({ createdBy: 1 });
pushNotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PushNotification', pushNotificationSchema);

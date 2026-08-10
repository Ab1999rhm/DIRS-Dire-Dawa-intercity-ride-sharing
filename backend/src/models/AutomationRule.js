const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  triggerType: {
    type: String,
    enum: ['user_signup', 'first_trip_completed', 'trip_completed', 'inactive_user', 'birthday', 'anniversary', 'custom_event'],
    required: true
  },
  triggerConditions: {
    daysSinceSignup: Number,
    daysSinceLastTrip: Number,
    tripCount: Number,
    spendingThreshold: Number,
    customEvent: String,
    customConditions: mongoose.Schema.Types.Mixed
  },
  actionType: {
    type: String,
    enum: ['send_push', 'send_email', 'send_sms', 'create_promo', 'add_to_segment'],
    required: true
  },
  actionConfig: {
    pushNotificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PushNotification'
    },
    emailCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailCampaign'
    },
    smsCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SMSCampaign'
    },
    promoCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromoCode'
    },
    segmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserSegment'
    },
    customAction: mongoose.Schema.Types.Mixed
  },
  targetAudience: {
    type: String,
    enum: ['all', 'passengers', 'drivers', 'specific_users', 'segment'],
    default: 'all'
  },
  targetSegment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSegment'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  schedule: {
    type: String,
    enum: ['immediate', 'delayed', 'recurring'],
    default: 'immediate'
  },
  delayMinutes: {
    type: Number,
    default: 0
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
    timeOfDay: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  executionCount: {
    type: Number,
    default: 0
  },
  lastExecutedAt: Date,
  nextExecutionAt: Date,
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

automationRuleSchema.index({ triggerType: 1 });
automationRuleSchema.index({ isActive: 1, nextExecutionAt: 1 });
automationRuleSchema.index({ targetAudience: 1 });
automationRuleSchema.index({ createdBy: 1 });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);

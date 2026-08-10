const mongoose = require('mongoose');

const campaignAnalyticsSchema = new mongoose.Schema({
  campaignType: {
    type: String,
    enum: ['push_notification', 'email_campaign', 'sms_campaign', 'announcement', 'promo_code'],
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'passengers', 'drivers', 'specific_users', 'segment'],
    required: true
  },
  totalSent: {
    type: Number,
    default: 0
  },
  totalDelivered: {
    type: Number,
    default: 0
  },
  totalOpened: {
    type: Number,
    default: 0
  },
  totalClicked: {
    type: Number,
    default: 0
  },
  totalConverted: {
    type: Number,
    default: 0
  },
  totalBounced: {
    type: Number,
    default: 0
  },
  totalUnsubscribed: {
    type: Number,
    default: 0
  },
  openRate: {
    type: Number,
    default: 0
  },
  clickRate: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  bounceRate: {
    type: Number,
    default: 0
  },
  unsubscribeRate: {
    type: Number,
    default: 0
  },
  revenueGenerated: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number,
    default: 0
  },
  roi: {
    type: Number,
    default: 0
  },
  abTestGroup: {
    type: String,
    enum: ['A', 'B', null],
    default: null
  },
  timeSeriesData: [{
    date: Date,
    sent: Number,
    opened: Number,
    clicked: Number,
    converted: Number
  }],
  demographicBreakdown: {
    byRole: {
      passengers: { sent: Number, opened: Number, clicked: Number },
      drivers: { sent: Number, opened: Number, clicked: Number }
    },
    byLocation: [{
      location: String,
      sent: Number,
      opened: Number,
      clicked: Number
    }]
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

campaignAnalyticsSchema.index({ campaignType: 1, campaignId: 1 });
campaignAnalyticsSchema.index({ calculatedAt: -1 });

module.exports = mongoose.model('CampaignAnalytics', campaignAnalyticsSchema);

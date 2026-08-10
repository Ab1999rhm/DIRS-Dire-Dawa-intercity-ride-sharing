const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
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
  scheduledFor: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
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
  bouncedCount: {
    type: Number,
    default: 0
  },
  unsubscribedCount: {
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

emailCampaignSchema.index({ status: 1, scheduledFor: 1 });
emailCampaignSchema.index({ targetAudience: 1 });
emailCampaignSchema.index({ createdBy: 1 });
emailCampaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);

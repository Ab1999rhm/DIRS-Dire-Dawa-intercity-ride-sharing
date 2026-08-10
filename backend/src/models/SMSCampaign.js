const mongoose = require('mongoose');

const smsCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SMSTemplate'
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
  deliveredCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  cost: {
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

smsCampaignSchema.index({ status: 1, scheduledFor: 1 });
smsCampaignSchema.index({ targetAudience: 1 });
smsCampaignSchema.index({ createdBy: 1 });
smsCampaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SMSCampaign', smsCampaignSchema);

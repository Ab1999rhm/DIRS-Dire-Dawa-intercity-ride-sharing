const mongoose = require('mongoose');

const inAppContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['banner', 'carousel', 'popup', 'modal', 'bottom_sheet'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  imageUrl: String,
  actionUrl: String,
  actionButtonText: String,
  displayLocation: {
    type: String,
    enum: ['home', 'trips', 'profile', 'wallet', 'all'],
    default: 'home'
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
  priority: {
    type: Number,
    default: 0
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  expirationDate: {
    type: Date,
    default: null
  },
  showForSeconds: {
    type: Number,
    default: 5 // for popups
  },
  dismissible: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'expired', 'archived'],
    default: 'draft'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  dismissCount: {
    type: Number,
    default: 0
  },
  carouselItems: [{
    title: String,
    imageUrl: String,
    actionUrl: String,
    order: Number
  }],
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

inAppContentSchema.index({ type: 1, status: 1 });
inAppContentSchema.index({ displayLocation: 1 });
inAppContentSchema.index({ targetAudience: 1 });
inAppContentSchema.index({ priority: -1 });
inAppContentSchema.index({ scheduledFor: 1, expirationDate: 1 });

module.exports = mongoose.model('InAppContent', inAppContentSchema);

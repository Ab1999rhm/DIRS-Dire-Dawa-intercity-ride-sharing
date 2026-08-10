const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['maintenance', 'policy', 'feature', 'emergency', 'promotion', 'general'],
    default: 'general'
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
  expirationDate: {
    type: Date,
    default: null
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinOrder: {
    type: Number,
    default: 0
  },
  imageUrl: String,
  actionUrl: String,
  actionButtonText: String,
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

announcementSchema.index({ status: 1, scheduledFor: 1 });
announcementSchema.index({ isPinned: 1, pinOrder: 1 });
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ expirationDate: 1 });
announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);

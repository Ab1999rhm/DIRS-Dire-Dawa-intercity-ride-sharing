const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
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
    enum: ['marketing', 'promotional', 'transactional', 'system', 'safety'],
    default: 'marketing'
  },
  variables: [{
    name: String,
    description: String,
    defaultValue: String
  }],
  isRich: {
    type: Boolean,
    default: false
  },
  imageUrl: String,
  actionUrl: String,
  actionButtonText: String,
  language: {
    type: String,
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
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

notificationTemplateSchema.index({ category: 1 });
notificationTemplateSchema.index({ isActive: 1 });
notificationTemplateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);

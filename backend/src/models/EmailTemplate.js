const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['marketing', 'promotional', 'transactional', 'welcome', 're_engagement', 'reminder'],
    default: 'marketing'
  },
  variables: [{
    name: String,
    description: String,
    defaultValue: String
  }],
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

emailTemplateSchema.index({ category: 1 });
emailTemplateSchema.index({ isActive: 1 });
emailTemplateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);

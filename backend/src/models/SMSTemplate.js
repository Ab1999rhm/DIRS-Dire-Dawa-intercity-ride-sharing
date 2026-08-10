const mongoose = require('mongoose');

const smsTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['marketing', 'promotional', 'transactional', 'alert', 'reminder'],
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

smsTemplateSchema.index({ category: 1 });
smsTemplateSchema.index({ isActive: 1 });
smsTemplateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('SMSTemplate', smsTemplateSchema);

const mongoose = require('mongoose');

const autoReplyRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  trigger: {
    type: String,
    required: true
  },
  triggerType: {
    type: String,
    enum: ['keyword', 'category', 'priority', 'status', 'time_elapsed'],
    required: true
  },
  conditions: [{
    field: String,
    operator: {
      type: String,
      enum: ['equals', 'contains', 'starts_with', 'ends_with', 'greater_than', 'less_than']
    },
    value: mongoose.Schema.Types.Mixed
  }],
  action: {
    type: String,
    enum: ['auto_reply', 'auto_escalate', 'auto_close', 'auto_assign', 'send_notification'],
    required: true
  },
  response: {
    message: String,
    assignTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    escalateTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notificationTemplate: String
  },
  category: {
    type: String,
    enum: ['payment', 'trip', 'account', 'app', 'safety', 'other']
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low']
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

autoReplyRuleSchema.index({ triggerType: 1, isActive: 1 });
autoReplyRuleSchema.index({ category: 1 });
autoReplyRuleSchema.index({ priority: 1 });

autoReplyRuleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AutoReplyRule', autoReplyRuleSchema);

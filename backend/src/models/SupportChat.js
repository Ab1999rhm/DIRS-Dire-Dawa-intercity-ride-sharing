const mongoose = require('mongoose');

const supportChatSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    default: null
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['customer', 'agent', 'admin'],
      required: true
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderRole: {
      type: String,
      enum: ['customer', 'agent', 'admin'],
      required: true
    },
    message: String,
    attachments: [{
      filename: String,
      url: String,
      mimeType: String
    }],
    isCannedResponse: { type: Boolean, default: false },
    cannedResponseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CannedResponse'
    },
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['active', 'transferred', 'ended', 'closed'],
    default: 'active'
  },
  transferredTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transferredAt: Date,
  transferredFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ratedAt: Date
  },
  autoResolved: {
    type: Boolean,
    default: false
  },
  chatbotHandled: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
});

supportChatSchema.index({ ticket: 1 });
supportChatSchema.index({ 'participants.user': 1 });
supportChatSchema.index({ status: 1 });
supportChatSchema.index({ startedAt: -1 });

module.exports = mongoose.model('SupportChat', supportChatSchema);

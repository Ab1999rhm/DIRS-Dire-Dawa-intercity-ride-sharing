const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['passenger', 'driver', 'admin'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  edited: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

chatMessageSchema.index({ trip: 1, createdAt: 1 });
chatMessageSchema.index({ createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
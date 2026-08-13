const mongoose = require('mongoose');

const chatReadSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastReadAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

chatReadSchema.index({ trip: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ChatRead', chatReadSchema);
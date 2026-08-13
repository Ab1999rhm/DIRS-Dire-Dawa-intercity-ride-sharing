const mongoose = require('mongoose');

const dispatchContactSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['police', 'hospital'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: 'Dire Dawa'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

dispatchContactSchema.index({ type: 1 });
dispatchContactSchema.index({ active: 1 });

module.exports = mongoose.model('DispatchContact', dispatchContactSchema);
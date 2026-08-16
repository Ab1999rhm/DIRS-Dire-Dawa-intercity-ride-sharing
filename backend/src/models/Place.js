const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Place name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['intra_city', 'intercity'],
    required: [true, 'Place type is required']
  },
  key: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  emoji: {
    type: String,
    default: ''
  },
  coordinates: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  city: {
    type: String,
    default: 'Dire Dawa'
  },
  category: {
    type: String,
    enum: ['neighborhood', 'market', 'hospital', 'school', 'transport', 'hotel', 'government', 'landmark', 'city', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

placeSchema.index({ type: 1, isActive: 1 });
placeSchema.index({ key: 1, type: 1 }, { unique: true });
placeSchema.index({ city: 1 });

module.exports = mongoose.model('Place', placeSchema);

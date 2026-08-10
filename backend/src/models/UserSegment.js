const mongoose = require('mongoose');

const userSegmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  segmentType: {
    type: String,
    enum: ['location', 'behavior', 'spending', 'rating', 'custom'],
    required: true
  },
  criteria: {
    location: {
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
    behavior: {
      isActive: {
        type: Boolean,
        default: true
      },
      lastTripDays: {
        min: Number,
        max: Number
      },
      tripCount: {
        min: Number,
        max: Number
      },
      registrationDate: {
        from: Date,
        to: Date
      }
    },
    spending: {
      totalSpent: {
        min: Number,
        max: Number
      },
      avgFare: {
        min: Number,
        max: Number
      },
      lastSpentDays: Number
    },
    rating: {
      min: Number,
      max: Number
    },
    custom: {
      field: String,
      operator: {
        type: String,
        enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin']
      },
      value: mongoose.Schema.Types.Mixed
    }
  },
  targetRole: {
    type: String,
    enum: ['all', 'passengers', 'drivers'],
    default: 'all'
  },
  estimatedSize: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastCalculatedAt: Date,
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

userSegmentSchema.index({ segmentType: 1 });
userSegmentSchema.index({ targetRole: 1 });
userSegmentSchema.index({ isActive: 1 });
userSegmentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('UserSegment', userSegmentSchema);

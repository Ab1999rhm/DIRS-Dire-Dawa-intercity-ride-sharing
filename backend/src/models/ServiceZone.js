const mongoose = require('mongoose');

const serviceZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  zoneType: {
    type: String,
    enum: ['city', 'region', 'highway', 'intercity'],
    default: 'city'
  },
  boundaries: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[[Number]]]], // GeoJSON Polygon
      required: true
    }
  },
  centerPoint: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  coverageRadius: {
    type: Number,
    default: 0 // in kilometers
  },
  isBlackoutZone: {
    type: Boolean,
    default: false
  },
  adjacentZones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceZone'
  }],
  crossZoneRules: {
    enabled: {
      type: Boolean,
      default: true
    },
    fareMultiplier: {
      type: Number,
      default: 1.0
    },
    restrictions: [{
      fromZone: mongoose.Schema.Types.ObjectId,
      toZone: mongoose.Schema.Types.ObjectId,
      allowedVehicleTypes: [String],
      surcharge: Number
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

serviceZoneSchema.index({ boundaries: '2dsphere' });
serviceZoneSchema.index({ centerPoint: '2dsphere' });
serviceZoneSchema.index({ isActive: 1 });
serviceZoneSchema.index({ zoneType: 1 });

module.exports = mongoose.model('ServiceZone', serviceZoneSchema);

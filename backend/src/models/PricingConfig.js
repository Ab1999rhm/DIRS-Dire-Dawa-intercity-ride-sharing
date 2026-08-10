const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema({
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceZone',
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'minivan', 'intercity_bus', 'all'],
    required: true
  },
  baseFare: {
    type: Number,
    required: true,
    default: 0
  },
  perKmRate: {
    type: Number,
    required: true,
    default: 0
  },
  perMinuteRate: {
    type: Number,
    required: true,
    default: 0
  },
  minimumFare: {
    type: Number,
    required: true,
    default: 0
  },
  maximumFare: {
    type: Number,
    default: null
  },
  surgePricing: {
    enabled: {
      type: Boolean,
      default: false
    },
    multiplier: {
      type: Number,
      default: 1.0,
      min: 1.0
    },
    triggerConditions: {
      demandThreshold: Number,
      driverAvailabilityThreshold: Number,
      timeOfDay: [{
        start: String, // HH:mm
        end: String
      }]
    }
  },
  nightCharges: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: String, // HH:mm
    endTime: String, // HH:mm
    surcharge: {
      type: Number,
      default: 0
    }
  },
  holidayPricing: {
    enabled: {
      type: Boolean,
      default: false
    },
    holidays: [{
      name: String,
      date: Date,
      surcharge: Number
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveUntil: {
    type: Date,
    default: null
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

pricingConfigSchema.index({ zoneId: 1, vehicleType: 1 });
pricingConfigSchema.index({ isActive: 1 });
pricingConfigSchema.index({ effectiveFrom: 1, effectiveUntil: 1 });

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);

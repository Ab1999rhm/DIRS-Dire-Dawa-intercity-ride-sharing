const mongoose = require('mongoose');

const vehicleCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  icon: String,
  capacity: {
    passengers: {
      type: Number,
      required: true,
      default: 4
    },
    luggage: {
      type: Number,
      default: 2
    }
  },
  vehicleRequirements: {
    minYear: Number,
    maxAge: Number, // in years
    insuranceRequired: {
      type: Boolean,
      default: true
    },
    licenseType: String,
    inspectionRequired: {
      type: Boolean,
      default: true
    }
  },
  pricingRules: {
    baseFareMultiplier: {
      type: Number,
      default: 1.0
    },
    perKmMultiplier: {
      type: Number,
      default: 1.0
    },
    perMinuteMultiplier: {
      type: Number,
      default: 1.0
    }
  },
  commissionRate: {
    type: Number,
    required: true,
    default: 0.15 // 15%
  },
  features: [{
    type: String,
    enum: ['ac', 'wifi', 'usb_charging', 'child_seat', 'wheelchair_accessible', 'pet_friendly']
  }],
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

vehicleCategorySchema.index({ name: 1 });
vehicleCategorySchema.index({ isActive: 1 });
vehicleCategorySchema.index({ sortOrder: 1 });

module.exports = mongoose.model('VehicleCategory', vehicleCategorySchema);

const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  commission: {
    platformRate: {
      type: Number,
      required: true,
      default: 0.15
    },
    driverRate: {
      type: Number,
      required: true,
      default: 0.85
    },
    specialRates: [{
      vehicleCategory: String,
      rate: Number
    }]
  },
  paymentMethods: {
    enabledMethods: [{
      type: String,
      enum: ['cash', 'mobile_money', 'card', 'wallet', 'bank_transfer']
    }],
    defaultMethod: {
      type: String,
      enum: ['cash', 'mobile_money', 'card', 'wallet']
    },
    cashPaymentLimit: {
      type: Number,
      default: null
    }
  },
  currency: {
    code: {
      type: String,
      required: true,
      default: 'ETB'
    },
    symbol: {
      type: String,
      required: true,
      default: 'Br'
    },
    decimalPlaces: {
      type: Number,
      default: 2
    },
    exchangeRates: [{
      from: String,
      to: String,
      rate: Number,
      updatedAt: Date
    }]
  },
  taxes: {
    vatEnabled: {
      type: Boolean,
      default: false
    },
    vatRate: {
      type: Number,
      default: 0
    },
    serviceTaxEnabled: {
      type: Boolean,
      default: false
    },
    serviceTaxRate: {
      type: Number,
      default: 0
    }
  },
  wallet: {
    minimumBalance: {
      type: Number,
      default: 0
    },
    rechargeMinimum: {
      type: Number,
      default: 100
    },
    rechargeMaximum: {
      type: Number,
      default: 10000
    },
    autoRecharge: {
      enabled: {
        type: Boolean,
        default: false
      },
      threshold: Number,
      rechargeAmount: Number
    }
  },
  refundPolicy: {
    enabled: {
      type: Boolean,
      default: true
    },
    autoRefundThreshold: {
      type: Number,
      default: 500
    },
    refundTimeLimit: {
      type: Number,
      default: 24 // hours
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

platformSettingsSchema.index({ isActive: 1 });

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);

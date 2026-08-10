const mongoose = require('mongoose');

const localizationConfigSchema = new mongoose.Schema({
  languages: [{
    code: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    nativeName: String,
    isActive: {
      type: Boolean,
      default: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    rtl: {
      type: Boolean,
      default: false
    }
  }],
  translations: [{
    language: String,
    namespace: String,
    keys: [{
      key: String,
      value: String
    }]
  }],
  dateTimeFormats: {
    default: {
      date: {
        type: String,
        default: 'YYYY-MM-DD'
      },
      time: {
        type: String,
        default: 'HH:mm:ss'
      },
      dateTime: {
        type: String,
        default: 'YYYY-MM-DD HH:mm:ss'
      }
    },
    perLanguage: [{
      language: String,
      date: String,
      time: String,
      dateTime: String
    }]
  },
  currencyDisplay: {
    symbolPosition: {
      type: String,
      enum: ['before', 'after'],
      default: 'before'
    },
    decimalSeparator: {
      type: String,
      default: '.'
    },
    thousandsSeparator: {
      type: String,
      default: ','
    },
    perLanguage: [{
      language: String,
      symbolPosition: String,
      decimalSeparator: String,
      thousandsSeparator: String
    }]
  },
  numberFormats: {
    decimalPlaces: {
      type: Number,
      default: 2
    },
    perLanguage: [{
      language: String,
      decimalPlaces: Number
    }]
  },
  timezone: {
    default: {
      type: String,
      default: 'Africa/Addis_Ababa'
    },
    perLanguage: [{
      language: String,
      timezone: String
    }]
  },
  autoDetect: {
    enabled: {
      type: Boolean,
      default: true
    },
    methods: [{
      type: String,
      enum: ['browser', 'ip', 'user_preference']
    }]
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

localizationConfigSchema.index({ isActive: 1 });

module.exports = mongoose.model('LocalizationConfig', localizationConfigSchema);

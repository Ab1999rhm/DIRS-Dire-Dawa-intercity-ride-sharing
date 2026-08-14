const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: 50
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^(\+251|0)?[97]\d{8}$/, 'Please provide a valid Ethiopian phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['passenger', 'driver', 'admin'],
    default: 'passenger'
  },
  profilePhoto: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isBookingBlocked: {
    type: Boolean,
    default: false
  },
  bookingBlockReason: {
    type: String,
    default: null
  },
  warnings: {
    type: Number,
    default: 0
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  fraudFlags: {
    type: Number,
    default: 0
  },
  complaints: {
    type: Number,
    default: 0
  },
  warnings: {
    type: Number,
    default: 0
  },
  cancellations: {
    type: Number,
    default: 0
  },
  noShows: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    default: null
  },
  blockedAt: {
    type: Date,
    default: null
  },
  blockUntil: {
    type: Date,
    default: null
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  totalTrips: {
    type: Number,
    default: 0
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  lastSeen: {
    type: Date,
    default: null
  },
  loginHistory: [{
    timestamp: Date,
    device: String,
    ip: String,
    location: String
  }],
  deviceInfo: {
    deviceType: String,
    os: String,
    browser: String,
    appVersion: String
  },
  intendedDestination: {
    city: { type: String, default: null },
    coordinates: { type: [Number], default: null },
    updatedAt: { type: Date, default: null }
  },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    updatedAt: { type: Date, default: Date.now }
  },
  emergencyContacts: [{
    name: String,
    phoneNumber: String,
    relationship: String
  }],
  favoriteLocations: [{
    name: String,
    address: String,
    type: { type: String, enum: ['home', 'work', 'school', 'other'], default: 'other' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    }
  }],
  favorites: [{
    name: String,
    address: String,
    iconType: String
  }],
  preferredLanguage: {
    type: String,
    enum: ['en', 'am', 'om', 'so'],
    default: 'en'
  },
  preferences: {
    rideUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    safetyAlerts: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    shareLocation: { type: Boolean, default: true },
    allowAnalytics: { type: Boolean, default: false }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'telebirr', 'chapa', 'wallet'],
    default: 'cash'
  },
  withdrawalAccount: {
    method: { type: String, enum: ['telebirr', 'cbe_birr', 'bank'], default: 'telebirr' },
    accountName: String,
    accountNumber: String,
    bankCode: String
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  credits: {
    type: Number,
    default: 0
  },
  totalCreditsEarned: {
    type: Number,
    default: 0
  },
  nationalId: {
    type: String,
    trim: true,
    default: null
  },
  refreshToken: {
    type: String,
    select: false
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ currentLocation: '2dsphere' });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);

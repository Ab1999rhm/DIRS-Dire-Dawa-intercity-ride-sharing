const User = require('../../models/User');
const Driver = require('../../models/Driver');
const Vehicle = require('../../models/Vehicle');
const { generateTokens, verifyRefreshToken } = require('../../services/tokenService');
const { generateOTP, sendOTP: sendOTPSms, sendEmailOTP } = require('../../services/smsService');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');
const upload = require('../../middleware/upload');

const otpStore = new Map();

const OTP_ATTEMPTS_KEY = 'attempts';
const MAX_OTP_ATTEMPTS = 5;

function canAttemptOTP(key) {
  const data = otpStore.get(key);
  if (!data) return true;
  return (data[OTP_ATTEMPTS_KEY] || 0) < MAX_OTP_ATTEMPTS;
}

function incrementOTPAttempts(key) {
  const data = otpStore.get(key);
  if (data) {
    data[OTP_ATTEMPTS_KEY] = (data[OTP_ATTEMPTS_KEY] || 0) + 1;
    otpStore.set(key, data);
  }
}

exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password, role } = req.body;

  const existingUser = await User.findOne({ phoneNumber });
  if (existingUser) {
    return res.status(400).json({ error: 'Phone number already registered' });
  }

  const user = await User.create({
    firstName, lastName, phoneNumber, email, password, role
  });

  if (role === 'driver') {
    await Driver.create({
      user: user._id,
      licenseNumber: 'PENDING',
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      licensePhoto: 'pending',
      nationalId: 'PENDING',
      nationalIdPhoto: 'pending'
    });
  }

  logger.info('User registered (pending email verification)', { userId: user._id, role: user.role });

  res.status(201).json({
    message: 'Registration successful. Please verify your email.',
    userId: user._id,
    email: user.email
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;

  const user = await User.findOne({ phoneNumber }).select('+password');
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  logger.info('User logged in', { userId: user._id, role: user.role });

  res.json({
    message: 'Login successful',
    user,
    accessToken,
    refreshToken
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const tokens = generateTokens(user._id);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  res.json(tokens);
});

exports.sendOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!canAttemptOTP(phoneNumber)) {
    return res.status(429).json({ error: 'Too many OTP attempts. Please try again later.' });
  }

  const otp = generateOTP();
  otpStore.set(phoneNumber, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    [OTP_ATTEMPTS_KEY]: (otpStore.get(phoneNumber)?.[OTP_ATTEMPTS_KEY] || 0) + 1
  });

  const result = await sendOTPSms(phoneNumber, otp);

  if (result.success) {
    res.json({ message: 'OTP sent successfully' });
  } else {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

exports.sendEmailOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!canAttemptOTP(email)) {
    return res.status(429).json({ error: 'Too many OTP attempts. Please try again later.' });
  }

  const otp = generateOTP();
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    [OTP_ATTEMPTS_KEY]: (otpStore.get(email)?.[OTP_ATTEMPTS_KEY] || 0) + 1
  });

  const result = await sendEmailOTP(email, otp);

  if (result.success) {
    res.json({
      message: 'OTP sent to your email',
      previewUrl: result.previewUrl || null
    });
  } else {
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

exports.verifyOTP = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  const storedOTP = otpStore.get(phoneNumber);
  if (!storedOTP) {
    return res.status(400).json({ error: 'OTP not found' });
  }

  if (storedOTP.expiresAt < Date.now()) {
    otpStore.delete(phoneNumber);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (storedOTP.otp !== otp) {
    incrementOTPAttempts(phoneNumber);
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  otpStore.delete(phoneNumber);

  await User.findOneAndUpdate(
    { phoneNumber },
    { isVerified: true }
  );

  logger.info('Phone verified', { phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') });

  res.json({ message: 'Phone number verified successfully' });
});

exports.verifyEmailOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const storedOTP = otpStore.get(email);
  if (!storedOTP) {
    return res.status(400).json({ error: 'OTP not found' });
  }

  if (storedOTP.expiresAt < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (storedOTP.otp !== otp) {
    incrementOTPAttempts(email);
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  otpStore.delete(email);

  const user = await User.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  let driverProfile = null;
  if (user.role === 'driver') {
    driverProfile = await Driver.findOne({ user: user._id });
  }

  logger.info('Email verified and logged in', { email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') });
  res.json({
    message: 'Email verified successfully',
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
    driverProfile,
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  const user = await User.findOne({ phoneNumber });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const otp = generateOTP();
  otpStore.set(`reset_${phoneNumber}`, {
    otp,
    userId: user._id,
    expiresAt: Date.now() + 5 * 60 * 1000,
    [OTP_ATTEMPTS_KEY]: 0
  });

  await sendOTPSms(phoneNumber, otp);
  logger.info('Password reset OTP sent', { userId: user._id });
  res.json({ message: 'Password reset OTP sent' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { phoneNumber, otp, newPassword } = req.body;

  const storedData = otpStore.get(`reset_${phoneNumber}`);
  if (!storedData) {
    return res.status(400).json({ error: 'Reset OTP not found' });
  }

  if (storedData.expiresAt < Date.now()) {
    otpStore.delete(`reset_${phoneNumber}`);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (storedData.otp !== otp) {
    incrementOTPAttempts(`reset_${phoneNumber}`);
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  const user = await User.findById(storedData.userId);
  user.password = newPassword;
  await user.save();

  otpStore.delete(`reset_${phoneNumber}`);
  logger.info('Password reset completed', { userId: user._id });
  res.json({ message: 'Password reset successful' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  let driverProfile = null;
  if (user.role === 'driver') {
    driverProfile = await Driver.findOne({ user: user._id });
  }

  let vehicle = null;
  if (driverProfile) {
    const Vehicle = require('../../models/Vehicle');
    vehicle = await Vehicle.findOne({ driver: driverProfile._id });
  }

  res.json({ user, driverProfile, vehicle });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, preferredLanguage, emergencyContacts, favoriteLocations } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName, email, preferredLanguage, emergencyContacts, favoriteLocations },
    { new: true, runValidators: true }
  );

  res.json({ user });
});

exports.updateLocation = asyncHandler(async (req, res) => {
  const { coordinates } = req.body;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({ error: 'Valid coordinates [lng, lat] required' });
  }

  const [lng, lat] = coordinates;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  await User.findByIdAndUpdate(req.user._id, {
    currentLocation: {
      type: 'Point',
      coordinates,
      updatedAt: new Date()
    }
  });

  res.json({ message: 'Location updated' });
});

exports.logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshToken');
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
  res.json({ message: 'Logged out successfully' });
});

exports.sendPhoneOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  if (!canAttemptOTP(`phone_${phoneNumber}`)) {
    return res.status(429).json({ error: 'Too many OTP attempts. Please try again later.' });
  }

  const otp = generateOTP();
  otpStore.set(`phone_${phoneNumber}`, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    [OTP_ATTEMPTS_KEY]: (otpStore.get(`phone_${phoneNumber}`)?.[OTP_ATTEMPTS_KEY] || 0) + 1
  });

  logger.info(`Phone OTP for ${phoneNumber}: ${otp}`);

  const result = await sendOTPSms(phoneNumber, otp);

  if (result.success) {
    res.json({ message: 'OTP sent to your phone' });
  } else {
    res.json({ message: 'OTP sent (development mode)', otp });
  }
});

exports.verifyPhoneOTP = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  const storedOTP = otpStore.get(`phone_${phoneNumber}`);
  if (!storedOTP) {
    return res.status(400).json({ error: 'OTP not found' });
  }

  if (storedOTP.expiresAt < Date.now()) {
    otpStore.delete(`phone_${phoneNumber}`);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (storedOTP.otp !== otp) {
    incrementOTPAttempts(`phone_${phoneNumber}`);
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  otpStore.delete(`phone_${phoneNumber}`);

  let user = await User.findOne({ phoneNumber });

  if (!user) {
    user = await User.create({
      phoneNumber,
      firstName: '',
      lastName: '',
      role: 'passenger',
      isVerified: true
    });
    logger.info('User created via phone OTP', { userId: user._id });
  } else {
    await User.findOneAndUpdate({ phoneNumber }, { isVerified: true });
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  let driverProfile = null;
  if (user.role === 'driver') {
    driverProfile = await Driver.findOne({ user: user._id });
  }

  logger.info('Phone OTP verified', { userId: user._id });

  res.json({
    message: 'Phone verified successfully',
    accessToken,
    refreshToken,
    user,
    driverProfile
  });
});

exports.uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  await User.findByIdAndUpdate(req.user._id, { profilePhoto: photoUrl });

  res.json({ message: 'Profile photo uploaded', profilePhoto: photoUrl });
});

exports.updateDriverStatus = asyncHandler(async (req, res) => {
  const { isOnline } = req.body;

  if (typeof isOnline !== 'boolean') {
    return res.status(400).json({ error: 'isOnline must be a boolean' });
  }

  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }

  driver.isAvailable = isOnline;
  if (!isOnline) {
    driver.currentTrip = null;
  }
  await driver.save();

  await User.findByIdAndUpdate(req.user._id, {
    isOnline,
    currentLocation: {
      type: 'Point',
      coordinates: req.body.coordinates || [0, 0],
      updatedAt: new Date()
    }
  });

  logger.info('Driver status updated', { driverId: driver._id, isOnline });

  res.json({ message: 'Status updated', isOnline, isAvailable: driver.isAvailable });
});

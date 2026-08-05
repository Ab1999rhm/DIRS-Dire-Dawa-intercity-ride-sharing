const path = require('path');
const User = require('../../models/User');
const Driver = require('../../models/Driver');
const Vehicle = require('../../models/Vehicle');
const { asyncHandler } = require('../../middleware/errorHandler');

exports.uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  await User.findByIdAndUpdate(req.user._id, { profilePhoto: photoUrl });

  res.json({ message: 'Profile photo uploaded', profilePhoto: photoUrl });
});

exports.uploadDocuments = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }

  const updates = {};

  if (req.files?.licensePhoto) {
    driver.licensePhoto = `/uploads/${req.files.licensePhoto[0].filename}`;
    updates.licensePhoto = driver.licensePhoto;
  }
  if (req.files?.nationalIdPhoto) {
    driver.nationalIdPhoto = `/uploads/${req.files.nationalIdPhoto[0].filename}`;
    updates.nationalIdPhoto = driver.nationalIdPhoto;
  }
  if (req.body.licenseNumber) {
    driver.licenseNumber = req.body.licenseNumber;
    updates.licenseNumber = driver.licenseNumber;
  }
  if (req.body.licenseExpiry) {
    driver.licenseExpiry = req.body.licenseExpiry;
    updates.licenseExpiry = driver.licenseExpiry;
  }
  if (req.body.nationalId) {
    driver.nationalId = req.body.nationalId;
    updates.nationalId = driver.nationalId;
  }

  if (driver.verificationStatus === 'rejected') {
    driver.verificationStatus = 'pending';
    driver.rejectionReason = null;
  }

  await driver.save();

  res.json({ message: 'Documents uploaded successfully', driver });
});

exports.uploadVehicleDocuments = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }

  const vehicle = await Vehicle.findOne({ driver: driver._id, isActive: true });
  if (!vehicle) {
    return res.status(404).json({ error: 'No active vehicle found' });
  }

  if (req.files?.vehiclePhoto) {
    vehicle.vehiclePhoto = `/uploads/${req.files.vehiclePhoto[0].filename}`;
  }
  if (req.files?.registrationPhoto) {
    vehicle.registrationPhoto = `/uploads/${req.files.registrationPhoto[0].filename}`;
  }
  if (req.files?.insurancePhoto) {
    vehicle.insurancePhoto = `/uploads/${req.files.insurancePhoto[0].filename}`;
  }
  if (req.body.insuranceExpiry) {
    vehicle.insuranceExpiry = req.body.insuranceExpiry;
  }
  if (req.body.registrationExpiry) {
    vehicle.registrationExpiry = req.body.registrationExpiry;
  }

  await vehicle.save();

  res.json({ message: 'Vehicle documents uploaded', vehicle });
});

exports.getDocuments = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }

  const vehicle = await Vehicle.findOne({ driver: driver._id, isActive: true });
  const user = await User.findById(req.user._id);

  res.json({
    profilePhoto: user.profilePhoto,
    driver: {
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      licensePhoto: driver.licensePhoto,
      nationalId: driver.nationalId,
      nationalIdPhoto: driver.nationalIdPhoto,
      verificationStatus: driver.verificationStatus,
      rejectionReason: driver.rejectionReason
    },
    vehicle: vehicle ? {
      vehiclePhoto: vehicle.vehiclePhoto,
      registrationPhoto: vehicle.registrationPhoto,
      registrationExpiry: vehicle.registrationExpiry,
      insuranceExpiry: vehicle.insuranceExpiry,
      insurancePhoto: vehicle.insurancePhoto
    } : null
  });
});

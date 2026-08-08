const User = require('../../models/User');
const Driver = require('../../models/Driver');
const Vehicle = require('../../models/Vehicle');
const { asyncHandler } = require('../../middleware/errorHandler');

exports.uploadProfilePhoto = asyncHandler(async (req, res) => {
  const { photoUrl } = req.body;
  if (!photoUrl) {
    return res.status(400).json({ error: 'photoUrl is required' });
  }
  await User.findByIdAndUpdate(req.user._id, { profilePhoto: photoUrl });
  res.json({ message: 'Profile photo uploaded', profilePhoto: photoUrl });
});

exports.uploadDocuments = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }

  const { licensePhotoUrl, nationalIdPhotoUrl, licenseNumber, licenseExpiry, nationalId } = req.body;

  if (licensePhotoUrl) driver.licensePhoto = licensePhotoUrl;
  if (nationalIdPhotoUrl) driver.nationalIdPhoto = nationalIdPhotoUrl;
  if (licenseNumber) driver.licenseNumber = licenseNumber;
  if (licenseExpiry) driver.licenseExpiry = licenseExpiry;
  if (nationalId) driver.nationalId = nationalId;

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

  const { vehiclePhotoUrl, registrationPhotoUrl, insurancePhotoUrl, insuranceExpiry, registrationExpiry } = req.body;

  if (vehiclePhotoUrl) vehicle.vehiclePhoto = vehiclePhotoUrl;
  if (registrationPhotoUrl) vehicle.registrationPhoto = registrationPhotoUrl;
  if (insurancePhotoUrl) vehicle.insurancePhoto = insurancePhotoUrl;
  if (insuranceExpiry) vehicle.insuranceExpiry = insuranceExpiry;
  if (registrationExpiry) vehicle.registrationExpiry = registrationExpiry;

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

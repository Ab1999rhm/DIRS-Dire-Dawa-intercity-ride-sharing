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

  const { licensePhotoUrl, nationalIdPhotoUrl, licenseNumber, licenseExpiry, nationalId, librePhotoUrl, insurancePhotoUrl, policeClearancePhotoUrl } = req.body;

  if (licensePhotoUrl) driver.licensePhoto = licensePhotoUrl;
  if (nationalIdPhotoUrl) driver.nationalIdPhoto = nationalIdPhotoUrl;
  if (licenseNumber) driver.licenseNumber = licenseNumber;
  if (licenseExpiry) driver.licenseExpiry = licenseExpiry;
  if (nationalId) driver.nationalId = nationalId;
  if (librePhotoUrl) {
    driver.set('documents.librePhoto', { data: librePhotoUrl, status: 'pending', updatedAt: new Date() });
  }
  if (insurancePhotoUrl) {
    driver.set('documents.insurancePhoto', { data: insurancePhotoUrl, status: 'pending', updatedAt: new Date() });
  }
  if (policeClearancePhotoUrl) {
    driver.set('documents.policeClearancePhoto', { data: policeClearancePhotoUrl, status: 'pending', updatedAt: new Date() });
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

  let vehicle = await Vehicle.findOne({ driver: driver._id, isActive: true });
  if (!vehicle) {
    vehicle = await Vehicle.create({
      driver: driver._id,
      vehicleType: 'car',
      make: 'Pending',
      model: 'Pending',
      plateNumber: `PENDING-${driver._id}`,
      color: 'Unknown',
      year: new Date().getFullYear(),
      capacity: 4
    });
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
      rejectionReason: driver.rejectionReason,
      librePhoto: driver.documents?.librePhoto?.data || null,
      insurancePhoto: driver.documents?.insurancePhoto?.data || null,
      policeClearancePhoto: driver.documents?.policeClearancePhoto?.data || null
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

const Vehicle = require('../../models/Vehicle');
const Driver = require('../../models/Driver');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');

exports.registerVehicle = asyncHandler(async (req, res) => {
  const {
    vehicleType, make, model, year, color,
    plateNumber, registrationExpiry, capacity,
    serviceType, insuranceExpiry,
    registrationPhotoUrl, vehiclePhotoUrl
  } = req.body;

  const driver = await Driver.findOne({ user: req.user._id });

  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }

  const existingVehicle = await Vehicle.findOne({ plateNumber });
  if (existingVehicle) {
    return res.status(400).json({ error: 'Vehicle with this plate number already exists' });
  }

  const vehicle = await Vehicle.create({
    driver: driver._id,
    vehicleType, make, model, year, color,
    plateNumber, registrationExpiry, capacity,
    serviceType,
    insuranceExpiry,
    registrationPhoto: registrationPhotoUrl || req.files?.registrationPhoto?.[0]?.path,
    vehiclePhoto: vehiclePhotoUrl || req.files?.vehiclePhoto?.[0]?.path
  });

  logger.info('Vehicle registered', { vehicleId: vehicle._id, driverId: driver._id });

  res.status(201).json({ vehicle });
});

exports.getMyVehicle = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });

  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }

  const vehicle = await Vehicle.findOne({ driver: driver._id, isActive: true });

  res.json({ vehicle });
});

exports.updateVehicle = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });

  if (!driver) {
    return res.status(404).json({ error: 'Driver profile not found' });
  }

  const { vehicleType, make, model, year, color, plateNumber, capacity, serviceType, registrationPhotoUrl, vehiclePhotoUrl } = req.body;

  const updateData = { vehicleType, make, model, year, color, plateNumber, capacity, serviceType };
  if (registrationPhotoUrl) updateData.registrationPhoto = registrationPhotoUrl;
  if (vehiclePhotoUrl) updateData.vehiclePhoto = vehiclePhotoUrl;

  const vehicle = await Vehicle.findOneAndUpdate(
    { driver: driver._id, isActive: true },
    updateData,
    { new: true, runValidators: true }
  );

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  res.json({ vehicle });
});

exports.getVehicleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id)
    .populate('driver', 'user verificationStatus')
    .populate({
      path: 'driver',
      populate: { path: 'user', select: 'firstName lastName averageRating' }
    });

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  res.json({ vehicle });
});

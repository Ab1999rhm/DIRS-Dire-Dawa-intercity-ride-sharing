const User = require('../../models/User');
const { asyncHandler } = require('../../middleware/errorHandler');

exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-refreshToken');
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
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

  await User.findByIdAndUpdate(req.user._id, {
    currentLocation: {
      type: 'Point',
      coordinates,
      updatedAt: new Date()
    }
  });

  res.json({ message: 'Location updated' });
});

exports.addEmergencyContact = asyncHandler(async (req, res) => {
  const { name, phoneNumber, relationship } = req.body;

  const user = await User.findById(req.user._id);
  user.emergencyContacts.push({ name, phoneNumber, relationship });
  await user.save();

  res.json({ emergencyContacts: user.emergencyContacts });
});

exports.removeEmergencyContact = asyncHandler(async (req, res) => {
  const { contactId } = req.params;

  const user = await User.findById(req.user._id);
  user.emergencyContacts = user.emergencyContacts.filter(c => c._id.toString() !== contactId);
  await user.save();

  res.json({ emergencyContacts: user.emergencyContacts });
});

exports.addFavoriteLocation = asyncHandler(async (req, res) => {
  const { name, address, coordinates } = req.body;

  const user = await User.findById(req.user._id);
  user.favoriteLocations.push({
    name,
    address,
    location: {
      type: 'Point',
      coordinates
    }
  });
  await user.save();

  res.json({ favoriteLocations: user.favoriteLocations });
});

exports.removeFavoriteLocation = asyncHandler(async (req, res) => {
  const { locationId } = req.params;

  const user = await User.findById(req.user._id);
  user.favoriteLocations = user.favoriteLocations.filter(l => l._id.toString() !== locationId);
  await user.save();

  res.json({ favoriteLocations: user.favoriteLocations });
});

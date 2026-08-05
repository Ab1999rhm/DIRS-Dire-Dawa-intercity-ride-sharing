const User = require('../../models/User');

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-refreshToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, preferredLanguage, emergencyContacts, favoriteLocations } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, email, preferredLanguage, emergencyContacts, favoriteLocations },
      { new: true, runValidators: true }
    );

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Profile update failed' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: {
        type: 'Point',
        coordinates,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ error: 'Location update failed' });
  }
};

exports.addEmergencyContact = async (req, res) => {
  try {
    const { name, phoneNumber, relationship } = req.body;

    const user = await User.findById(req.user._id);
    user.emergencyContacts.push({ name, phoneNumber, relationship });
    await user.save();

    res.json({ emergencyContacts: user.emergencyContacts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add emergency contact' });
  }
};

exports.removeEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const user = await User.findById(req.user._id);
    user.emergencyContacts = user.emergencyContacts.filter(c => c._id.toString() !== contactId);
    await user.save();

    res.json({ emergencyContacts: user.emergencyContacts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove emergency contact' });
  }
};

exports.addFavoriteLocation = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to add favorite location' });
  }
};

exports.removeFavoriteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const user = await User.findById(req.user._id);
    user.favoriteLocations = user.favoriteLocations.filter(l => l._id.toString() !== locationId);
    await user.save();

    res.json({ favoriteLocations: user.favoriteLocations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove favorite location' });
  }
};

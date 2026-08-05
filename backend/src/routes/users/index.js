const express = require('express');
const router = express.Router();
const userController = require('../../controllers/users/userController');
const { protect } = require('../../middleware/auth');

router.get('/:id', protect, userController.getUserById);
router.put('/profile', protect, userController.updateProfile);
router.put('/location', protect, userController.updateLocation);
router.post('/emergency-contacts', protect, userController.addEmergencyContact);
router.delete('/emergency-contacts/:contactId', protect, userController.removeEmergencyContact);
router.post('/favorite-locations', protect, userController.addFavoriteLocation);
router.delete('/favorite-locations/:locationId', protect, userController.removeFavoriteLocation);

module.exports = router;

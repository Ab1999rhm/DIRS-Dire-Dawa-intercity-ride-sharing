const express = require('express');
const router = express.Router();
const userController = require('../../controllers/users/userController');
const adminController = require('../../controllers/admin/adminController');
const { protect } = require('../../middleware/auth');

router.get('/:id', protect, userController.getUserById);
router.put('/profile', protect, userController.updateProfile);
router.put('/location', protect, userController.updateLocation);
router.post('/emergency-contacts', protect, userController.addEmergencyContact);
router.delete('/emergency-contacts/:contactId', protect, userController.removeEmergencyContact);
router.post('/favorite-locations', protect, userController.addFavoriteLocation);
router.delete('/favorite-locations/:locationId', protect, userController.removeFavoriteLocation);

// ==================== CONTENT & NOTIFICATIONS ROUTES ====================

// Active Announcements (for passengers and drivers)
router.get('/content/announcements/active', protect, adminController.getActiveAnnouncements);
router.post('/content/announcements/:id/track-view', protect, adminController.trackAnnouncementView);
router.post('/content/announcements/:id/track-click', protect, adminController.trackAnnouncementClick);

// Active In-App Content (for passengers and drivers)
router.get('/content/in-app/active', protect, adminController.getActiveInAppContent);
router.post('/content/in-app/:id/track-view', protect, adminController.trackContentView);
router.post('/content/in-app/:id/track-click', protect, adminController.trackContentClick);

// Push Notification Tracking (for passengers and drivers)
router.post('/content/push-notifications/:id/track-open', protect, adminController.trackNotificationOpen);
router.post('/content/push-notifications/:id/track-click', protect, adminController.trackNotificationClick);

module.exports = router;

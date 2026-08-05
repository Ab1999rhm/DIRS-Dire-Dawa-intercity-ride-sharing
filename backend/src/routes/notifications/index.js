const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notifications/notificationController');
const { protect } = require('../../middleware/auth');

router.get('/', protect, notificationController.getNotifications);
router.put('/:notificationId/read', protect, notificationController.markRead);
router.put('/read-all', protect, notificationController.markAllRead);
router.delete('/:notificationId', protect, notificationController.deleteNotification);

module.exports = router;

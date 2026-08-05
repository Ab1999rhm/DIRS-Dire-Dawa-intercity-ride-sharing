const express = require('express');
const router = express.Router();
const sosController = require('../../controllers/sos/sosController');
const { protect, authorize } = require('../../middleware/auth');

router.post('/trigger', protect, sosController.triggerSOS);
router.post('/:alertId/resolve', protect, authorize('admin'), sosController.resolveSOS);
router.get('/active', protect, authorize('admin'), sosController.getActiveSOSAlerts);
router.get('/history', protect, sosController.getUserSOSHistory);
router.post('/share-trip', protect, sosController.shareTrip);

module.exports = router;

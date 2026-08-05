const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController');
const { protect, authorize } = require('../../middleware/auth');

router.get('/dashboard', protect, authorize('admin'), adminController.getDashboardStats);
router.get('/users', protect, authorize('admin'), adminController.getAllUsers);
router.put('/users/:userId/suspend', protect, authorize('admin'), adminController.suspendUser);
router.put('/users/:userId/reactivate', protect, authorize('admin'), adminController.reactivateUser);
router.get('/drivers/pending', protect, authorize('admin'), adminController.getPendingDriverVerifications);
router.post('/drivers/:driverId/verify', protect, authorize('admin'), adminController.verifyDriver);
router.get('/trips', protect, authorize('admin'), adminController.getAllTrips);
router.get('/payments', protect, authorize('admin'), adminController.getPaymentOverview);
router.get('/reports', protect, authorize('admin'), adminController.generateReport);
router.get('/sos', protect, authorize('admin'), adminController.getSOSAlerts);

module.exports = router;

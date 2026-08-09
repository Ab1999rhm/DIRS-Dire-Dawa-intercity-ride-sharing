const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController');
const { protect, authorize } = require('../../middleware/auth');

router.get('/dashboard', protect, authorize('admin'), adminController.getDashboardStats);
router.get('/users', protect, authorize('admin'), adminController.getAllUsers);
router.put('/users/:userId/suspend', protect, authorize('admin'), adminController.suspendUser);
router.put('/users/:userId/reactivate', protect, authorize('admin'), adminController.reactivateUser);
router.get('/drivers', protect, authorize('admin'), adminController.getAllDrivers);
router.get('/drivers/pending', protect, authorize('admin'), adminController.getPendingDriverVerifications);
router.post('/drivers/:driverId/verify', protect, authorize('admin'), adminController.verifyDriver);
router.get('/trips', protect, authorize('admin'), adminController.getAllTrips);
router.get('/payments', protect, authorize('admin'), adminController.getPaymentOverview);
router.get('/reports', protect, authorize('admin'), adminController.generateReport);
router.get('/sos', protect, authorize('admin'), adminController.getSOSAlerts);

// Monitoring
router.get('/monitoring/system-health', protect, authorize('admin'), adminController.getSystemHealth);
router.get('/monitoring/active-drivers', protect, authorize('admin'), adminController.getActiveDriversMonitoring);
router.get('/monitoring/active-trips', protect, authorize('admin'), adminController.getActiveTripsMonitoring);
router.post('/monitoring/sos/:sosId/respond', protect, authorize('admin'), adminController.respondToSOS);

// Financial
router.get('/financials/revenue', protect, authorize('admin'), adminController.getRevenueBreakdown);
router.get('/financials/transactions', protect, authorize('admin'), adminController.getPaymentTransactions);
router.post('/financials/commission', protect, authorize('admin'), adminController.processCommission);

// Safety
router.get('/safety/fraud-alerts', protect, authorize('admin'), adminController.getFraudAlerts);
router.get('/safety/suspicious-activity', protect, authorize('admin'), adminController.getSuspiciousActivity);
router.post('/safety/incidents', protect, authorize('admin'), adminController.reportIncident);

// Support
router.get('/support/tickets', protect, authorize('admin'), adminController.getSupportTickets);
router.put('/support/tickets/:ticketId', protect, authorize('admin'), adminController.updateTicket);

// Analytics
router.get('/analytics/demand-heatmap', protect, authorize('admin'), adminController.getDemandHeatmap);
router.get('/analytics/peak-hours', protect, authorize('admin'), adminController.getPeakHours);
router.get('/analytics/retention', protect, authorize('admin'), adminController.getRetentionMetrics);

// Config
router.get('/config/service-areas', protect, authorize('admin'), adminController.getServiceAreas);
router.put('/config/service-areas', protect, authorize('admin'), adminController.updateServiceAreas);

// Passenger wallet
router.get('/passengers/:passengerId/wallet', protect, authorize('admin'), adminController.getPassengerWallet);
router.post('/passengers/:passengerId/refund', protect, authorize('admin'), adminController.processRefund);

// Driver details
router.get('/drivers/:driverId/documents', protect, authorize('admin'), adminController.getDriverDocuments);
router.put('/drivers/:driverId/approve', protect, authorize('admin'), adminController.approveDriverDirect);
router.put('/drivers/:driverId/reject', protect, authorize('admin'), adminController.rejectDriverDirect);
router.put('/drivers/:driverId/suspend', protect, authorize('admin'), adminController.suspendDriver);
router.get('/drivers/:driverId/earnings', protect, authorize('admin'), adminController.getDriverEarnings);

// Trip details
router.get('/trips/:tripId', protect, authorize('admin'), adminController.getTripDetails);
router.put('/trips/:tripId/adjust-fare', protect, authorize('admin'), adminController.adjustFare);
router.post('/trips/:tripId/resolve-dispute', protect, authorize('admin'), adminController.resolveDispute);

// Content
router.post('/content/push-notification', protect, authorize('admin'), adminController.sendPushNotification);
router.post('/content/announcements', protect, authorize('admin'), adminController.createAnnouncement);

module.exports = router;

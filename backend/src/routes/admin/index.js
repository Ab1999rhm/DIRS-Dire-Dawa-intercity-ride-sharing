const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController');
const { protect, authorize } = require('../../middleware/auth');

router.get('/dashboard', protect, authorize('admin'), adminController.getDashboardStats);
router.get('/users', protect, authorize('admin'), adminController.getAllUsers);
router.put('/users/:userId/suspend', protect, authorize('admin'), adminController.suspendUser);
router.put('/users/:userId/reactivate', protect, authorize('admin'), adminController.reactivateUser);
router.put('/users/:userId/verify', protect, authorize('admin'), adminController.verifyUser);
router.delete('/users/:userId', protect, authorize('admin'), adminController.deleteUser);
router.post('/users/delete-unverified', protect, authorize('admin'), adminController.deleteUnverifiedUsers);
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
router.get('/monitoring/drivers-locations', protect, authorize('admin'), adminController.getActiveDriversLocations);
router.get('/monitoring/trips-routes', protect, authorize('admin'), adminController.getActiveTripsRoutes);
router.get('/monitoring/booking-queue', protect, authorize('admin'), adminController.getBookingQueue);

// Financial
router.get('/financials/revenue', protect, authorize('admin'), adminController.getRevenueBreakdown);
router.get('/financials/transactions', protect, authorize('admin'), adminController.getPaymentTransactions);
router.post('/financials/commission', protect, authorize('admin'), adminController.processCommission);

// ==================== SAFETY & SECURITY ROUTES ====================

// SOS/Emergency System
router.get('/safety/sos-alerts', protect, authorize('admin'), adminController.getSOSAlerts);
router.get('/safety/sos-history/:userId', protect, authorize('admin'), adminController.getSOSHistory);
router.put('/safety/sos/:alertId/resolve', protect, authorize('admin'), adminController.resolveSOS);

// Fraud Detection
router.get('/safety/fraud-alerts', protect, authorize('admin'), adminController.getFraudAlerts);
router.put('/safety/fraud/:fraudId/investigate', protect, authorize('admin'), adminController.investigateFraud);

// Suspicious Activity
router.get('/safety/suspicious-activities', protect, authorize('admin'), adminController.getSuspiciousActivities);
router.put('/safety/suspicious/:activityId/resolve', protect, authorize('admin'), adminController.resolveSuspiciousActivity);

// Incident Management
router.get('/safety/incidents', protect, authorize('admin'), adminController.getIncidents);
router.post('/safety/incidents', protect, authorize('admin'), adminController.createIncident);
router.put('/safety/incidents/:incidentId/assign', protect, authorize('admin'), adminController.assignIncident);
router.post('/safety/incidents/:incidentId/notes', protect, authorize('admin'), adminController.addInvestigationNote);
router.put('/safety/incidents/:incidentId/resolve', protect, authorize('admin'), adminController.resolveIncident);

// Banned/Blocked Users
router.get('/safety/blocked-users', protect, authorize('admin'), adminController.getBlockedUsers);
router.put('/safety/users/:userId/block', protect, authorize('admin'), adminController.blockUser);
router.put('/safety/users/:userId/unblock', protect, authorize('admin'), adminController.unblockUser);

// Safety Verification
router.get('/safety/pending-verifications', protect, authorize('admin'), adminController.getPendingVerifications);
router.put('/safety/drivers/:driverId/approve', protect, authorize('admin'), adminController.approveDriverVerification);
router.put('/safety/drivers/:driverId/reject', protect, authorize('admin'), adminController.rejectDriverVerification);

// Emergency Services Integration
router.put('/safety/incidents/:incidentId/police', protect, authorize('admin'), adminController.notifyPolice);
router.put('/safety/incidents/:incidentId/ambulance', protect, authorize('admin'), adminController.dispatchAmbulance);
router.get('/safety/users/:userId/emergency-contacts', protect, authorize('admin'), adminController.getEmergencyContacts);
router.get('/safety/dispatch-contacts', protect, authorize('admin'), adminController.getDispatchContacts);
router.post('/safety/dispatch-contacts', protect, authorize('admin'), adminController.createDispatchContact);
router.put('/safety/dispatch-contacts/:contactId', protect, authorize('admin'), adminController.updateDispatchContact);
router.delete('/safety/dispatch-contacts/:contactId', protect, authorize('admin'), adminController.deleteDispatchContact);

// Safety Analytics & Reports
router.get('/safety/analytics', protect, authorize('admin'), adminController.getSafetyAnalytics);

// Driver Behavior Monitoring
router.get('/safety/drivers/:driverId/behavior', protect, authorize('admin'), adminController.getDriverBehaviorReport);

// Passenger Behavior Monitoring
router.get('/safety/passengers/:userId/behavior', protect, authorize('admin'), adminController.getPassengerBehaviorReport);

// Support
router.get('/support/tickets', protect, authorize('admin'), adminController.getTickets);
router.get('/support/tickets/:ticketId', protect, authorize('admin'), adminController.getTicket);
router.post('/support/tickets', protect, authorize('admin'), adminController.createTicket);
router.put('/support/tickets/:ticketId', protect, authorize('admin'), adminController.updateTicket);
router.post('/support/tickets/:ticketId/messages', protect, authorize('admin'), adminController.addTicketMessage);
router.put('/support/tickets/:ticketId/resolve', protect, authorize('admin'), adminController.resolveTicket);
router.put('/support/tickets/:ticketId/close', protect, authorize('admin'), adminController.closeTicket);
router.put('/support/tickets/:ticketId/escalate', protect, authorize('admin'), adminController.escalateTicket);
router.post('/support/tickets/bulk', protect, authorize('admin'), adminController.bulkUpdateTickets);

// Live Chat
router.get('/support/chats', protect, authorize('admin'), adminController.getSupportChats);
router.get('/support/chats/:chatId', protect, authorize('admin'), adminController.getSupportChat);
router.post('/support/chats', protect, authorize('admin'), adminController.createSupportChat);
router.post('/support/chats/:chatId/messages', protect, authorize('admin'), adminController.sendChatMessage);
router.put('/support/chats/:chatId/transfer', protect, authorize('admin'), adminController.transferChat);
router.post('/support/chats/:chatId/rate', protect, authorize('admin'), adminController.rateChat);
router.put('/support/chats/:chatId/end', protect, authorize('admin'), adminController.endChat);

// Knowledge Base
router.get('/support/faqs', protect, authorize('admin'), adminController.getFAQs);
router.get('/support/faqs/:faqId', protect, authorize('admin'), adminController.getFAQ);
router.post('/support/faqs', protect, authorize('admin'), adminController.createFAQ);
router.put('/support/faqs/:faqId', protect, authorize('admin'), adminController.updateFAQ);
router.delete('/support/faqs/:faqId', protect, authorize('admin'), adminController.deleteFAQ);
router.post('/support/faqs/:faqId/helpful', protect, authorize('admin'), adminController.markFAQHelpful);

// Canned Responses
router.get('/support/canned-responses', protect, authorize('admin'), adminController.getCannedResponses);
router.post('/support/canned-responses', protect, authorize('admin'), adminController.createCannedResponse);
router.put('/support/canned-responses/:responseId', protect, authorize('admin'), adminController.updateCannedResponse);
router.delete('/support/canned-responses/:responseId', protect, authorize('admin'), adminController.deleteCannedResponse);

// Auto Reply Rules
router.get('/support/auto-reply-rules', protect, authorize('admin'), adminController.getAutoReplyRules);
router.post('/support/auto-reply-rules', protect, authorize('admin'), adminController.createAutoReplyRule);
router.put('/support/auto-reply-rules/:ruleId', protect, authorize('admin'), adminController.updateAutoReplyRule);
router.delete('/support/auto-reply-rules/:ruleId', protect, authorize('admin'), adminController.deleteAutoReplyRule);

// Communication
router.post('/support/broadcast', protect, authorize('admin'), adminController.sendBroadcastMessage);
router.post('/support/email', protect, authorize('admin'), adminController.sendEmailNotification);
router.post('/support/sms', protect, authorize('admin'), adminController.sendSMSNotification);

// Support Analytics
router.get('/support/analytics', protect, authorize('admin'), adminController.getSupportAnalytics);

// User Support
router.get('/support/users/:userId/history', protect, authorize('admin'), adminController.getUserSupportHistory);
router.get('/support/users/:userId/profile', protect, authorize('admin'), adminController.getUserSupportProfile);

// Reports
router.get('/support/reports', protect, authorize('admin'), adminController.generateSupportReport);
router.get('/support/sla-compliance', protect, authorize('admin'), adminController.getSLACompliance);

// ==================== ANALYTICS & REPORTING ROUTES ====================
// Revenue Analytics
router.get('/analytics/revenue/trends', protect, authorize('admin'), adminController.getRevenueTrends);
router.get('/analytics/revenue/by-route', protect, authorize('admin'), adminController.getRevenueByRoute);
router.get('/analytics/revenue/by-vehicle', protect, authorize('admin'), adminController.getRevenueByVehicleType);
router.get('/analytics/revenue/per-driver', protect, authorize('admin'), adminController.getRevenuePerDriver);
router.get('/analytics/revenue/per-passenger', protect, authorize('admin'), adminController.getRevenuePerPassenger);
router.get('/analytics/revenue/surge-impact', protect, authorize('admin'), adminController.getSurgePricingImpact);

// Trip Analytics
router.get('/analytics/trips/completion-rate', protect, authorize('admin'), adminController.getTripCompletionRate);
router.get('/analytics/trips/cancellation-reasons', protect, authorize('admin'), adminController.getCancellationReasons);
router.get('/analytics/trips/avg-duration', protect, authorize('admin'), adminController.getAverageTripDuration);
router.get('/analytics/trips/avg-distance', protect, authorize('admin'), adminController.getAverageTripDistance);
router.get('/analytics/trips/volume-trends', protect, authorize('admin'), adminController.getTripVolumeTrends);

// User Analytics
router.get('/analytics/users/growth', protect, authorize('admin'), adminController.getUserGrowth);
router.get('/analytics/users/activity', protect, authorize('admin'), adminController.getUserActivity);
router.get('/analytics/users/demographics', protect, authorize('admin'), adminController.getUserDemographics);
router.get('/analytics/users/behavior', protect, authorize('admin'), adminController.getUserBehavior);
router.get('/analytics/users/lifetime-value', protect, authorize('admin'), adminController.getUserLifetimeValue);

// Driver Analytics
router.get('/analytics/drivers/availability', protect, authorize('admin'), adminController.getDriverAvailability);
router.get('/analytics/drivers/utilization', protect, authorize('admin'), adminController.getDriverUtilization);
router.get('/analytics/drivers/performance', protect, authorize('admin'), adminController.getAllDriversPerformance);
router.get('/analytics/drivers/earnings', protect, authorize('admin'), adminController.getDriverEarnings);
router.get('/analytics/drivers/churn', protect, authorize('admin'), adminController.getDriverChurn);

// Geographic Analytics
router.get('/analytics/geo/demand-heatmap', protect, authorize('admin'), adminController.getDemandHeatmap);
router.get('/analytics/geo/supply-heatmap', protect, authorize('admin'), adminController.getSupplyHeatmap);
router.get('/analytics/geo/route-popularity', protect, authorize('admin'), adminController.getRoutePopularity);
router.get('/analytics/geo/area-performance', protect, authorize('admin'), adminController.getAreaPerformance);
router.get('/analytics/geo/coverage-gaps', protect, authorize('admin'), adminController.getCoverageGaps);

// Time Analytics
router.get('/analytics/time/peak-hours', protect, authorize('admin'), adminController.getPeakHours);
router.get('/analytics/time/peak-days', protect, authorize('admin'), adminController.getPeakDays);
router.get('/analytics/time/seasonal-trends', protect, authorize('admin'), adminController.getSeasonalTrends);
router.get('/analytics/time/holiday-impact', protect, authorize('admin'), adminController.getHolidayImpact);

// Financial Analytics
router.get('/analytics/financial/commission-rate', protect, authorize('admin'), adminController.getCommissionCollectionRate);
router.get('/analytics/financial/refund-rate', protect, authorize('admin'), adminController.getRefundRate);
router.get('/analytics/financial/avg-fare', protect, authorize('admin'), adminController.getAverageFare);
router.get('/analytics/financial/payment-distribution', protect, authorize('admin'), adminController.getPaymentMethodDistribution);

// Performance Metrics
router.get('/analytics/performance/driver-response-time', protect, authorize('admin'), adminController.getDriverResponseTime);
router.get('/analytics/performance/avg-wait-time', protect, authorize('admin'), adminController.getAverageWaitTime);
router.get('/analytics/performance/app-crash-rate', protect, authorize('admin'), adminController.getAppCrashRate);
router.get('/analytics/performance/api-response-time', protect, authorize('admin'), adminController.getAPIResponseTime);

// Reports
router.get('/reports/daily', protect, authorize('admin'), adminController.generateDailyReport);
router.get('/reports/weekly', protect, authorize('admin'), adminController.generateWeeklyReport);
router.get('/reports/monthly', protect, authorize('admin'), adminController.generateMonthlyReport);
router.get('/reports/custom', protect, authorize('admin'), adminController.generateCustomReport);
router.get('/reports/export', protect, authorize('admin'), adminController.exportReport);
router.post('/reports/schedule', protect, authorize('admin'), adminController.scheduleReport);

// Forecasting
router.get('/forecast/demand', protect, authorize('admin'), adminController.getDemandPrediction);
router.get('/forecast/driver-supply', protect, authorize('admin'), adminController.getDriverSupplyForecast);
router.get('/forecast/revenue', protect, authorize('admin'), adminController.getRevenueProjection);

// Comparative Analytics
router.get('/analytics/compare/periods', protect, authorize('admin'), adminController.getPeriodComparison);
router.get('/analytics/compare/year-over-year', protect, authorize('admin'), adminController.getYearOverYear);
router.get('/analytics/compare/competitors', protect, authorize('admin'), adminController.getCompetitorAnalysis);

// Analytics
router.get('/analytics/demand-heatmap', protect, authorize('admin'), adminController.getDemandHeatmap);
router.get('/analytics/peak-hours', protect, authorize('admin'), adminController.getPeakHours);
router.get('/analytics/retention', protect, authorize('admin'), adminController.getRetentionMetrics);

// Config
router.get('/config/service-areas', protect, authorize('admin'), adminController.getServiceAreas);
router.put('/config/service-areas', protect, authorize('admin'), adminController.updateServiceAreas);

// Passenger wallet
router.get('/passengers/:passengerId/wallet', protect, authorize('admin'), adminController.getPassengerWallet);
router.post('/passengers/:passengerId/refund', protect, authorize('admin'), adminController.processPassengerRefund);
router.post('/passengers/:passengerId/add-funds', protect, authorize('admin'), adminController.addPassengerFunds);
router.get('/passengers/:passengerId/transactions', protect, authorize('admin'), adminController.getPassengerTransactions);
router.put('/passengers/:passengerId/ban', protect, authorize('admin'), adminController.banPassenger);
router.post('/passengers/:passengerId/message', protect, authorize('admin'), adminController.sendPassengerMessage);
router.post('/passengers/:passengerId/warning', protect, authorize('admin'), adminController.issuePassengerWarning);
router.get('/passengers/:passengerId/trips', protect, authorize('admin'), adminController.getPassengerTrips);
router.get('/passengers/:passengerId/behavior', protect, authorize('admin'), adminController.getPassengerBehavior);
router.put('/passengers/:passengerId/block-booking', protect, authorize('admin'), adminController.blockPassengerBooking);
router.put('/passengers/:passengerId/unblock-booking', protect, authorize('admin'), adminController.unblockPassengerBooking);
router.get('/passengers/:passengerId/login-history', protect, authorize('admin'), adminController.getPassengerLoginHistory);
router.get('/passengers/analytics', protect, authorize('admin'), adminController.getPassengerAnalytics);

// Driver details
router.get('/drivers/:driverId/documents', protect, authorize('admin'), adminController.getDriverDocuments);
router.put('/drivers/:driverId/approve', protect, authorize('admin'), adminController.approveDriverDirect);
router.put('/drivers/:driverId/reject', protect, authorize('admin'), adminController.rejectDriverDirect);
router.put('/drivers/:driverId/suspend', protect, authorize('admin'), adminController.suspendDriver);
router.put('/drivers/:driverId/ban', protect, authorize('admin'), adminController.banDriver);
router.put('/drivers/:driverId/reactivate', protect, authorize('admin'), adminController.reactivateDriver);
router.get('/drivers/:driverId/earnings', protect, authorize('admin'), adminController.getDriverEarnings);
router.put('/drivers/:driverId/commission-rate', protect, authorize('admin'), adminController.adjustCommissionRate);
router.post('/drivers/:driverId/payout', protect, authorize('admin'), adminController.processPayout);
router.post('/drivers/:driverId/request-resubmit', protect, authorize('admin'), adminController.requestDocumentResubmit);
router.post('/drivers/:driverId/message', protect, authorize('admin'), adminController.sendDriverMessage);
router.post('/drivers/:driverId/warning', protect, authorize('admin'), adminController.issueDriverWarning);
router.get('/drivers/:driverId/performance', protect, authorize('admin'), adminController.getDriverPerformance);
router.get('/drivers/:driverId/response-time', protect, authorize('admin'), adminController.getDriverResponseTime);
router.get('/drivers/activity-heatmap', protect, authorize('admin'), adminController.getDriverActivityHeatmap);
router.get('/drivers/retention', protect, authorize('admin'), adminController.getDriverRetention);

// Trip details
router.get('/trips/:tripId', protect, authorize('admin'), adminController.getTripDetails);
router.put('/trips/:tripId/adjust-fare', protect, authorize('admin'), adminController.adjustFare);
router.post('/trips/:tripId/resolve-dispute', protect, authorize('admin'), adminController.resolveDispute);
router.put('/trips/:tripId/complete', protect, authorize('admin'), adminController.completeTrip);
router.put('/trips/:tripId/cancel', protect, authorize('admin'), adminController.cancelTrip);
router.put('/trips/:tripId/reassign-driver', protect, authorize('admin'), adminController.reassignDriver);
router.put('/trips/:tripId/no-show', protect, authorize('admin'), adminController.markNoShow);
router.post('/trips/:tripId/refund', protect, authorize('admin'), adminController.processRefund);
router.post('/trips/:tripId/payout', protect, authorize('admin'), adminController.processDriverPayout);
router.post('/trips/:tripId/promo-code', protect, authorize('admin'), adminController.applyPromoCode);
router.post('/trips/:tripId/dispute/fare', protect, authorize('admin'), adminController.handleFareDispute);
router.post('/trips/:tripId/dispute/route', protect, authorize('admin'), adminController.handleRouteDispute);
router.post('/trips/:tripId/dispute/behavior', protect, authorize('admin'), adminController.handleBehaviorComplaint);
router.post('/trips/:tripId/compensation', protect, authorize('admin'), adminController.issueCompensation);
router.get('/trips/analytics', protect, authorize('admin'), adminController.getTripAnalytics);
router.get('/trips/export', protect, authorize('admin'), adminController.exportTripData);

// Dispute management
router.get('/disputes', protect, authorize('admin'), adminController.getDisputes);
router.put('/disputes/:disputeId/resolve', protect, authorize('admin'), adminController.resolveDispute);

// Lost item management
router.get('/lost-items', protect, authorize('admin'), adminController.getLostItems);
router.put('/lost-items/:itemId', protect, authorize('admin'), adminController.resolveLostItem);

// Driver issue management
router.get('/driver-issues', protect, authorize('admin'), adminController.getDriverIssues);
router.put('/driver-issues/:issueId/resolve', protect, authorize('admin'), adminController.resolveDriverIssue);

// Content
router.post('/content/push-notification', protect, authorize('admin'), adminController.sendPushNotification);
router.post('/content/announcements', protect, authorize('admin'), adminController.createAnnouncement);
router.post('/content/driver-announcement', protect, authorize('admin'), adminController.sendDriverAnnouncement);

// ==================== CONTENT & NOTIFICATIONS ROUTES ====================

// Push Notifications
router.post('/content/push-notifications', protect, authorize('admin'), adminController.createPushNotification);
router.get('/content/push-notifications', protect, authorize('admin'), adminController.getPushNotifications);
router.get('/content/push-notifications/:id', protect, authorize('admin'), adminController.getPushNotification);
router.put('/content/push-notifications/:id', protect, authorize('admin'), adminController.updatePushNotification);
router.delete('/content/push-notifications/:id', protect, authorize('admin'), adminController.deletePushNotification);
router.put('/content/push-notifications/:id/cancel', protect, authorize('admin'), adminController.cancelPushNotification);
router.post('/content/push-notifications/:id/track-open', protect, authorize('admin'), adminController.trackNotificationOpen);
router.post('/content/push-notifications/:id/track-click', protect, authorize('admin'), adminController.trackNotificationClick);

// Notification Templates
router.post('/content/notification-templates', protect, authorize('admin'), adminController.createNotificationTemplate);
router.get('/content/notification-templates', protect, authorize('admin'), adminController.getNotificationTemplates);
router.put('/content/notification-templates/:id', protect, authorize('admin'), adminController.updateNotificationTemplate);
router.delete('/content/notification-templates/:id', protect, authorize('admin'), adminController.deleteNotificationTemplate);

// Announcements
router.post('/content/announcements', protect, authorize('admin'), adminController.createAnnouncement);
router.get('/content/announcements', protect, authorize('admin'), adminController.getAnnouncements);
router.get('/content/announcements/active', protect, authorize('admin'), adminController.getActiveAnnouncements);
router.get('/content/announcements/:id', protect, authorize('admin'), adminController.getAnnouncement);
router.put('/content/announcements/:id', protect, authorize('admin'), adminController.updateAnnouncement);
router.delete('/content/announcements/:id', protect, authorize('admin'), adminController.deleteAnnouncement);
router.put('/content/announcements/:id/pin', protect, authorize('admin'), adminController.pinAnnouncement);
router.post('/content/announcements/:id/track-view', protect, authorize('admin'), adminController.trackAnnouncementView);
router.post('/content/announcements/:id/track-click', protect, authorize('admin'), adminController.trackAnnouncementClick);

// Promo Codes
router.post('/content/promo-codes', protect, authorize('admin'), adminController.createPromoCode);
router.get('/content/promo-codes', protect, authorize('admin'), adminController.getPromoCodes);
router.get('/content/promo-codes/:code', protect, authorize('admin'), adminController.getPromoCode);
router.post('/content/promo-codes/validate', protect, authorize('admin'), adminController.validatePromoCode);
router.put('/content/promo-codes/:id', protect, authorize('admin'), adminController.updatePromoCode);
router.delete('/content/promo-codes/:id', protect, authorize('admin'), adminController.deletePromoCode);
router.get('/content/promo-codes/:id/analytics', protect, authorize('admin'), adminController.getPromoCodeAnalytics);

// Email Campaigns
router.post('/content/email-campaigns', protect, authorize('admin'), adminController.createEmailCampaign);
router.get('/content/email-campaigns', protect, authorize('admin'), adminController.getEmailCampaigns);
router.get('/content/email-campaigns/:id', protect, authorize('admin'), adminController.getEmailCampaign);
router.put('/content/email-campaigns/:id', protect, authorize('admin'), adminController.updateEmailCampaign);
router.delete('/content/email-campaigns/:id', protect, authorize('admin'), adminController.deleteEmailCampaign);
router.put('/content/email-campaigns/:id/cancel', protect, authorize('admin'), adminController.cancelEmailCampaign);

// Email Templates
router.post('/content/email-templates', protect, authorize('admin'), adminController.createEmailTemplate);
router.get('/content/email-templates', protect, authorize('admin'), adminController.getEmailTemplates);
router.put('/content/email-templates/:id', protect, authorize('admin'), adminController.updateEmailTemplate);
router.delete('/content/email-templates/:id', protect, authorize('admin'), adminController.deleteEmailTemplate);

// SMS Campaigns
router.post('/content/sms-campaigns', protect, authorize('admin'), adminController.createSMSCampaign);
router.get('/content/sms-campaigns', protect, authorize('admin'), adminController.getSMSCampaigns);
router.get('/content/sms-campaigns/:id', protect, authorize('admin'), adminController.getSMSCampaign);
router.put('/content/sms-campaigns/:id', protect, authorize('admin'), adminController.updateSMSCampaign);
router.delete('/content/sms-campaigns/:id', protect, authorize('admin'), adminController.deleteSMSCampaign);

// SMS Templates
router.post('/content/sms-templates', protect, authorize('admin'), adminController.createSMSTemplate);
router.get('/content/sms-templates', protect, authorize('admin'), adminController.getSMSTemplates);
router.put('/content/sms-templates/:id', protect, authorize('admin'), adminController.updateSMSTemplate);
router.delete('/content/sms-templates/:id', protect, authorize('admin'), adminController.deleteSMSTemplate);

// In-App Content
router.post('/content/in-app', protect, authorize('admin'), adminController.createInAppContent);
router.get('/content/in-app', protect, authorize('admin'), adminController.getInAppContent);
router.get('/content/in-app/active', protect, authorize('admin'), adminController.getActiveInAppContent);
router.put('/content/in-app/:id', protect, authorize('admin'), adminController.updateInAppContent);
router.delete('/content/in-app/:id', protect, authorize('admin'), adminController.deleteInAppContent);
router.post('/content/in-app/:id/track-view', protect, authorize('admin'), adminController.trackContentView);
router.post('/content/in-app/:id/track-click', protect, authorize('admin'), adminController.trackContentClick);

// User Segments
router.post('/content/segments', protect, authorize('admin'), adminController.createUserSegment);
router.get('/content/segments', protect, authorize('admin'), adminController.getUserSegments);
router.get('/content/segments/:id', protect, authorize('admin'), adminController.getUserSegment);
router.put('/content/segments/:id', protect, authorize('admin'), adminController.updateUserSegment);
router.delete('/content/segments/:id', protect, authorize('admin'), adminController.deleteUserSegment);
router.post('/content/segments/:id/recalculate', protect, authorize('admin'), adminController.recalculateSegmentSize);

// Campaign Analytics
router.get('/content/analytics/:campaignType/:campaignId', protect, authorize('admin'), adminController.getCampaignAnalytics);
router.get('/content/analytics', protect, authorize('admin'), adminController.getOverallAnalytics);
router.get('/content/analytics/:campaignType/:campaignId/roi', protect, authorize('admin'), adminController.calculateCampaignROI);

// Automation Rules
router.post('/content/automation', protect, authorize('admin'), adminController.createAutomationRule);
router.get('/content/automation', protect, authorize('admin'), adminController.getAutomationRules);
router.get('/content/automation/:id', protect, authorize('admin'), adminController.getAutomationRule);
router.put('/content/automation/:id', protect, authorize('admin'), adminController.updateAutomationRule);
router.delete('/content/automation/:id', protect, authorize('admin'), adminController.deleteAutomationRule);
router.put('/content/automation/:id/toggle', protect, authorize('admin'), adminController.toggleAutomationRule);
router.post('/content/automation/:id/execute', protect, authorize('admin'), adminController.executeAutomationRule);
router.get('/content/automation/:id/history', protect, authorize('admin'), adminController.getAutomationHistory);

// ==================== SYSTEM CONFIGURATION ROUTES ====================

// Pricing & Tariffs
router.post('/config/pricing', protect, authorize('admin'), adminController.createPricingConfig);
router.get('/config/pricing', protect, authorize('admin'), adminController.getPricingConfigs);
router.put('/config/pricing/:id', protect, authorize('admin'), adminController.updatePricingConfig);
router.delete('/config/pricing/:id', protect, authorize('admin'), adminController.deletePricingConfig);

// Service Areas
router.post('/config/zones', protect, authorize('admin'), adminController.createServiceZone);
router.get('/config/zones', protect, authorize('admin'), adminController.getServiceZones);
router.put('/config/zones/:id', protect, authorize('admin'), adminController.updateServiceZone);
router.delete('/config/zones/:id', protect, authorize('admin'), adminController.deleteServiceZone);

// Vehicle Categories
router.post('/config/vehicles/categories', protect, authorize('admin'), adminController.createVehicleCategory);
router.get('/config/vehicles/categories', protect, authorize('admin'), adminController.getVehicleCategories);
router.put('/config/vehicles/categories/:id', protect, authorize('admin'), adminController.updateVehicleCategory);
router.delete('/config/vehicles/categories/:id', protect, authorize('admin'), adminController.deleteVehicleCategory);

// Platform Settings
router.get('/config/platform', protect, authorize('admin'), adminController.getPlatformSettings);
router.put('/config/platform', protect, authorize('admin'), adminController.updatePlatformSettings);

// Notification Settings
router.get('/config/notifications', protect, authorize('admin'), adminController.getNotificationSettings);
router.put('/config/notifications', protect, authorize('admin'), adminController.updateNotificationSettings);

// Security Settings
router.get('/config/security', protect, authorize('admin'), adminController.getSecuritySettings);
router.put('/config/security', protect, authorize('admin'), adminController.updateSecuritySettings);

// Feature Flags
router.post('/config/features', protect, authorize('admin'), adminController.createFeatureFlag);
router.get('/config/features', protect, authorize('admin'), adminController.getFeatureFlags);
router.put('/config/features/:id', protect, authorize('admin'), adminController.updateFeatureFlag);
router.delete('/config/features/:id', protect, authorize('admin'), adminController.deleteFeatureFlag);
router.put('/config/features/:id/toggle', protect, authorize('admin'), adminController.toggleFeatureFlag);

// Deployment Settings
router.post('/config/deployment', protect, authorize('admin'), adminController.createDeploymentConfig);
router.get('/config/deployment', protect, authorize('admin'), adminController.getDeploymentConfigs);
router.put('/config/deployment/:id', protect, authorize('admin'), adminController.updateDeploymentConfig);
router.put('/config/deployment/maintenance', protect, authorize('admin'), adminController.toggleMaintenanceMode);

// Performance Settings
router.get('/config/performance', protect, authorize('admin'), adminController.getPerformanceConfig);
router.put('/config/performance', protect, authorize('admin'), adminController.updatePerformanceConfig);

// Localization Settings
router.get('/config/localization', protect, authorize('admin'), adminController.getLocalizationConfig);
router.put('/config/localization', protect, authorize('admin'), adminController.updateLocalizationConfig);

// Audit Logs
router.get('/config/audit-logs', protect, authorize('admin'), adminController.getAuditLogs);
router.get('/config/audit-logs/:id', protect, authorize('admin'), adminController.getAuditLog);

// API Keys
router.post('/config/api-keys', protect, authorize('admin'), adminController.createAPIKey);
router.get('/config/api-keys', protect, authorize('admin'), adminController.getAPIKeys);
router.put('/config/api-keys/:id/revoke', protect, authorize('admin'), adminController.revokeAPIKey);

// Webhooks
router.post('/config/webhooks', protect, authorize('admin'), adminController.createWebhook);
router.get('/config/webhooks', protect, authorize('admin'), adminController.getWebhooks);
router.put('/config/webhooks/:id', protect, authorize('admin'), adminController.updateWebhook);
router.delete('/config/webhooks/:id', protect, authorize('admin'), adminController.deleteWebhook);
router.post('/config/webhooks/:id/test', protect, authorize('admin'), adminController.testWebhook);

// Places Management
router.get('/config/places', protect, authorize('admin'), adminController.getPlaces);
router.get('/config/places/:id', protect, authorize('admin'), adminController.getPlace);
router.post('/config/places', protect, authorize('admin'), adminController.createPlace);
router.put('/config/places/:id', protect, authorize('admin'), adminController.updatePlace);
router.delete('/config/places/:id', protect, authorize('admin'), adminController.deletePlace);
router.post('/config/places/bulk', protect, authorize('admin'), adminController.bulkCreatePlaces);

module.exports = router;

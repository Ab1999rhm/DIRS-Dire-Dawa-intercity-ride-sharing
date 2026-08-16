import axios from 'axios';
import offlineService from './offlineService';

const API_URL = process.env.REACT_APP_API_URL || 'https://dirs-dire-dawa-intercity-ride-sharing.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 second timeout — Render cold start can take 20-25s
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle 401, cache data, handle offline
api.interceptors.response.use(
  (response) => {
    // Cache successful responses
    cacheResponse(response);
    return response;
  },
  async (error) => {
    // Handle 401 - token refresh
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }

    // Handle network errors - queue for sync
    if (!error.response && error.message === 'Network Error') {
      console.log('Offline detected, request will be queued');
    }

    return Promise.reject(error);
  }
);

// Cache response data for offline use
async function cacheResponse(response) {
  try {
    const url = response.config?.url || '';

    if (url.includes('/rides/passenger/trips')) {
      const trips = response.data?.trips || response.data;
      if (Array.isArray(trips)) await offlineService.cacheTrips(trips);
    }

    if (url.includes('/auth/me')) {
      const user = response.data?.user;
      if (user) await offlineService.cacheUser(user);
    }

    if (url.includes('/payments/history')) {
      const payments = response.data?.payments || response.data;
      if (Array.isArray(payments)) await offlineService.cachePayments(payments);
    }

    if (url.includes('/notifications')) {
      const notifications = response.data?.notifications || response.data;
      if (Array.isArray(notifications)) await offlineService.cacheNotifications(notifications);
    }
  } catch (err) {
    console.error('Cache error:', err);
  }
}

// Offline-aware API wrapper
async function offlineFirst(apiCall, fallbackCacheFn) {
  try {
    return await apiCall();
  } catch (error) {
    if (!error.response && navigator.onLine === false) {
      console.log('Offline - using cached data');
      if (fallbackCacheFn) {
        const cached = await fallbackCacheFn();
        return { data: cached, offline: true };
      }
    }
    throw error;
  }
}

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  checkDuplicate: (email, phoneNumber) => api.post('/auth/check-duplicate', { email, phoneNumber }),
  login: (data) => api.post('/auth/login', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  getMe: () => offlineFirst(
    () => api.get('/auth/me'),
    () => offlineService.getCachedUser()
  ),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadProfilePhoto: (formData) => api.post('/auth/profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateLocation: (coordinates) => {
    if (navigator.onLine) {
      return api.put('/auth/location', { coordinates });
    }
    // Queue location update for later sync
    offlineService.queueLocationUpdate({ coordinates });
    return Promise.resolve({ data: { queued: true } });
  },
  sendOTP: (phoneNumber) => api.post('/auth/send-otp', { phoneNumber }),
  sendEmailOTP: (email) => api.post('/auth/send-email-otp', { email }),
  verifyOTP: (phoneNumber, otp) => api.post('/auth/verify-otp', { phoneNumber, otp }),
  verifyEmailOTP: (email, otp) => api.post('/auth/verify-email-otp', { email, otp }),
  sendPhoneOTP: (data) => api.post('/auth/send-phone-otp', data),
  verifyPhoneOTP: (data) => api.post('/auth/verify-phone-otp', data),
  forgotPassword: (phoneNumber) => api.post('/auth/forgot-password', { phoneNumber }),
  verifyResetOTP: (phoneNumber, otp) => api.post('/auth/verify-reset-otp', { phoneNumber, otp }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updateDriverStatus: (isOnline, coordinates, serviceType, intendedDestination, currentArea) => api.put('/auth/driver/status', { isOnline, coordinates, serviceType, intendedDestination, currentArea }),
  updateDriverDestination: (city, coordinates) => api.put('/auth/driver/destination', { city, coordinates }),
  updateDriverArea: (area, coordinates) => api.put('/auth/driver/area', { area, coordinates }),
};

export const ridesAPI = {
  create: async (data) => {
    if (navigator.onLine) {
      return api.post('/rides', data);
    }
    // Queue ride request for offline
    await offlineService.queueRide(data);
    return { data: { queued: true, message: 'Ride request queued. Will be sent when online.' } };
  },
  cancel: (id, reason) => api.post(`/rides/${id}/cancel`, { cancellationReason: reason }),
  get: (id) => api.get(`/rides/${id}`),
  passengerTrips: (params) => offlineFirst(
    () => api.get('/rides/passenger/trips', { params }),
    () => offlineService.getCachedTrips()
  ),
  driverTrips: (params) => offlineFirst(
    () => api.get('/rides/driver/trips', { params }),
    () => offlineService.getCachedTrips()
  ),
  tripDetails: (id) => api.get(`/rides/trip/${id}`),
  accept: (id) => api.post(`/rides/${id}/accept`),
  decline: (id) => api.post(`/rides/${id}/decline`),
  start: (id) => api.post(`/rides/trip/${id}/start`),
  complete: (id) => api.post(`/rides/trip/${id}/complete`),
  confirmArrival: (id) => api.post(`/rides/trip/${id}/arrival`),
  available: (params) => api.get('/rides/available', { params }),
};

export const chatAPI = {
  getMessages: (tripId, params) => api.get(`/chat/${tripId}/messages`, { params }),
  sendMessage: (tripId, text) => api.post(`/chat/${tripId}/messages`, { text }),
  editMessage: (messageId, text) => api.put(`/chat/messages/${messageId}`, { text }),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
  markRead: (tripId) => api.post(`/chat/${tripId}/read`),
  getUnread: (params) => api.get('/chat/unread', { params }),
};

export const paymentsAPI = {
  process: (tripId, data) => api.post(`/payments/trip/${tripId}`, data),
  history: (params) => offlineFirst(
    () => api.get('/payments/history', { params }),
    () => offlineService.getCachedPayments()
  ),
  wallet: (params) => api.get('/payments/wallet', { params }),
  topUp: (data) => api.post('/payments/wallet/topup', data),
  walletWithdraw: (data) => api.post('/payments/wallet/withdraw', data),
  getBanks: () => api.get('/payments/banks'),
  deleteTransaction: (paymentId) => api.delete(`/payments/wallet/${paymentId}`),
  earnings: () => api.get('/payments/earnings'),
  earningsHistory: (params) => api.get('/payments/earnings/history', { params }),
  withdraw: (data) => api.post('/payments/withdraw', data),
};

export const ratingsAPI = {
  create: async (tripId, data) => {
    if (navigator.onLine) {
      return api.post(`/ratings/trip/${tripId}`, data);
    }
    await offlineService.queueRating(tripId, data);
    return { data: { queued: true } };
  },
  userRatings: (userId, params) => api.get(`/ratings/user/${userId}`, { params }),
};

export const notificationsAPI = {
  get: (params) => offlineFirst(
    () => api.get('/notifications', { params }),
    () => offlineService.getCachedNotifications()
  ),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const sosAPI = {
  trigger: (data) => api.post('/sos/trigger', data),
  resolve: (id) => api.put(`/sos/${id}/resolve`, { resolution: 'resolved' }),
  history: (params) => api.get('/sos/history', { params }),
  active: () => api.get('/sos/active'),
  shareTrip: (data) => api.post('/sos/share-trip', data),
};

export const reportAPI = {
  create: (data) => api.post('/safety', data),
  getMyReports: (params) => api.get('/safety', { params }),
};

export const referralAPI = {
  getMyCode: () => api.get('/referrals/code'),
  getMyReferrals: () => api.get('/referrals/list'),
  applyCode: (referralCode) => api.post('/referrals/apply', { referralCode }),
  validateCode: (code) => api.get(`/referrals/validate/${code}`),
};

export const vehiclesAPI = {
  getMy: () => api.get('/vehicles/my'),
  register: (data) => api.post('/vehicles', data),
  update: (data) => api.put('/vehicles/my', data),
};

export const documentsAPI = {
  get: () => api.get('/auth/documents'),
  uploadDriver: (data) => api.post('/auth/documents', data),
  uploadVehicle: (data) => api.post('/auth/vehicle-documents', data),
  uploadProfilePhoto: (photoUrl) => api.post('/auth/profile-photo', { photoUrl }),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  suspendUser: (id, reason) => api.put(`/admin/users/${id}/suspend`, { reason }),
  reactivateUser: (id) => api.put(`/admin/users/${id}/reactivate`),
  verifyUser: (id) => api.put(`/admin/users/${id}/verify`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  deleteUnverifiedUsers: (data) => api.post('/admin/users/delete-unverified', data),
  drivers: (params) => api.get('/admin/drivers', { params }),
  pendingDrivers: (params) => api.get('/admin/drivers/pending', { params }),
  verifyDriver: (id, action, reason) => api.post(`/admin/drivers/${id}/verify`, { action, reason }),
  trips: (params) => api.get('/admin/trips', { params }),
  payments: (params) => api.get('/admin/payments', { params }),
  report: (params) => api.get('/admin/reports', { params }),
  sosAlerts: (params) => api.get('/admin/sos', { params }),
  // Real-time monitoring endpoints
  getActiveDrivers: () => api.get('/admin/monitoring/active-drivers'),
  getActiveTrips: () => api.get('/admin/monitoring/active-trips'),
  getSOSAlerts: () => api.get('/admin/sos'),
  getSystemHealth: () => api.get('/admin/monitoring/system-health'),
  respondToSOS: (sosId) => api.post(`/admin/monitoring/sos/${sosId}/respond`),
  // Driver management endpoints
  getDriverDocuments: (driverId) => api.get(`/admin/drivers/${driverId}/documents`),
  approveDriver: (driverId) => api.put(`/admin/drivers/${driverId}/approve`),
  rejectDriver: (driverId, reason) => api.put(`/admin/drivers/${driverId}/reject`, { reason }),
  suspendDriver: (driverId, reason) => api.put(`/admin/drivers/${driverId}/suspend`, { reason }),
  banDriver: (driverId, reason) => api.put(`/admin/drivers/${driverId}/ban`, { reason }),
  reactivateDriver: (driverId) => api.put(`/admin/drivers/${driverId}/reactivate`),
  getDriverEarnings: (driverId, params) => api.get(`/admin/drivers/${driverId}/earnings`, { params }),
  adjustCommissionRate: (driverId, rate) => api.put(`/admin/drivers/${driverId}/commission-rate`, { rate }),
  processPayout: (driverId, amount) => api.post(`/admin/drivers/${driverId}/payout`, { amount }),
  requestDocumentResubmit: (driverId, docType) => api.post(`/admin/drivers/${driverId}/request-resubmit`, { docType }),
  sendDriverMessage: (driverId, message) => api.post(`/admin/drivers/${driverId}/message`, { message }),
  issueDriverWarning: (driverId, reason) => api.post(`/admin/drivers/${driverId}/warning`, { reason }),
  getDriverPerformance: (driverId, params) => api.get(`/admin/drivers/${driverId}/performance`, { params }),
  getDriverResponseTime: (driverId, params) => api.get(`/admin/drivers/${driverId}/response-time`, { params }),
  getDriverActivityHeatmap: (params) => api.get('/admin/drivers/activity-heatmap', { params }),
  getDriverRetention: (params) => api.get('/admin/drivers/retention', { params }),
  // Dispute management endpoints
  getDisputes: (params) => api.get('/admin/disputes', { params }),
  resolveDispute: (disputeId, resolution, fareAdjustment) => api.put(`/admin/disputes/${disputeId}/resolve`, { resolution, fareAdjustment }),
  // Lost item endpoints
  getLostItems: (params) => api.get('/admin/lost-items', { params }),
  resolveLostItem: (itemId, status) => api.put(`/admin/lost-items/${itemId}`, { status }),
  // Driver-reported issues endpoints
  getDriverIssues: (params) => api.get('/admin/driver-issues', { params }),
  resolveDriverIssue: (issueId, resolution) => api.put(`/admin/driver-issues/${issueId}/resolve`, { resolution }),
  // Passenger management endpoints
  getPassengerWallet: (passengerId) => api.get(`/admin/passengers/${passengerId}/wallet`),
  processRefund: (passengerId, amount, reason) => api.post(`/admin/passengers/${passengerId}/refund`, { amount, reason }),
  addPassengerFunds: (passengerId, amount, reason) => api.post(`/admin/passengers/${passengerId}/add-funds`, { amount, reason }),
  getPassengerTransactions: (passengerId, params) => api.get(`/admin/passengers/${passengerId}/transactions`, { params }),
  banPassenger: (passengerId, reason) => api.put(`/admin/passengers/${passengerId}/ban`, { reason }),
  sendPassengerMessage: (passengerId, message) => api.post(`/admin/passengers/${passengerId}/message`, { message }),
  issuePassengerWarning: (passengerId, reason) => api.post(`/admin/passengers/${passengerId}/warning`, { reason }),
  getPassengerTrips: (passengerId, params) => api.get(`/admin/passengers/${passengerId}/trips`, { params }),
  getPassengerBehavior: (passengerId, params) => api.get(`/admin/passengers/${passengerId}/behavior`, { params }),
  blockPassengerBooking: (passengerId, reason) => api.put(`/admin/passengers/${passengerId}/block-booking`, { reason }),
  unblockPassengerBooking: (passengerId) => api.put(`/admin/passengers/${passengerId}/unblock-booking`),
  getPassengerLoginHistory: (passengerId) => api.get(`/admin/passengers/${passengerId}/login-history`),
  getPassengerAnalytics: (params) => api.get('/admin/passengers/analytics', { params }),
  // Trip management endpoints
  getTripDetails: (tripId) => api.get(`/admin/trips/${tripId}`),
  adjustFare: (tripId, newFare, reason) => api.put(`/admin/trips/${tripId}/adjust-fare`, { newFare, reason }),
  resolveDispute: (tripId, resolution) => api.post(`/admin/trips/${tripId}/resolve-dispute`, { resolution }),
  // Financial management endpoints
  getRevenueBreakdown: (params) => api.get('/admin/financials/revenue', { params }),
  getPaymentTransactions: (params) => api.get('/admin/financials/transactions', { params }),
  processCommission: (data) => api.post('/admin/financials/commission', data),
  // Withdrawal approvals
  getWithdrawals: (params) => api.get('/payments/withdrawals', { params }),
  approveWithdrawal: (id, note) => api.post(`/payments/withdrawals/${id}/approve`, { note }),
  rejectWithdrawal: (id, reason, note) => api.post(`/payments/withdrawals/${id}/reject`, { reason, note }),
  // Safety endpoints
  getFraudAlerts: () => api.get('/admin/safety/fraud-alerts'),
  getSuspiciousActivity: () => api.get('/admin/safety/suspicious-activity'),
  reportIncident: (data) => api.post('/admin/safety/incidents', data),
  // Support endpoints
  getSupportTickets: (params) => api.get('/admin/support/tickets', { params }),
  updateTicket: (ticketId, status, response) => api.put(`/admin/support/tickets/${ticketId}`, { status, response }),
  // Analytics endpoints
  getDemandHeatmap: (params) => api.get('/admin/analytics/demand-heatmap', { params }),
  getPeakHours: (params) => api.get('/admin/analytics/peak-hours', { params }),
  getRetentionMetrics: (params) => api.get('/admin/analytics/retention', { params }),
  // Content endpoints
  sendPushNotification: (data) => api.post('/admin/content/push-notification', data),
  createAnnouncement: (data) => api.post('/admin/content/announcements', data),
  sendDriverAnnouncement: (data) => api.post('/admin/content/driver-announcement', data),
  // Configuration endpoints
  updateTariff: (data) => api.put('/admin/config/tariff', data),
  getServiceAreas: () => api.get('/admin/config/service-areas'),
  updateServiceAreas: (data) => api.put('/admin/config/service-areas', data),
  // Real-time monitoring endpoints
  getSystemHealth: () => api.get('/admin/monitoring/system-health'),
  getActiveDriversLocations: () => api.get('/admin/monitoring/drivers-locations'),
  getActiveTripsRoutes: () => api.get('/admin/monitoring/trips-routes'),
  getBookingQueue: () => api.get('/admin/monitoring/booking-queue'),
  // Trip lifecycle management
  completeTrip: (tripId, notes) => api.put(`/admin/trips/${tripId}/complete`, { notes }),
  cancelTrip: (tripId, reason, cancelledBy) => api.put(`/admin/trips/${tripId}/cancel`, { reason, cancelledBy }),
  reassignDriver: (tripId, newDriverId) => api.put(`/admin/trips/${tripId}/reassign-driver`, { newDriverId }),
  markNoShow: (tripId, party, reason) => api.put(`/admin/trips/${tripId}/no-show`, { party, reason }),
  // Fare & payment management
  processRefund: (tripId, amount, reason) => api.post(`/admin/trips/${tripId}/refund`, { amount, reason }),
  processDriverPayout: (tripId) => api.post(`/admin/trips/${tripId}/payout`),
  applyPromoCode: (tripId, code, discountAmount) => api.post(`/admin/trips/${tripId}/promo-code`, { code, discountAmount }),
  // Dispute handling
  handleFareDispute: (tripId, resolution, compensationAmount) => api.post(`/admin/trips/${tripId}/dispute/fare`, { resolution, compensationAmount }),
  handleRouteDispute: (tripId, resolution, action) => api.post(`/admin/trips/${tripId}/dispute/route`, { resolution, action }),
  handleBehaviorComplaint: (tripId, resolution, party, action) => api.post(`/admin/trips/${tripId}/dispute/behavior`, { resolution, party, action }),
  issueCompensation: (tripId, amount, reason, recipient) => api.post(`/admin/trips/${tripId}/compensation`, { amount, reason, recipient }),
  // Trip analytics
  getTripAnalytics: (params) => api.get('/admin/trips/analytics', { params }),
  // Export
  exportTripData: (params) => api.get('/admin/trips/export', { params }),
  // ==================== SAFETY & SECURITY APIS ====================
  // SOS/Emergency System
  getSOSAlerts: (params) => api.get('/admin/safety/sos-alerts', { params }),
  getSOSHistory: (userId) => api.get(`/admin/safety/sos-history/${userId}`),
  resolveSOS: (alertId, notes, isFalseAlarm) => api.put(`/admin/safety/sos/${alertId}/resolve`, { notes, isFalseAlarm }),
  // Fraud Detection
  getFraudAlerts: (params) => api.get('/admin/safety/fraud-alerts', { params }),
  investigateFraud: (fraudId, action, notes) => api.put(`/admin/safety/fraud/${fraudId}/investigate`, { action, notes }),
  // Suspicious Activity
  getSuspiciousActivities: (params) => api.get('/admin/safety/suspicious-activities', { params }),
  resolveSuspiciousActivity: (activityId, action, notes) => api.put(`/admin/safety/suspicious/${activityId}/resolve`, { action, notes }),
  // Incident Management
  getIncidents: (params) => api.get('/admin/safety/incidents', { params }),
  createIncident: (incidentData) => api.post('/admin/safety/incidents', incidentData),
  assignIncident: (incidentId, assignedTo) => api.put(`/admin/safety/incidents/${incidentId}/assign`, { assignedTo }),
  addInvestigationNote: (incidentId, note) => api.post(`/admin/safety/incidents/${incidentId}/notes`, { note }),
  resolveIncident: (incidentId, resolution, policeNotified, ambulanceDispatched) => api.put(`/admin/safety/incidents/${incidentId}/resolve`, { resolution, policeNotified, ambulanceDispatched }),
  // Banned/Blocked Users
  getBlockedUsers: () => api.get('/admin/safety/blocked-users'),
  blockUser: (userId, reason, duration) => api.put(`/admin/safety/users/${userId}/block`, { reason, duration }),
  unblockUser: (userId) => api.put(`/admin/safety/users/${userId}/unblock`),
  // Safety Verification
  getPendingVerifications: () => api.get('/admin/safety/pending-verifications'),
  approveDriverVerification: (driverId, notes) => api.put(`/admin/safety/drivers/${driverId}/approve`, { notes }),
  rejectDriverVerification: (driverId, reason) => api.put(`/admin/safety/drivers/${driverId}/reject`, { reason }),
  // Emergency Services Integration
  notifyPolice: (incidentId, policeReportNumber, recipientIds = []) => api.put(`/admin/safety/incidents/${incidentId}/police`, { policeReportNumber, recipientIds }),
  dispatchAmbulance: (incidentId, hospitalName, hospitalLocation, recipientIds = []) => api.put(`/admin/safety/incidents/${incidentId}/ambulance`, { hospitalName, hospitalLocation, recipientIds }),
  getEmergencyContacts: (userId) => api.get(`/admin/safety/users/${userId}/emergency-contacts`),
  // Dispatch Contact Registry
  getDispatchContacts: (params) => api.get('/admin/safety/dispatch-contacts', { params }),
  createDispatchContact: (contactData) => api.post('/admin/safety/dispatch-contacts', contactData),
  updateDispatchContact: (contactId, contactData) => api.put(`/admin/safety/dispatch-contacts/${contactId}`, contactData),
  deleteDispatchContact: (contactId) => api.delete(`/admin/safety/dispatch-contacts/${contactId}`),
  // Safety Analytics & Reports
  getSafetyAnalytics: (params) => api.get('/admin/safety/analytics', { params }),
  // Driver Behavior Monitoring
  getDriverBehaviorReport: (driverId) => api.get(`/admin/safety/drivers/${driverId}/behavior`),
  // Passenger Behavior Monitoring
  getPassengerBehaviorReport: (userId) => api.get(`/admin/safety/passengers/${userId}/behavior`),
  // ==================== SUPPORT SYSTEM APIS ====================
  // Ticket Management
  getTickets: (params) => api.get('/admin/support/tickets', { params }),
  getTicket: (ticketId) => api.get(`/admin/support/tickets/${ticketId}`),
  createTicket: (ticketData) => api.post('/admin/support/tickets', ticketData),
  updateTicket: (ticketId, ticketData) => api.put(`/admin/support/tickets/${ticketId}`, ticketData),
  addTicketMessage: (ticketId, message, isInternal, attachments) => api.post(`/admin/support/tickets/${ticketId}/messages`, { message, isInternal, attachments }),
  resolveTicket: (ticketId, resolutionNotes, satisfactionRating, satisfactionFeedback) => api.put(`/admin/support/tickets/${ticketId}/resolve`, { resolutionNotes, satisfactionRating, satisfactionFeedback }),
  closeTicket: (ticketId) => api.put(`/admin/support/tickets/${ticketId}/close`),
  escalateTicket: (ticketId, escalateTo, reason) => api.put(`/admin/support/tickets/${ticketId}/escalate`, { escalateTo, reason }),
  bulkUpdateTickets: (ticketIds, action, value) => api.post('/admin/support/tickets/bulk', { ticketIds, action, value }),
  // Live Chat
  getSupportChats: (params) => api.get('/admin/support/chats', { params }),
  getSupportChat: (chatId) => api.get(`/admin/support/chats/${chatId}`),
  createSupportChat: (userId, ticketId) => api.post('/admin/support/chats', { userId, ticketId }),
  sendChatMessage: (chatId, message, attachments, isCannedResponse, cannedResponseId) => api.post(`/admin/support/chats/${chatId}/messages`, { message, attachments, isCannedResponse, cannedResponseId }),
  transferChat: (chatId, transferTo) => api.put(`/admin/support/chats/${chatId}/transfer`, { transferTo }),
  rateChat: (chatId, score, feedback) => api.post(`/admin/support/chats/${chatId}/rate`, { score, feedback }),
  endChat: (chatId) => api.put(`/admin/support/chats/${chatId}/end`),
  // Knowledge Base
  getFAQs: (params) => api.get('/admin/support/faqs', { params }),
  getFAQ: (faqId) => api.get(`/admin/support/faqs/${faqId}`),
  createFAQ: (faqData) => api.post('/admin/support/faqs', faqData),
  updateFAQ: (faqId, faqData) => api.put(`/admin/support/faqs/${faqId}`, faqData),
  deleteFAQ: (faqId) => api.delete(`/admin/support/faqs/${faqId}`),
  markFAQHelpful: (faqId, helpful) => api.post(`/admin/support/faqs/${faqId}/helpful`, { helpful }),
  // Canned Responses
  getCannedResponses: (params) => api.get('/admin/support/canned-responses', { params }),
  createCannedResponse: (responseData) => api.post('/admin/support/canned-responses', responseData),
  updateCannedResponse: (responseId, responseData) => api.put(`/admin/support/canned-responses/${responseId}`, responseData),
  deleteCannedResponse: (responseId) => api.delete(`/admin/support/canned-responses/${responseId}`),
  // Auto Reply Rules
  getAutoReplyRules: (params) => api.get('/admin/support/auto-reply-rules', { params }),
  createAutoReplyRule: (ruleData) => api.post('/admin/support/auto-reply-rules', ruleData),
  updateAutoReplyRule: (ruleId, ruleData) => api.put(`/admin/support/auto-reply-rules/${ruleId}`, ruleData),
  deleteAutoReplyRule: (ruleId) => api.delete(`/admin/support/auto-reply-rules/${ruleId}`),
  // Communication
  sendBroadcastMessage: (message, targetAudience, title) => api.post('/admin/support/broadcast', { message, targetAudience, title }),
  sendEmailNotification: (userId, subject, message) => api.post('/admin/support/email', { userId, subject, message }),
  sendSMSNotification: (userId, message) => api.post('/admin/support/sms', { userId, message }),
  // Support Analytics
  getSupportAnalytics: (params) => api.get('/admin/support/analytics', { params }),
  // User Support
  getUserSupportHistory: (userId) => api.get(`/admin/support/users/${userId}/history`),
  getUserSupportProfile: (userId) => api.get(`/admin/support/users/${userId}/profile`),
  // Reports
  generateSupportReport: (params) => api.get('/admin/support/reports', { params }),
  getSLACompliance: (params) => api.get('/admin/support/sla-compliance', { params }),
  // ==================== ANALYTICS & REPORTING APIS ====================
  // Revenue Analytics
  getRevenueTrends: (params) => api.get('/admin/analytics/revenue/trends', { params }),
  getRevenueByRoute: (params) => api.get('/admin/analytics/revenue/by-route', { params }),
  getRevenueByVehicleType: (params) => api.get('/admin/analytics/revenue/by-vehicle', { params }),
  getRevenuePerDriver: (params) => api.get('/admin/analytics/revenue/per-driver', { params }),
  getRevenuePerPassenger: (params) => api.get('/admin/analytics/revenue/per-passenger', { params }),
  getSurgePricingImpact: (params) => api.get('/admin/analytics/revenue/surge-impact', { params }),
  // Trip Analytics
  getTripCompletionRate: (params) => api.get('/admin/analytics/trips/completion-rate', { params }),
  getCancellationReasons: (params) => api.get('/admin/analytics/trips/cancellation-reasons', { params }),
  getAverageTripDuration: (params) => api.get('/admin/analytics/trips/avg-duration', { params }),
  getAverageTripDistance: (params) => api.get('/admin/analytics/trips/avg-distance', { params }),
  getTripVolumeTrends: (params) => api.get('/admin/analytics/trips/volume-trends', { params }),
  // User Analytics
  getUserGrowth: (params) => api.get('/admin/analytics/users/growth', { params }),
  getUserActivity: (params) => api.get('/admin/analytics/users/activity', { params }),
  getUserDemographics: (params) => api.get('/admin/analytics/users/demographics', { params }),
  getUserBehavior: (params) => api.get('/admin/analytics/users/behavior', { params }),
  getUserLifetimeValue: (params) => api.get('/admin/analytics/users/lifetime-value', { params }),
  // Driver Analytics
  getDriverAvailability: (params) => api.get('/admin/analytics/drivers/availability', { params }),
  getDriverUtilization: (params) => api.get('/admin/analytics/drivers/utilization', { params }),
  getDriverPerformance: (params) => api.get('/admin/analytics/drivers/performance', { params }),
  getDriverEarnings: (params) => api.get('/admin/analytics/drivers/earnings', { params }),
  getDriverChurn: (params) => api.get('/admin/analytics/drivers/churn', { params }),
  // Geographic Analytics
  getDemandHeatmapNew: (params) => api.get('/admin/analytics/geo/demand-heatmap', { params }),
  getSupplyHeatmapNew: (params) => api.get('/admin/analytics/geo/supply-heatmap', { params }),
  getRoutePopularity: (params) => api.get('/admin/analytics/geo/route-popularity', { params }),
  getAreaPerformance: (params) => api.get('/admin/analytics/geo/area-performance', { params }),
  getCoverageGaps: (params) => api.get('/admin/analytics/geo/coverage-gaps', { params }),
  // Time Analytics
  getPeakHoursNew: (params) => api.get('/admin/analytics/time/peak-hours', { params }),
  getPeakDays: (params) => api.get('/admin/analytics/time/peak-days', { params }),
  getSeasonalTrends: (params) => api.get('/admin/analytics/time/seasonal-trends', { params }),
  getHolidayImpact: (params) => api.get('/admin/analytics/time/holiday-impact', { params }),
  // Financial Analytics
  getCommissionCollectionRate: (params) => api.get('/admin/analytics/financial/commission-rate', { params }),
  getRefundRate: (params) => api.get('/admin/analytics/financial/refund-rate', { params }),
  getAverageFare: (params) => api.get('/admin/analytics/financial/avg-fare', { params }),
  getPaymentMethodDistribution: (params) => api.get('/admin/analytics/financial/payment-distribution', { params }),
  // Performance Metrics
  getDriverResponseTime: (params) => api.get('/admin/analytics/performance/driver-response-time', { params }),
  getAverageWaitTime: (params) => api.get('/admin/analytics/performance/avg-wait-time', { params }),
  getAppCrashRate: (params) => api.get('/admin/analytics/performance/app-crash-rate', { params }),
  getAPIResponseTime: (params) => api.get('/admin/analytics/performance/api-response-time', { params }),
  // Reports
  generateDailyReport: (params) => api.get('/admin/reports/daily', { params }),
  generateWeeklyReport: (params) => api.get('/admin/reports/weekly', { params }),
  generateMonthlyReport: (params) => api.get('/admin/reports/monthly', { params }),
  generateCustomReport: (params) => api.get('/admin/reports/custom', { params }),
  exportReport: (params) => api.get('/admin/reports/export', { params }),
  scheduleReport: (data) => api.post('/admin/reports/schedule', data),
  // Forecasting
  getDemandPrediction: (params) => api.get('/admin/forecast/demand', { params }),
  getDriverSupplyForecast: (params) => api.get('/admin/forecast/driver-supply', { params }),
  getRevenueProjection: (params) => api.get('/admin/forecast/revenue', { params }),
  // Comparative Analytics
  getPeriodComparison: (params) => api.get('/admin/analytics/compare/periods', { params }),
  getYearOverYear: (params) => api.get('/admin/analytics/compare/year-over-year', { params }),
  getCompetitorAnalysis: (params) => api.get('/admin/analytics/compare/competitors', { params }),
  // ==================== CONTENT & NOTIFICATIONS ====================
  // Push Notifications
  createPushNotification: (data) => api.post('/admin/content/push-notifications', data),
  getPushNotifications: (params) => api.get('/admin/content/push-notifications', { params }),
  getPushNotification: (id) => api.get(`/admin/content/push-notifications/${id}`),
  updatePushNotification: (id, data) => api.put(`/admin/content/push-notifications/${id}`, data),
  deletePushNotification: (id) => api.delete(`/admin/content/push-notifications/${id}`),
  cancelPushNotification: (id) => api.put(`/admin/content/push-notifications/${id}/cancel`),
  trackNotificationOpen: (id) => api.post(`/admin/content/push-notifications/${id}/track-open`),
  trackNotificationClick: (id) => api.post(`/admin/content/push-notifications/${id}/track-click`),
  // Notification Templates
  createNotificationTemplate: (data) => api.post('/admin/content/notification-templates', data),
  getNotificationTemplates: (params) => api.get('/admin/content/notification-templates', { params }),
  updateNotificationTemplate: (id, data) => api.put(`/admin/content/notification-templates/${id}`, data),
  deleteNotificationTemplate: (id) => api.delete(`/admin/content/notification-templates/${id}`),
  // Announcements
  createAnnouncement: (data) => api.post('/admin/content/announcements', data),
  getAnnouncements: (params) => api.get('/admin/content/announcements', { params }),
  getActiveAnnouncements: (params) => api.get('/admin/content/announcements/active', { params }),
  updateAnnouncement: (id, data) => api.put(`/admin/content/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/admin/content/announcements/${id}`),
  pinAnnouncement: (id, data) => api.put(`/admin/content/announcements/${id}/pin`, data),
  trackAnnouncementView: (id) => api.post(`/admin/content/announcements/${id}/track-view`),
  trackAnnouncementClick: (id) => api.post(`/admin/content/announcements/${id}/track-click`),
  // Promo Codes
  createPromoCode: (data) => api.post('/admin/content/promo-codes', data),
  getPromoCodes: (params) => api.get('/admin/content/promo-codes', { params }),
  getPromoCode: (code) => api.get(`/admin/content/promo-codes/${code}`),
  validatePromoCode: (data) => api.post('/admin/content/promo-codes/validate', data),
  updatePromoCode: (id, data) => api.put(`/admin/content/promo-codes/${id}`, data),
  deletePromoCode: (id) => api.delete(`/admin/content/promo-codes/${id}`),
  getPromoCodeAnalytics: (id) => api.get(`/admin/content/promo-codes/${id}/analytics`),
  // Email Campaigns
  createEmailCampaign: (data) => api.post('/admin/content/email-campaigns', data),
  getEmailCampaigns: (params) => api.get('/admin/content/email-campaigns', { params }),
  getEmailCampaign: (id) => api.get(`/admin/content/email-campaigns/${id}`),
  updateEmailCampaign: (id, data) => api.put(`/admin/content/email-campaigns/${id}`, data),
  deleteEmailCampaign: (id) => api.delete(`/admin/content/email-campaigns/${id}`),
  cancelEmailCampaign: (id) => api.put(`/admin/content/email-campaigns/${id}/cancel`),
  // Email Templates
  createEmailTemplate: (data) => api.post('/admin/content/email-templates', data),
  getEmailTemplates: (params) => api.get('/admin/content/email-templates', { params }),
  updateEmailTemplate: (id, data) => api.put(`/admin/content/email-templates/${id}`, data),
  deleteEmailTemplate: (id) => api.delete(`/admin/content/email-templates/${id}`),
  // SMS Campaigns
  createSMSCampaign: (data) => api.post('/admin/content/sms-campaigns', data),
  getSMSCampaigns: (params) => api.get('/admin/content/sms-campaigns', { params }),
  getSMSCampaign: (id) => api.get(`/admin/content/sms-campaigns/${id}`),
  updateSMSCampaign: (id, data) => api.put(`/admin/content/sms-campaigns/${id}`, data),
  deleteSMSCampaign: (id) => api.delete(`/admin/content/sms-campaigns/${id}`),
  // SMS Templates
  createSMSTemplate: (data) => api.post('/admin/content/sms-templates', data),
  getSMSTemplates: (params) => api.get('/admin/content/sms-templates', { params }),
  updateSMSTemplate: (id, data) => api.put(`/admin/content/sms-templates/${id}`, data),
  deleteSMSTemplate: (id) => api.delete(`/admin/content/sms-templates/${id}`),
  // In-App Content
  createInAppContent: (data) => api.post('/admin/content/in-app', data),
  getInAppContent: (params) => api.get('/admin/content/in-app', { params }),
  getActiveInAppContent: (params) => api.get('/admin/content/in-app/active', { params }),
  updateInAppContent: (id, data) => api.put(`/admin/content/in-app/${id}`, data),
  deleteInAppContent: (id) => api.delete(`/admin/content/in-app/${id}`),
  trackContentView: (id) => api.post(`/admin/content/in-app/${id}/track-view`),
  trackContentClick: (id) => api.post(`/admin/content/in-app/${id}/track-click`),
  // User Segments
  createUserSegment: (data) => api.post('/admin/content/segments', data),
  getUserSegments: (params) => api.get('/admin/content/segments', { params }),
  getUserSegment: (id) => api.get(`/admin/content/segments/${id}`),
  updateUserSegment: (id, data) => api.put(`/admin/content/segments/${id}`, data),
  deleteUserSegment: (id) => api.delete(`/admin/content/segments/${id}`),
  recalculateSegmentSize: (id) => api.post(`/admin/content/segments/${id}/recalculate`),
  // Campaign Analytics
  getCampaignAnalytics: (campaignType, campaignId) => api.get(`/admin/content/analytics/${campaignType}/${campaignId}`),
  getOverallAnalytics: (params) => api.get('/admin/content/analytics', { params }),
  calculateCampaignROI: (campaignType, campaignId) => api.get(`/admin/content/analytics/${campaignType}/${campaignId}/roi`),
  // Automation Rules
  createAutomationRule: (data) => api.post('/admin/content/automation', data),
  getAutomationRules: (params) => api.get('/admin/content/automation', { params }),
  getAutomationRule: (id) => api.get(`/admin/content/automation/${id}`),
  updateAutomationRule: (id, data) => api.put(`/admin/content/automation/${id}`, data),
  deleteAutomationRule: (id) => api.delete(`/admin/content/automation/${id}`),
  toggleAutomationRule: (id, data) => api.put(`/admin/content/automation/${id}/toggle`, data),
  executeAutomationRule: (id) => api.post(`/admin/content/automation/${id}/execute`),
  getAutomationHistory: (id) => api.get(`/admin/content/automation/${id}/history`),
  // ==================== SYSTEM CONFIGURATION ====================
  // Pricing & Tariffs
  createPricingConfig: (data) => api.post('/admin/config/pricing', data),
  getPricingConfigs: (params) => api.get('/admin/config/pricing', { params }),
  updatePricingConfig: (id, data) => api.put(`/admin/config/pricing/${id}`, data),
  deletePricingConfig: (id) => api.delete(`/admin/config/pricing/${id}`),
  // Service Areas
  createServiceZone: (data) => api.post('/admin/config/zones', data),
  getServiceZones: (params) => api.get('/admin/config/zones', { params }),
  updateServiceZone: (id, data) => api.put(`/admin/config/zones/${id}`, data),
  deleteServiceZone: (id) => api.delete(`/admin/config/zones/${id}`),
  // Vehicle Categories
  createVehicleCategory: (data) => api.post('/admin/config/vehicles/categories', data),
  getVehicleCategories: (params) => api.get('/admin/config/vehicles/categories', { params }),
  updateVehicleCategory: (id, data) => api.put(`/admin/config/vehicles/categories/${id}`, data),
  deleteVehicleCategory: (id) => api.delete(`/admin/config/vehicles/categories/${id}`),
  // Platform Settings
  getPlatformSettings: () => api.get('/admin/config/platform'),
  updatePlatformSettings: (data) => api.put('/admin/config/platform', data),
  // Notification Settings
  getNotificationSettings: () => api.get('/admin/config/notifications'),
  updateNotificationSettings: (data) => api.put('/admin/config/notifications', data),
  // Security Settings
  getSecuritySettings: () => api.get('/admin/config/security'),
  updateSecuritySettings: (data) => api.put('/admin/config/security', data),
  // Feature Flags
  createFeatureFlag: (data) => api.post('/admin/config/features', data),
  getFeatureFlags: (params) => api.get('/admin/config/features', { params }),
  updateFeatureFlag: (id, data) => api.put(`/admin/config/features/${id}`, data),
  deleteFeatureFlag: (id) => api.delete(`/admin/config/features/${id}`),
  toggleFeatureFlag: (id, data) => api.put(`/admin/config/features/${id}/toggle`, data),
  // Deployment Settings
  createDeploymentConfig: (data) => api.post('/admin/config/deployment', data),
  getDeploymentConfigs: (params) => api.get('/admin/config/deployment', { params }),
  updateDeploymentConfig: (id, data) => api.put(`/admin/config/deployment/${id}`, data),
  toggleMaintenanceMode: (data) => api.put('/admin/config/deployment/maintenance', data),
  // Performance Settings
  getPerformanceConfig: () => api.get('/admin/config/performance'),
  updatePerformanceConfig: (data) => api.put('/admin/config/performance', data),
  // Localization Settings
  getLocalizationConfig: () => api.get('/admin/config/localization'),
  updateLocalizationConfig: (data) => api.put('/admin/config/localization', data),
  // Audit Logs
  getAuditLogs: (params) => api.get('/admin/config/audit-logs', { params }),
  getAuditLog: (id) => api.get(`/admin/config/audit-logs/${id}`),
  // API Keys
  createAPIKey: (data) => api.post('/admin/config/api-keys', data),
  getAPIKeys: (params) => api.get('/admin/config/api-keys', { params }),
  revokeAPIKey: (id) => api.put(`/admin/config/api-keys/${id}/revoke`),
  // Webhooks
  createWebhook: (data) => api.post('/admin/config/webhooks', data),
  getWebhooks: (params) => api.get('/admin/config/webhooks', { params }),
  updateWebhook: (id, data) => api.put(`/admin/config/webhooks/${id}`, data),
  deleteWebhook: (id) => api.delete(`/admin/config/webhooks/${id}`),
  testWebhook: (id) => api.post(`/admin/config/webhooks/${id}/test`),
  // Places
  getPlaces: (params) => api.get('/admin/config/places', { params }),
  getPlace: (id) => api.get(`/admin/config/places/${id}`),
  createPlace: (data) => api.post('/admin/config/places', data),
  updatePlace: (id, data) => api.put(`/admin/config/places/${id}`, data),
  deletePlace: (id) => api.delete(`/admin/config/places/${id}`),
  bulkCreatePlaces: (data) => api.post('/admin/config/places/bulk', data),
};

// Public places API (no auth)
export const placesAPI = {
  getAll: (params) => api.get('/rides/places', { params }),
};

// Saved places API (authenticated, uses favoriteLocations in User model)
export const savedPlacesAPI = {
  getAll: () => api.get('/auth/profile'),
  update: (places) => api.put('/auth/profile', { favoriteLocations: places }),
};

// Network status helper
export const networkStatus = {
  isOnline: () => navigator.onLine,
  onOffline: (callback) => window.addEventListener('offline', callback),
  onOnline: (callback) => window.addEventListener('online', callback),
  getQueuedCount: () => offlineService.getQueuedCount()
};

export default api;

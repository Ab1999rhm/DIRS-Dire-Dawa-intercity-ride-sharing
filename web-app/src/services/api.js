import axios from 'axios';
import offlineService from './offlineService';

const API_URL = process.env.REACT_APP_API_URL || 'https://dirs-dire-dawa-intercity-ride-sharing.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 second timeout — prevents infinite loading on mobile (Render cold start)
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
  login: (data) => api.post('/auth/login', data),
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
  forgotPassword: (phoneNumber) => api.post('/auth/forgot-password', { phoneNumber }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  deleteAccount: () => api.delete('/auth/account'),
  updateDriverStatus: (isOnline, coordinates) => api.put('/auth/driver/status', { isOnline, coordinates }),
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

export const paymentsAPI = {
  process: (tripId, data) => api.post(`/payments/trip/${tripId}`, data),
  history: (params) => offlineFirst(
    () => api.get('/payments/history', { params }),
    () => offlineService.getCachedPayments()
  ),
  earnings: () => api.get('/payments/earnings'),
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
  resolve: (id) => api.put(`/sos/${id}/resolve`),
  history: (params) => api.get('/sos/history', { params }),
  active: () => api.get('/sos/active'),
  shareTrip: (data) => api.post('/sos/share-trip', data),
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
  uploadDriver: (formData) => api.post('/auth/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadVehicle: (formData) => api.post('/auth/vehicle-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  suspendUser: (id, reason) => api.put(`/admin/users/${id}/suspend`, { reason }),
  reactivateUser: (id) => api.put(`/admin/users/${id}/reactivate`),
  pendingDrivers: (params) => api.get('/admin/drivers/pending', { params }),
  verifyDriver: (id, action, reason) => api.post(`/admin/drivers/${id}/verify`, { action, reason }),
  trips: (params) => api.get('/admin/trips', { params }),
  payments: (params) => api.get('/admin/payments', { params }),
  report: (params) => api.get('/admin/reports', { params }),
  sosAlerts: (params) => api.get('/admin/sos', { params }),
};

// Network status helper
export const networkStatus = {
  isOnline: () => navigator.onLine,
  onOffline: (callback) => window.addEventListener('offline', callback),
  onOnline: (callback) => window.addEventListener('online', callback),
  getQueuedCount: () => offlineService.getQueuedCount()
};

export default api;

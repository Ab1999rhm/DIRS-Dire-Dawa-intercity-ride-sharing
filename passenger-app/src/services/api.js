import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api(error.config);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  sendOTP: (phoneNumber) => api.post('/auth/send-otp', { phoneNumber }),
  verifyOTP: (phoneNumber, otp) => api.post('/auth/verify-otp', { phoneNumber, otp }),
  forgotPassword: (phoneNumber) => api.post('/auth/forgot-password', { phoneNumber }),
  resetPassword: (phoneNumber, otp, newPassword) => api.post('/auth/reset-password', { phoneNumber, otp, newPassword }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updateLocation: (coordinates) => api.put('/auth/location', { coordinates })
};

export const ridesAPI = {
  createRideRequest: (data) => api.post('/rides', data),
  cancelRide: (rideRequestId, reason) => api.post(`/rides/${rideRequestId}/cancel`, { cancellationReason: reason }),
  getRideRequest: (id) => api.get(`/rides/${id}`),
  getPassengerTrips: (params) => api.get('/rides/passenger/trips', { params }),
  getTripDetails: (id) => api.get(`/rides/trip/${id}`),
  startTrip: (tripId) => api.post(`/rides/trip/${tripId}/start`),
  completeTrip: (tripId) => api.post(`/rides/trip/${tripId}/complete`)
};

export const paymentsAPI = {
  processPayment: (tripId, data) => api.post(`/payments/trip/${tripId}`, data),
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
  getPaymentDetails: (paymentId) => api.get(`/payments/${paymentId}`)
};

export const ratingsAPI = {
  createRating: (tripId, data) => api.post(`/ratings/trip/${tripId}`, data),
  getUserRatings: (userId, params) => api.get(`/ratings/user/${userId}`, { params }),
  getTripRating: (tripId) => api.get(`/ratings/trip/${tripId}`)
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`)
};

export const sosAPI = {
  triggerSOS: (data) => api.post('/sos/trigger', data),
  getHistory: (params) => api.get('/sos/history', { params }),
  shareTrip: (data) => api.post('/sos/share-trip', data)
};

export const usersAPI = {
  getUserById: (id) => api.get(`/users/${id}`),
  addEmergencyContact: (data) => api.post('/users/emergency-contacts', data),
  removeEmergencyContact: (contactId) => api.delete(`/users/emergency-contacts/${contactId}`),
  addFavoriteLocation: (data) => api.post('/users/favorite-locations', data),
  removeFavoriteLocation: (locationId) => api.delete(`/users/favorite-locations/${locationId}`)
};

export default api;

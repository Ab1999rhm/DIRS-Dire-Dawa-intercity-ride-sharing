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
    const token = localStorage.getItem('driverAccessToken');
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
      const refreshToken = localStorage.getItem('driverRefreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('driverAccessToken', accessToken);
          localStorage.setItem('driverRefreshToken', newRefreshToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api(error.config);
        } catch (refreshError) {
          localStorage.removeItem('driverAccessToken');
          localStorage.removeItem('driverRefreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updateLocation: (coordinates) => api.put('/auth/location', { coordinates }),
  updateDriverStatus: (isOnline, coordinates) => api.put('/auth/driver/status', { isOnline, coordinates })
};

export const driverAPI = {
  getMyVehicle: () => api.get('/vehicles/my'),
  registerVehicle: (data) => api.post('/vehicles', data),
  updateVehicle: (data) => api.put('/vehicles/my', data),
  getAvailableRides: (params) => api.get('/rides/available', { params }),
  acceptRide: (rideRequestId) => api.post(`/rides/${rideRequestId}/accept`),
  declineRide: (rideRequestId) => api.post(`/rides/${rideRequestId}/decline`),
  startTrip: (tripId) => api.post(`/rides/trip/${tripId}/start`),
  completeTrip: (tripId) => api.post(`/rides/trip/${tripId}/complete`),
  confirmArrival: (tripId) => api.post(`/rides/trip/${tripId}/arrival`),
  cancelTrip: (tripId, reason) => api.post(`/rides/trip/${tripId}/cancel`, { reason }),
  getDriverTrips: (params) => api.get('/rides/driver/trips', { params }),
  getTripDetails: (id) => api.get(`/rides/trip/${id}`),
  getDriverStats: () => api.get('/rides/driver/stats')
};

export const paymentsAPI = {
  getEarnings: () => api.get('/payments/earnings'),
  requestWithdrawal: (data) => api.post('/payments/withdraw', data),
  getPaymentHistory: (params) => api.get('/payments/history', { params })
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export const sosAPI = {
  trigger: (data) => api.post('/sos/trigger', data),
  history: (params) => api.get('/sos/history', { params }),
  active: () => api.get('/sos/active')
};

export default api;

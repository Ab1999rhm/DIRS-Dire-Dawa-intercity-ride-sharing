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
    const token = localStorage.getItem('adminAccessToken');
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
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('adminAccessToken', accessToken);
          localStorage.setItem('adminRefreshToken', newRefreshToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api(error.config);
        } catch (refreshError) {
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  suspendUser: (userId, reason) => api.put(`/admin/users/${userId}/suspend`, { reason }),
  reactivateUser: (userId) => api.put(`/admin/users/${userId}/reactivate`),
  getPendingVerifications: (params) => api.get('/admin/drivers/pending', { params }),
  verifyDriver: (driverId, action, reason) => api.post(`/admin/drivers/${driverId}/verify`, { action, reason }),
  getAllTrips: (params) => api.get('/admin/trips', { params }),
  getPayments: (params) => api.get('/admin/payments', { params }),
  generateReport: (params) => api.get('/admin/reports', { params }),
  getSOSAlerts: (params) => api.get('/admin/sos', { params })
};

export default api;

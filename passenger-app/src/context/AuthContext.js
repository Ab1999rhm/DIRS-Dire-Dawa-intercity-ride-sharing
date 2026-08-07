import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const connectSocket = useCallback((token) => {
    // Use socket URL (strip /api suffix if present from the API URL env var)
    const socketUrl = process.env.REACT_APP_SOCKET_URL ||
      (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('notification', (data) => {
      console.log('New notification:', data);
      setNotifications((prev) => [data, ...prev]);
    });

    newSocket.on('ride_accepted', (data) => {
      console.log('Ride accepted:', data);
      // Dispatch custom event for active navigation across pages
      window.dispatchEvent(new CustomEvent('dirs_ride_accepted', { detail: data }));
    });

    newSocket.on('driver_location', (data) => {
      console.log('Driver location:', data);
    });

    newSocket.on('trip_status', (data) => {
      console.log('Trip status:', data);
    });

    setSocket(newSocket);
    return newSocket;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Apply a 10-second timeout so the app never hangs indefinitely on mobile
      // when the backend is unreachable (e.g. localhost doesn't resolve on a phone)
      const timeoutId = setTimeout(() => {
        console.warn('Auth check timed out — clearing session');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setLoading(false);
      }, 10000);

      authAPI.getMe()
        .then(response => {
          clearTimeout(timeoutId);
          setUser(response.data.user);
          connectSocket(token);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [connectSocket]);

  const login = async (phoneNumber, password) => {
    const response = await authAPI.login({ phoneNumber, password });
    const { user, accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    connectSocket(accessToken);
    return user;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const { user, accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    connectSocket(accessToken);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    if (socket) {
      socket.disconnect();
    }
  };

  const updateUser = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      socket,
      notifications,
      login,
      register,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

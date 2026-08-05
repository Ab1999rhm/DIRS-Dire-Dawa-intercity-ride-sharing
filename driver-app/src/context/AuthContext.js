import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const connectSocket = useCallback((token) => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Driver socket connected');
    });

    newSocket.on('notification', (data) => {
      console.log('New notification:', data);
    });

    newSocket.on('new_ride_request', (data) => {
      console.log('New ride request:', data);
    });

    newSocket.on('trip_status', (data) => {
      console.log('Trip status:', data);
    });

    setSocket(newSocket);
    return newSocket;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('driverAccessToken');
    if (token) {
      authAPI.getMe()
        .then(response => {
          setUser(response.data.user);
          setDriverProfile(response.data.driverProfile);
          connectSocket(token);
        })
        .catch(() => {
          localStorage.removeItem('driverAccessToken');
          localStorage.removeItem('driverRefreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [connectSocket]);

  const login = async (phoneNumber, password) => {
    const response = await authAPI.login({ phoneNumber, password });
    const { user, driverProfile, accessToken, refreshToken } = response.data;
    localStorage.setItem('driverAccessToken', accessToken);
    localStorage.setItem('driverRefreshToken', refreshToken);
    setUser(user);
    setDriverProfile(driverProfile);
    connectSocket(accessToken);
    return user;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const { user, driverProfile, accessToken, refreshToken } = response.data;
    localStorage.setItem('driverAccessToken', accessToken);
    localStorage.setItem('driverRefreshToken', refreshToken);
    setUser(user);
    setDriverProfile(driverProfile);
    connectSocket(accessToken);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('driverAccessToken');
    localStorage.removeItem('driverRefreshToken');
    setUser(null);
    setDriverProfile(null);
    if (socket) {
      socket.disconnect();
    }
  };

  const updateDriverProfile = (newData) => {
    setDriverProfile(prev => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      driverProfile,
      loading,
      socket,
      login,
      register,
      logout,
      updateDriverProfile
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

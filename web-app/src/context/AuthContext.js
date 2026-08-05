import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newRideRequest, setNewRideRequest] = useState(null);
  const [rideAccepted, setRideAccepted] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [tripStatusUpdate, setTripStatusUpdate] = useState(null);
  const [sosAlert, setSosAlert] = useState(null);

  const socketRef = useRef(null);

  const connectSocket = useCallback((token) => {
    if (socketRef.current?.connected) return socketRef.current;

    const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (user?.role === 'driver') newSocket.emit('join_drivers');
      if (user?.role === 'admin') newSocket.emit('join_admins');
    });

    newSocket.on('notification', (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on('new_ride_request', (data) => {
      setNewRideRequest(data);
    });

    newSocket.on('ride_accepted', (data) => {
      setRideAccepted(data);
    });

    newSocket.on('driver_location', (data) => {
      setDriverLocation(data);
    });

    newSocket.on('trip_status', (data) => {
      setTripStatusUpdate(data);
    });

    newSocket.on('sos_alert', (data) => {
      setSosAlert(data);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
    return newSocket;
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authAPI.getMe()
        .then((res) => {
          setUser(res.data.user);
          setDriverProfile(res.data.driverProfile);
          connectSocket(token);
        })
        .catch(() => { localStorage.clear(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phoneNumber, password) => {
    const res = await authAPI.login({ phoneNumber, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
    setDriverProfile(res.data.driverProfile);
    connectSocket(res.data.accessToken);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    return res.data;
  };

  const completeRegistration = (accessToken, refreshToken, userData, driverProfileData) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    if (driverProfileData) setDriverProfile(driverProfileData);
    connectSocket(accessToken);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setDriverProfile(null);
    setNotifications([]);
    setUnreadCount(0);
    socket?.disconnect();
    socketRef.current = null;
  };

  const clearNewRideRequest = () => setNewRideRequest(null);
  const clearRideAccepted = () => setRideAccepted(null);
  const clearSosAlert = () => setSosAlert(null);

  const emitLocationUpdate = (coordinates) => {
    if (socket?.connected) {
      socket.emit('driver_location_update', { coordinates });
    }
  };

  return (
    <AuthContext.Provider value={{
      user, driverProfile, loading, socket,
      login, register, completeRegistration, logout, setUser, setDriverProfile,
      notifications, unreadCount, setNotifications, setUnreadCount,
      newRideRequest, clearNewRideRequest,
      rideAccepted, clearRideAccepted,
      driverLocation, tripStatusUpdate,
      sosAlert, clearSosAlert,
      emitLocationUpdate,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

import React, { createContext, useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { authAPI, chatAPI, notificationsAPI } from '../services/api';
import { io } from 'socket.io-client';
import soundService from '../services/soundService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverWaking, setServerWaking] = useState(false); // true when backend is cold-starting
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newRideRequest, setNewRideRequest] = useState(null);
  const [rideAccepted, setRideAccepted] = useState(null);
  const [newPassengerJoined, setNewPassengerJoined] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [tripStatusUpdate, setTripStatusUpdate] = useState(null);
  const [sosAlert, setSosAlert] = useState(null);
  const [chatUnread, setChatUnread] = useState({});
  const [accountBanned, setAccountBanned] = useState(null);

  const socketRef = useRef(null);

  const loadChatUnread = useCallback(() => {
    if (!localStorage.getItem('accessToken')) return;
    chatAPI.getUnread().then((res) => {
      const trips = res.data?.trips || [];
      const map = {};
      trips.forEach(t => { if (t.unread > 0) map[t.tripId] = t.unread; });
      setChatUnread(map);
    }).catch(() => {});
  }, []);

  const loadNotifications = useCallback(() => {
    if (!localStorage.getItem('accessToken')) return;
    notificationsAPI.get({ limit: 20 }).then((res) => {
      const data = res.data || {};
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications.map((n, i) => ({ ...n, _key: n._id || i })));
      }
      if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const api = authAPI;
    const instance = api?.axios || api;
    if (!instance?.interceptors) return;

    const interceptor = instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const res = await authAPI.refreshToken(refreshToken);
              const { accessToken } = res.data;
              localStorage.setItem('accessToken', accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return instance(originalRequest);
            } catch {
              window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Session expired. Please login again.', type: 'error' } }));
              localStorage.clear();
              setUser(null);
              setDriverProfile(null);
              window.location.href = '/login';
            }
          } else {
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Session expired. Please login again.', type: 'error' } }));
            localStorage.clear();
            setUser(null);
            setDriverProfile(null);
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      if (instance?.interceptors?.response?.eject) {
        instance.interceptors.response.eject(interceptor);
      }
    };
  }, []);

  const connectSocket = useCallback((token) => {
    if (socketRef.current?.connected) return socketRef.current;

    const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://dirs-dire-dawa-intercity-ride-sharing.onrender.com', {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 15,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (user?.role === 'driver') newSocket.emit('join_drivers');
      if (user?.role === 'admin') newSocket.emit('join_admins');
      if (user?.role === 'passenger' && user?._id) {
        newSocket.emit('join_passengers', { userId: user._id });
      }
    });

    newSocket.on('notification', (data) => {
      soundService.play('notification');
      // New shape: { notification, unreadCount }; old shape: { type, title, body }
      if (data?.notification) {
        setNotifications(prev => {
          const next = [{ ...data.notification, _key: data.notification._id }, ...prev];
          return next.slice(0, 100);
        });
        if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
        else setUnreadCount(prev => prev + 1);
      } else if (data?.title || data?.body) {
        setNotifications(prev => [{ ...data, _key: `push-${Date.now()}` }, ...prev].slice(0, 100));
        setUnreadCount(prev => prev + 1);
      }
    });

    newSocket.on('notification_count', (data) => {
      if (typeof data?.unreadCount === 'number') setUnreadCount(data.unreadCount);
    });

    newSocket.on('new_ride_request', (data) => {
      soundService.play('new-ride');
      setNewRideRequest(data);
    });

    newSocket.on('ride_accepted', (data) => {
      soundService.play('ride-accepted');
      setRideAccepted(data);
    });

    newSocket.on('new_passenger_joined', (data) => {
      soundService.play('new-ride');
      setNewPassengerJoined(data);
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: `New passenger joined! Seat ${data.passenger?.seats?.join(', ') || ''}`, type: 'info' }
      }));
    });

    newSocket.on('driver_location', (data) => {
      setDriverLocation(data);
    });

    newSocket.on('trip_status', (data) => {
      soundService.play('trip-status');
      setTripStatusUpdate(data);
    });

    newSocket.on('sos_alert', (data) => {
      soundService.play('sos-alert');
      setSosAlert(data);
    });

    const handleIncomingMessage = (msg) => {
      if (!msg?.tripId) return;
      soundService.play('chat-message');
      setChatUnread(prev => ({ ...prev, [msg.tripId]: (prev[msg.tripId] || 0) + 1 }));
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: `New message from ${msg.senderRole === 'driver' ? 'your driver' : 'your passenger'}`, type: 'info' }
      }));
    };
    newSocket.on('chat_message', handleIncomingMessage);
    newSocket.on('trip_message', handleIncomingMessage);

    socketRef.current = newSocket;
    setSocket(newSocket);
    loadChatUnread();

    newSocket.on('account_banned', (data) => {
      setAccountBanned({ reason: data.reason || 'Your account has been permanently banned.' });
      setUser(null);
      setDriverProfile(null);
      localStorage.clear();
    });

    newSocket.on('account_reactivated', () => {
      setAccountBanned(null);
    });

    return newSocket;
  }, [user, loadChatUnread]);

  useEffect(() => {
    if (user?.preferences?.sound === false) {
      soundService.setEnabled(false);
    } else {
      soundService.setEnabled(true);
    }
  }, [user?.preferences?.sound]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Show 'waking server' message after 3s if still loading
      const wakingTimer = setTimeout(() => setServerWaking(true), 3000);
      // Hard timeout after 12s — clear session and show login
      const hardTimeout = setTimeout(() => {
        clearTimeout(wakingTimer);
        setServerWaking(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setLoading(false);
      }, 12000);

      authAPI.getMe()
        .then((res) => {
          clearTimeout(wakingTimer);
          clearTimeout(hardTimeout);
          setServerWaking(false);
          setUser(res.data.user);
          setDriverProfile(res.data.driverProfile);
          if (res.data.user?.isBanned || res.data.driverProfile?.isBanned) {
            setAccountBanned({ reason: res.data.driverProfile?.banReason || res.data.user?.banReason || 'Your account has been permanently banned.' });
          }
          connectSocket(token);
          loadNotifications();
        })
        .catch(() => {
          clearTimeout(wakingTimer);
          clearTimeout(hardTimeout);
          setServerWaking(false);
          localStorage.clear();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    const globalTimeout = setTimeout(() => setLoading(false), 20000);
    return () => clearTimeout(globalTimeout);
  }, []);

  const login = async (phoneNumber, password) => {
    const res = await authAPI.login({ phoneNumber, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
    setDriverProfile(res.data.driverProfile);
    if (res.data.user?.isBanned || res.data.driverProfile?.isBanned) {
      setAccountBanned({ reason: res.data.driverProfile?.banReason || res.data.user?.banReason || 'Your account has been permanently banned.' });
    }
    connectSocket(res.data.accessToken);
    loadNotifications();
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
    loadNotifications();
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

  const markTripRead = useCallback((tripId) => {
    if (!tripId) return;
    setChatUnread(prev => {
      const next = { ...prev };
      delete next[tripId];
      return next;
    });
    chatAPI.markRead(tripId).catch(() => {});
  }, []);

  const contextValue = useMemo(() => ({
    user, driverProfile, loading, serverWaking, socket,
    login, register, completeRegistration, logout, setUser, setDriverProfile,
    notifications, unreadCount, setNotifications, setUnreadCount, loadNotifications,
    newRideRequest, clearNewRideRequest,
    rideAccepted, clearRideAccepted,
    newPassengerJoined, setNewPassengerJoined,
    driverLocation, tripStatusUpdate,
    sosAlert, clearSosAlert,
    emitLocationUpdate,
    chatUnread, markTripRead,
    accountBanned, setAccountBanned,
  }), [
    user, driverProfile, loading, serverWaking, socket,
    notifications, unreadCount, loadNotifications,
    newRideRequest, rideAccepted, newPassengerJoined,
    driverLocation, tripStatusUpdate, sosAlert,
    chatUnread, accountBanned,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

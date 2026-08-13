import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { authAPI, chatAPI } from '../services/api';
import { unregisterPush } from '../services/pushService';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { playMessageSound } from '../utils/sound';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatUnread, setChatUnread] = useState({});
  const userIdRef = useRef(null);

  useEffect(() => {
    userIdRef.current = user?._id || null;
  }, [user]);

  const handleIncomingMessage = useCallback((data) => {
    const tripId = data?.tripId;
    const text = data?.text;
    if (!tripId || !text) return;

    if (data.senderId && userIdRef.current && String(data.senderId) === String(userIdRef.current)) {
      return;
    }

    setChatMessages((prev) => {
      const list = prev[tripId] || [];
      const exists = list.some((m) =>
        (m.id && m.id === data.id) || (m.timestamp === data.timestamp && m.text === text && m.senderRole === data.senderRole)
      );
      if (exists) return prev;
      return { ...prev, [tripId]: [...list, { ...data, isOwn: false }] };
    });

    setChatUnread((prev) => ({ ...prev, [tripId]: (prev[tripId] || 0) + 1 }));
    playMessageSound();
    toast.info(`New message: ${text}`, { position: 'top-center', autoClose: 4000 });
  }, []);

  const connectSocket = useCallback((token) => {
    const newSocket = io(process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('Driver socket connected');
      chatAPI.getUnread()
        .then((res) => {
          const map = {};
          (res.data?.trips || []).forEach((t) => {
            if (t.unread > 0) map[t.tripId] = t.unread;
          });
          setChatUnread(map);
        })
        .catch(() => {});
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnect attempt:', attemptNumber);
    });

    newSocket.on('reconnect_error', (err) => {
      console.error('Socket reconnect error:', err.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after all attempts');
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

    newSocket.on('trip_message', handleIncomingMessage);
    newSocket.on('chat_message', handleIncomingMessage);

    setSocket(newSocket);
    return newSocket;
  }, [handleIncomingMessage]);

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
    return response.data;
  };

  const markTripRead = useCallback((tripId) => {
    setChatUnread((prev) => ({ ...prev, [tripId]: 0 }));
    chatAPI.markRead(tripId).catch(() => {});
  }, []);

  const loadTripMessages = useCallback(async (tripId) => {
    const res = await chatAPI.getMessages(tripId, { limit: 200 });
    const loaded = (res.data?.messages || []).map((m) => ({ ...m, isOwn: false }));
    setChatMessages((prev) => ({ ...prev, [tripId]: loaded }));
    return res.data?.messages || [];
  }, []);

  const logout = async () => {
    await unregisterPush();
    localStorage.removeItem('driverAccessToken');
    localStorage.removeItem('driverRefreshToken');
    setUser(null);
    setDriverProfile(null);
    setChatMessages({});
    setChatUnread({});
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
      chatMessages,
      chatUnread,
      loadTripMessages,
      markTripRead,
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

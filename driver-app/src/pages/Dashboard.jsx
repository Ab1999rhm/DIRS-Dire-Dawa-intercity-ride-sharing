import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { driverAPI, authAPI, notificationsAPI, sosAPI } from '../services/api';
import { getVehicleIcon } from '../components/VehicleIcons';
import {
  FaMapMarkerAlt, FaPhone, FaCheck, FaTimes, FaPowerOff, FaHome, FaListUl,
  FaWallet, FaUser, FaBell, FaExclamationTriangle, FaDirections, FaStar,
  FaClock, FaRoute, FaSync, FaCar, FaMoneyBillWave, FaCalendarDay
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Dashboard.css';

const REQUEST_TIMEOUT = 15;
const GPS_INTERVAL = 10000;

const DriverDashboard = () => {
  const { user, driverProfile, socket, updateDriverProfile } = useAuth();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [onlineDuration, setOnlineDuration] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [tripLoading, setTripLoading] = useState(false);

  const gpsRef = useRef(null);
  const onlineTimerRef = useRef(null);
  const requestTimersRef = useRef({});

  // Load stats on mount
  useEffect(() => {
    loadStats();
    loadNotifications();
  }, []);

  // Sync online status with backend on mount
  useEffect(() => {
    if (driverProfile) {
      setIsOnline(driverProfile.isAvailable || false);
      if (driverProfile.currentTrip) {
        loadCurrentTrip(driverProfile.currentTrip);
      }
    }
  }, [driverProfile]);

  // Online duration timer
  useEffect(() => {
    if (isOnline) {
      onlineTimerRef.current = setInterval(() => {
        setOnlineDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(onlineTimerRef.current);
      setOnlineDuration(0);
    }
    return () => clearInterval(onlineTimerRef.current);
  }, [isOnline]);

  // Continuous GPS tracking when online
  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      const sendLocation = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              await authAPI.updateLocation([longitude, latitude]);
            } catch (e) { /* silent */ }
          },
          () => { /* silent */ }
        );
      };
      sendLocation();
      gpsRef.current = setInterval(sendLocation, GPS_INTERVAL);
    } else {
      clearInterval(gpsRef.current);
    }
    return () => clearInterval(gpsRef.current);
  }, [isOnline]);

  // Socket listeners
  useEffect(() => {
    if (socket) {
      socket.on('new_ride_request', (data) => {
        const request = data.rideRequest;
        setRideRequests(prev => {
          if (prev.find(r => r._id === request._id)) return prev;
          return [request, ...prev];
        });
        startRequestTimer(request._id);
        toast.info('New ride request!');
      });

      socket.on('trip_status', (data) => {
        if (currentTrip && data.tripId === currentTrip._id) {
          setCurrentTrip(prev => ({ ...prev, status: data.status }));
          if (data.status === 'completed' || data.status === 'cancelled') {
            setCurrentTrip(null);
            loadStats();
          }
        }
      });

      socket.on('notification', (data) => {
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      socket.on('ride_cancelled', (data) => {
        setRideRequests(prev => prev.filter(r => r._id !== data.rideRequestId));
        if (currentTrip && data.tripId === currentTrip._id) {
          setCurrentTrip(null);
          toast.warning('Ride was cancelled');
        }
      });

      return () => {
        socket.off('new_ride_request');
        socket.off('trip_status');
        socket.off('notification');
        socket.off('ride_cancelled');
      };
    }
  }, [socket, currentTrip]);

  // Cleanup request timers
  useEffect(() => {
    return () => {
      Object.values(requestTimersRef.current).forEach(clearInterval);
    };
  }, []);

  const startRequestTimer = (requestId) => {
    let timeLeft = REQUEST_TIMEOUT;
    requestTimersRef.current[requestId] = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(requestTimersRef.current[requestId]);
        delete requestTimersRef.current[requestId];
        setRideRequests(prev => prev.filter(r => r._id !== requestId));
      }
    }, 1000);
  };

  const loadStats = async () => {
    try {
      const response = await driverAPI.getDriverStats();
      setStats(response.data);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications({ limit: 20 });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Load notifications error:', error);
    }
  };

  const loadCurrentTrip = async (tripId) => {
    try {
      const response = await driverAPI.getTripDetails(tripId);
      setCurrentTrip(response.data.trip);
      if (socket) {
        socket.emit('join_trip', tripId);
      }
    } catch (error) {
      console.error('Load trip error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadNotifications()]);
    setRefreshing(false);
    toast.success('Refreshed');
  };

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setLoading(true);
    try {
      let coords = [0, 0];
      if (newStatus && navigator.geolocation) {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        coords = [pos.coords.longitude, pos.coords.latitude];
      }
      await authAPI.updateDriverStatus(newStatus, coords);
      setIsOnline(newStatus);
      if (newStatus) {
        toast.success('You are now online');
      } else {
        toast.info('You are now offline');
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Status update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideRequestId) => {
    setTripLoading(true);
    try {
      const response = await driverAPI.acceptRide(rideRequestId);
      const trip = response.data.trip;
      setCurrentTrip(trip);
      setRideRequests(prev => prev.filter(r => r._id !== rideRequestId));
      clearInterval(requestTimersRef.current[rideRequestId]);
      delete requestTimersRef.current[rideRequestId];
      if (socket) {
        socket.emit('join_trip', trip._id);
      }
      toast.success('Ride accepted!');
      loadStats();
    } catch (error) {
      toast.error('Failed to accept ride');
      console.error('Accept ride error:', error);
    } finally {
      setTripLoading(false);
    }
  };

  const handleDeclineRide = async (rideRequestId) => {
    try {
      await driverAPI.declineRide(rideRequestId);
      setRideRequests(prev => prev.filter(r => r._id !== rideRequestId));
      clearInterval(requestTimersRef.current[rideRequestId]);
      delete requestTimersRef.current[rideRequestId];
    } catch (error) {
      console.error('Decline ride error:', error);
    }
  };

  const handleStartTrip = async () => {
    setTripLoading(true);
    try {
      await driverAPI.startTrip(currentTrip._id);
      setCurrentTrip(prev => ({ ...prev, status: 'in_progress' }));
      toast.success('Trip started');
    } catch (error) {
      toast.error('Failed to start trip');
    } finally {
      setTripLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    setTripLoading(true);
    try {
      await driverAPI.completeTrip(currentTrip._id);
      setCurrentTrip(null);
      toast.success('Trip completed!');
      loadStats();
    } catch (error) {
      toast.error('Failed to complete trip');
    } finally {
      setTripLoading(false);
    }
  };

  const handleConfirmArrival = async () => {
    setTripLoading(true);
    try {
      await driverAPI.confirmArrival(currentTrip._id);
      toast.success('Arrival confirmed');
    } catch (error) {
      toast.error('Failed to confirm arrival');
    } finally {
      setTripLoading(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    setTripLoading(true);
    try {
      await driverAPI.cancelTrip(currentTrip._id, 'Driver cancelled');
      setCurrentTrip(null);
      toast.warning('Trip cancelled');
      loadStats();
    } catch (error) {
      toast.error('Failed to cancel trip');
    } finally {
      setTripLoading(false);
    }
  };

  const handleSOS = async () => {
    if (!window.confirm('Send emergency SOS alert?')) return;
    try {
      await sosAPI.trigger({
        tripId: currentTrip?._id,
        message: 'Driver SOS emergency'
      });
      toast.error('SOS alert sent!');
    } catch (error) {
      toast.error('Failed to send SOS');
    }
  };

  const handleNavigate = (lat, lng, address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat || ''},${lng || ''}&destination_place_id=`;
    window.open(url, '_blank');
  };

  const handleCallPassenger = (phone) => {
    if (phone) window.open(`tel:${phone}`, '_self');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const VehicleIcon = getVehicleIcon(stats?.vehicle?.type || driverProfile?.vehicle?.vehicleType || 'car');

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="driver-info">
          <h2>Welcome, {user?.firstName}</h2>
          <p className="verification-status">
            {driverProfile?.verificationStatus === 'approved' ? 'Verified Driver' : 'Pending Verification'}
          </p>
          {isOnline && (
            <p className="online-duration">
              <FaClock /> {formatDuration(onlineDuration)}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <FaBell />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <div className={`online-toggle ${isOnline ? 'online' : 'offline'}`}>
            <button onClick={toggleOnline} disabled={loading}>
              <FaPowerOff />
              {loading ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={handleMarkAllRead}>Mark all read</button>
            )}
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n._id} className={`notification-item ${!n.isRead ? 'unread' : ''}`}>
                  <p className="notification-title">{n.title || n.type}</p>
                  <p className="notification-message">{n.message}</p>
                  <span className="notification-time">{formatTime(n.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Vehicle Info Bar */}
      {stats?.vehicle && (
        <div className="vehicle-info-bar">
          <VehicleIcon size={28} color="#1a73e8" />
          <span className="vehicle-text">{stats.vehicle.color} {stats.vehicle.make} {stats.vehicle.model}</span>
          <span className="plate-number">{stats.vehicle.plateNumber}</span>
        </div>
      )}

      {/* Pull to Refresh */}
      <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh}>
        <FaSync /> Refresh
      </button>

      {/* Waiting Section */}
      {!currentTrip && rideRequests.length === 0 && (
        <div className="waiting-section">
          <div className="pulse-animation">
            <VehicleIcon size={72} color={isOnline ? '#1a73e8' : '#94a3b8'} className="car-icon" />
          </div>
          <h3>{isOnline ? 'Waiting for ride requests...' : 'Go online to receive requests'}</h3>
          <p>{isOnline ? 'Stay in a good network area' : 'Toggle the online button to start'}</p>
        </div>
      )}

      {/* Ride Requests */}
      {rideRequests.length > 0 && !currentTrip && (
        <div className="ride-requests-section">
          <h3>New Ride Requests ({rideRequests.length})</h3>
          {rideRequests.map((request) => (
            <div key={request._id} className="ride-request-card">
              <div className="request-timer-bar">
                <div className="timer-fill" style={{ animationDuration: `${REQUEST_TIMEOUT}s` }} />
              </div>
              <div className="request-header">
                <FaMapMarkerAlt className="pickup-icon" />
                <div className="request-info">
                  <p className="pickup">{request.pickupLocation?.address || 'Pickup Location'}</p>
                  <p className="dropoff">→ {request.dropoffLocation?.address || 'Dropoff Location'}</p>
                </div>
              </div>
              <div className="request-passenger">
                <FaUser className="passenger-icon" />
                <span>{request.passenger?.firstName} {request.passenger?.lastName}</span>
                {request.passenger?.averageRating && (
                  <span className="passenger-rating">
                    <FaStar /> {request.passenger.averageRating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="request-details">
                <div className="detail-item">
                  <span className="detail-label-sm">Fare</span>
                  <span className="fare">{request.estimatedFare} ETB</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sm">Distance</span>
                  <span className="distance">{(request.route?.distance / 1000).toFixed(1)} km</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sm">Duration</span>
                  <span className="duration">{Math.ceil((request.route?.duration || 0) / 60)} min</span>
                </div>
              </div>
              <div className="request-actions">
                <button
                  className="btn-decline"
                  onClick={() => handleDeclineRide(request._id)}
                  disabled={tripLoading}
                >
                  <FaTimes /> Decline
                </button>
                <button
                  className="btn-accept"
                  onClick={() => handleAcceptRide(request._id)}
                  disabled={tripLoading}
                >
                  <FaCheck /> Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Trip */}
      {currentTrip && (
        <div className="current-trip-section">
          <div className="trip-header-row">
            <h3>Current Trip</h3>
            <span className={`status-badge ${currentTrip.status}`}>
              {currentTrip.status.replace('_', ' ')}
            </span>
          </div>
          <div className="trip-card">
            <div className="trip-route">
              <div className="route-point">
                <span className="route-dot pickup" />
                <div className="route-text-group">
                  <span className="route-label">PICKUP</span>
                  <span className="route-text">{currentTrip.pickupLocation?.address || 'Pickup'}</span>
                </div>
                <button className="btn-navigate" onClick={() => handleNavigate(
                  currentTrip.pickupLocation?.coordinates?.[1],
                  currentTrip.pickupLocation?.coordinates?.[0],
                  currentTrip.pickupLocation?.address
                )}>
                  <FaDirections />
                </button>
              </div>
              <div className="route-line" />
              <div className="route-point">
                <span className="route-dot dropoff" />
                <div className="route-text-group">
                  <span className="route-label">DROPOFF</span>
                  <span className="route-text">{currentTrip.dropoffLocation?.address || 'Dropoff'}</span>
                </div>
                <button className="btn-navigate" onClick={() => handleNavigate(
                  currentTrip.dropoffLocation?.coordinates?.[1],
                  currentTrip.dropoffLocation?.coordinates?.[0],
                  currentTrip.dropoffLocation?.address
                )}>
                  <FaDirections />
                </button>
              </div>
            </div>

            {/* Passenger Info */}
            {currentTrip.passenger && (
              <div className="trip-passenger-info">
                <div className="passenger-avatar">
                  <FaUser />
                </div>
                <div className="passenger-details">
                  <span className="passenger-name">{currentTrip.passenger.firstName} {currentTrip.passenger.lastName}</span>
                  {currentTrip.passenger.averageRating && (
                    <span className="passenger-rating">
                      <FaStar /> {currentTrip.passenger.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <button className="btn-call" onClick={() => handleCallPassenger(currentTrip.passenger.phoneNumber)}>
                  <FaPhone /> Call
                </button>
              </div>
            )}

            {/* Trip Fare */}
            {currentTrip.fare && (
              <div className="trip-fare-info">
                <FaMoneyBillWave className="fare-icon" />
                <span className="fare-amount">{currentTrip.fare.totalFare} ETB</span>
              </div>
            )}

            <div className="trip-actions">
              {currentTrip.status === 'driver_arriving' && (
                <>
                  <button className="btn-action" onClick={handleConfirmArrival} disabled={tripLoading}>
                    <FaCheck /> Confirm Arrival
                  </button>
                  <button className="btn-action" onClick={handleStartTrip} disabled={tripLoading}>
                    <FaRoute /> Start Trip
                  </button>
                </>
              )}
              {currentTrip.status === 'in_progress' && (
                <button className="btn-complete" onClick={handleCompleteTrip} disabled={tripLoading}>
                  <FaCheck /> Complete Trip
                </button>
              )}
              <button className="btn-cancel-trip" onClick={handleCancelTrip} disabled={tripLoading}>
                <FaTimes /> Cancel
              </button>
            </div>

            {/* SOS Button */}
            <button className="btn-sos" onClick={handleSOS}>
              <FaExclamationTriangle /> SOS Emergency
            </button>
          </div>
        </div>
      )}

      {/* Daily Stats */}
      <div className="daily-stats">
        <div className="daily-stat-card">
          <FaCalendarDay className="stat-icon today" />
          <div>
            <span className="stat-value">{stats?.todayTrips || 0}</span>
            <span className="stat-label">Today's Trips</span>
          </div>
        </div>
        <div className="daily-stat-card">
          <FaMoneyBillWave className="stat-icon earnings" />
          <div>
            <span className="stat-value">{stats?.todayEarnings || 0}</span>
            <span className="stat-label">Today (ETB)</span>
          </div>
        </div>
        <div className="daily-stat-card">
          <FaStar className="stat-icon rating" />
          <div>
            <span className="stat-value">{stats?.averageRating?.toFixed(1) || 'N/A'}</span>
            <span className="stat-label">Rating</span>
          </div>
        </div>
        <div className="daily-stat-card">
          <FaWallet className="stat-icon balance" />
          <div>
            <span className="stat-value">{stats?.availableBalance || 0}</span>
            <span className="stat-label">Balance</span>
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      {stats?.recentTrips?.length > 0 && !currentTrip && (
        <div className="recent-trips-section">
          <h3>Recent Trips</h3>
          {stats.recentTrips.map((trip) => (
            <div key={trip._id} className="recent-trip-item">
              <div className="recent-trip-route">
                <span className="route-dot pickup" />
                <span className="route-text-sm">{trip.pickupLocation?.address || 'Pickup'}</span>
              </div>
              <div className="recent-trip-route">
                <span className="route-dot dropoff" />
                <span className="route-text-sm">{trip.dropoffLocation?.address || 'Dropoff'}</span>
              </div>
              <div className="recent-trip-footer">
                <span className="recent-passenger">{trip.passenger?.firstName}</span>
                <span className="recent-fare">{trip.fare?.totalFare || 0} ETB</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-btn active" onClick={() => navigate('/')}>
          <FaHome /> <span>Home</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/trips')}>
          <FaListUl /> <span>Trips</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/earnings')}>
          <FaWallet /> <span>Earnings</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/vehicle')}>
          <FaCar /> <span>Vehicle</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/profile')}>
          <FaUser /> <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default DriverDashboard;

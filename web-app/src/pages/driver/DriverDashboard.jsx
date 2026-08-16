import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, paymentsAPI, vehiclesAPI, authAPI, sosAPI, reportAPI, notificationsAPI } from '../../services/api';
import { placesAPI } from '../../services/api';
import { Card } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import L from 'leaflet';
import {
  FaCar, FaPowerOff, FaMapMarkerAlt, FaPhone, FaCheck, FaTimes,
  FaStar, FaMoneyBillWave, FaClock, FaRoad, FaBell,
  FaMotorcycle, FaShuttleVan, FaBus, FaTruck, FaBolt,
  FaHome, FaListUl, FaWallet, FaCog, FaChevronRight,
  FaExclamationTriangle, FaFlag, FaShieldAlt, FaUserSlash, FaEllipsisH,
  FaComment, FaUser, FaHeadset, FaMap, FaSms, FaSearch, FaTimesCircle
} from 'react-icons/fa';
import FlexibleMap from '../../components/common/FlexibleMap';
import InAppChat from '../../components/passenger/InAppChat';
import INTERCITY_DESTINATIONS from '../../constants/intercityDestinations';
import './Driver.css';

const INTRA_CITY_PLACES = [
  { key: 'sabian', label: 'Sabian, Dire Dawa', lat: 9.5950, lon: 41.8600 },
  { key: 'kezira', label: 'Kezira, Dire Dawa', lat: 9.6080, lon: 41.8450 },
  { key: 'addis ketema', label: 'Addis Ketema, Dire Dawa', lat: 9.5990, lon: 41.8530 },
  { key: 'gendekore', label: 'Gendekore, Dire Dawa', lat: 9.6120, lon: 41.8390 },
  { key: 'dire dawa city center', label: 'Dire Dawa City Center', lat: 9.6009, lon: 41.8508 },
  { key: 'melka jebdu', label: 'Melka Jebdu, Dire Dawa', lat: 9.5880, lon: 41.8700 },
  { key: 'legehare', label: 'Legehare, Dire Dawa', lat: 9.6050, lon: 41.8470 },
  { key: 'taiwan', label: 'Taiwan, Dire Dawa', lat: 9.6030, lon: 41.8540 },
  { key: 'ashewa', label: 'Ashewa, Dire Dawa', lat: 9.6090, lon: 41.8610 },
  { key: 'megala', label: 'Megala, Dire Dawa', lat: 9.5910, lon: 41.8650 },
  { key: 'buramedo', label: 'Buramedo, Dire Dawa', lat: 9.5870, lon: 41.8430 },
  { key: 'dire dawa market', label: 'Dire Dawa Main Market', lat: 9.6072, lon: 41.8445 },
  { key: 'taiwan market', label: 'Taiwan Market, Dire Dawa', lat: 9.6028, lon: 41.8542 },
  { key: 'sabian market', label: 'Sabian Market, Dire Dawa', lat: 9.5955, lon: 41.8605 },
  { key: 'dire dawa hospital', label: 'Dire Dawa Referral Hospital', lat: 9.6015, lon: 41.8430 },
  { key: 'dilchora hospital', label: 'Dil Chora Hospital, Dire Dawa', lat: 9.6055, lon: 41.8555 },
  { key: 'dire dawa university', label: 'Dire Dawa University', lat: 9.6133, lon: 41.8617 },
  { key: 'bus station', label: 'Dire Dawa Bus Station', lat: 9.6005, lon: 41.8398 },
  { key: 'railway station', label: 'Dire Dawa Railway Station', lat: 9.5998, lon: 41.8462 },
  { key: 'airport', label: 'Dire Dawa Airport', lat: 9.6247, lon: 41.8542 },
];

const driverIcon = L.divIcon({
  className: 'driver-marker',
  html: '<div style="background:#2563eb;color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">D</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const pickupIcon = L.divIcon({
  className: 'pickup-marker',
  html: '<div style="background:#16a34a;color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">P</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const dropoffIcon = L.divIcon({
  className: 'dropoff-marker',
  html: '<div style="background:#dc2626;color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">D</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const SERVICES = [
  { id: 'sedan', icon: FaCar, label: 'Sedan', color: '#2563eb' },
  { id: 'bike', icon: FaMotorcycle, label: 'Bike', color: '#f59e0b' },
  { id: 'tuktuk', icon: FaShuttleVan, label: 'Tuk Tuk', color: '#10b981' },
  { id: 'electric', icon: FaBolt, label: 'Electric', color: '#22c55e' },
  { id: 'minivan', icon: FaBus, label: 'Minivan', color: '#8b5cf6' },
  { id: 'minibus', icon: FaTruck, label: 'Minibus', color: '#ef4444' },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const DriverDashboard = () => {
  const { t } = useLanguage();
  const { user, setUser, emitLocationUpdate, newRideRequest, clearNewRideRequest, rideAccepted, clearRideAccepted, tripStatusUpdate, socket, chatUnread } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [rideRequests, setRideRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [stats, setStats] = useState({ totalTrips: 0, rating: 0, todayEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);
  const [watchId, setWatchId] = useState(null);
  const [mapCenter, setMapCenter] = useState([9.6009, 41.8508]);
  const [vehicleType, setVehicleType] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [serviceType, setServiceType] = useState('intra_city');
  const [intendedDestination, setIntendedDestination] = useState(user?.intendedDestination?.city || null);
  const [currentArea, setCurrentArea] = useState(user?.currentArea?.name || null);
  const [showReportSection, setShowReportSection] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [destinations, setDestinations] = useState(INTERCITY_DESTINATIONS);
  const [intraCityPlaces, setIntraCityPlaces] = useState(INTRA_CITY_PLACES);

  const [destSearch, setDestSearch] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);

  useEffect(() => {
    placesAPI.getAll({ type: 'intercity' }).then(res => {
      const places = (res.data.places || []).map(p => ({
        key: p.key, label: p.label || p.name, emoji: p.emoji || '', lat: p.coordinates.lat, lon: p.coordinates.lon
      }));
      if (places.length > 0) setDestinations(places);
    }).catch(() => {
      toast.info('Using offline destination data');
    });

    placesAPI.getAll({ type: 'intra_city' }).then(res => {
      const places = (res.data.places || []).map(p => ({
        key: p.key, label: p.label || p.name, lat: p.coordinates.lat, lon: p.coordinates.lon
      }));
      if (places.length > 0) setIntraCityPlaces(places);
    }).catch(() => {
      toast.info('Using offline area data');
    });
  }, []);

  const filterDestSuggestions = useCallback((query) => {
    if (query.length < 2) { setDestSuggestions([]); return; }
    const lower = query.toLowerCase();
    const matches = destinations.filter(d => d.label.toLowerCase().includes(lower) || d.key.includes(lower));
    setDestSuggestions(matches.slice(0, 6));
    setShowDestSuggestions(matches.length > 0);
  }, [destinations]);

  const filterAreaSuggestions = useCallback((query) => {
    if (query.length < 2) { setAreaSuggestions([]); return; }
    const lower = query.toLowerCase();
    const matches = intraCityPlaces.filter(p => p.label.toLowerCase().includes(lower) || p.key.includes(lower));
    setAreaSuggestions(matches.slice(0, 6));
    setShowAreaSuggestions(matches.length > 0);
  }, [intraCityPlaces]);

  useEffect(() => {
    if (user && typeof user.isOnline === 'boolean') {
      setIsOnline(user.isOnline);
      if (user.isOnline && !watchId && navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => emitLocationUpdate([pos.coords.longitude, pos.coords.latitude]),
          (err) => console.error('Geolocation error:', err),
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
        setWatchId(id);
      }
    }
  }, [user]);

  const loadNotifications = useCallback(() => {
    notificationsAPI.get({ limit: 20 }).then((res) => {
      const d = res.data || {};
      if (Array.isArray(d.notifications)) setNotifications(d.notifications);
    }).catch(() => {});
  }, []);

  const handleNotificationClick = useCallback(async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationsAPI.markRead(notification._id);
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch (_) {}
    }
    setShowNotifDropdown(false);
    const type = (notification.type || '').toLowerCase();
    if (type.includes('ride') || type.includes('trip')) {
      navigate('/driver/trips');
    } else if (type.includes('payment') || type.includes('wallet') || type.includes('earnings')) {
      navigate('/driver/earnings');
    } else if (type.includes('issue_resolved') || type.includes('incident')) {
      navigate('/driver');
    }
  }, [navigate]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    fetchData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  useEffect(() => {
    if (newRideRequest) {
      const rr = newRideRequest.rideRequest || newRideRequest;
      setRideRequests(prev => [rr, ...prev]);
      clearNewRideRequest();
    }
  }, [newRideRequest]);

  useEffect(() => {
    if (rideAccepted) {
      setActiveTrip(rideAccepted);
      setRideRequests(prev => prev.filter(r => r._id !== rideAccepted._id));
      clearRideAccepted();
    }
  }, [rideAccepted]);

  useEffect(() => {
    if (tripStatusUpdate && activeTrip?._id === tripStatusUpdate._id) {
      if (tripStatusUpdate.status === 'completed') {
        setActiveTrip(null);
        fetchData();
      } else {
        setActiveTrip(tripStatusUpdate);
      }
    }
  }, [tripStatusUpdate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activeTripsRes, completedTripsRes, earningsRes, vehicleRes] = await Promise.all([
        ridesAPI.driverTrips({ status: 'driver_arriving' }).catch(() => ({ data: { trips: [] } })),
        ridesAPI.driverTrips({ status: 'in_progress' }).catch(() => ({ data: { trips: [] } })),
        paymentsAPI.earnings().catch(() => ({ data: {} })),
        vehiclesAPI.getMy().catch(() => ({ data: {} }))
      ]);

      if (vehicleRes.data?.vehicle) {
        setVehicle(vehicleRes.data.vehicle);
        setVehicleType(vehicleRes.data.vehicle.serviceType || vehicleRes.data.vehicle.type);
      }

      const activeTrips = [...(activeTripsRes.data?.trips || []), ...(completedTripsRes.data?.trips || [])];
      const backendTrip = activeTrips.find(t => ['driver_arriving', 'driver_arrived', 'in_progress'].includes(t.status)) || null;
      const backendRides = activeTrips.filter(t => t.status === 'pending');

      const localRides = JSON.parse(localStorage.getItem('dirs_passenger_rides') || '[]');
      const pendingLocal = localRides.filter(r => ['pending', 'searching'].includes((r.status || '').toLowerCase()));
      const activeLocal = localRides.find(r => ['accepted', 'in_progress', 'driver_arriving', 'driver_found', 'ongoing'].includes((r.status || '').toLowerCase()));

      setActiveTrip(backendTrip || activeLocal || null);
      setRideRequests([...pendingLocal, ...backendRides]);

      if (earningsRes.data) {
        setEarnings({
          today: earningsRes.data.todayEarnings || earningsRes.data.today || 0,
          week: earningsRes.data.weekEarnings || earningsRes.data.week || 0,
          month: earningsRes.data.monthEarnings || earningsRes.data.month || 0
        });
        setStats({
          totalTrips: earningsRes.data.totalTrips || 0,
          rating: user?.averageRating || earningsRes.data.rating || 0,
          todayEarnings: earningsRes.data.todayEarnings || earningsRes.data.today || 0
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationChange = useCallback(async (dest) => {
    setIntendedDestination(dest?.key || null);
    setDestSearch('');
    setDestSuggestions([]);
    setShowDestSuggestions(false);
    try {
      await authAPI.updateDriverDestination(dest?.key || null);
      toast.success(dest ? `Destination set to ${dest.label}` : 'Destination cleared');
    } catch { toast.error('Failed to update destination'); }
  }, [toast]);

  const handleAreaChange = useCallback(async (area) => {
    setCurrentArea(area?.key || null);
    setAreaSearch('');
    setAreaSuggestions([]);
    setShowAreaSuggestions(false);
    try {
      await authAPI.updateDriverArea(area?.key || null, area ? [area.lat, area.lon] : null);
      toast.success(area ? `Area set to ${area.label}` : 'Area cleared');
    } catch { toast.error('Failed to update area'); }
  }, [toast]);

  const toggleOnline = useCallback(() => {
    const newStatus = !isOnline;
    if (newStatus && serviceType === 'intercity' && !intendedDestination) {
      toast.error('Please select a destination city before going online for intercity');
      return;
    }
    setIsOnline(newStatus);
    setUser(prev => prev ? { ...prev, isOnline: newStatus } : prev);
    const coords = mapCenter;
    authAPI.updateDriverStatus(newStatus, [coords[1], coords[0]], serviceType, intendedDestination, currentArea ? { name: currentArea } : null).catch(() => {});
    if (newStatus) {
      toast.success(`You are now ONLINE for ${serviceType === 'intra_city' ? 'Intra-City' : 'Intercity'} rides!`);
      fetchData();
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => emitLocationUpdate([pos.coords.longitude, pos.coords.latitude]),
          (err) => console.error('Geolocation error:', err),
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
        setWatchId(id);
      }
    } else {
      toast.info('You are now OFFLINE');
      if (watchId) { navigator.geolocation.clearWatch(watchId); setWatchId(null); }
    }
  }, [isOnline, watchId, emitLocationUpdate, toast, mapCenter, serviceType, intendedDestination, currentArea, setUser]);

  const handleAcceptRide = async (rideId) => {
    try {
      const res = await ridesAPI.accept(rideId).catch(() => null);
      const trip = res?.data?.trip;
      if (trip) {
        setActiveTrip(trip);
      } else {
        setActiveTrip({ _id: rideId, status: 'driver_arriving', passenger: { firstName: 'Passenger' } });
      }
      setRideRequests(prev => prev.filter(r => r._id !== rideId));
      toast.success('Ride Request Accepted! Proceeding to pickup location.');
    } catch (err) { setError(err.response?.data?.message || 'Failed to accept ride'); }
  };

  const handleDeclineRide = async (rideId) => {
    try {
      await ridesAPI.decline(rideId).catch(() => {});
      setRideRequests(prev => prev.filter(r => r._id !== rideId));
      toast.info('Ride Request Declined');
    } catch (err) { setError(err.response?.data?.message || 'Failed to decline ride'); }
  };

  const handleTripAction = async (action) => {
    if (!activeTrip) return;
    try {
      let res;
      if (action === 'start') res = await ridesAPI.start(activeTrip._id).catch(() => null);
      else if (action === 'arrival') res = await ridesAPI.confirmArrival(activeTrip._id).catch(() => null);
      else if (action === 'complete') res = await ridesAPI.complete(activeTrip._id).catch(() => null);

      const newStatusMap = { start: 'in_progress', arrival: 'driver_arrived', complete: 'completed' };
      const newStatus = newStatusMap[action] || 'completed';

      if (newStatus === 'completed') {
        setActiveTrip(null);
        toast.success(`Trip Completed! Payment recorded.`);
      } else {
        const updatedTrip = res?.data?.trip || { ...activeTrip, status: newStatus };
        setActiveTrip(updatedTrip);
        toast.success(`Status updated: ${newStatus}`);
      }
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update trip'); }
  };

  const getNextAction = () => {
    if (!activeTrip) return null;
    switch (activeTrip.status) {
      case 'driver_arriving': return { action: 'arrival', label: t('driver.confirmArrival') || 'Confirm Arrival' };
      case 'driver_arrived': return { action: 'start', label: t('driver.startTrip') || 'Start Trip' };
      case 'in_progress': return { action: 'complete', label: t('driver.completeTrip') || 'Complete Trip' };
      default: return { action: 'complete', label: t('driver.completeTrip') || 'Complete Trip' };
    }
  };

  const handleSOS = async () => {
    try {
      let location = null;
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        location = { coordinates: [pos.coords.longitude, pos.coords.latitude], address: '' };
      } catch (_) {}
      await sosAPI.trigger({ location, tripId: activeTrip?._id, description: 'SOS triggered by driver' });
      toast.warning('SOS alert sent!');
    } catch (err) {
      toast.error('Failed to send SOS');
    }
  };

  const REPORT_OPTIONS = [
    { key: 'passenger_misbehavior', label: 'Passenger behavior', icon: FaUserSlash },
    { key: 'safety_concern', label: 'Safety concern', icon: FaShieldAlt },
    { key: 'vehicle_damage', label: 'Vehicle damage', icon: FaCar },
    { key: 'payment_evasion', label: 'Payment evasion', icon: FaEllipsisH },
    { key: 'other', label: 'Other', icon: FaFlag },
  ];

  const handleReportIssue = async () => {
    if (!reportCategory) {
      toast.error('Please select an issue type');
      return;
    }
    setSubmittingReport(true);
    try {
      await reportAPI.create({
        tripId: activeTrip?._id,
        category: reportCategory,
        description: reportDescription,
        severity: reportCategory === 'passenger_misbehavior' ? 'high' : 'medium',
      });
      toast.success('Issue reported successfully.');
      setReportCategory('');
      setReportDescription('');
      setShowReportSection(false);
    } catch (err) {
      toast.error('Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="driver-page">
        <div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" />
      </div>
    );
  }

  const selectedRequest = rideRequests.length > 0 ? rideRequests[0] : null;

  return (
    <div className="driver-page">
      <div className="driver-logo-bar">
        <img src="/logo.svg?v=2" alt="DIRS - Dire Dawa Ride Sharing" className="driver-logo" />
      </div>

      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}

      <div className="driver-header-row">
        <div>
          <h1 className="driver-greeting">{getGreeting()} {user?.firstName || 'Driver'}</h1>
          <p className="driver-location"><FaMapMarkerAlt /> Dire Dawa, Ethiopia</p>
        </div>
        <button className="driver-bell-btn" onClick={() => { const next = !showNotifDropdown; setShowNotifDropdown(next); if (next) loadNotifications(); }}>
          <FaBell />
          {(rideRequests.length + notifications.filter(n => !n.isRead).length) > 0 && (
            <span className="bell-badge">{rideRequests.length + notifications.filter(n => !n.isRead).length}</span>
          )}
        </button>
        {showNotifDropdown && (
          <div className="driver-notif-dropdown" ref={notifRef}>
            <div className="driver-notif-header">
              <span>Notifications</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="driver-notif-unread" style={{ cursor: 'pointer' }} onClick={async () => {
                    try {
                      await notificationsAPI.markAllRead();
                      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    } catch (_) {}
                  }}>Mark all read</span>
                )}
              </div>
            </div>
            <div className="driver-notif-list">
              {rideRequests.length > 0 && (
                <div className="driver-notif-item driver-notif-item-unread" onClick={() => { setShowNotifDropdown(false); }}>
                  <span className="driver-notif-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}><FaCar /></span>
                  <div className="driver-notif-item-body">
                    <div className="driver-notif-item-title driver-notif-item-title-unread">New Ride Request</div>
                    <div className="driver-notif-item-msg">{rideRequests.length} ride request{rideRequests.length !== 1 ? 's' : ''} waiting</div>
                  </div>
                </div>
              )}
              {notifications.length === 0 && rideRequests.length === 0 ? (
                <div className="driver-notif-empty">No notifications</div>
              ) : (
                notifications.slice(0, 15).map(n => (
                  <div key={n._id || Math.random()} className={`driver-notif-item${n.isRead ? '' : ' driver-notif-item-unread'}`} onClick={() => handleNotificationClick(n)} style={{ cursor: 'pointer' }}>
                    <span className={`driver-notif-icon${n.isRead ? '' : ' driver-notif-icon-unread'}`}>
                      {(() => {
                        const type = (n.type || '').toLowerCase();
                        if (type.includes('sos') || type.includes('emergency')) return <FaExclamationTriangle />;
                        if (type.includes('payment') || type.includes('wallet') || type.includes('withdrawal') || type.includes('earnings')) return <FaMoneyBillWave />;
                        if (type.includes('ride') || type.includes('trip') || type.includes('driver') || type.includes('booking')) return <FaCar />;
                        if (type.includes('message') || type.includes('chat')) return <FaComment />;
                        if (type.includes('rating')) return <FaStar />;
                        if (type.includes('incident') || type.includes('issue')) return <FaShieldAlt />;
                        return <FaBell />;
                      })()}
                    </span>
                    <div className="driver-notif-item-body">
                      <div className={`driver-notif-item-title${n.isRead ? '' : ' driver-notif-item-title-unread'}`}>
                        {(n.type || 'notification').replace(/_/g, ' ')}
                      </div>
                      <div className="driver-notif-item-msg">{n.message || n.title || ''}</div>
                      {n.createdAt && (
                        <div className="driver-notif-item-time">{new Date(n.createdAt).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="driver-notif-footer" onClick={() => { setShowNotifDropdown(false); }}>
              Dismiss
            </div>
          </div>
        )}
      </div>

      <div className="driver-online-row">
        <button className={`driver-online-toggle ${isOnline ? 'online' : 'offline'}`} onClick={toggleOnline}>
          <FaPowerOff />
          {isOnline ? t('driver.online') || 'Online' : t('driver.offline') || 'Offline'}
        </button>
        {isOnline && (
          <div className="driver-online-stats">
            <span><FaMoneyBillWave /> ETB {earnings.today?.toFixed(0) || 0}</span>
            <span><FaStar /> {stats.rating?.toFixed(1) || 'N/A'}</span>
          </div>
        )}
      </div>

      {isOnline && (
        <div className="driver-service-type-picker" style={{ marginBottom: 16 }}>
          <p className="destination-label" style={{ marginBottom: 8 }}>
            <FaCar /> Service Type
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`destination-chip ${serviceType === 'intra_city' ? 'active' : ''}`}
              onClick={() => setServiceType('intra_city')}
              style={{ flex: 1 }}
            >
              <span>Intra-City</span>
            </button>
            <button
              className={`destination-chip ${serviceType === 'intercity' ? 'active' : ''}`}
              onClick={() => setServiceType('intercity')}
              style={{ flex: 1 }}
            >
              <span>Intercity</span>
            </button>
          </div>
        </div>
      )}

      {isOnline && serviceType === 'intra_city' && (
        <div className="driver-destination-picker">
          <p className="destination-label">
            <FaMapMarkerAlt /> Where are you based? (Area)
          </p>
          {currentArea && (
            <div className="driver-area-active">
              <span className="driver-area-active-label">{intraCityPlaces.find(p => p.key === currentArea)?.label || currentArea}</span>
              <button className="driver-area-clear" onClick={() => handleAreaChange(null)}>
                <FaTimesCircle /> Clear
              </button>
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <div className="driver-search-input-wrap">
              <FaSearch className="driver-search-icon" />
              <input
                type="text"
                className="driver-search-input"
                placeholder="Search your area..."
                value={areaSearch}
                onChange={(e) => { setAreaSearch(e.target.value); filterAreaSuggestions(e.target.value); }}
                onFocus={() => { if (areaSearch.length >= 2) filterAreaSuggestions(areaSearch); }}
                onBlur={() => setTimeout(() => setShowAreaSuggestions(false), 200)}
              />
              {areaSearch && (
                <button className="driver-search-clear" onClick={() => { setAreaSearch(''); setAreaSuggestions([]); setShowAreaSuggestions(false); }}>
                  <FaTimes />
                </button>
              )}
            </div>
            {showAreaSuggestions && areaSuggestions.length > 0 && (
              <div className="driver-search-dropdown">
                {areaSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className={`driver-search-item ${currentArea === s.key ? 'active' : ''}`}
                    onMouseDown={() => handleAreaChange(s)}
                  >
                    <FaMapMarkerAlt className="driver-search-item-icon" />
                    <span>{s.label}</span>
                    {currentArea === s.key && <FaCheck className="driver-search-item-check" />}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="destination-grid" style={{ marginTop: 8 }}>
            {intraCityPlaces.slice(0, 6).map(place => (
              <button
                key={place.key}
                className={`destination-chip ${currentArea === place.key ? 'active' : ''}`}
                onClick={() => handleAreaChange(currentArea === place.key ? null : place)}
              >
                <span>{place.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOnline && serviceType === 'intercity' && (
        <div className="driver-destination-picker">
          <p className="destination-label">
            <FaMapMarkerAlt /> Where are you heading? (Intercity)
          </p>
          {intendedDestination && (
            <div className="driver-area-active">
              <span className="driver-area-active-label">
                {destinations.find(d => d.key === intendedDestination)?.emoji} {destinations.find(d => d.key === intendedDestination)?.label || intendedDestination}
              </span>
              <button className="driver-area-clear" onClick={() => handleDestinationChange(null)}>
                <FaTimesCircle /> Clear
              </button>
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <div className="driver-search-input-wrap">
              <FaSearch className="driver-search-icon" />
              <input
                type="text"
                className="driver-search-input"
                placeholder="Search destination city..."
                value={destSearch}
                onChange={(e) => { setDestSearch(e.target.value); filterDestSuggestions(e.target.value); }}
                onFocus={() => { if (destSearch.length >= 2) filterDestSuggestions(destSearch); }}
                onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
              />
              {destSearch && (
                <button className="driver-search-clear" onClick={() => { setDestSearch(''); setDestSuggestions([]); setShowDestSuggestions(false); }}>
                  <FaTimes />
                </button>
              )}
            </div>
            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="driver-search-dropdown">
                {destSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className={`driver-search-item ${intendedDestination === s.key ? 'active' : ''}`}
                    onMouseDown={() => handleDestinationChange(s)}
                  >
                    <FaMapMarkerAlt className="driver-search-item-icon" />
                    <span>{s.emoji} {s.label}</span>
                    {intendedDestination === s.key && <FaCheck className="driver-search-item-check" />}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="destination-grid" style={{ marginTop: 8 }}>
            {destinations.map(dest => (
              <button
                key={dest.key}
                className={`destination-chip ${intendedDestination === dest.key ? 'active' : ''}`}
                onClick={() => handleDestinationChange(intendedDestination === dest.key ? null : dest)}
              >
                <span className="dest-emoji">{dest.emoji}</span>
                <span>{dest.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="driver-map-container">
        <FlexibleMap
          center={
            activeTrip?.pickup?.coordinates ||
            selectedRequest?.pickup?.coordinates ||
            mapCenter
          }
          zoom={(activeTrip || selectedRequest) ? 15 : 14}
          defaultHeight="280px"
          markers={[
            { position: mapCenter, icon: driverIcon, popup: 'My Position' },
            ...(activeTrip?.pickup?.coordinates ? [{ position: activeTrip.pickup.coordinates, icon: pickupIcon, popup: 'Pickup' }] : []),
            ...(activeTrip?.dropoff?.coordinates ? [{ position: activeTrip.dropoff.coordinates, icon: dropoffIcon, popup: 'Dropoff' }] : []),
            ...(!activeTrip && selectedRequest?.pickup?.coordinates ? [{ position: selectedRequest.pickup.coordinates, icon: pickupIcon, popup: 'Pickup' }] : []),
            ...(!activeTrip && selectedRequest?.dropoff?.coordinates ? [{ position: selectedRequest.dropoff.coordinates, icon: dropoffIcon, popup: 'Dropoff' }] : []),
          ]}
          polylinePoints={
            activeTrip?.pickup?.coordinates && activeTrip?.dropoff?.coordinates
              ? [activeTrip.pickup.coordinates, activeTrip.dropoff.coordinates]
              : !activeTrip && selectedRequest?.pickup?.coordinates && selectedRequest?.dropoff?.coordinates
                ? [selectedRequest.pickup.coordinates, selectedRequest.dropoff.coordinates]
                : null
          }
          showControls={true}
        />
      </div>

      {vehicle ? (
        <div className="driver-vehicle-card" onClick={() => navigate('/driver/vehicle')} style={{ cursor: 'pointer' }}>
          <div className="vehicle-card-left">
            <div className="vehicle-card-icon">
              <FaCar />
            </div>
            <div className="vehicle-card-info">
              <h3>{vehicle.make} {vehicle.model}</h3>
              <p>{vehicle.color} • {vehicle.year}</p>
              <span className="vehicle-plate">{vehicle.plateNumber}</span>
            </div>
          </div>
          <div className="vehicle-card-right">
            <span className={`vehicle-status-badge ${vehicle.status || 'active'}`}>
              {vehicle.status === 'approved' ? 'Active' : vehicle.status === 'pending' ? 'Pending' : 'Active'}
            </span>
            <FaChevronRight style={{ color: 'var(--text-muted)', fontSize: 14 }} />
          </div>
        </div>
      ) : (
        <div className="driver-vehicle-card empty" onClick={() => navigate('/driver/vehicle')} style={{ cursor: 'pointer' }}>
          <div className="vehicle-card-left">
            <div className="vehicle-card-icon empty-icon">
              <FaCar />
            </div>
            <div className="vehicle-card-info">
              <h3>No Vehicle Registered</h3>
              <p>Add your vehicle to start accepting rides</p>
            </div>
          </div>
          <FaChevronRight style={{ color: 'var(--text-muted)', fontSize: 14 }} />
        </div>
      )}

      {activeTrip && (
        <div className="driver-active-section">
          <h2 className="driver-section-title"><FaCar /> {t('driver.currentTrip') || 'Current Trip'}</h2>
          <Card className="driver-active-card" padding="md">
            <div className="trip-passenger-info">
              <div className="passenger-avatar">
                {activeTrip.passenger?.firstName?.[0]}{activeTrip.passenger?.lastName?.[0]}
              </div>
              <div className="passenger-details">
                <h4>{activeTrip.passenger?.firstName} {activeTrip.passenger?.lastName}</h4>
                <div className="passenger-rating"><FaStar /> {activeTrip.passenger?.rating?.average?.toFixed(1) || 'N/A'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="call-btn"
                  style={{ position: 'relative' }}
                  onClick={() => setChatOpen(true)}
                  title="Chat with passenger"
                >
                  <FaComment />
                  {chatUnread[activeTrip._id] > 0 && (
                    <span className="chat-unread-badge" style={{ position: 'absolute', top: -6, right: -6 }}>{chatUnread[activeTrip._id]}</span>
                  )}
                </button>
                <a href={`tel:${activeTrip.passenger?.phoneNumber}`} className="call-btn"><FaPhone /></a>
              </div>
            </div>
            <div className="trip-route-display">
              <div className="route-point"><div className="route-dot pickup" /><span>{activeTrip.pickup?.address || 'Pickup'}</span></div>
              <div className="route-connector"><div className="connector-line" /></div>
              <div className="route-point"><div className="route-dot dropoff" /><span>{activeTrip.dropoff?.address || 'Dropoff'}</span></div>
            </div>
            <div className="trip-earnings">
              <span><FaMoneyBillWave /> {t('driver.earnings') || 'Earnings'}</span>
              <span>{activeTrip.fare?.totalFare || activeTrip.fare?.total || 0} ETB</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
              <button
                type="button"
                style={{ flex: 1, padding: '8px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => {
                  const addr = encodeURIComponent(activeTrip.dropoff?.address || activeTrip.pickup?.address || 'Dire Dawa');
                  window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
                }}
              >
                Open Google Maps
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: '8px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => {
                  const addr = encodeURIComponent(activeTrip.dropoff?.address || activeTrip.pickup?.address || 'Dire Dawa');
                  window.open(`https://waze.com/ul?q=${addr}&navigate=yes`, '_blank');
                }}
              >
                Open Waze
              </button>
            </div>

            {(() => {
              const nextAction = getNextAction();
              if (!nextAction) return null;
              return (
                <button 
                  className="driver-action-btn" 
                  onClick={() => handleTripAction(nextAction.action)}
                  style={{ marginTop: 12 }}
                >
                  <FaCheck />
                  {nextAction.label}
                </button>
              );
            })()}

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={handleSOS}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <FaExclamationTriangle /> SOS
              </button>
              <button
                onClick={() => setShowReportSection(!showReportSection)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <FaFlag /> Report Issue
              </button>
            </div>

            {showReportSection && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary, #f9fafb)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {REPORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setReportCategory(opt.key)}
                      style={{
                        padding: '6px 12px', borderRadius: 16, border: reportCategory === opt.key ? 'none' : '1px solid #e5e7eb',
                        background: reportCategory === opt.key ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'white',
                        color: reportCategory === opt.key ? 'white' : '#6b7280',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <opt.icon /> {opt.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-light)', minHeight: 60, fontSize: 12, resize: 'vertical', background: 'white', color: 'var(--text)', boxSizing: 'border-box' }}
                />
                <button
                  onClick={handleReportIssue}
                  disabled={submittingReport || !reportCategory}
                  style={{ marginTop: 8, width: '100%', padding: 8, borderRadius: 8, border: 'none', background: submittingReport || !reportCategory ? '#9ca3af' : '#3b82f6', color: 'white', fontSize: 12, fontWeight: 600, cursor: submittingReport || !reportCategory ? 'not-allowed' : 'pointer' }}
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {rideRequests.length > 0 && (
        <div className="driver-requests-section">
          <h2 className="driver-section-title">{t('driver.newRequests') || 'New Requests'}</h2>
          {rideRequests.map(ride => (
            <Card key={ride._id} className="driver-request-card" padding="md" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '8px 12px', borderRadius: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>Incoming Ride Request</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '10px' }}>
                  15s Auto-Decline
                </span>
              </div>
              <div className="request-header">
                <div className="request-passenger">
                  <div className="passenger-avatar">{ride.passenger?.firstName?.[0]}{ride.passenger?.lastName?.[0]}</div>
                  <div>
                    <h4>{ride.passenger?.firstName} {ride.passenger?.lastName}</h4>
                    <div className="passenger-rating"><FaStar /> {ride.passenger?.rating?.average?.toFixed(1) || 'N/A'}</div>
                  </div>
                </div>
                <div className="request-fare">
                  <span className="fare-amount">{ride.fare?.totalFare || ride.fare?.total || 0} ETB</span>
                  <span className="fare-distance">{ride.distance?.toFixed(1)} km</span>
                </div>
              </div>
              <div className="request-route">
                <div className="route-point"><div className="route-dot pickup" /><span>{ride.pickup?.address || 'Pickup'}</span></div>
                <div className="route-connector"><div className="connector-line" /></div>
                <div className="route-point"><div className="route-dot dropoff" /><span>{ride.dropoff?.address || 'Dropoff'}</span></div>
              </div>
              <div className="request-actions">
                <button className="driver-btn-decline" onClick={() => handleDeclineRide(ride._id)}><FaTimes /> Decline</button>
                <button className="driver-btn-accept" onClick={() => handleAcceptRide(ride._id)}><FaCheck /> {t('driver.accept') || 'Accept (15s)'}</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="driver-earnings-section">
        <h2 className="driver-section-title"><FaMoneyBillWave /> {t('driver.earnings') || 'Earnings'}</h2>
        <div className="driver-earnings-grid">
          <div className="driver-earnings-card">
            <span className="earnings-period"><FaClock /> Today</span>
            <span className="earnings-value">ETB {earnings.today?.toFixed(0) || 0}</span>
          </div>
          <div className="driver-earnings-card">
            <span className="earnings-period"><FaRoad /> Week</span>
            <span className="earnings-value">ETB {earnings.week?.toFixed(0) || 0}</span>
          </div>
          <div className="driver-earnings-card">
            <span className="earnings-period"><FaMoneyBillWave /> Month</span>
            <span className="earnings-value">ETB {earnings.month?.toFixed(0) || 0}</span>
          </div>
        </div>
      </div>

      {activeTrip && (
        <InAppChat
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          tripId={activeTrip._id}
          driverName={`${activeTrip.passenger?.firstName || ''} ${activeTrip.passenger?.lastName || ''}`.trim() || 'Passenger'}
          socket={socket}
          role="driver"
          tripStatus={activeTrip.status}
          route={activeTrip.pickup?.address && activeTrip.dropoff?.address ? `${activeTrip.pickup.address} → ${activeTrip.dropoff.address}` : ''}
        />
      )}

    </div>
  );
};

export default DriverDashboard;

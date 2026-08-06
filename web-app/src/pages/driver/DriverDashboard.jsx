import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, paymentsAPI } from '../../services/api';
import { Card } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import {
  FaCar, FaPowerOff, FaMapMarkerAlt, FaPhone, FaCheck, FaTimes,
  FaStar, FaMoneyBillWave, FaClock, FaRoad, FaBell, FaSearch,
  FaMotorcycle, FaShuttleVan, FaBus, FaTruck, FaBolt,
  FaHome, FaListUl, FaWallet, FaCog
} from 'react-icons/fa';
import FlexibleMap from '../../components/common/FlexibleMap';
import './Driver.css';

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
  const { user, emitLocationUpdate, newRideRequest, clearNewRideRequest, rideAccepted, clearRideAccepted, tripStatusUpdate } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isOnline, setIsOnline] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [stats, setStats] = useState({ totalTrips: 0, rating: 0, todayEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    fetchData();
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  useEffect(() => {
    if (newRideRequest) {
      setRideRequests(prev => [newRideRequest, ...prev]);
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
      const [tripsRes, earningsRes] = await Promise.all([
        ridesAPI.driverTrips({ status: 'ongoing' }),
        paymentsAPI.earnings()
      ]);
      if (tripsRes.data?.trip) setActiveTrip(tripsRes.data.trip);
      if (tripsRes.data?.availableRides) setRideRequests(tripsRes.data.availableRides);
      if (earningsRes.data) {
        setEarnings({
          today: earningsRes.data.today || 0,
          week: earningsRes.data.week || 0,
          month: earningsRes.data.month || 0
        });
        setStats({
          totalTrips: earningsRes.data.totalTrips || 0,
          rating: earningsRes.data.rating || 0,
          todayEarnings: earningsRes.data.today || 0
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = useCallback(() => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    if (newStatus) {
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => emitLocationUpdate([pos.coords.longitude, pos.coords.latitude]),
          (err) => console.error('Geolocation error:', err),
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
        setWatchId(id);
      }
    } else {
      if (watchId) { navigator.geolocation.clearWatch(watchId); setWatchId(null); }
    }
  }, [isOnline, watchId, emitLocationUpdate]);

  const handleAcceptRide = async (rideId) => {
    try { await ridesAPI.accept(rideId); setRideRequests(prev => prev.filter(r => r._id !== rideId)); }
    catch (err) { setError(err.response?.data?.message || 'Failed to accept ride'); }
  };

  const handleDeclineRide = async (rideId) => {
    try { await ridesAPI.decline(rideId); setRideRequests(prev => prev.filter(r => r._id !== rideId)); }
    catch (err) { setError(err.response?.data?.message || 'Failed to decline ride'); }
  };

  const handleTripAction = async (action) => {
    if (!activeTrip) return;
    try {
      if (action === 'start') await ridesAPI.start(activeTrip._id);
      else if (action === 'arrival') await ridesAPI.confirmArrival(activeTrip._id);
      else if (action === 'complete') await ridesAPI.complete(activeTrip._id);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update trip'); }
  };

  const getNextAction = () => {
    if (!activeTrip) return null;
    switch (activeTrip.status) {
      case 'accepted': return { action: 'start', label: t('driver.startTrip') || 'Start Trip' };
      case 'arrived': return { action: 'complete', label: t('driver.completeTrip') || 'Complete Trip' };
      case 'ongoing': return { action: 'arrival', label: t('driver.confirmArrival') || 'Confirm Arrival' };
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="driver-page">
        <div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" />
      </div>
    );
  }

  return (
    <div className="driver-page">
      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}

      <div className="driver-header-row">
        <div>
          <h1 className="driver-greeting">{getGreeting()} {user?.firstName || 'Driver'}</h1>
          <p className="driver-location"><FaMapMarkerAlt /> Dire Dawa, Ethiopia</p>
        </div>
        <button className="driver-bell-btn">
          <FaBell />
          {rideRequests.length > 0 && <span className="bell-badge">{rideRequests.length}</span>}
        </button>
      </div>

      <div className="driver-search-bar">
        <FaSearch className="search-icon" />
        <input
          className="search-input"
          type="text"
          placeholder={t('passenger.whereTo') || 'Where are you going?'}
        />
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

      <div style={{ margin: '14px 0' }}>
        <FlexibleMap
          center={[9.6009, 41.8508]}
          zoom={14}
          defaultHeight="260px"
          markers={[
            { position: [9.6009, 41.8508], popup: 'Driver Current Position' },
            ...(activeTrip?.pickup?.coordinates ? [{ position: activeTrip.pickup.coordinates, popup: 'Passenger Pickup' }] : []),
            ...(activeTrip?.dropoff?.coordinates ? [{ position: activeTrip.dropoff.coordinates, popup: 'Passenger Dropoff' }] : [])
          ]}
          polylinePoints={activeTrip?.pickup?.coordinates && activeTrip?.dropoff?.coordinates ? [activeTrip.pickup.coordinates, activeTrip.dropoff.coordinates] : null}
          showControls={true}
        />
      </div>

      <h2 className="driver-section-title">All Services</h2>
      <div className="driver-services-grid">
        {SERVICES.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="driver-service-card">
              <div className="service-card-icon" style={{ color: s.color }}>
                <Icon />
              </div>
              <span className="service-card-label">{s.label}</span>
            </div>
          );
        })}
      </div>

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
              <a href={`tel:${activeTrip.passenger?.phoneNumber}`} className="call-btn"><FaPhone /></a>
            </div>
            <div className="trip-route-display">
              <div className="route-point"><div className="route-dot pickup" /><span>{activeTrip.pickup?.address || 'Pickup'}</span></div>
              <div className="route-connector"><div className="connector-line" /></div>
              <div className="route-point"><div className="route-dot dropoff" /><span>{activeTrip.dropoff?.address || 'Dropoff'}</span></div>
            </div>
            <div className="trip-earnings">
              <span><FaMoneyBillWave /> {t('driver.earnings') || 'Earnings'}</span>
              <span>{activeTrip.fare?.total || activeTrip.fare || 0} ETB</span>
            </div>
            {getNextAction() && (
              <button className="driver-action-btn" onClick={() => handleTripAction(getNextAction().action)}>
                {getNextAction().action === 'start' && <FaCar />}
                {getNextAction().action === 'arrival' && <FaMapMarkerAlt />}
                {getNextAction().action === 'complete' && <FaCheck />}
                {getNextAction().label}
              </button>
            )}
          </Card>
        </div>
      )}

      {rideRequests.length > 0 && (
        <div className="driver-requests-section">
          <h2 className="driver-section-title">{t('driver.newRequests') || 'New Requests'}</h2>
          {rideRequests.map(ride => (
            <Card key={ride._id} className="driver-request-card" padding="md">
              <div className="request-header">
                <div className="request-passenger">
                  <div className="passenger-avatar">{ride.passenger?.firstName?.[0]}{ride.passenger?.lastName?.[0]}</div>
                  <div>
                    <h4>{ride.passenger?.firstName} {ride.passenger?.lastName}</h4>
                    <div className="passenger-rating"><FaStar /> {ride.passenger?.rating?.average?.toFixed(1) || 'N/A'}</div>
                  </div>
                </div>
                <div className="request-fare">
                  <span className="fare-amount">{ride.fare?.total || ride.fare || 0} ETB</span>
                  <span className="fare-distance">{ride.distance?.toFixed(1)} km</span>
                </div>
              </div>
              <div className="request-route">
                <div className="route-point"><div className="route-dot pickup" /><span>{ride.pickup?.address || 'Pickup'}</span></div>
                <div className="route-connector"><div className="connector-line" /></div>
                <div className="route-point"><div className="route-dot dropoff" /><span>{ride.dropoff?.address || 'Dropoff'}</span></div>
              </div>
              <div className="request-actions">
                <button className="driver-btn-decline" onClick={() => handleDeclineRide(ride._id)}><FaTimes /></button>
                <button className="driver-btn-accept" onClick={() => handleAcceptRide(ride._id)}><FaCheck /> {t('driver.accept') || 'Accept'}</button>
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

      <div className="driver-bottom-nav">
        <button className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <FaHome /><span>Home</span>
        </button>
        <button className={`bottom-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => navigate('/driver/trips')}>
          <FaListUl /><span>Orders</span>
        </button>
        <button className={`bottom-nav-item ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => navigate('/driver/earnings')}>
          <FaWallet /><span>Wallet</span>
        </button>
        <button className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => navigate('/driver/profile')}>
          <FaCog /><span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default DriverDashboard;

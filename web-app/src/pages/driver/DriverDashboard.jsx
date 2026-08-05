import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, paymentsAPI } from '../../services/api';
import { Card } from '../../components/common';
import { FaCar, FaPowerOff, FaMapMarkerAlt, FaPhone, FaCheck, FaTimes, FaStar, FaMoneyBillWave, FaClock, FaRoad } from 'react-icons/fa';
import './Driver.css';

const DriverDashboard = () => {
  const { t } = useLanguage();
  const { user, socket, emitLocationUpdate, newRideRequest, clearNewRideRequest, rideAccepted, clearRideAccepted, tripStatusUpdate } = useAuth();

  const [isOnline, setIsOnline] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [stats, setStats] = useState({ totalTrips: 0, rating: 0, todayEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
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

      if (tripsRes.data?.trip) {
        setActiveTrip(tripsRes.data.trip);
      }

      if (tripsRes.data?.availableRides) {
        setRideRequests(tripsRes.data.availableRides);
      }

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
          (position) => {
            const { latitude, longitude } = position.coords;
            emitLocationUpdate([longitude, latitude]);
          },
          (err) => console.error('Geolocation error:', err),
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
        setWatchId(id);
      }
    } else {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    }
  }, [isOnline, watchId, emitLocationUpdate]);

  const handleAcceptRide = async (rideId) => {
    try {
      await ridesAPI.accept(rideId);
      setRideRequests(prev => prev.filter(r => r._id !== rideId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept ride');
    }
  };

  const handleDeclineRide = async (rideId) => {
    try {
      await ridesAPI.decline(rideId);
      setRideRequests(prev => prev.filter(r => r._id !== rideId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline ride');
    }
  };

  const handleTripAction = async (action) => {
    if (!activeTrip) return;
    try {
      if (action === 'start') {
        await ridesAPI.start(activeTrip._id);
      } else if (action === 'arrival') {
        await ridesAPI.confirmArrival(activeTrip._id);
      } else if (action === 'complete') {
        await ridesAPI.complete(activeTrip._id);
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update trip');
    }
  };

  const getNextAction = () => {
    if (!activeTrip) return null;
    switch (activeTrip.status) {
      case 'accepted': return { action: 'start', label: t('driver.startTrip') };
      case 'arrived': return { action: 'complete', label: t('driver.completeTrip') };
      case 'ongoing': return { action: 'arrival', label: t('driver.confirmArrival') };
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="driver-page">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    );
  }

  return (
    <div className="driver-page">
      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}

      <div className="driver-hero-banner">
        <img src="/images/city-transport.jpg" alt="Driver dashboard" className="driver-hero-bg" />
        <div className="driver-hero-overlay">
          <div>
            <h1 className="page-title" style={{color:'white'}}>{user?.firstName} {user?.lastName}</h1>
            <p className="page-subtitle" style={{color:'rgba(255,255,255,0.85)'}}>{isOnline ? t('driver.online') : t('driver.offline')}</p>
          </div>
          <button className={`online-toggle ${isOnline ? 'online' : 'offline'}`} onClick={toggleOnline}>
            <FaPowerOff />
            {isOnline ? t('driver.online') : t('driver.offline')}
          </button>
        </div>
      </div>

      {!isOnline && !activeTrip && (
        <Card className="active-trip-section" padding="lg">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('driver.goOnline')}</p>
        </Card>
      )}

      {rideRequests.length > 0 && (
        <div className="ride-requests-section">
          <h2 className="section-title">{t('driver.newRequests')}</h2>
          {rideRequests.map((ride) => (
            <Card key={ride._id} className="ride-request-card" padding="md">
              <div className="request-header">
                <div className="request-passenger">
                  <div className="passenger-avatar">
                    {ride.passenger?.firstName?.[0]}{ride.passenger?.lastName?.[0]}
                  </div>
                  <div>
                    <h4>{ride.passenger?.firstName} {ride.passenger?.lastName}</h4>
                    <div className="passenger-rating">
                      <FaStar /> {ride.passenger?.rating?.average?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="request-fare">
                  <span className="fare-amount">{ride.fare?.total || ride.fare || 0} ETB</span>
                  <span className="fare-distance">{ride.distance?.toFixed(1)} km</span>
                </div>
              </div>

              <div className="request-route">
                <div className="route-point">
                  <div className="route-dot pickup" />
                  <span>{ride.pickup?.address || 'Pickup Location'}</span>
                </div>
                <div className="route-connector">
                  <div className="connector-line" />
                  <span className="connector-distance">{ride.distance?.toFixed(1)} km</span>
                </div>
                <div className="route-point">
                  <div className="route-dot dropoff" />
                  <span>{ride.dropoff?.address || 'Dropoff Location'}</span>
                </div>
              </div>

              <div className="request-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => handleDeclineRide(ride._id)}>
                  <FaTimes /> {t('driver.decline')}
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => handleAcceptRide(ride._id)}>
                  <FaCheck /> {t('driver.accept')}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTrip && (
        <div className="active-trip-section">
          <h2 className="section-title">{t('driver.currentTrip')}</h2>
          <Card className="active-trip-card" padding="md">
            <div className="trip-passenger-info">
              <div className="passenger-avatar">
                {activeTrip.passenger?.firstName?.[0]}{activeTrip.passenger?.lastName?.[0]}
              </div>
              <div className="passenger-details">
                <h4>{activeTrip.passenger?.firstName} {activeTrip.passenger?.lastName}</h4>
                <div className="passenger-rating">
                  <FaStar /> {activeTrip.passenger?.rating?.average?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <a href={`tel:${activeTrip.passenger?.phoneNumber}`} className="call-btn">
                <FaPhone /> {t('common.call')}
              </a>
            </div>

            <div className="trip-route-display">
              <div className="route-point">
                <div className="route-dot pickup" />
                <div>
                  <span className="route-label">{t('passenger.pickup')}</span>
                  <span className="route-address">{activeTrip.pickup?.address}</span>
                </div>
              </div>
              <div className="route-connector">
                <div className="connector-line" />
              </div>
              <div className="route-point">
                <div className="route-dot dropoff" />
                <div>
                  <span className="route-label">{t('passenger.dropoff')}</span>
                  <span className="route-address">{activeTrip.dropoff?.address}</span>
                </div>
              </div>
            </div>

            <div className="trip-earnings">
              <span><FaMoneyBillWave /> {t('driver.earnings')}</span>
              <span>{activeTrip.fare?.total || activeTrip.fare || 0} ETB</span>
            </div>

            {getNextAction() && (
              <div className="trip-actions">
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleTripAction(getNextAction().action)}
                >
                  {getNextAction().action === 'start' && <FaCar />}
                  {getNextAction().action === 'arrival' && <FaMapMarkerAlt />}
                  {getNextAction().action === 'complete' && <FaCheck />}
                  {getNextAction().label}
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="earnings-section">
        <h2 className="section-title">{t('driver.earnings')}</h2>
        <div className="earnings-cards">
          <Card className="earnings-card today" padding="md">
            <span className="earnings-period"><FaClock /> Today</span>
            <span className="earnings-value">{earnings.today?.toFixed(0)} ETB</span>
          </Card>
          <Card className="earnings-card week" padding="md">
            <span className="earnings-period"><FaRoad /> This Week</span>
            <span className="earnings-value">{earnings.week?.toFixed(0)} ETB</span>
          </Card>
          <Card className="earnings-card month" padding="md">
            <span className="earnings-period"><FaMoneyBillWave /> This Month</span>
            <span className="earnings-value">{earnings.month?.toFixed(0)} ETB</span>
          </Card>
        </div>
      </div>

      <div className="quick-stats">
        <Card padding="md">
          <div className="stat-item">
            <FaMoneyBillWave className="stat-icon" />
            <div>
              <span className="stat-label">{t('driver.todayEarnings')}</span>
              <span className="stat-value">{stats.todayEarnings?.toFixed(0)} ETB</span>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="stat-item">
            <FaCar className="stat-icon" />
            <div>
              <span className="stat-label">{t('driver.totalTrips')}</span>
              <span className="stat-value">{stats.totalTrips}</span>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="stat-item">
            <FaStar className="stat-icon" />
            <div>
              <span className="stat-label">{t('driver.rating')}</span>
              <span className="stat-value">{stats.rating?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;

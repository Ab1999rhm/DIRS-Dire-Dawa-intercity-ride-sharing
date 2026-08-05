import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaMapMarkerAlt, FaCreditCard, FaStar, FaHistory, FaExclamationTriangle, FaExchangeAlt, FaClock, FaMoneyBillWave, FaPhone, FaRoute, FaWallet, FaUserShield, FaUsers, FaMobileAlt } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, paymentsAPI } from '../../services/api';
import { Card, StatCard, Button, Badge, StatusBadge } from '../../components/common';
import { EmptyStateIllustration, MapPlaceholder } from '../../components/common/Backgrounds';
import { useToast } from '../../components/common/Toast';
import './Passenger.css';

const VEHICLES = [
  { id: 'bajaj', icon: '🛺', nameKey: 'bajaj', capacity: 3, priceKm: 15, priceMin: 2, baseFare: 25, eta: '3-5' },
  { id: 'minivan', icon: '🚐', nameKey: 'minivan', capacity: 7, priceKm: 25, priceMin: 3, baseFare: 50, eta: '5-8' },
  { id: 'sedan', icon: '🚗', nameKey: 'sedan', capacity: 4, priceKm: 30, priceMin: 4, baseFare: 60, eta: '4-7' },
  { id: 'bus', icon: '🚌', nameKey: 'bus', capacity: 14, priceKm: 12, priceMin: 1.5, baseFare: 40, eta: '8-12' },
];

const PassengerHome = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [rideType, setRideType] = useState('intraCity');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [rideState, setRideState] = useState('idle');
  const [activeRide, setActiveRide] = useState(null);
  const [completedRide, setCompletedRide] = useState(null);
  const [rating, setRating] = useState(0);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalTrips: 0, totalSpent: 0, favoriteRoutes: 0 });
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchRecentTrips();
    fetchStats();
  }, []);

  const fetchRecentTrips = async () => {
    try {
      const res = await ridesAPI.passengerTrips({ limit: 3, status: 'completed' });
      setRecentTrips(res.data.trips || []);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await ridesAPI.passengerTrips({ limit: 100 });
      const trips = res.data.trips || [];
      const totalSpent = trips.reduce((sum, t) => sum + (t.fare?.total || t.fare || 0), 0);
      const uniqueRoutes = new Set(trips.map(t => `${t.pickupLocation?.address}-${t.dropoffLocation?.address}`)).size;
      setStats({ totalTrips: trips.length, totalSpent, favoriteRoutes: uniqueRoutes });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const swapLocations = () => {
    setPickup(dropoff);
    setDropoff(pickup);
  };

  const calcFare = (vehicle) => {
    if (!vehicle) return { base: 0, distance: 0, time: 0, platform: 0, total: 0 };
    const base = vehicle.baseFare;
    const distance = vehicle.priceKm * 5;
    const time = vehicle.priceMin * 15;
    const platform = Math.round((base + distance + time) * 0.1);
    return { base, distance, time, platform, total: base + distance + time + platform };
  };

  const handleBookRide = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      toast.error(t('passenger.whereTo') || 'Please enter pickup and dropoff locations');
      return;
    }
    if (!selectedVehicle) {
      toast.error(t('passenger.selectVehicle') || 'Please select a vehicle');
      return;
    }

    setLoading(true);
    setRideState('searching');

    try {
      const fare = calcFare(selectedVehicle);
      const res = await ridesAPI.create({
        pickupLocation: { address: pickup, coordinates: [9.6, 41.6] },
        dropoffLocation: { address: dropoff, coordinates: [9.0, 40.5] },
        rideType,
        vehicleType: selectedVehicle.id,
        paymentMethod,
        estimatedFare: fare.total,
      });
      setActiveRide(res.data.ride || { _id: 'demo', pickupLocation: { address: pickup }, dropoffLocation: { address: dropoff }, estimatedFare: fare.total, vehicleType: selectedVehicle.id, paymentMethod });
      setRideState('active');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book ride');
      setRideState('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide?._id || activeRide._id === 'demo') {
      setRideState('idle');
      setActiveRide(null);
      return;
    }
    try {
      await ridesAPI.cancel(activeRide._id, cancelReason);
      toast.success(t('passenger.cancelRide') || 'Ride cancelled');
    } catch (err) {
      console.error(err);
    }
    setRideState('idle');
    setActiveRide(null);
    setCancelReason('');
  };

  const handleSubmitRating = async () => {
    if (activeRide?._id && activeRide._id !== 'demo' && rating > 0) {
      try {
        await paymentsAPI.process(activeRide._id, { rating, paymentMethod: activeRide.paymentMethod });
      } catch (err) {
        console.error(err);
      }
    }
    setCompletedRide(null);
    setRideState('idle');
    setActiveRide(null);
    setRating(0);
    setPickup('');
    setDropoff('');
    setSelectedVehicle(null);
    fetchRecentTrips();
    fetchStats();
  };

  const handleSOS = () => {
    toast.warning(t('passenger.emergency') + ': SOS alert sent!');
  };

  const fare = calcFare(selectedVehicle);
  const userName = user?.firstName || user?.name || '';

  if (rideState === 'searching') {
    return (
      <div className="passenger-page">
        <div className="ride-status">
          <div className="searching-animation">
            <div className="pulse-ring"></div>
            <div className="pulse-ring delay-1"></div>
            <div className="pulse-ring delay-2"></div>
            <div className="searching-car"><FaCar /></div>
          </div>
          <h3>{t('passenger.findingDriver') || 'Finding your driver...'}</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>{t('passenger.whereTo')}</p>
          <div style={{ marginTop: 24 }}>
            <Button variant="ghost" onClick={handleCancelRide}>{t('passenger.cancelRide') || 'Cancel'}</Button>
          </div>
        </div>
      </div>
    );
  }

  if (rideState === 'active' && activeRide) {
    const driver = activeRide.driver || { firstName: 'Abebe', lastName: 'Kebede', vehiclePlate: 'AA-12345', rating: 4.8, totalTrips: 342 };
    const progress = activeRide.progress || 35;
    return (
      <div className="passenger-page">
        <div className="ride-active">
          <h2 className="section-title"><FaCar /> {t('passenger.rideActive') || 'Ride in Progress'}</h2>
          <div className="driver-card">
            <div className="driver-avatar">{(driver.firstName || 'A')[0]}{(driver.lastName || 'K')[0]}</div>
            <div className="driver-info">
              <h4>{driver.firstName} {driver.lastName}</h4>
              <p className="driver-vehicle">{driver.vehicleType || 'Sedan'} · {driver.vehiclePlate}</p>
              <span className="driver-trips">{driver.totalTrips} trips</span>
            </div>
            <div className="driver-rating">
              <FaStar /> {driver.rating}
            </div>
          </div>

          <div className="ride-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-labels">
              <span className={progress > 0 ? 'active' : ''}>{activeRide.pickupLocation?.address || pickup}</span>
              <span className={progress >= 100 ? 'active' : ''}>{activeRide.dropoffLocation?.address || dropoff}</span>
            </div>
          </div>

          <div className="ride-actions">
            <button className="ride-action-btn" onClick={() => toast.info('Calling driver...')}>
              <FaPhone /> {t('passenger.callDriver') || 'Call Driver'}
            </button>
            <button className="ride-action-btn sos" onClick={handleSOS}>
              <FaExclamationTriangle /> {t('passenger.emergency') || 'SOS'}
            </button>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Button variant="outline" onClick={handleCancelRide}>{t('passenger.cancelRide') || 'Cancel Ride'}</Button>
          </div>
        </div>
      </div>
    );
  }

  if (rideState === 'complete' && completedRide) {
    return (
      <div className="passenger-page">
        <div className="ride-complete">
          <div className="complete-icon"><FaStar /></div>
          <h3>{t('passenger.rideComplete') || 'Trip Complete!'}</h3>
          <p className="text-muted">ETB {completedRide.fare?.total || fare.total}</p>

          <div className="rating-section">
            <h4>{t('passenger.rateExperience') || 'Rate your experience'}</h4>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} className={`star ${rating >= s ? 'active' : ''}`} onClick={() => setRating(s)}>
                  <FaStar />
                </button>
              ))}
            </div>
          </div>

          <div className="complete-actions">
            <Button variant="primary" onClick={handleSubmitRating}>{t('passenger.done') || 'Done'}</Button>
            <Button variant="ghost" onClick={() => navigate('/passenger/history')}>{t('passenger.history') || 'History'}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="passenger-page">
      <div className="hero-banner">
        <img src="/images/phone-car.jpg" alt="Ride sharing" className="hero-bg-img" />
        <div className="hero-overlay">
          <h1 className="hero-title">
            {t('passenger.welcome', { name: userName }) || `Welcome, ${userName}`}
          </h1>
          <p className="hero-subtitle">{t('passenger.whereTo')}</p>
        </div>
      </div>

      <div className="quick-stats">
          <StatCard icon={<FaRoute />} iconColor="primary" value={stats.totalTrips} label={t('passenger.totalTrips') || 'Total Trips'} />
          <StatCard icon={<FaWallet />} iconColor="success" value={`ETB ${stats.totalSpent.toLocaleString()}`} label={t('passenger.totalSpent') || 'Total Spent'} />
          <StatCard icon={<FaStar />} iconColor="warning" value={stats.favoriteRoutes} label={t('passenger.favoriteRoutes') || 'Favorite Routes'} />
      </div>

      <div className="map-section">
        <Card className="map-card" padding="none">
          <div className="map-container">
            <MapPlaceholder />
            <div className="map-overlay">
              <div className="map-info-chip">
                <FaMapMarkerAlt /> {Math.floor(Math.random() * 8) + 3} {t('passenger.nearbyDrivers') || 'drivers nearby'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="booking-section">
        <Card className="booking-card">
          <h2 className="section-title"><FaCar /> {t('passenger.bookRide')}</h2>

          <div className="location-inputs">
            <div className="location-input-wrapper">
              <div className="location-dot pickup"></div>
              <input
                className="location-input"
                type="text"
                placeholder={t('passenger.pickup') || 'Enter pickup location'}
                value={pickup}
                onChange={e => setPickup(e.target.value)}
              />
            </div>
            <div className="location-divider">
              <div className="divider-line"></div>
              <div className="divider-dots"><span></span><span></span><span></span></div>
              <button className="location-btn" onClick={swapLocations}><FaExchangeAlt /></button>
              <div className="divider-dots"><span></span><span></span><span></span></div>
              <div className="divider-line"></div>
            </div>
            <div className="location-input-wrapper">
              <div className="location-dot dropoff"></div>
              <input
                className="location-input"
                type="text"
                placeholder={t('passenger.dropoff') || 'Enter drop-off location'}
                value={dropoff}
                onChange={e => setDropoff(e.target.value)}
              />
            </div>
          </div>

          <div className="tab-bar" style={{ marginTop: 20 }}>
            <button className={`tab ${rideType === 'intraCity' ? 'active' : ''}`} onClick={() => setRideType('intraCity')}>
              {t('passenger.intraCity')}
            </button>
            <button className={`tab ${rideType === 'intercity' ? 'active' : ''}`} onClick={() => setRideType('intercity')}>
              {t('passenger.intercity')}
            </button>
          </div>

          <h3 className="subsection-title">{t('passenger.selectVehicle')}</h3>
          <div className="vehicle-grid">
            {VEHICLES.map(v => (
              <div
                key={v.id}
                className={`vehicle-card ${selectedVehicle?.id === v.id ? 'selected' : ''}`}
                onClick={() => setSelectedVehicle(v)}
              >
                {selectedVehicle?.id === v.id && <div className="vehicle-check"><FaStar size={10} /></div>}
                <div className="vehicle-icon">{v.icon}</div>
                <div className="vehicle-info">
                  <h4>{t(`vehicle.${v.nameKey}`)}</h4>
                  <span className="vehicle-capacity"><FaUsers size={11} /> {v.capacity} {t('passenger.seats')}</span>
                </div>
                <div className="vehicle-price">ETB {calcFare(v).total}</div>
                <div className="vehicle-eta"><FaClock size={11} /> {v.eta} {t('passenger.minutes')}</div>
              </div>
            ))}
          </div>

          {selectedVehicle && (
            <>
              <h3 className="subsection-title">{t('passenger.fareBreakdown')}</h3>
              <div className="fare-summary">
                <div className="fare-row"><span>{t('passenger.baseFare')}</span><span>ETB {fare.base}</span></div>
                <div className="fare-row"><span>{t('passenger.distanceFare')}</span><span>ETB {fare.distance}</span></div>
                <div className="fare-row"><span>{t('passenger.timeFare')}</span><span>ETB {fare.time}</span></div>
                <div className="fare-row"><span>{t('passenger.platformFee')}</span><span>ETB {fare.platform}</span></div>
                <div className="fare-total"><span>{t('passenger.totalFare')}</span><span>ETB {fare.total}</span></div>
              </div>
            </>
          )}

          <h3 className="subsection-title">{t('passenger.selectPayment')}</h3>
          <div className="payment-options">
            <div className="payment-grid">
              {[
                { id: 'cash', icon: <FaMoneyBillWave />, label: t('passenger.cash') },
                { id: 'telebirr', icon: <FaMobileAlt />, label: t('passenger.telebirr') },
                { id: 'chapa', icon: <FaCreditCard />, label: t('passenger.chapa') },
              ].map(p => (
                <div
                  key={p.id}
                  className={`payment-option ${paymentMethod === p.id ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(p.id)}
                >
                  <div className="payment-icon">{p.icon}</div>
                  <span className="payment-label">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="request-ride-btn"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
            onClick={handleBookRide}
            icon={<FaCar />}
          >
            {t('passenger.bookNow')}
          </Button>
        </Card>
      </div>

      {recentTrips.length > 0 && (
        <div className="recent-section">
          <div className="section-header">
            <h2 className="section-title"><FaHistory /> {t('passenger.historyLabel')}</h2>
            <button className="see-all-btn" onClick={() => navigate('/passenger/history')}>
              {t('passenger.completed')} →
            </button>
          </div>
          <div className="trips-grid">
            {recentTrips.map(trip => (
              <Card key={trip._id} className="trip-card" hover>
                <div className="trip-card-header">
                  <span className="trip-date"><FaClock size={12} /> {new Date(trip.createdAt).toLocaleDateString()}</span>
                  <StatusBadge status={trip.status} />
                </div>
                <div className="trip-locations">
                  <div className="trip-location">
                    <div className="loc-dot pickup"></div>
                    <span>{trip.pickupLocation?.address || 'Pickup'}</span>
                  </div>
                  <div className="trip-location">
                    <div className="loc-dot dropoff"></div>
                    <span>{trip.dropoffLocation?.address || 'Drop-off'}</span>
                  </div>
                </div>
                <div className="trip-card-footer">
                  <span className="trip-fare">ETB {trip.fare?.total || trip.fare || 0}</span>
                  <button className="trip-detail-btn" onClick={() => navigate('/passenger/history')}>
                    {t('passenger.completed')} →
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="quick-actions">
        <div className="actions-grid">
          <div className="action-card" onClick={() => navigate('/passenger/history')}>
            <div className="action-icon"><FaHistory /></div>
            <span>{t('passenger.history')}</span>
          </div>
          <div className="action-card" onClick={() => navigate('/passenger/favorites')}>
            <div className="action-icon"><FaStar /></div>
            <span>{t('passenger.favorites')}</span>
          </div>
          <div className="action-card" onClick={handleSOS}>
            <div className="action-icon danger"><FaExclamationTriangle /></div>
            <span>{t('passenger.emergency')}</span>
          </div>
          <div className="action-card" onClick={() => navigate('/passenger/profile')}>
            <div className="action-icon"><FaUserShield /></div>
            <span>{t('passenger.settings')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerHome;

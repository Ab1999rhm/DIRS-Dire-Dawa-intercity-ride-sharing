import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCar, FaMapMarkerAlt, FaCreditCard, FaStar, FaHistory, FaExclamationTriangle,
  FaExchangeAlt, FaClock, FaMoneyBillWave, FaPhone, FaRoute, FaWallet,
  FaUserShield, FaUsers, FaMobileAlt, FaBell, FaSearch, FaMotorcycle,
  FaShuttleVan, FaBus, FaBolt, FaHome, FaListUl, FaCog
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, ratingsAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Passenger.css';

const VEHICLES = [
  { id: 'bajaj', icon: FaShuttleVan, nameKey: 'bajaj', label: 'Bajaj', capacity: 3, priceKm: 15, priceMin: 2, baseFare: 25, eta: '3-5', color: '#10b981' },
  { id: 'minivan', icon: FaBus, nameKey: 'minivan', label: 'Minivan', capacity: 7, priceKm: 25, priceMin: 3, baseFare: 50, eta: '5-8', color: '#8b5cf6' },
  { id: 'sedan', icon: FaCar, nameKey: 'sedan', label: 'Sedan', capacity: 4, priceKm: 30, priceMin: 4, baseFare: 60, eta: '4-7', color: '#2563eb' },
  { id: 'bus', icon: FaBus, nameKey: 'bus', label: 'Bus', capacity: 14, priceKm: 12, priceMin: 1.5, baseFare: 40, eta: '8-12', color: '#ef4444' },
  { id: 'bike', icon: FaMotorcycle, nameKey: 'bike', label: 'Bike', capacity: 1, priceKm: 10, priceMin: 1, baseFare: 15, eta: '2-4', color: '#f59e0b' },
  { id: 'electric', icon: FaBolt, nameKey: 'electric', label: 'Electric', capacity: 4, priceKm: 20, priceMin: 2, baseFare: 35, eta: '3-6', color: '#22c55e' },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

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
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => { fetchRecentTrips(); fetchStats(); }, []);

  const fetchRecentTrips = async () => {
    try {
      const res = await ridesAPI.passengerTrips({ limit: 3, status: 'completed' });
      setRecentTrips(res.data.trips || []);
    } catch (err) { console.error('Failed to fetch trips:', err); }
  };

  const fetchStats = async () => {
    try {
      const res = await ridesAPI.passengerTrips({ limit: 100 });
      const trips = res.data.trips || [];
      const totalSpent = trips.reduce((sum, t) => sum + (t.fare?.total || t.fare || 0), 0);
      const uniqueRoutes = new Set(trips.map(t => `${t.pickupLocation?.address}-${t.dropoffLocation?.address}`)).size;
      setStats({ totalTrips: trips.length, totalSpent, favoriteRoutes: uniqueRoutes });
    } catch (err) { console.error('Failed to fetch stats:', err); }
  };

  const swapLocations = () => { setPickup(dropoff); setDropoff(pickup); };

  const calcFare = (vehicle) => {
    if (!vehicle) return { base: 0, distance: 0, time: 0, platform: 0, total: 0 };
    const base = vehicle.baseFare;
    const distance = vehicle.priceKm * 5;
    const time = vehicle.priceMin * 15;
    const platform = Math.round((base + distance + time) * 0.1);
    return { base, distance, time, platform, total: base + distance + time + platform };
  };

  const handleBookRide = async () => {
    if (!pickup.trim() || !dropoff.trim()) { toast.error('Please enter pickup and dropoff'); return; }
    if (!selectedVehicle) { toast.error('Please select a vehicle'); return; }
    setLoading(true);
    setRideState('searching');
    try {
      const fare = calcFare(selectedVehicle);
      const res = await ridesAPI.create({
        pickupLocation: { address: pickup, coordinates: [9.6, 41.6] },
        dropoffLocation: { address: dropoff, coordinates: [9.0, 40.5] },
        rideType, vehicleType: selectedVehicle.id, paymentMethod, estimatedFare: fare.total,
      });
      setActiveRide(res.data.ride || { _id: 'demo', pickupLocation: { address: pickup }, dropoffLocation: { address: dropoff }, estimatedFare: fare.total });
      setRideState('active');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book ride');
      setRideState('idle');
    } finally { setLoading(false); }
  };

  const handleCancelRide = async () => {
    if (activeRide?._id && activeRide._id !== 'demo') {
      try { await ridesAPI.cancel(activeRide._id, 'Cancelled by passenger'); } catch (err) { console.error(err); }
    }
    toast.success('Ride cancelled');
    setRideState('idle'); setActiveRide(null);
  };

  const handleSubmitRating = async () => {
    if (activeRide?._id && activeRide._id !== 'demo' && rating > 0) {
      try { await ratingsAPI.create(activeRide._id, { rating, comment: '' }); } catch (err) { console.error(err); }
    }
    setCompletedRide(null); setRideState('idle'); setActiveRide(null); setRating(0);
    setPickup(''); setDropoff(''); setSelectedVehicle(null);
    fetchRecentTrips(); fetchStats();
  };

  const handleSOS = () => { toast.warning('SOS alert sent!'); };

  const fare = calcFare(selectedVehicle);
  const userName = user?.firstName || user?.name || '';

  if (rideState === 'searching') {
    return (
      <div className="passenger-page">
        <div className="ride-status">
          <div className="searching-animation">
            <div className="pulse-ring"></div><div className="pulse-ring delay-1"></div><div className="pulse-ring delay-2"></div>
            <div className="searching-car"><FaCar /></div>
          </div>
          <h3>{t('passenger.findingDriver') || 'Finding your driver...'}</h3>
          <button className="passenger-cancel-btn" onClick={handleCancelRide}>{t('passenger.cancelRide') || 'Cancel'}</button>
        </div>
      </div>
    );
  }

  if (rideState === 'active' && activeRide) {
    const driver = activeRide.driver || { firstName: 'Abebe', lastName: 'Kebede', vehiclePlate: 'AA-12345', rating: 4.8 };
    return (
      <div className="passenger-page">
        <div className="ride-active">
          <h2 className="passenger-section-title"><FaCar /> {t('passenger.rideActive') || 'Ride in Progress'}</h2>
          <div className="driver-card">
            <div className="passenger-avatar-lg">{(driver.firstName || 'A')[0]}{(driver.lastName || 'K')[0]}</div>
            <div className="driver-info">
              <h4>{driver.firstName} {driver.lastName}</h4>
              <p>{driver.vehiclePlate}</p>
              <span><FaStar /> {driver.rating}</span>
            </div>
            <a href={`tel:${driver.phone}`} className="call-btn-sm"><FaPhone /></a>
          </div>
          <div className="ride-actions-row">
            <button className="passenger-action-btn" onClick={() => toast.info('Calling driver...')}><FaPhone /> {t('passenger.callDriver') || 'Call'}</button>
            <button className="passenger-action-btn danger" onClick={handleSOS}><FaExclamationTriangle /> SOS</button>
          </div>
          <button className="passenger-cancel-btn" onClick={handleCancelRide}>{t('passenger.cancelRide') || 'Cancel Ride'}</button>
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
          <p className="fare-display">ETB {completedRide.fare?.total || fare.total}</p>
          <div className="rating-section">
            <h4>{t('passenger.rateExperience') || 'Rate your experience'}</h4>
            <div className="rating-stars">
              {[1,2,3,4,5].map(s => (
                <button key={s} className={`star ${rating >= s ? 'active' : ''}`} onClick={() => setRating(s)}><FaStar /></button>
              ))}
            </div>
          </div>
          <button className="passenger-primary-btn" onClick={handleSubmitRating}>{t('passenger.done') || 'Done'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="passenger-page">
      <div className="passenger-header-row">
        <div>
          <h1 className="passenger-greeting">{getGreeting()} {userName}</h1>
          <p className="passenger-location"><FaMapMarkerAlt /> Dire Dawa, Ethiopia</p>
        </div>
        <button className="passenger-bell-btn"><FaBell /></button>
      </div>

      <div className="passenger-search-bar" onClick={() => document.querySelector('.location-input')?.focus()}>
        <FaSearch className="search-icon" />
        <span className="search-placeholder">{t('passenger.whereTo') || 'Where are you going?'}</span>
      </div>

      <div className="passenger-booking-card">
        <div className="location-inputs">
          <div className="location-input-wrapper">
            <div className="location-dot pickup"></div>
            <input className="location-input" type="text" placeholder={t('passenger.pickup') || 'Pickup location'} value={pickup} onChange={e => setPickup(e.target.value)} />
          </div>
          <div className="location-divider">
            <div className="divider-line"></div>
            <button className="location-btn" onClick={swapLocations}><FaExchangeAlt /></button>
            <div className="divider-line"></div>
          </div>
          <div className="location-input-wrapper">
            <div className="location-dot dropoff"></div>
            <input className="location-input" type="text" placeholder={t('passenger.dropoff') || 'Drop-off location'} value={dropoff} onChange={e => setDropoff(e.target.value)} />
          </div>
        </div>

        <div className="passenger-tab-bar">
          <button className={`passenger-tab ${rideType === 'intraCity' ? 'active' : ''}`} onClick={() => setRideType('intraCity')}>{t('passenger.intraCity')}</button>
          <button className={`passenger-tab ${rideType === 'intercity' ? 'active' : ''}`} onClick={() => setRideType('intercity')}>{t('passenger.intercity')}</button>
        </div>

        <h3 className="passenger-subsection">{t('passenger.selectVehicle')}</h3>
        <div className="passenger-services-grid">
          {VEHICLES.map(v => {
            const Icon = v.icon;
            return (
              <div key={v.id} className={`passenger-service-card ${selectedVehicle?.id === v.id ? 'selected' : ''}`} onClick={() => setSelectedVehicle(v)}>
                {selectedVehicle?.id === v.id && <div className="service-check"><FaStar size={10} /></div>}
                <div className="service-card-icon" style={{ color: v.color }}><Icon /></div>
                <span className="service-card-label">{v.label}</span>
                <span className="service-card-price">ETB {calcFare(v).total}</span>
              </div>
            );
          })}
        </div>

        {selectedVehicle && (
          <>
            <h3 className="passenger-subsection">{t('passenger.fareBreakdown')}</h3>
            <div className="fare-summary">
              <div className="fare-row"><span>{t('passenger.baseFare')}</span><span>ETB {fare.base}</span></div>
              <div className="fare-row"><span>{t('passenger.distanceFare')}</span><span>ETB {fare.distance}</span></div>
              <div className="fare-row"><span>{t('passenger.timeFare')}</span><span>ETB {fare.time}</span></div>
              <div className="fare-row"><span>{t('passenger.platformFee')}</span><span>ETB {fare.platform}</span></div>
              <div className="fare-total"><span>{t('passenger.totalFare')}</span><span>ETB {fare.total}</span></div>
            </div>
          </>
        )}

        <h3 className="passenger-subsection">{t('passenger.selectPayment')}</h3>
        <div className="passenger-payment-grid">
          {[
            { id: 'cash', icon: <FaMoneyBillWave />, label: t('passenger.cash') || 'Cash' },
            { id: 'telebirr', icon: <FaMobileAlt />, label: t('passenger.telebirr') || 'Telebirr' },
            { id: 'chapa', icon: <FaCreditCard />, label: t('passenger.chapa') || 'Chapa' },
          ].map(p => (
            <div key={p.id} className={`passenger-payment-option ${paymentMethod === p.id ? 'selected' : ''}`} onClick={() => setPaymentMethod(p.id)}>
              <div className="payment-icon">{p.icon}</div>
              <span className="payment-label">{p.label}</span>
            </div>
          ))}
        </div>

        <button className="passenger-primary-btn" disabled={loading} onClick={handleBookRide}>
          <FaCar /> {t('passenger.bookNow')}
        </button>
      </div>

      {recentTrips.length > 0 && (
        <div className="passenger-recent">
          <div className="passenger-section-header">
            <h2 className="passenger-section-title"><FaHistory /> {t('passenger.historyLabel')}</h2>
            <button className="see-all-btn" onClick={() => navigate('/passenger/history')}>{t('passenger.completed')} →</button>
          </div>
          <div className="passenger-trips-list">
            {recentTrips.map(trip => (
              <div key={trip._id} className="passenger-trip-item">
                <div className="trip-route-info">
                  <div className="trip-point"><div className="loc-dot pickup"></div><span>{trip.pickupLocation?.address || 'Pickup'}</span></div>
                  <div className="trip-point"><div className="loc-dot dropoff"></div><span>{trip.dropoffLocation?.address || 'Dropoff'}</span></div>
                </div>
                <span className="trip-fare">ETB {trip.fare?.total || trip.fare || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="passenger-quick-actions">
        <div className="passenger-actions-grid">
          <div className="passenger-action-card" onClick={() => navigate('/passenger/history')}>
            <div className="action-icon"><FaHistory /></div><span>{t('passenger.history')}</span>
          </div>
          <div className="passenger-action-card" onClick={() => navigate('/passenger/favorites')}>
            <div className="action-icon"><FaStar /></div><span>{t('passenger.favorites')}</span>
          </div>
          <div className="passenger-action-card" onClick={handleSOS}>
            <div className="action-icon danger"><FaExclamationTriangle /></div><span>{t('passenger.emergency')}</span>
          </div>
          <div className="passenger-action-card" onClick={() => navigate('/passenger/profile')}>
            <div className="action-icon"><FaUserShield /></div><span>{t('passenger.settings')}</span>
          </div>
        </div>
      </div>

      <div className="passenger-bottom-nav">
        <button className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><FaHome /><span>Home</span></button>
        <button className={`bottom-nav-item ${activeTab === 'trips' ? 'active' : ''}`} onClick={() => navigate('/passenger/trips')}><FaListUl /><span>Trips</span></button>
        <button className={`bottom-nav-item ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => navigate('/passenger/favorites')}><FaWallet /><span>Wallet</span></button>
        <button className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => navigate('/passenger/profile')}><FaCog /><span>Settings</span></button>
      </div>
    </div>
  );
};

export default PassengerHome;

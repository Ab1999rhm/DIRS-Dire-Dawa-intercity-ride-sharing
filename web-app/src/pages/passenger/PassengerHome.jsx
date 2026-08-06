import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCar, FaMapMarkerAlt, FaCreditCard, FaStar, FaHistory, FaExclamationTriangle,
  FaExchangeAlt, FaClock, FaMoneyBillWave, FaPhone, FaRoute, FaWallet,
  FaUserShield, FaUsers, FaMobileAlt, FaBell, FaSearch, FaMotorcycle,
  FaShuttleVan, FaBus, FaBolt, FaHome, FaListUl, FaCog
} from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, ratingsAPI, sosAPI } from '../../services/api';
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

const pickupIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#16a34a;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const dropoffIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#dc2626;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">D</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

const PassengerHome = () => {
  const { t } = useLanguage();
  const { user, socket, tripStatusUpdate, notifications } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
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
  const [mapCenter, setMapCenter] = useState([9.6009, 41.8508]);
  const [promoCode, setPromoCode] = useState('');
  const [notifToastShown, setNotifToastShown] = useState(false);

  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

  useEffect(() => { fetchRecentTrips(); fetchStats(); }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter([lat, lng]);
        setPickupCoords([lat, lng]);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data.display_name) setPickup(data.display_name);
        } catch (_) {}
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!tripStatusUpdate) return;
    if (tripStatusUpdate.status === 'completed') {
      setCompletedRide(tripStatusUpdate.ride || activeRide);
      setRideState('complete');
    }
  }, [tripStatusUpdate]);

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
      const uniqueRoutes = new Set(
        trips.map((t) => `${t.pickupLocation?.address}-${t.dropoffLocation?.address}`)
      ).size;
      setStats({ totalTrips: trips.length, totalSpent, favoriteRoutes: uniqueRoutes });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchSuggestions = useCallback(
    debounce(async (query, setter) => {
      if (query.length < 3) {
        setter([]);
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await res.json();
        setter(
          data.map((item) => ({
            label: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
          }))
        );
      } catch (_) {
        setter([]);
      }
    }, 500),
    []
  );

  const swapLocations = () => {
    setPickup(dropoff);
    setDropoff(pickup);
    setPickupCoords(dropoffCoords);
    setDropoffCoords(pickupCoords);
  };

  const calcFare = (vehicle) => {
    if (!vehicle) return { base: 0, distance: 0, time: 0, platform: 0, total: 0 };
    const base = vehicle.baseFare;
    let distKm = 5;
    if (pickupCoords && dropoffCoords) {
      distKm = haversineDistance(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]);
    }
    const distance = Math.round(vehicle.priceKm * distKm);
    const time = Math.round(vehicle.priceMin * Math.max(5, Math.round(distKm * 2)));
    const platform = Math.round((base + distance + time) * 0.1);
    return { base, distance, time, platform, total: base + distance + time + platform };
  };

  const handleBookRide = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      toast.error('Please enter pickup and dropoff');
      return;
    }
    if (!pickupCoords || !dropoffCoords) {
      toast.error('Please select addresses from suggestions');
      return;
    }
    if (!selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }
    setLoading(true);
    setRideState('searching');
    try {
      const fare = calcFare(selectedVehicle);
      const res = await ridesAPI.create({
        pickupLocation: { address: pickup, coordinates: pickupCoords },
        dropoffLocation: { address: dropoff, coordinates: dropoffCoords },
        rideType,
        vehicleType: selectedVehicle.id,
        paymentMethod,
        estimatedFare: fare.total,
        promoCode: promoCode || undefined,
      });
      setActiveRide(
        res.data.ride || {
          _id: 'demo',
          pickupLocation: { address: pickup },
          dropoffLocation: { address: dropoff },
          estimatedFare: fare.total,
        }
      );
      setRideState('active');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book ride');
      setRideState('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (activeRide?._id && activeRide._id !== 'demo') {
      try {
        await ridesAPI.cancel(activeRide._id, 'Cancelled by passenger');
      } catch (err) {
        console.error(err);
      }
    }
    toast.success('Ride cancelled');
    setRideState('idle');
    setActiveRide(null);
  };

  const handleSubmitRating = async () => {
    if (activeRide?._id && activeRide._id !== 'demo' && rating > 0) {
      try {
        await ratingsAPI.create(activeRide._id, { rating, comment: '' });
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
    setPickupCoords(null);
    setDropoffCoords(null);
    setSelectedVehicle(null);
    fetchRecentTrips();
    fetchStats();
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
      await sosAPI.trigger({ location, description: 'SOS triggered by passenger' });
      toast.warning('SOS alert sent!');
    } catch (err) {
      toast.error('Failed to send SOS alert');
    }
  };

  const handleBellClick = () => {
    if (notifications && notifications.length > 0) {
      toast.info(`You have ${notifications.length} notification(s)`);
    } else {
      toast.info('No new notifications');
    }
  };

  const fare = calcFare(selectedVehicle);
  const userName = user?.firstName || user?.name || '';

  const getGreetingText = () => {
    const h = new Date().getHours();
    if (h < 12) return t('passenger.goodMorning') || 'Good Morning';
    if (h < 17) return t('passenger.goodAfternoon') || 'Good Afternoon';
    return t('passenger.goodEvening') || 'Good Evening';
  };

  if (rideState === 'searching') {
    return (
      <div className="passenger-page">
        <div className="ride-status">
          <div className="searching-animation">
            <div className="pulse-ring"></div>
            <div className="pulse-ring delay-1"></div>
            <div className="pulse-ring delay-2"></div>
            <div className="searching-car">
              <FaCar />
            </div>
          </div>
          <h3>{t('passenger.findingDriver') || 'Finding your driver...'}</h3>
          <button className="passenger-cancel-btn" onClick={handleCancelRide}>
            {t('passenger.cancelRide') || 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  if (rideState === 'active' && activeRide) {
    const driver = activeRide.driver || { firstName: 'Driver', lastName: 'Assigned', vehiclePlate: '--', rating: '--' };
    const driverPhone = activeRide.driver?.phone || '';
    return (
      <div className="passenger-page">
        <div className="ride-active">
          <h2 className="passenger-section-title">
            <FaCar /> {t('passenger.rideActive') || 'Ride in Progress'}
          </h2>
          <div className="driver-card">
            <div className="passenger-avatar-lg">
              {(driver.firstName || 'D')[0]}
              {(driver.lastName || 'A')[0]}
            </div>
            <div className="driver-info">
              <h4>{driver.firstName} {driver.lastName}</h4>
              <p>{driver.vehiclePlate}</p>
              <span>
                <FaStar /> {driver.rating}
              </span>
            </div>
            {driverPhone ? (
              <a href={`tel:${driverPhone}`} className="call-btn-sm">
                <FaPhone />
              </a>
            ) : (
              <span className="call-btn-sm" style={{ opacity: 0.4, cursor: 'default' }}>
                <FaPhone />
              </span>
            )}
          </div>
          <div className="ride-actions-row">
            <button
              className="passenger-action-btn"
              onClick={() => driverPhone ? window.location.href = `tel:${driverPhone}` : toast.info('Driver phone not available')}
            >
              <FaPhone /> {t('passenger.callDriver') || 'Call'}
            </button>
            <button className="passenger-action-btn danger" onClick={handleSOS}>
              <FaExclamationTriangle /> SOS
            </button>
          </div>
          <button className="passenger-cancel-btn" onClick={handleCancelRide}>
            {t('passenger.cancelRide') || 'Cancel Ride'}
          </button>
        </div>
      </div>
    );
  }

  if (rideState === 'complete' && completedRide) {
    return (
      <div className="passenger-page">
        <div className="ride-complete">
          <div className="complete-icon">
            <FaStar />
          </div>
          <h3>{t('passenger.rideComplete') || 'Trip Complete!'}</h3>
          <p className="fare-display">ETB {completedRide.fare?.total || fare.total}</p>
          <div className="rating-section">
            <h4>{t('passenger.rateExperience') || 'Rate your experience'}</h4>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  className={`star ${rating >= s ? 'active' : ''}`}
                  onClick={() => setRating(s)}
                >
                  <FaStar />
                </button>
              ))}
            </div>
          </div>
          <button className="passenger-primary-btn" onClick={handleSubmitRating}>
            {t('passenger.done') || 'Done'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="passenger-page">
      <div className="passenger-header-row">
        <div>
          <h1 className="passenger-greeting">{getGreetingText()} {userName}</h1>
          <p className="passenger-location">
            <FaMapMarkerAlt /> {t('passenger.currentLocation') || 'Dire Dawa, Ethiopia'}
          </p>
        </div>
        <button className="passenger-bell-btn" onClick={handleBellClick}>
          <FaBell />
        </button>
      </div>

      <div className="passenger-map-container">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '250px', borderRadius: '14px', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pickupCoords && (
            <Marker position={pickupCoords} icon={pickupIcon}>
              <Popup>{pickup || 'Pickup'}</Popup>
            </Marker>
          )}
          {dropoffCoords && (
            <Marker position={dropoffCoords} icon={dropoffIcon}>
              <Popup>{dropoff || 'Dropoff'}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="passenger-booking-card">
        <div className="location-inputs">
          <div className="location-input-wrapper" style={{ position: 'relative' }}>
            <div className="location-dot pickup"></div>
            <input
              ref={pickupInputRef}
              className="location-input"
              type="text"
              placeholder={t('passenger.pickup') || 'Pickup location'}
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
                setPickupCoords(null);
                setShowPickupSuggestions(true);
                fetchSuggestions(e.target.value, setPickupSuggestions);
              }}
              onFocus={() => setShowPickupSuggestions(true)}
              onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
            />
            {showPickupSuggestions && pickupSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {pickupSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className="suggestion-item"
                    onMouseDown={() => {
                      setPickup(s.label);
                      setPickupCoords([s.lat, s.lon]);
                      setPickupSuggestions([]);
                      setShowPickupSuggestions(false);
                    }}
                  >
                    <FaMapMarkerAlt className="suggestion-icon" />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="location-divider">
            <div className="divider-line"></div>
            <button className="location-btn" onClick={swapLocations}>
              <FaExchangeAlt />
            </button>
            <div className="divider-line"></div>
          </div>
          <div className="location-input-wrapper" style={{ position: 'relative' }}>
            <div className="location-dot dropoff"></div>
            <input
              ref={dropoffInputRef}
              className="location-input"
              type="text"
              placeholder={t('passenger.dropoff') || 'Drop-off location'}
              value={dropoff}
              onChange={(e) => {
                setDropoff(e.target.value);
                setDropoffCoords(null);
                setShowDropoffSuggestions(true);
                fetchSuggestions(e.target.value, setDropoffSuggestions);
              }}
              onFocus={() => setShowDropoffSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 200)}
            />
            {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {dropoffSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className="suggestion-item"
                    onMouseDown={() => {
                      setDropoff(s.label);
                      setDropoffCoords([s.lat, s.lon]);
                      setDropoffSuggestions([]);
                      setShowDropoffSuggestions(false);
                    }}
                  >
                    <FaMapMarkerAlt className="suggestion-icon" />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="passenger-tab-bar">
          <button
            className={`passenger-tab ${rideType === 'intraCity' ? 'active' : ''}`}
            onClick={() => setRideType('intraCity')}
          >
            {t('passenger.intraCity')}
          </button>
          <button
            className={`passenger-tab ${rideType === 'intercity' ? 'active' : ''}`}
            onClick={() => setRideType('intercity')}
          >
            {t('passenger.intercity')}
          </button>
        </div>

        <h3 className="passenger-subsection">{t('passenger.selectVehicle')}</h3>
        <div className="passenger-services-grid">
          {VEHICLES.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.id}
                className={`passenger-service-card ${selectedVehicle?.id === v.id ? 'selected' : ''}`}
                onClick={() => setSelectedVehicle(v)}
              >
                {selectedVehicle?.id === v.id && (
                  <div className="service-check">
                    <FaStar size={10} />
                  </div>
                )}
                <div className="service-card-icon" style={{ color: v.color }}>
                  <Icon />
                </div>
                <span className="service-card-label">{v.label}</span>
                <span className="service-card-eta">{v.eta} min</span>
                <span className="service-card-price">ETB {calcFare(v).total}</span>
              </div>
            );
          })}
        </div>

        {selectedVehicle && (
          <>
            <h3 className="passenger-subsection">{t('passenger.fareBreakdown')}</h3>
            <div className="fare-summary">
              <div className="fare-row">
                <span>{t('passenger.baseFare')}</span>
                <span>ETB {fare.base}</span>
              </div>
              <div className="fare-row">
                <span>{t('passenger.distanceFare')}</span>
                <span>ETB {fare.distance}</span>
              </div>
              <div className="fare-row">
                <span>{t('passenger.timeFare')}</span>
                <span>ETB {fare.time}</span>
              </div>
              <div className="fare-row">
                <span>{t('passenger.platformFee')}</span>
                <span>ETB {fare.platform}</span>
              </div>
              <div className="fare-total">
                <span>{t('passenger.totalFare')}</span>
                <span>ETB {fare.total}</span>
              </div>
            </div>
          </>
        )}

        <h3 className="passenger-subsection">Promo Code</h3>
        <div className="promo-code-input">
          <input
            className="location-input"
            type="text"
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
        </div>

        <h3 className="passenger-subsection">{t('passenger.selectPayment')}</h3>
        <div className="passenger-payment-grid">
          {[
            { id: 'cash', icon: <FaMoneyBillWave />, label: t('passenger.cash') || 'Cash' },
            { id: 'telebirr', icon: <FaMobileAlt />, label: t('passenger.telebirr') || 'Telebirr' },
            { id: 'chapa', icon: <FaCreditCard />, label: t('passenger.chapa') || 'Chapa' },
          ].map((p) => (
            <div
              key={p.id}
              className={`passenger-payment-option ${paymentMethod === p.id ? 'selected' : ''}`}
              onClick={() => setPaymentMethod(p.id)}
            >
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
            <h2 className="passenger-section-title">
              <FaHistory /> {t('passenger.historyLabel')}
            </h2>
            <button className="see-all-btn" onClick={() => navigate('/passenger/history')}>
              {t('passenger.completed')} →
            </button>
          </div>
          <div className="passenger-trips-list">
            {recentTrips.map((trip) => (
              <div key={trip._id} className="passenger-trip-item">
                <div className="trip-route-info">
                  <div className="trip-point">
                    <div className="loc-dot pickup"></div>
                    <span>{trip.pickupLocation?.address || 'Pickup'}</span>
                  </div>
                  <div className="trip-point">
                    <div className="loc-dot dropoff"></div>
                    <span>{trip.dropoffLocation?.address || 'Dropoff'}</span>
                  </div>
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
            <div className="action-icon">
              <FaHistory />
            </div>
            <span>{t('passenger.history')}</span>
          </div>
          <div className="passenger-action-card" onClick={() => navigate('/passenger/favorites')}>
            <div className="action-icon">
              <FaStar />
            </div>
            <span>{t('passenger.favorites')}</span>
          </div>
          <div className="passenger-action-card" onClick={handleSOS}>
            <div className="action-icon danger">
              <FaExclamationTriangle />
            </div>
            <span>{t('passenger.emergency')}</span>
          </div>
          <div className="passenger-action-card" onClick={() => navigate('/passenger/profile')}>
            <div className="action-icon">
              <FaUserShield />
            </div>
            <span>{t('passenger.settings')}</span>
          </div>
        </div>
      </div>

      <div className="passenger-bottom-nav">
        <button
          className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <FaHome />
          <span>Home</span>
        </button>
        <button
          className={`bottom-nav-item ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => navigate('/passenger/trips')}
        >
          <FaListUl />
          <span>Trips</span>
        </button>
        <button
          className={`bottom-nav-item ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => navigate('/passenger/wallet')}
        >
          <FaWallet />
          <span>Wallet</span>
        </button>
        <button
          className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => navigate('/passenger/profile')}
        >
          <FaCog />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default PassengerHome;

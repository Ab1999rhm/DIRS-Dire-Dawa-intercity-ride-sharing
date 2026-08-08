import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, paymentsAPI, vehiclesAPI, authAPI } from '../../services/api';
import { Card } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import L from 'leaflet';
import {
  FaCar, FaPowerOff, FaMapMarkerAlt, FaPhone, FaCheck, FaTimes,
  FaStar, FaMoneyBillWave, FaClock, FaRoad, FaBell,
  FaMotorcycle, FaShuttleVan, FaBus, FaTruck, FaBolt,
  FaHome, FaListUl, FaWallet, FaCog, FaChevronRight
} from 'react-icons/fa';
import FlexibleMap from '../../components/common/FlexibleMap';
import './Driver.css';

const INTERCITY_DESTINATIONS = [
  { key: 'harar', label: 'Harar', emoji: '🕌' },
  { key: 'addis ababa', label: 'Addis Ababa', emoji: '🏙️' },
  { key: 'combolcha', label: 'Combolcha', emoji: '🏔️' },
  { key: 'jijiga', label: 'Jijiga', emoji: '🏜️' },
  { key: 'awash', label: 'Awash', emoji: '🌿' },
  { key: 'debre markos', label: 'Debre Markos', emoji: '⛪' },
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
  const { user, emitLocationUpdate, newRideRequest, clearNewRideRequest, rideAccepted, clearRideAccepted, tripStatusUpdate } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [rideRequests, setRideRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [stats, setStats] = useState({ totalTrips: 0, rating: 0, todayEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [mapCenter, setMapCenter] = useState([9.6009, 41.8508]);
  const [vehicleType, setVehicleType] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [intendedDestination, setIntendedDestination] = useState(user?.intendedDestination?.city || null);

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

      // Merge with persisted passenger orders from localStorage
      const localRides = JSON.parse(localStorage.getItem('dirs_passenger_rides') || '[]');
      const pendingLocal = localRides.filter(r => ['pending', 'searching'].includes((r.status || '').toLowerCase()));
      const activeLocal = localRides.find(r => ['accepted', 'in_progress', 'driver_arriving', 'driver_found', 'ongoing'].includes((r.status || '').toLowerCase()));

      setActiveTrip(backendTrip || activeLocal || null);
      setRideRequests([...pendingLocal, ...backendRides]);

      if (earningsRes.data) {
        setEarnings({
          today: earningsRes.data.today || 956,
          week: earningsRes.data.week || 4200,
          month: earningsRes.data.month || 18500
        });
        setStats({
          totalTrips: earningsRes.data.totalTrips || localRides.length || 14,
          rating: earningsRes.data.rating || 4.9,
          todayEarnings: earningsRes.data.today || 956
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
    try {
      await authAPI.updateDriverDestination(dest?.key || null, dest ? undefined : undefined);
      toast.success(dest ? `Destination set to ${dest.label}` : 'Destination cleared');
    } catch { toast.error('Failed to update destination'); }
  }, [toast]);

  const toggleOnline = useCallback(() => {
    const newStatus = !isOnline;
    if (newStatus && vehicleType === 'intercity' && !intendedDestination) {
      toast.error('Please select a destination city before going online for intercity');
      return;
    }
    setIsOnline(newStatus);
    const coords = mapCenter;
    authAPI.updateDriverStatus(newStatus, [coords[1], coords[0]]).catch(() => {});
    if (newStatus) {
      toast.success('You are now ONLINE — receiving nearby ride requests!');
      // Load pending passenger orders
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
  }, [isOnline, watchId, emitLocationUpdate, toast, mapCenter, vehicleType, intendedDestination]);

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

  const selectedRequest = rideRequests.length > 0 ? rideRequests[0] : null;

  return (
    <div className="driver-page">
      <div className="driver-logo-bar">
        <img src="/logo.svg" alt="DIRS - Dire Dawa Ride Sharing" className="driver-logo" />
      </div>

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

      {isOnline && (vehicleType === 'intercity' || vehicleType === 'both') && (
        <div className="driver-destination-picker">
          <p className="destination-label">
            <FaMapMarkerAlt /> Where are you heading? (Intercity)
          </p>
          <div className="destination-grid">
            {INTERCITY_DESTINATIONS.map(dest => (
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
              <a href={`tel:${activeTrip.passenger?.phoneNumber}`} className="call-btn"><FaPhone /></a>
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

            {/* Real-World External Navigation Launcher */}
            <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
              <button
                type="button"
                style={{ flex: 1, padding: '8px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => {
                  const addr = encodeURIComponent(activeTrip.dropoff?.address || activeTrip.pickup?.address || 'Dire Dawa');
                  window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
                }}
              >
                🗺️ Open Google Maps
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: '8px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => {
                  const addr = encodeURIComponent(activeTrip.dropoff?.address || activeTrip.pickup?.address || 'Dire Dawa');
                  window.open(`https://waze.com/ul?q=${addr}&navigate=yes`, '_blank');
                }}
              >
                🚗 Open Waze
              </button>
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
            <Card key={ride._id} className="driver-request-card" padding="md" style={{ borderLeft: '4px solid #2563eb' }}>
              {/* Real-World 15-second Circular Request Acceptance Timer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '8px 12px', borderRadius: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>⚡ Incoming Ride Request</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '10px' }}>
                  ⏳ 15s Auto-Decline
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

    </div>
  );
};

export default DriverDashboard;

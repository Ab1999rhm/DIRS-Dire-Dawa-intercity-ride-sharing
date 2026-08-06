import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaClock, FaMapMarkerAlt, FaFilter } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI } from '../../services/api';
import { Card, Button, Badge, StatusBadge, SkeletonCard } from '../../components/common';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import { useToast } from '../../components/common/Toast';
import './Passenger.css';

const PassengerTrips = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('active');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, [activeTab]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const statusMap = { active: 'accepted', upcoming: 'pending', completed: 'completed' };
      let backendTrips = [];
      try {
        const res = await ridesAPI.passengerTrips({ status: statusMap[activeTab], limit: 20 });
        backendTrips = res.data?.trips || res.data || [];
      } catch (_) {}

      const localRides = JSON.parse(localStorage.getItem('dirs_passenger_rides') || '[]');
      const combined = [...backendTrips, ...localRides];

      const seen = new Set();
      const uniqueRides = combined.filter(r => {
        if (!r._id || seen.has(r._id)) return false;
        seen.add(r._id);
        return true;
      });

      const filtered = uniqueRides.filter(r => {
        const s = (r.status || 'pending').toLowerCase();
        if (activeTab === 'active') {
          return ['accepted', 'searching', 'pending', 'in_progress', 'driver_found', 'driver_arriving', 'active'].includes(s);
        }
        if (activeTab === 'upcoming') {
          return s === 'pending' || Boolean(r.scheduledTime);
        }
        if (activeTab === 'completed') {
          return s === 'completed' || s === 'finished';
        }
        return true;
      });

      setTrips(filtered);
    } catch (err) {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (tripId) => {
    try {
      await ridesAPI.cancel(tripId, 'Cancelled by passenger');
      toast.success(t('passenger.cancelRide'));
      fetchTrips();
    } catch (err) {
      toast.error('Failed to cancel trip');
    }
  };

  const tabs = [
    { id: 'active', label: t('passenger.active') || 'Active' },
    { id: 'upcoming', label: t('passenger.upcoming') || 'Upcoming' },
    { id: 'completed', label: t('passenger.completed') || 'Completed' },
  ];

  return (
    <div className="passenger-page">
      <div className="page-header">
        <h1 className="page-title"><FaCar /> {t('passenger.history') || 'My Trips'}</h1>
      </div>

      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="trips-list">
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={4} avatar />)}
        </div>
      ) : trips.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <EmptyStateIllustration type="rides" />
            <h3 style={{ marginTop: 16, fontWeight: 700 }}>{t('passenger.noTrips')}</h3>
            <p className="text-muted" style={{ marginTop: 8 }}>{t('passenger.noTripsDesc')}</p>
            <Button variant="primary" style={{ marginTop: 16 }} onClick={() => navigate('/passenger')}>
              {t('passenger.bookRide')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="trips-list">
          {trips.map(trip => (
            <Card key={trip._id} className="trip-list-item" hover>
              <div className="trip-item-header">
                <div className="trip-item-date">
                  <FaClock size={12} />
                  {new Date(trip.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <StatusBadge status={trip.status} />
              </div>

              <div className="trip-item-route">
                <div className="route-point">
                  <div className="loc-dot pickup"></div>
                  <span>{trip.pickupLocation?.address || 'Pickup location'}</span>
                </div>
                <div className="route-point">
                  <div className="loc-dot dropoff"></div>
                  <span>{trip.dropoffLocation?.address || 'Drop-off location'}</span>
                </div>
              </div>

              <div className="trip-item-footer">
                <div className="trip-item-meta">
                  <span><FaCar size={12} /> {trip.vehicleType || 'Sedan'}</span>
                  <span><FaClock size={12} /> {trip.duration || '—'} min</span>
                </div>
                <span className="trip-item-fare">ETB {trip.fare?.total || trip.estimatedFare || 0}</span>
              </div>

              {trip.driver && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <div className="cell-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                    {trip.driver.firstName?.[0]}{trip.driver.lastName?.[0]}
                  </div>
                  {trip.driver.firstName} {trip.driver.lastName}
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FaClock size={11} /> {trip.driver.rating || '4.8'}
                  </span>
                </div>
              )}

              {trip.status === 'pending' && (
                <div style={{ marginTop: 12 }}>
                  <Button variant="danger" size="sm" onClick={() => handleCancel(trip._id)}>
                    {t('passenger.cancelRide')}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PassengerTrips;

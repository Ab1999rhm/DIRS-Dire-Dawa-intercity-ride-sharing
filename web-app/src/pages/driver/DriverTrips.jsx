import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI } from '../../services/api';
import { Card } from '../../components/common';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import EmptyState from '../../components/common/EmptyState';
import { FaCar, FaStar, FaMapMarkerAlt, FaCalendar, FaFilter } from 'react-icons/fa';
import './Driver.css';

const DriverTrips = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('driver.all') },
    { id: 'completed', label: t('driver.completed') },
    { id: 'cancelled', label: t('driver.cancelled') }
  ];

  useEffect(() => {
    fetchTrips();
  }, [activeTab]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await ridesAPI.driverTrips(params);
      setTrips(res.data?.trips || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="driver-page">
        <h1 className="page-title">{t('driver.myTrips')}</h1>
        <div className="driver-trips-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="driver-page">
      <h1 className="page-title">{t('driver.myTrips')}</h1>

      <div className="tabs">
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

      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}

      {trips.length === 0 ? (
        <EmptyState
          icon={<EmptyStateIllustration type="rides" />}
          title={t('driver.noTrips')}
          description={t('driver.noTripsDesc')}
        />
      ) : (
        <div className="driver-trips-list">
          {trips.map(trip => (
            <Card key={trip._id} className="driver-trip-item" padding="md">
              <div className="driver-trip-route">
                <div className="trip-point">
                  <div className="loc-dot pickup" />
                  <span>{trip.pickup?.address || 'Pickup'}</span>
                </div>
                <div className="trip-point">
                  <div className="loc-dot dropoff" />
                  <span>{trip.dropoff?.address || 'Dropoff'}</span>
                </div>
                <div className="driver-trip-date">
                  <FaCalendar /> {formatDate(trip.createdAt)}
                </div>
              </div>
              <div className="driver-trip-meta">
                <span className="driver-trip-fare">{trip.fare?.total || trip.fare || 0} ETB</span>
                {trip.rating?.driver && (
                  <span className="driver-trip-rating">
                    <FaStar /> {trip.rating.driver}
                  </span>
                )}
                <span className={`status-badge ${trip.status}`}>
                  {trip.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverTrips;

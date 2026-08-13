import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI } from '../../services/api';
import { Card } from '../../components/common';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import EmptyState from '../../components/common/EmptyState';
import InAppChat from '../../components/passenger/InAppChat';
import { FaCar, FaStar, FaMapMarkerAlt, FaCalendar, FaFilter, FaComment } from 'react-icons/fa';
import './Driver.css';

const DriverTrips = () => {
  const { t } = useLanguage();
  const { user, socket, chatUnread } = useAuth();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [chatTrip, setChatTrip] = useState(null);

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

  const ACTIVE_STATUSES = ['driver_arriving', 'driver_arrived', 'in_progress'];
  const sortedTrips = [...trips].sort((a, b) => {
    const aActive = ACTIVE_STATUSES.includes(a.status) ? 0 : 1;
    const bActive = ACTIVE_STATUSES.includes(b.status) ? 0 : 1;
    return aActive - bActive || new Date(b.createdAt) - new Date(a.createdAt);
  });

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
          {sortedTrips.map(trip => (
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
                <span className="driver-trip-fare">{trip.fare?.totalFare || trip.fare?.total || 0} ETB</span>
                {trip.rating?.driver && (
                  <span className="driver-trip-rating">
                    <FaStar /> {trip.rating.driver}
                  </span>
                )}
                {ACTIVE_STATUSES.includes(trip.status) && (
                  <span className="status-badge ongoing-badge">ONGOING</span>
                )}
                <span className={`status-badge ${trip.status}`}>
                  {trip.status}
                </span>
                <button
                  className="driver-chat-btn"
                  onClick={() => setChatTrip(trip)}
                  style={{ marginLeft: 'auto' }}
                >
                  <FaComment /> Chat
                  {chatUnread[trip._id] > 0 && (
                    <span className="chat-unread-badge" style={{ position: 'absolute', top: -6, right: -6 }}>{chatUnread[trip._id]}</span>
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {chatTrip && (
        <InAppChat
          isOpen={!!chatTrip}
          onClose={() => setChatTrip(null)}
          tripId={chatTrip._id}
          driverName={`${chatTrip.passenger?.firstName || ''} ${chatTrip.passenger?.lastName || ''}`.trim() || 'Passenger'}
          socket={socket}
          role="driver"
          tripStatus={chatTrip.status}
          route={chatTrip.pickup?.address && chatTrip.dropoff?.address ? `${chatTrip.pickup.address} → ${chatTrip.dropoff.address}` : ''}
        />
      )}
    </div>
  );
};

export default DriverTrips;

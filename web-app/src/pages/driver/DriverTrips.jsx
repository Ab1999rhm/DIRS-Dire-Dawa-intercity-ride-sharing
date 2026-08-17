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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const tabs = [
    { id: 'all', label: t('driver.all') },
    { id: 'completed', label: t('driver.completed') },
    { id: 'cancelled', label: t('driver.cancelled') }
  ];

  useEffect(() => {
    setPage(1);
    fetchTrips();
  }, [activeTab]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await ridesAPI.driverTrips(params);
      const regularTrips = res.data?.trips || [];
      const vehicleTrips = res.data?.vehicleTrips || [];
      
      // Normalize VehicleTrips for display
      const normalizedVT = vehicleTrips.map(vt => ({
        _id: vt._id,
        isVehicleTrip: true,
        status: vt.status,
        passenger: vt.passengers?.[0] ? { firstName: `${vt.passengers.length} passengers`, lastName: '', averageRating: 0 } : { firstName: 'Shared', lastName: 'Trip', averageRating: 0 },
        vehicle: vt.vehicle,
        pickupLocation: { address: vt.destinationCity || 'Shared Trip' },
        dropoffLocation: { address: vt.destinationCity || '' },
        fare: { totalFare: vt.totalCollected || 0 },
        createdAt: vt.createdAt,
        seats: vt.seats,
        vehicleTrip: vt
      }));
      
      setTrips([...regularTrips, ...normalizedVT]);
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
  const totalPages = Math.max(1, Math.ceil(sortedTrips.length / PAGE_SIZE));
  const pagedTrips = sortedTrips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          {pagedTrips.map(trip => (
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
              {trip.isVehicleTrip && (
                <div style={{ padding: '6px 10px', background: 'var(--primary-50)', borderRadius: 6, margin: '6px 0', fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                  Shared Ride · {trip.seats?.filter(s => s.status === 'occupied' || s.status === 'reserved').length || 0} of {trip.seats?.length || 0} seats
                </div>
              )}
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

      {totalPages > 1 && (
        <div className="driver-pagination" aria-label="Pagination">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            {t('common.previous') || 'Previous'}
          </button>
          <span className="pagination-info">{t('passenger.pageOf', { current: page, total: totalPages })}</span>
          <button
            className="pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            {t('common.next') || 'Next'}
          </button>
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

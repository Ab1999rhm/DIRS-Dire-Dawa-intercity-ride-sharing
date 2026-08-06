import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaSearch, FaCalendarAlt, FaRoute, FaWallet, FaStar, FaClock, FaCar, FaRedo } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI } from '../../services/api';
import { Card, Button, Input, Badge, StatusBadge, SkeletonCard } from '../../components/common';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import { useToast } from '../../components/common/Toast';
import './Passenger.css';

const PassengerHistory = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ totalTrips: 0, totalSpent: 0, avgRating: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter, searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { limit, page };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await ridesAPI.passengerTrips(params);
      const tripsData = res.data.trips || [];
      setTrips(tripsData);
      setTotalPages(res.data.totalPages || Math.max(1, Math.ceil((res.data.total || tripsData.length) / limit)));
      const totalSpent = tripsData.reduce((sum, trip) => sum + (trip.fare?.total || trip.fare || 0), 0);
      const ratedTrips = tripsData.filter(trip => trip.rating);
      const avgRating = ratedTrips.length > 0
        ? (ratedTrips.reduce((sum, trip) => sum + trip.rating, 0) / ratedTrips.length).toFixed(1)
        : '0.0';
      setStats({ totalTrips: tripsData.length, totalSpent, avgRating });
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = !searchQuery ||
      trip.pickupLocation?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.dropoffLocation?.address?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (dateFilter === 'all') return true;

    const tripDate = new Date(trip.createdAt);
    const now = new Date();
    if (dateFilter === 'today') return tripDate.toDateString() === now.toDateString();
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      return tripDate >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      return tripDate >= monthAgo;
    }
    return true;
  });

  return (
    <div className="passenger-page">
      <div className="page-header">
        <h1 className="page-title"><FaHistory /> {t('passenger.history') || 'Trip History'}</h1>
        <span className="total-count">{stats.totalTrips} {t('passenger.totalTrips')}</span>
      </div>

      <div className="history-stats">
        <Card className="history-stat" hover>
          <span className="history-stat-value">{stats.totalTrips}</span>
          <span className="history-stat-label">{t('passenger.totalTrips')}</span>
        </Card>
        <Card className="history-stat" hover>
          <span className="history-stat-value">ETB {stats.totalSpent.toLocaleString()}</span>
          <span className="history-stat-label">{t('passenger.totalSpent')}</span>
        </Card>
        <Card className="history-stat" hover>
          <span className="history-stat-value">{stats.avgRating}</span>
          <span className="history-stat-label">{t('passenger.avgRating')}</span>
        </Card>
      </div>

      <div className="history-status-tabs" role="tablist" aria-label="Filter by status">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={statusFilter === tab.key}
            className={`history-status-tab ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder={t('passenger.searchTrips') || 'Search trips...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        >
          <option value="all">{t('passenger.allDates') || 'All Dates'}</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {loading ? (
        <div className="trips-list">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : filteredTrips.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <EmptyStateIllustration type="history" />
            <h3 style={{ marginTop: 16, fontWeight: 700 }}>{t('passenger.noHistory')}</h3>
            <p className="text-muted" style={{ marginTop: 8 }}>{t('passenger.noHistoryDesc')}</p>
          </div>
        </Card>
      ) : (
        <div className="trips-list">
          {filteredTrips.map(trip => (
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
                  <span>{trip.pickupLocation?.address || 'Pickup'}</span>
                </div>
                <div className="route-point">
                  <div className="loc-dot dropoff"></div>
                  <span>{trip.dropoffLocation?.address || 'Drop-off'}</span>
                </div>
              </div>

              <div className="trip-item-footer">
                <div className="trip-item-meta">
                  <span><FaCar size={12} /> {trip.vehicleType || 'Sedan'}</span>
                  <span><FaClock size={12} /> {trip.duration || '—'} min</span>
                  {trip.rating && (
                    <span><FaStar size={12} style={{ color: 'var(--accent)' }} /> {trip.rating}</span>
                  )}
                </div>
                <span className="trip-item-fare">ETB {trip.fare?.total || trip.fare || 0}</span>
              </div>

              {trip.driver && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                  {trip.driver.profilePhoto ? (
                    <img src={trip.driver.profilePhoto} alt="Driver" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div className="cell-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                      {trip.driver.firstName?.[0]}{trip.driver.lastName?.[0]}
                    </div>
                  )}
                  {trip.driver.firstName} {trip.driver.lastName}
                </div>
              )}

              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (trip.pickupLocation?.address) params.set('pickup', trip.pickupLocation.address);
                  if (trip.dropoffLocation?.address) params.set('dropoff', trip.dropoffLocation.address);
                  if (trip.pickupLocation?.coordinates) params.set('pickupCoords', JSON.stringify(trip.pickupLocation.coordinates));
                  if (trip.dropoffLocation?.coordinates) params.set('dropoffCoords', JSON.stringify(trip.dropoffLocation.coordinates));
                  navigate(`/passenger?${params.toString()}`);
                }}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '8px 0',
                  borderRadius: 10,
                  border: '1px solid var(--primary)',
                  background: 'transparent',
                  color: 'var(--primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <FaRedo size={12} /> Rebook
              </button>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="history-pagination" aria-label="Pagination">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="pagination-info">Page {page} of {totalPages}</span>
          <button
            className="pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PassengerHistory;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaSearch, FaCalendarAlt, FaRoute, FaWallet, FaStar, FaClock, FaCar, FaRedo, FaQuestionCircle } from 'react-icons/fa';
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ totalTrips: 0, totalSpent: 0, avgRating: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter, searchQuery, fromDate, toDate]);

  const exportCSV = () => {
    const headers = ['Date', 'Pickup', 'Dropoff', 'Distance', 'Duration', 'Fare', 'Status', 'Driver'];
    const rows = filteredTrips.map(trip => [
      new Date(trip.createdAt).toLocaleDateString(),
      trip.pickupLocation?.address || '',
      trip.dropoffLocation?.address || '',
      trip.distance || '',
      trip.duration || '',
      trip.fare?.totalFare || trip.fare?.total || 0,
      trip.status || '',
      trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { limit, page };
      if (statusFilter !== 'all') params.status = statusFilter;
      let backendTrips = [];
      try {
        const res = await ridesAPI.passengerTrips(params);
        backendTrips = res.data.trips || res.data || [];
      } catch (_) {}

      const localRides = JSON.parse(localStorage.getItem('dirs_passenger_rides') || '[]');
      const combined = [...backendTrips, ...localRides];

      const seen = new Set();
      const tripsData = combined.filter(r => {
        if (!r._id || seen.has(r._id)) return false;
        seen.add(r._id);
        return true;
      });

      setTrips(tripsData);
      setTotalPages(Math.max(1, Math.ceil(tripsData.length / limit)));
      const totalSpent = tripsData.reduce((sum, trip) => sum + (Number(trip.fare?.total) || Number(trip.fare?.totalFare) || trip.estimatedFare || 0), 0);
      const ratedTrips = tripsData.filter(trip => trip.rating);
      const avgRating = ratedTrips.length > 0
        ? (ratedTrips.reduce((sum, trip) => sum + trip.rating, 0) / ratedTrips.length).toFixed(1)
        : '4.9';
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

    const tripDate = new Date(trip.createdAt);
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (tripDate < from) return false;
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (tripDate > to) return false;
    }
    if (!fromDate && !toDate) {
      if (dateFilter === 'all') return true;
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
        <Card className="history-stat stat-trips" hover>
          <div className="history-stat-icon"><FaCar /></div>
          <span className="history-stat-value">{stats.totalTrips}</span>
          <span className="history-stat-label">{t('passenger.totalTrips')}</span>
        </Card>
        <Card className="history-stat stat-spent" hover>
          <div className="history-stat-icon"><FaWallet /></div>
          <span className="history-stat-value">ETB {stats.totalSpent.toLocaleString()}</span>
          <span className="history-stat-label">{t('passenger.totalSpent')}</span>
        </Card>
        <Card className="history-stat stat-rating" hover>
          <div className="history-stat-icon"><FaStar /></div>
          <span className="history-stat-value">{stats.avgRating}</span>
          <span className="history-stat-label">{t('passenger.avgRating')}</span>
        </Card>
      </div>

      <div className="history-status-tabs" role="tablist" aria-label="Filter by status">
        {[
          { key: 'all', labelKey: 'passenger.all' },
          { key: 'active', labelKey: 'passenger.activeStatus' },
          { key: 'completed', labelKey: 'passenger.completed' },
          { key: 'cancelled', labelKey: 'passenger.cancelled' },
        ].map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={statusFilter === tab.key}
            className={`history-status-tab ${statusFilter === tab.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {t(tab.labelKey)}
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={fromDate}
            onChange={e => { setFromDate(e.target.value); setDateFilter('all'); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
            aria-label={t('passenger.fromDate') || 'From date'}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
          <input
            type="date"
            value={toDate}
            onChange={e => { setToDate(e.target.value); setDateFilter('all'); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
            aria-label={t('passenger.toDate') || 'To date'}
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              {t('passenger.clear')}
            </button>
          )}
          <button
            onClick={exportCSV}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {t('passenger.exportHistory') || 'Export CSV'}
          </button>
        </div>
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
                   <span><FaCar size={12} /> {trip.vehicleType || 'Car'}</span>
                  <span><FaClock size={12} /> {trip.duration || '—'} min</span>
                  {trip.rating && (
                    <span><FaStar size={12} style={{ color: 'var(--accent)' }} /> {trip.rating}</span>
                  )}
                </div>
                <span className="trip-item-fare">ETB {Number(trip.fare?.total) || Number(trip.fare?.totalFare) || 0}</span>
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
                  const fixCoords = (loc) => {
                    if (!loc?.coordinates) return null;
                    const c = loc.coordinates.coordinates || loc.coordinates;
                    if (!Array.isArray(c) || c.length < 2) return null;
                    let [v1, v2] = [parseFloat(c[0]), parseFloat(c[1])];
                    if (v1 > 30 && v2 < 20) return [v2, v1];
                    return [v1, v2];
                  };
                  const pc = fixCoords(trip.pickupLocation);
                  const dc = fixCoords(trip.dropoffLocation);
                  if (pc) params.set('pickupCoords', JSON.stringify(pc));
                  if (dc) params.set('dropoffCoords', JSON.stringify(dc));
                  if (trip.pickupLocation?.placeId) params.set('pickupPlaceId', trip.pickupLocation.placeId);
                  if (trip.dropoffLocation?.placeId) params.set('dropoffPlaceId', trip.dropoffLocation.placeId);
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
                <FaRedo size={12} /> {t('passenger.rebook')}
              </button>
              {trip.status === 'completed' && (
                <button
                  className="help-btn"
                  onClick={() => navigate(`/passenger/trip/${trip._id}?help=true`)}
                >
                  <FaQuestionCircle size={12} /> {t('passenger.getHelp')}
                </button>
              )}
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
            {t('common.previous')}
          </button>
          <span className="pagination-info">{t('passenger.pageOf', { current: page, total: totalPages })}</span>
          <button
            className="pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
};

export default PassengerHistory;

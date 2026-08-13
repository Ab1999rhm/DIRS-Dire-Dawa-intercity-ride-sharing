import React, { useState, useEffect } from 'react';
import { driverAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaMapMarkerAlt, FaHome, FaListUl, FaWallet, FaUser, FaComment } from 'react-icons/fa';
import './Pages.css';

const TripsPage = () => {
  const navigate = useNavigate();
  const { chatUnread } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTrips();
  }, [statusFilter, page]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const response = await driverAPI.getDriverTrips(params);
      setTrips(response.data.trips);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Load trips error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#e8f5e9', color: '#00c853' };
      case 'in_progress': return { bg: '#e3f2fd', color: '#1a73e8' };
      case 'driver_arriving': return { bg: '#fff3e0', color: '#ff9100' };
      case 'cancelled': return { bg: '#ffebee', color: '#ff1744' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="page-loading">Loading trips...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Trip History</h2>
      </header>

      <div className="filter-section">
        <div className="filter-pills">
          <button
            className={`filter-pill ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >All</button>
          <button
            className={`filter-pill ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('completed'); setPage(1); }}
          >Completed</button>
          <button
            className={`filter-pill ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('in_progress'); setPage(1); }}
          >Active</button>
          <button
            className={`filter-pill ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => { setStatusFilter('cancelled'); setPage(1); }}
          >Cancelled</button>
        </div>
      </div>

      <div className="trips-list">
        {trips.length === 0 ? (
          <div className="empty-state">
            <FaMapMarkerAlt size={56} color="#94a3b8" />
            <p>No trips found</p>
          </div>
        ) : (
          trips.map((trip) => {
            const statusStyle = getStatusColor(trip.status);
            return (
              <div key={trip._id} className="trip-item" onClick={() => navigate(`/trip/${trip._id}`)} style={{ cursor: 'pointer' }}>
                <div className="trip-item-header">
                  <span className="trip-date">{formatDate(trip.createdAt)}</span>
                  <span
                    className="trip-status-badge"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {trip.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="trip-route-info">
                  <div className="route-point">
                    <span className="route-dot pickup" />
                    <span className="route-text">{trip.pickupLocation?.address || 'Pickup'}</span>
                  </div>
                  <div className="route-connector" />
                  <div className="route-point">
                    <span className="route-dot dropoff" />
                    <span className="route-text">{trip.dropoffLocation?.address || 'Dropoff'}</span>
                  </div>
                </div>
                <div className="trip-item-footer">
                  <span className="trip-passenger">
                    {trip.passenger?.firstName} {trip.passenger?.lastName}
                  </span>
                  <span className="trip-fare">{trip.fare?.totalFare || 0} ETB</span>
                </div>
                <div className="trip-item-actions">
                  <button
                    className="trip-chat-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      sessionStorage.setItem('activeTripId', trip._id);
                      sessionStorage.setItem('chatPassengerName', trip.passenger?.firstName || 'Passenger');
                      navigate('/chat');
                    }}
                  >
                    <FaComment /> Chat
                    {chatUnread[trip._id] > 0 && (
                      <span className="chat-unread-badge">{chatUnread[trip._id]}</span>
                    )}
                  </button>
                </div>
                <div className="trip-time">{formatTime(trip.createdAt)}</div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      <nav className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/')}>
          <FaHome /> <span>Home</span>
        </button>
        <button className="nav-btn active" onClick={() => navigate('/trips')}>
          <FaListUl /> <span>Trips</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/earnings')}>
          <FaWallet /> <span>Earnings</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/profile')}>
          <FaUser /> <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default TripsPage;

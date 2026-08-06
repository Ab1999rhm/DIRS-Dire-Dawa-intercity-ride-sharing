import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ridesAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { FaHistory, FaMapMarkerAlt, FaCar, FaChevronRight } from 'react-icons/fa';
import './History.css';

const HistoryPage = () => {
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'cancelled'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTripHistory();
  }, [filter]);

  const fetchTripHistory = async () => {
    try {
      setLoading(true);
      const res = await ridesAPI.getPassengerTrips({ status: filter === 'all' ? undefined : filter });
      setTrips(res.data.trips || res.data || []);
    } catch (err) {
      console.error('Failed to load trips history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-container">
      <header className="page-header">
        <h2><FaHistory /> Trip History</h2>
      </header>

      <div className="history-tabs">
        <button
          className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`tab-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`tab-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      <div className="trips-list">
        {loading ? (
          <p className="status-text">Loading trip history...</p>
        ) : trips.length === 0 ? (
          <div className="empty-history">
            <FaCar className="empty-icon" />
            <p>No trips found</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Book a Ride</button>
          </div>
        ) : (
          trips.map((trip) => (
            <div
              key={trip._id}
              className="trip-card"
              onClick={() => navigate(`/trip/${trip._id}`)}
            >
              <div className="trip-card-header">
                <span className={`status-tag ${trip.status}`}>{trip.status ? trip.status.replace('_', ' ') : 'COMPLETED'}</span>
                <span className="trip-date">
                  {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>

              <div className="trip-card-body">
                <div className="route-preview">
                  <div className="route-point">
                    <FaMapMarkerAlt className="pickup-dot" />
                    <span>{trip.pickupLocation?.address || 'Pickup location'}</span>
                  </div>
                  <div className="route-point">
                    <FaMapMarkerAlt className="dropoff-dot" />
                    <span>{trip.dropoffLocation?.address || 'Dropoff location'}</span>
                  </div>
                </div>

                <div className="trip-meta">
                  <span className="trip-fare font-bold">{trip.fare?.totalFare || trip.estimatedFare || 0} ETB</span>
                  <FaChevronRight className="arrow-icon" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Navbar />
    </div>
  );
};

export default HistoryPage;

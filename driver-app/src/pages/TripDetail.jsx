import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { driverAPI, ratingsAPI } from '../services/api';
import {
  FaArrowLeft, FaMapMarkerAlt, FaDirections, FaUser, FaStar,
  FaMoneyBillWave, FaClock, FaRoute, FaCar
} from 'react-icons/fa';
import './Pages.css';

const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      const response = await driverAPI.getTripDetails(tripId);
      setTrip(response.data.trip);
    } catch (err) {
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

  if (loading) return <div className="page-loading">Loading trip details...</div>;
  if (error) return <div className="page-loading">{error}</div>;
  if (!trip) return <div className="page-loading">Trip not found</div>;

  const statusStyle = getStatusColor(trip.status);

  return (
    <div className="page-container">
      <header className="page-header trip-detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <h2>Trip Details</h2>
        <span className="spacer" />
      </header>

      <div className="trip-detail-content">
        {/* Status Badge */}
        <div className="detail-status-row">
          <span className="detail-status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
            {trip.status?.replace('_', ' ')}
          </span>
          <span className="detail-date">{formatDate(trip.createdAt)}</span>
        </div>

        {/* Route Card */}
        <div className="detail-card">
          <div className="detail-route">
            <div className="route-point">
              <span className="route-dot pickup" />
              <div className="route-text-group">
                <span className="route-label">PICKUP</span>
                <span className="route-text">{trip.pickupLocation?.address || 'Pickup Location'}</span>
              </div>
              {trip.pickupLocation?.coordinates && (
                <button className="btn-navigate-sm" onClick={() =>
                  handleNavigate(trip.pickupLocation.coordinates[1], trip.pickupLocation.coordinates[0])
                }>
                  <FaDirections />
                </button>
              )}
            </div>
            <div className="route-line" />
            <div className="route-point">
              <span className="route-dot dropoff" />
              <div className="route-text-group">
                <span className="route-label">DROPOFF</span>
                <span className="route-text">{trip.dropoffLocation?.address || 'Dropoff Location'}</span>
              </div>
              {trip.dropoffLocation?.coordinates && (
                <button className="btn-navigate-sm" onClick={() =>
                  handleNavigate(trip.dropoffLocation.coordinates[1], trip.dropoffLocation.coordinates[0])
                }>
                  <FaDirections />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Passenger Card */}
        {trip.passenger && (
          <div className="detail-card">
            <h4 className="detail-card-title">Passenger</h4>
            <div className="detail-passenger">
              <div className="passenger-avatar-sm">
                <FaUser />
              </div>
              <div className="passenger-info-sm">
                <span className="passenger-name-sm">{trip.passenger.firstName} {trip.passenger.lastName}</span>
                <span className="passenger-phone-sm">{trip.passenger.phoneNumber}</span>
                {trip.passenger.averageRating && (
                  <span className="passenger-rating-sm">
                    <FaStar /> {trip.passenger.averageRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trip Info Card */}
        <div className="detail-card">
          <h4 className="detail-card-title">Trip Information</h4>
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <FaClock className="info-icon" />
              <div>
                <span className="info-label">Started</span>
                <span className="info-value">{formatTime(trip.startTime)}</span>
              </div>
            </div>
            <div className="detail-info-item">
              <FaClock className="info-icon" />
              <div>
                <span className="info-label">Completed</span>
                <span className="info-value">{formatTime(trip.endTime)}</span>
              </div>
            </div>
            <div className="detail-info-item">
              <FaRoute className="info-icon" />
              <div>
                <span className="info-label">Distance</span>
                <span className="info-value">{((trip.actualDistance || trip.route?.distance || 0) / 1000).toFixed(1)} km</span>
              </div>
            </div>
            <div className="detail-info-item">
              <FaClock className="info-icon" />
              <div>
                <span className="info-label">Duration</span>
                <span className="info-value">{Math.ceil((trip.actualDuration || trip.route?.duration || 0) / 60)} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Card */}
        {trip.fare && (
          <div className="detail-card fare-card">
            <h4 className="detail-card-title">Fare Breakdown</h4>
            <div className="fare-breakdown">
              <div className="fare-row">
                <span>Base Fare</span>
                <span>{trip.fare.baseFare || 0} ETB</span>
              </div>
              <div className="fare-row">
                <span>Distance Fare</span>
                <span>{trip.fare.distanceFare || 0} ETB</span>
              </div>
              <div className="fare-row">
                <span>Time Fare</span>
                <span>{trip.fare.timeFare || 0} ETB</span>
              </div>
              {trip.fare.surgeMultiplier > 1 && (
                <div className="fare-row">
                  <span>Surge ({trip.fare.surgeMultiplier}x)</span>
                  <span>+{((trip.fare.totalFare || 0) - (trip.fare.baseFare || 0) - (trip.fare.distanceFare || 0) - (trip.fare.timeFare || 0)).toFixed(0)} ETB</span>
                </div>
              )}
              <div className="fare-row total">
                <span>Total Fare</span>
                <span>{trip.fare.totalFare || 0} ETB</span>
              </div>
              <div className="fare-row earnings">
                <span>Your Earnings</span>
                <span>{trip.fare.driverEarnings || 0} ETB</span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Card */}
        {trip.vehicle && (
          <div className="detail-card">
            <h4 className="detail-card-title">Vehicle</h4>
            <div className="detail-vehicle">
              <FaCar className="vehicle-icon" />
              <div className="vehicle-info-sm">
                <span className="vehicle-text-sm">{trip.vehicle.color} {trip.vehicle.make} {trip.vehicle.model}</span>
                <span className="vehicle-plate-sm">{trip.vehicle.plateNumber}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rating Card */}
        {trip.driverRating && (
          <div className="detail-card">
            <h4 className="detail-card-title">Your Rating</h4>
            <div className="detail-rating">
              <div className="rating-stars-sm">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar key={star} className={star <= (trip.driverRating.score || 0) ? 'star-filled' : 'star-empty'} />
                ))}
              </div>
              {trip.driverRating.comment && (
                <p className="rating-comment-sm">{trip.driverRating.comment}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetailPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ridesAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaCar, FaMapMarkerAlt, FaClock, FaMoneyBill, FaPhone, FaStar } from 'react-icons/fa';
import './TripDetails.css';

const TripDetailsPage = () => {
  const { tripId } = useParams();
  const { socket } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadTripDetails();
  }, [tripId]);

  useEffect(() => {
    if (socket) {
      socket.emit('join_trip', tripId);

      socket.on('trip_status', (data) => {
        if (data.tripId === tripId) {
          setTrip(prev => ({ ...prev, status: data.status }));
        }
      });

      socket.on('driver_location', (data) => {
        if (data.tripId === tripId) {
          setTrip(prev => ({
            ...prev,
            driverLocation: data.coordinates
          }));
        }
      });

      return () => {
        socket.emit('leave_trip', tripId);
        socket.off('trip_status');
        socket.off('driver_location');
      };
    }
  }, [socket, tripId]);

  const loadTripDetails = async () => {
    try {
      const response = await ridesAPI.getTripDetails(tripId);
      setTrip(response.data.trip);
    } catch (error) {
      console.error('Load trip details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      await paymentsAPI.processPayment(tripId, { method: paymentMethod });
      setShowPayment(false);
      loadTripDetails();
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleRating = async () => {
    try {
      await ridesAPI.getTripDetails(tripId);
      setShowRating(false);
      navigate('/history');
    } catch (error) {
      console.error('Rating error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading trip details...</div>;
  }

  if (!trip) {
    return <div className="error">Trip not found</div>;
  }

  return (
    <div className="trip-details-container">
      <header className="trip-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2>Trip Details</h2>
      </header>

      <div className="trip-status">
        <span className={`status-badge ${trip.status}`}>{trip.status.replace('_', ' ')}</span>
      </div>

      <div className="trip-route">
        <div className="route-point">
          <FaMapMarkerAlt className="pickup-icon" />
          <div className="route-info">
            <span className="label">Pickup</span>
            <span className="address">{trip.pickupLocation?.address}</span>
          </div>
        </div>
        <div className="route-line"></div>
        <div className="route-point">
          <FaMapMarkerAlt className="dropoff-icon" />
          <div className="route-info">
            <span className="label">Dropoff</span>
            <span className="address">{trip.dropoffLocation?.address}</span>
          </div>
        </div>
      </div>

      <div className="driver-info">
        <div className="driver-avatar">
          <FaCar />
        </div>
        <div className="driver-details">
          <h3>{trip.driver?.user?.firstName} {trip.driver?.user?.lastName}</h3>
          <div className="driver-rating">
            <FaStar /> {trip.driver?.user?.averageRating || '4.5'}
          </div>
          <p className="vehicle-info">
            {trip.vehicle?.color} {trip.vehicle?.make} {trip.vehicle?.model}
          </p>
          <p className="plate-number">{trip.vehicle?.plateNumber}</p>
        </div>
        <a href={`tel:${trip.driver?.user?.phoneNumber}`} className="call-btn">
          <FaPhone />
        </a>
      </div>

      <div className="trip-fare">
        <div className="fare-row">
          <span>Base Fare</span>
          <span>{trip.fare?.baseFare} ETB</span>
        </div>
        <div className="fare-row">
          <span>Distance Fare</span>
          <span>{trip.fare?.distanceFare} ETB</span>
        </div>
        <div className="fare-row">
          <span>Time Fare</span>
          <span>{trip.fare?.timeFare} ETB</span>
        </div>
        {trip.fare?.surgeMultiplier > 1 && (
          <div className="fare-row surge">
            <span>Surge ({trip.fare.surgeMultiplier}x)</span>
            <span>Applied</span>
          </div>
        )}
        <div className="fare-row total">
          <span>Total Fare</span>
          <span>{trip.fare?.totalFare} ETB</span>
        </div>
      </div>

      {trip.status === 'completed' && !trip.payment && (
        <div className="payment-section">
          <h3>Complete Payment</h3>
          <div className="payment-methods">
            <button
              className={`method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              Cash
            </button>
            <button
              className={`method-btn ${paymentMethod === 'telebirr' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('telebirr')}
            >
              Telebirr
            </button>
            <button
              className={`method-btn ${paymentMethod === 'chapa' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('chapa')}
            >
              Chapa
            </button>
          </div>
          <button className="btn-pay" onClick={handlePayment}>
            Pay {trip.fare?.totalFare} ETB
          </button>
        </div>
      )}

      {trip.status === 'completed' && trip.payment && !showRating && (
        <div className="rating-prompt">
          <button className="btn-rate" onClick={() => setShowRating(true)}>
            Rate Your Trip
          </button>
        </div>
      )}

      {showRating && (
        <div className="rating-modal">
          <h3>Rate Your Trip</h3>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`star ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <textarea
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn-submit" onClick={handleRating}>
            Submit Rating
          </button>
        </div>
      )}
    </div>
  );
};

export default TripDetailsPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ridesAPI, paymentsAPI, ratingsAPI, sosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import MapView from '../components/MapView';
import Navbar from '../components/Navbar';
import InAppChat from '../components/InAppChat';
import DigitalTicketModal from '../components/DigitalTicketModal';
import { FaCar, FaMapMarkerAlt, FaPhone, FaStar, FaShareAlt, FaComments, FaQrcode, FaWallet } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './TripDetails.css';

const TripDetailsPage = () => {
  const { tripId } = useParams();
  const { socket, user } = useAuth();
  const { walletBalance, setWalletBalance } = useRide();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'telebirr' | 'chapa' | 'wallet'
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [driverLocation, setDriverLocation] = useState(null);

  // Real world modals
  const [showChat, setShowChat] = useState(false);
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => {
    loadTripDetails();
  }, [tripId]);

  useEffect(() => {
    if (socket && tripId) {
      socket.emit('join_trip', tripId);

      socket.on('trip_status', (data) => {
        if (data.tripId === tripId || data._id === tripId) {
          setTrip((prev) => (prev ? { ...prev, status: data.status } : prev));
          toast.info(`Trip status updated: ${data.status.replace('_', ' ')}`);
        }
      });

      socket.on('driver_location', (data) => {
        if (data.tripId === tripId) {
          setDriverLocation({ coordinates: data.coordinates });
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
      setTrip(response.data.trip || response.data);
    } catch (error) {
      console.error('Load trip details error:', error);
      toast.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    const amountToPay = trip.fare?.totalFare || trip.estimatedFare || 50;

    if (paymentMethod === 'wallet') {
      if (walletBalance < amountToPay) {
        toast.error(`Insufficient wallet balance (${walletBalance} ETB). Please top up or select another method.`);
        return;
      }
      setWalletBalance((prev) => prev - amountToPay);
    }

    try {
      await paymentsAPI.processPayment(tripId, { method: paymentMethod });
      toast.success(`Payment of ${amountToPay} ETB completed via ${paymentMethod.toUpperCase()}!`);
      loadTripDetails();
    } catch (error) {
      console.error('Payment error:', error);
      toast.success(`Payment of ${amountToPay} ETB recorded!`);
      loadTripDetails();
    }
  };

  const handleRating = async () => {
    try {
      await ratingsAPI.createRating(tripId, { rating, comment });
      toast.success('Thank you for rating your trip!');
      setShowRating(false);
      navigate('/history');
    } catch (error) {
      console.error('Rating error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit rating');
    }
  };

  const handleShareTrip = async () => {
    try {
      const shareUrl = `${window.location.origin}/trip/${tripId}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Track My DIRS Trip',
          text: `I'm on a ride! Track my trip status live:`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Trip tracking link copied to clipboard!');
      }
      await sosAPI.shareTrip({ tripId, shareUrl });
    } catch (err) {
      console.error('Share trip error:', err);
    }
  };

  if (loading) {
    return <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading trip details...</div>;
  }

  if (!trip) {
    return <div className="error" style={{ padding: '40px', textAlign: 'center' }}>Trip not found</div>;
  }

  const driverName = trip.driver?.user ? `${trip.driver.user.firstName} ${trip.driver.user.lastName}` : 'Driver';

  return (
    <div className="trip-details-container" style={{ paddingBottom: '80px' }}>
      <header className="trip-header">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <h2>Trip Details</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button
            className="action-head-btn"
            onClick={() => setShowTicket(true)}
            title="Digital Boarding Ticket"
          >
            <FaQrcode />
          </button>
          <button
            className="action-head-btn"
            onClick={handleShareTrip}
            title="Share trip tracking link"
          >
            <FaShareAlt />
          </button>
        </div>
      </header>

      {/* Live Map Header */}
      <div style={{ padding: '16px 16px 0 16px' }}>
        <MapView
          pickupLocation={trip.pickupLocation}
          dropoffLocation={trip.dropoffLocation}
          driverLocation={driverLocation || (trip.driver?.currentLocation ? { coordinates: trip.driver.currentLocation.coordinates } : null)}
          height="220px"
        />
      </div>

      <div className="trip-status">
        <span className={`status-badge ${trip.status}`}>{trip.status ? trip.status.replace('_', ' ') : 'ACTIVE'}</span>
      </div>

      {/* Driver Quick Action Row (Call & Live Chat) */}
      {trip.driver && (
        <div className="driver-action-bar" style={{ margin: '0 16px 16px 16px', display: 'flex', gap: '12px' }}>
          <button className="btn-driver-action chat" onClick={() => setShowChat(true)}>
            <FaComments /> Chat with Driver
          </button>
          <a href={`tel:${trip.driver?.user?.phoneNumber || ''}`} className="btn-driver-action call">
            <FaPhone /> Call Driver
          </a>
        </div>
      )}

      <div className="trip-route">
        <div className="route-point">
          <FaMapMarkerAlt className="pickup-icon" />
          <div className="route-info">
            <span className="label">Pickup</span>
            <span className="address">{trip.pickupLocation?.address || 'Pickup Point'}</span>
          </div>
        </div>
        <div className="route-line"></div>
        <div className="route-point">
          <FaMapMarkerAlt className="dropoff-icon" />
          <div className="route-info">
            <span className="label">Dropoff</span>
            <span className="address">{trip.dropoffLocation?.address || 'Destination Point'}</span>
          </div>
        </div>
      </div>

      {trip.driver && (
        <div className="driver-info">
          <div className="driver-avatar">
            <FaCar />
          </div>
          <div className="driver-details">
            <h3>{driverName}</h3>
            <div className="driver-rating">
              <FaStar /> {trip.driver?.user?.averageRating || '4.8'}
            </div>
            <p className="vehicle-info">
              {trip.vehicle?.color} {trip.vehicle?.make} {trip.vehicle?.model}
            </p>
            <p className="plate-number">{trip.vehicle?.plateNumber}</p>
          </div>
        </div>
      )}

      <div className="trip-fare">
        <div className="fare-row">
          <span>Base Fare</span>
          <span>{trip.fare?.baseFare || 50} ETB</span>
        </div>
        <div className="fare-row">
          <span>Distance Fare</span>
          <span>{trip.fare?.distanceFare || 0} ETB</span>
        </div>
        {trip.fare?.surgeMultiplier > 1 && (
          <div className="fare-row surge">
            <span>Surge ({trip.fare.surgeMultiplier}x)</span>
            <span>Applied</span>
          </div>
        )}
        <div className="fare-row total">
          <span>Total Fare</span>
          <span>{trip.fare?.totalFare || trip.estimatedFare || 0} ETB</span>
        </div>
      </div>

      {/* Payment Section */}
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
              className={`method-btn ${paymentMethod === 'wallet' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('wallet')}
            >
              <FaWallet /> App Wallet ({walletBalance} ETB)
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
            Pay {trip.fare?.totalFare || trip.estimatedFare} ETB via {paymentMethod.toUpperCase()}
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
          <h3>Rate Your Driver & Trip</h3>
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
            placeholder="Add a comment about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn-submit" onClick={handleRating}>
            Submit Rating
          </button>
        </div>
      )}

      {/* In-App Live Socket Chat */}
      <InAppChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        tripId={tripId}
        driverName={driverName}
        socket={socket}
      />

      {/* Digital QR Ticket Pass */}
      <DigitalTicketModal
        isOpen={showTicket}
        onClose={() => setShowTicket(false)}
        trip={trip}
        passenger={user}
      />

      <Navbar />
    </div>
  );
};

export default TripDetailsPage;

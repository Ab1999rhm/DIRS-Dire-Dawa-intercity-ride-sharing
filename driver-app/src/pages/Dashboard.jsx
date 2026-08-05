import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { driverAPI } from '../services/api';
import { FaCar, FaMapMarkerAlt, FaPhone, FaCheck, FaTimes, FaPowerOff } from 'react-icons/fa';
import './Dashboard.css';

const DriverDashboard = () => {
  const { user, driverProfile, socket } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('new_ride_request', (data) => {
        setRideRequests(prev => [...prev, data.rideRequest]);
      });

      socket.on('trip_status', (data) => {
        if (currentTrip && data.tripId === currentTrip._id) {
          setCurrentTrip(prev => ({ ...prev, status: data.status }));
        }
      });

      return () => {
        socket.off('new_ride_request');
        socket.off('trip_status');
      };
    }
  }, [socket, currentTrip]);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);

    if (newStatus && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await driverAPI.updateLocation([longitude, latitude]);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const handleAcceptRide = async (rideRequestId) => {
    setLoading(true);
    try {
      const response = await driverAPI.acceptRide(rideRequestId);
      setCurrentTrip(response.data.trip);
      setRideRequests(prev => prev.filter(r => r._id !== rideRequestId));
    } catch (error) {
      console.error('Accept ride error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRide = async (rideRequestId) => {
    try {
      await driverAPI.declineRide(rideRequestId);
      setRideRequests(prev => prev.filter(r => r._id !== rideRequestId));
    } catch (error) {
      console.error('Decline ride error:', error);
    }
  };

  const handleStartTrip = async () => {
    try {
      await driverAPI.startTrip(currentTrip._id);
      setCurrentTrip(prev => ({ ...prev, status: 'in_progress' }));
    } catch (error) {
      console.error('Start trip error:', error);
    }
  };

  const handleCompleteTrip = async () => {
    try {
      await driverAPI.completeTrip(currentTrip._id);
      setCurrentTrip(null);
    } catch (error) {
      console.error('Complete trip error:', error);
    }
  };

  const handleConfirmArrival = async () => {
    try {
      await driverAPI.confirmArrival(currentTrip._id);
    } catch (error) {
      console.error('Confirm arrival error:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="driver-info">
          <h2>Welcome, {user?.firstName}</h2>
          <p className="verification-status">
            {driverProfile?.verificationStatus === 'approved' ? '✓ Verified' : 'Pending Verification'}
          </p>
        </div>
        <div className={`online-toggle ${isOnline ? 'online' : 'offline'}`}>
          <button onClick={toggleOnline}>
            <FaPowerOff />
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </header>

      {!currentTrip && rideRequests.length === 0 && (
        <div className="waiting-section">
          <div className="pulse-animation">
            <FaCar className="car-icon" />
          </div>
          <h3>{isOnline ? 'Waiting for ride requests...' : 'Go online to receive requests'}</h3>
          <p>{isOnline ? 'Stay in a good network area' : 'Toggle the online button to start'}</p>
        </div>
      )}

      {rideRequests.length > 0 && !currentTrip && (
        <div className="ride-requests-section">
          <h3>New Ride Requests ({rideRequests.length})</h3>
          {rideRequests.map((request) => (
            <div key={request._id} className="ride-request-card">
              <div className="request-header">
                <FaMapMarkerAlt className="pickup-icon" />
                <div className="request-info">
                  <p className="pickup">{request.pickupLocation?.address}</p>
                  <p className="dropoff">→ {request.dropoffLocation?.address}</p>
                </div>
              </div>
              <div className="request-details">
                <span className="fare">{request.estimatedFare} ETB</span>
                <span className="distance">{(request.route?.distance / 1000).toFixed(1)} km</span>
              </div>
              <div className="request-actions">
                <button
                  className="btn-decline"
                  onClick={() => handleDeclineRide(request._id)}
                  disabled={loading}
                >
                  <FaTimes /> Decline
                </button>
                <button
                  className="btn-accept"
                  onClick={() => handleAcceptRide(request._id)}
                  disabled={loading}
                >
                  <FaCheck /> Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentTrip && (
        <div className="current-trip-section">
          <h3>Current Trip</h3>
          <div className="trip-card">
            <div className="trip-route">
              <div className="route-point">
                <FaMapMarkerAlt className="pickup-icon" />
                <span>{currentTrip.pickupLocation?.address}</span>
              </div>
              <div className="route-line"></div>
              <div className="route-point">
                <FaMapMarkerAlt className="dropoff-icon" />
                <span>{currentTrip.dropoffLocation?.address}</span>
              </div>
            </div>

            <div className="trip-status">
              <span className={`status-badge ${currentTrip.status}`}>
                {currentTrip.status.replace('_', ' ')}
              </span>
            </div>

            <div className="trip-actions">
              {currentTrip.status === 'driver_arriving' && (
                <button className="btn-action" onClick={handleConfirmArrival}>
                  Confirm Arrival
                </button>
              )}
              {currentTrip.status === 'driver_arriving' && (
                <button className="btn-action" onClick={handleStartTrip}>
                  Start Trip
                </button>
              )}
              {currentTrip.status === 'in_progress' && (
                <button className="btn-complete" onClick={handleCompleteTrip}>
                  Complete Trip
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="quick-stats">
        <div className="stat-card">
          <span className="stat-value">{driverProfile?.totalTrips || 0}</span>
          <span className="stat-label">Total Trips</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{driverProfile?.availableBalance || 0}</span>
          <span className="stat-label">Balance (ETB)</span>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;

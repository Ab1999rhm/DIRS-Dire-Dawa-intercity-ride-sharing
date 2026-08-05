import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { ridesAPI } from '../services/api';
import { FaMapMarkerAlt, FaSearch, FaCar, FaBus, FaStar, FaHistory, FaUser } from 'react-icons/fa';
import './Home.css';

const HomePage = () => {
  const { user, socket } = useAuth();
  const {
    pickupLocation, dropoffLocation,
    selectPickup, selectDropoff,
    rideType, setRideType,
    estimatedFare, setEstimatedFare
  } = useRide();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rideOptions, setRideOptions] = useState([]);
  const [currentStep, setCurrentStep] = useState('search');
  const searchTimeout = useRef(null);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(async () => {
      if (query.length > 2) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&components=country:et`
          );
          const data = await response.json();
          setSearchResults(data.predictions || []);
        } catch (error) {
          console.error('Search error:', error);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
  }, []);

  const handleSelectLocation = async (prediction, type) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      const location = {
        address: prediction.description,
        coordinates: [
          data.result.geometry.location.lng,
          data.result.geometry.location.lat
        ],
        placeId: prediction.place_id
      };

      if (type === 'pickup') {
        selectPickup(location);
      } else {
        selectDropoff(location);
      }
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Get place details error:', error);
    }
  };

  const calculateFare = useCallback(() => {
    if (pickupLocation && dropoffLocation) {
      const distance = calculateDistance(
        pickupLocation.coordinates[1], pickupLocation.coordinates[0],
        dropoffLocation.coordinates[1], dropoffLocation.coordinates[0]
      );

      const baseFare = rideType === 'intra_city' ? 50 : 150;
      const perKm = rideType === 'intra_city' ? 15 : 20;
      const fare = baseFare + (distance * perKm);

      setEstimatedFare(Math.round(fare));
    }
  }, [pickupLocation, dropoffLocation, rideType, setEstimatedFare]);

  useEffect(() => {
    calculateFare();
  }, [calculateFare]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleBookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      return;
    }

    setLoading(true);
    try {
      const distance = calculateDistance(
        pickupLocation.coordinates[1], pickupLocation.coordinates[0],
        dropoffLocation.coordinates[1], dropoffLocation.coordinates[0]
      );

      const response = await ridesAPI.createRideRequest({
        rideType,
        pickupLocation,
        dropoffLocation,
        route: {
          distance: distance * 1000,
          duration: Math.round(distance * 2 * 60)
        },
        estimatedFare,
        passengersCount: 1
      });

      setCurrentStep('waiting');
      socket?.emit('join_trip', response.data.rideRequest._id);
    } catch (error) {
      console.error('Book ride error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    try {
      await ridesAPI.cancelRide('current-ride', 'User cancelled');
      setCurrentStep('search');
    } catch (error) {
      console.error('Cancel ride error:', error);
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="user-info">
          <FaUser className="user-icon" />
          <span>Welcome, {user?.firstName}</span>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => navigate('/history')}>
            <FaHistory />
          </button>
        </div>
      </header>

      <div className="search-section">
        <div className="ride-type-toggle">
          <button
            className={`type-btn ${rideType === 'intra_city' ? 'active' : ''}`}
            onClick={() => setRideType('intra_city')}
          >
            <FaCar /> Intra-City
          </button>
          <button
            className={`type-btn ${rideType === 'intercity' ? 'active' : ''}`}
            onClick={() => setRideType('intercity')}
          >
            <FaBus /> Intercity
          </button>
        </div>

        <div className="location-inputs">
          <div className="location-input">
            <FaMapMarkerAlt className="pickup-icon" />
            <input
              type="text"
              placeholder="Pickup location"
              value={pickupLocation?.address || searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="location-divider">
            <div className="divider-line"></div>
            <div className="divider-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="divider-line"></div>
          </div>

          <div className="location-input">
            <FaMapMarkerAlt className="dropoff-icon" />
            <input
              type="text"
              placeholder="Where to?"
              value={dropoffLocation?.address || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result) => (
              <div
                key={result.place_id}
                className="search-result-item"
                onClick={() => handleSelectLocation(
                  result,
                  !pickupLocation ? 'pickup' : 'dropoff'
                )}
              >
                <FaMapMarkerAlt />
                <span>{result.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {pickupLocation && dropoffLocation && currentStep === 'search' && (
        <div className="fare-section">
          <div className="fare-details">
            <div className="fare-row">
              <span>Distance</span>
              <span>{calculateDistance(
                pickupLocation.coordinates[1], pickupLocation.coordinates[0],
                dropoffLocation.coordinates[1], dropoffLocation.coordinates[0]
              ).toFixed(1)} km</span>
            </div>
            <div className="fare-row total">
              <span>Estimated Fare</span>
              <span>{estimatedFare} ETB</span>
            </div>
          </div>

          <button
            className="btn-book"
            onClick={handleBookRide}
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Book Ride'}
          </button>
        </div>
      )}

      {currentStep === 'waiting' && (
        <div className="waiting-section">
          <div className="waiting-animation">
            <div className="pulse"></div>
            <FaCar className="waiting-icon" />
          </div>
          <h3>Finding your driver...</h3>
          <p>Please wait while we match you with a nearby driver</p>
          <button className="btn-cancel" onClick={handleCancelRide}>
            Cancel Ride
          </button>
        </div>
      )}

      <div className="quick-actions">
        <button className="action-btn" onClick={() => navigate('/sos')}>
          <span className="sos-icon">SOS</span>
          <span>Emergency</span>
        </button>
        <button className="action-btn" onClick={() => navigate('/favorites')}>
          <FaStar />
          <span>Favorites</span>
        </button>
        <button className="action-btn" onClick={() => navigate('/profile')}>
          <FaUser />
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
};

export default HomePage;

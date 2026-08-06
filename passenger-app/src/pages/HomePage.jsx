import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { ridesAPI, promosAPI } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import VehicleCategorySelector, { VEHICLE_CATEGORIES } from '../components/VehicleCategorySelector';
import SeatPickerModal from '../components/SeatPickerModal';
import FareBreakdownModal from '../components/FareBreakdownModal';
import { FaMapMarkerAlt, FaCar, FaBus, FaCrosshairs, FaCalendarAlt, FaUsers, FaChair, FaTag, FaCalculator, FaWifi, FaSms } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Home.css';

const PRESET_LOCATIONS = [
  { address: 'Dire Dawa Airport (DIR), Dire Dawa', coordinates: [41.8542, 9.6247] },
  { address: 'Dire Dawa Railway Station, Kebele 01', coordinates: [41.8661, 9.5931] },
  { address: 'Taiwan Market, Dire Dawa', coordinates: [41.8612, 9.5982] },
  { address: 'Aselafi Hotel Area, Dire Dawa', coordinates: [41.8645, 9.5910] },
  { address: 'Kezira, Dire Dawa', coordinates: [41.8633, 9.5955] },
  { address: 'Megala, Dire Dawa', coordinates: [41.8700, 9.5880] },
  { address: 'Harar Bus Station, Harar', coordinates: [42.1286, 9.3139] },
  { address: 'Addis Ababa Bus Terminal, Addis Ababa', coordinates: [38.7469, 9.0300] },
  { address: 'Jigjiga Central Station, Jigjiga', coordinates: [42.7950, 9.3500] }
];

const HomePage = () => {
  const { user, socket, notifications } = useAuth();
  const {
    pickupLocation, dropoffLocation,
    selectPickup, selectDropoff,
    rideType, setRideType,
    estimatedFare, setEstimatedFare,
    currentRideRequestId, setCurrentRideRequestId,
    vehicleCategory, setVehicleCategory,
    selectedSeats, setSelectedSeats,
    appliedPromo, setAppliedPromo
  } = useRide();
  const navigate = useNavigate();

  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [activeInput, setActiveInput] = useState(null);
  const [passengersCount, setPassengersCount] = useState(1);
  const [departureTime, setDepartureTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('search');

  // Modals
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle auto-redirect when driver accepts ride
  useEffect(() => {
    const handleRideAccepted = (e) => {
      const data = e.detail;
      toast.success('A driver has accepted your ride request!');
      const tripId = data.tripId || data._id || data.trip?._id;
      if (tripId) {
        navigate(`/trip/${tripId}`);
      }
    };

    window.addEventListener('dirs_ride_accepted', handleRideAccepted);
    return () => window.removeEventListener('dirs_ride_accepted', handleRideAccepted);
  }, [navigate]);

  const handleGetCurrentLocation = (type) => {
    if ('geolocation' in navigator) {
      toast.info('Fetching current location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            address: `Current Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
            coordinates: [position.coords.longitude, position.coords.latitude]
          };
          if (type === 'pickup') {
            selectPickup(loc);
            setPickupSearch(loc.address);
          } else {
            selectDropoff(loc);
            setDropoffSearch(loc.address);
          }
          setActiveInput(null);
          toast.success('Location set!');
        },
        (err) => {
          console.error('GPS Error:', err);
          toast.error('Unable to fetch current location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateFare = useCallback(() => {
    if (pickupLocation && dropoffLocation) {
      const dist = calculateDistance(
        pickupLocation.coordinates[1],
        pickupLocation.coordinates[0],
        dropoffLocation.coordinates[1],
        dropoffLocation.coordinates[0]
      );

      const base = vehicleCategory?.baseFare || (rideType === 'intra_city' ? 50 : 150);
      const perKm = vehicleCategory?.perKm || (rideType === 'intra_city' ? 15 : 20);
      let grossFare = (base + dist * perKm) * (rideType === 'intercity' ? passengersCount : 1);

      if (appliedPromo) {
        grossFare = Math.max(20, grossFare - appliedPromo.discountAmount);
      }

      setEstimatedFare(Math.round(grossFare));
    }
  }, [pickupLocation, dropoffLocation, rideType, passengersCount, vehicleCategory, appliedPromo, setEstimatedFare]);

  useEffect(() => {
    calculateFare();
  }, [calculateFare]);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    try {
      if (promoCodeInput.toUpperCase() === 'DIRE2026') {
        const discount = 30;
        setAppliedPromo({ code: 'DIRE2026', discountAmount: discount });
        toast.success(`Promo DIRE2026 applied! You saved 30 ETB.`);
      } else {
        toast.error('Invalid promo code');
      }
    } catch (err) {
      toast.error('Failed to validate promo code');
    }
  };

  const handleBookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      toast.warning('Please select pickup and dropoff locations');
      return;
    }

    setLoading(true);
    try {
      const distance = calculateDistance(
        pickupLocation.coordinates[1],
        pickupLocation.coordinates[0],
        dropoffLocation.coordinates[1],
        dropoffLocation.coordinates[0]
      );

      const response = await ridesAPI.createRideRequest({
        rideType,
        vehicleCategory: vehicleCategory?.id,
        pickupLocation,
        dropoffLocation,
        seats: selectedSeats,
        route: {
          distance: Math.round(distance * 1000),
          duration: Math.round(distance * 2 * 60)
        },
        estimatedFare,
        passengersCount,
        scheduledTime: departureTime || undefined
      });

      const newRideId = response.data.rideRequest?._id || response.data._id;
      if (newRideId) {
        setCurrentRideRequestId(newRideId);
        socket?.emit('join_trip', newRideId);
      }

      setCurrentStep('waiting');
      toast.success('Ride request broadcasted to nearby drivers');
    } catch (error) {
      console.error('Book ride error:', error);
      toast.error(error.response?.data?.error || 'Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    try {
      const rideIdToCancel = currentRideRequestId || 'current-ride';
      await ridesAPI.cancelRide(rideIdToCancel, 'User cancelled from app');
      setCurrentStep('search');
      setCurrentRideRequestId(null);
      toast.info('Ride request cancelled');
    } catch (error) {
      console.error('Cancel ride error:', error);
      setCurrentStep('search');
    }
  };

  const handleSMSFallback = () => {
    const textBody = `DIRS RIDE ${rideType} ${vehicleCategory?.id} FROM ${pickupLocation?.address || 'Pickup'} TO ${dropoffLocation?.address || 'Dropoff'}`;
    window.location.href = `sms:+251911000000?body=${encodeURIComponent(textBody)}`;
  };

  const filterPreset = (query) => {
    if (!query) return PRESET_LOCATIONS;
    return PRESET_LOCATIONS.filter((item) =>
      item.address.toLowerCase().includes(query.toLowerCase())
    );
  };

  const distanceKm = pickupLocation && dropoffLocation
    ? calculateDistance(pickupLocation.coordinates[1], pickupLocation.coordinates[0], dropoffLocation.coordinates[1], dropoffLocation.coordinates[0])
    : 5;

  return (
    <div className="home-container">
      {!isOnline && (
        <div className="offline-banner">
          <span><FaWifi /> Offline Mode — Network Disconnected</span>
          <button onClick={handleSMSFallback}><FaSms /> Book via SMS</button>
        </div>
      )}

      <header className="home-header">
        <div className="user-info">
          <div className="avatar-circle">{user?.firstName?.charAt(0) || 'U'}</div>
          <div>
            <h3 style={{ fontSize: '15px', color: '#333' }}>Hi, {user?.firstName || 'Passenger'}</h3>
            <span style={{ fontSize: '12px', color: '#777' }}>Where are you going today?</span>
          </div>
        </div>
        <div className="header-actions">
          <NotificationBell notifications={notifications} />
        </div>
      </header>

      <div className="search-section">
        <div className="ride-type-toggle">
          <button
            className={`type-btn ${rideType === 'intra_city' ? 'active' : ''}`}
            onClick={() => {
              setRideType('intra_city');
              setVehicleCategory(VEHICLE_CATEGORIES[1]); // Economy
            }}
          >
            <FaCar /> Intra-City (Dire Dawa)
          </button>
          <button
            className={`type-btn ${rideType === 'intercity' ? 'active' : ''}`}
            onClick={() => {
              setRideType('intercity');
              setVehicleCategory(VEHICLE_CATEGORIES[3]); // Minibus
            }}
          >
            <FaBus /> Intercity Ride
          </button>
        </div>

        <div className="location-inputs">
          <div className="location-input">
            <FaMapMarkerAlt className="pickup-icon" />
            <input
              type="text"
              placeholder="Pickup location..."
              value={pickupLocation?.address || pickupSearch}
              onFocus={() => setActiveInput('pickup')}
              onChange={(e) => {
                setPickupSearch(e.target.value);
                setActiveInput('pickup');
              }}
            />
            <button
              className="gps-btn"
              type="button"
              onClick={() => handleGetCurrentLocation('pickup')}
              title="Use current GPS location"
            >
              <FaCrosshairs />
            </button>
          </div>

          <div className="location-divider">
            <div className="divider-line"></div>
          </div>

          <div className="location-input">
            <FaMapMarkerAlt className="dropoff-icon" />
            <input
              type="text"
              placeholder="Where to?"
              value={dropoffLocation?.address || dropoffSearch}
              onFocus={() => setActiveInput('dropoff')}
              onChange={(e) => {
                setDropoffSearch(e.target.value);
                setActiveInput('dropoff');
              }}
            />
            <button
              className="gps-btn"
              type="button"
              onClick={() => handleGetCurrentLocation('dropoff')}
              title="Use current GPS location"
            >
              <FaCrosshairs />
            </button>
          </div>
        </div>

        {/* Suggestions list */}
        {activeInput && (
          <div className="search-results">
            <div className="suggestions-header">
              <span>Popular Locations</span>
              <button onClick={() => setActiveInput(null)}>Close</button>
            </div>
            {filterPreset(activeInput === 'pickup' ? pickupSearch : dropoffSearch).map(
              (place, idx) => (
                <div
                  key={idx}
                  className="search-result-item"
                  onClick={() => {
                    if (activeInput === 'pickup') {
                      selectPickup(place);
                      setPickupSearch(place.address);
                    } else {
                      selectDropoff(place);
                      setDropoffSearch(place.address);
                    }
                    setActiveInput(null);
                  }}
                >
                  <FaMapMarkerAlt style={{ color: '#1a73e8' }} />
                  <span>{place.address}</span>
                </div>
              )
            )}
          </div>
        )}

        {/* Real World Production: Vehicle Category Selector */}
        <VehicleCategorySelector
          selectedCategory={vehicleCategory}
          onSelectCategory={setVehicleCategory}
          rideType={rideType}
          distanceKm={distanceKm}
          passengersCount={passengersCount}
        />

        {/* Extra Intercity / Booking Fields */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="extra-field">
            <label><FaUsers /> Seats</label>
            <select
              value={passengersCount}
              onChange={(e) => setPassengersCount(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Seat' : 'Seats'}
                </option>
              ))}
            </select>
          </div>

          {rideType === 'intercity' && (
            <>
              <div className="extra-field">
                <label><FaCalendarAlt /> Departure Date/Time</label>
                <input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
              </div>

              <div className="extra-field" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="seat-picker-btn"
                  onClick={() => setShowSeatPicker(true)}
                >
                  <FaChair /> {selectedSeats.length > 0 ? `Seats: ${selectedSeats.join(', ')}` : 'Pick Bus Seats'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Promo Code Input */}
        <div className="promo-input-row">
          <FaTag className="promo-icon" />
          <input
            type="text"
            placeholder="Enter Promo Code (e.g. DIRE2026)"
            value={promoCodeInput}
            onChange={(e) => setPromoCodeInput(e.target.value)}
          />
          <button type="button" className="apply-promo-btn" onClick={handleApplyPromo}>
            Apply
          </button>
        </div>
      </div>

      {/* Map visualizer preview */}
      <div style={{ padding: '0 16px', marginBottom: '16px' }}>
        <MapView
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          height="180px"
        />
      </div>

      {pickupLocation && dropoffLocation && currentStep === 'search' && (
        <div className="fare-section">
          <div className="fare-details">
            <div className="fare-row">
              <span>Distance</span>
              <span>{distanceKm.toFixed(1)} km</span>
            </div>
            <div className="fare-row">
              <span>Vehicle Category</span>
              <span>{vehicleCategory?.name || 'Economy'}</span>
            </div>
            {appliedPromo && (
              <div className="fare-row promo-applied">
                <span>Promo Discount ({appliedPromo.code})</span>
                <span>-{appliedPromo.discountAmount} ETB</span>
              </div>
            )}
            <div className="fare-row total">
              <span>Estimated Total Fare</span>
              <span>{estimatedFare} ETB</span>
            </div>
          </div>

          <button
            type="button"
            className="breakdown-link-btn"
            onClick={() => setShowFareBreakdown(true)}
          >
            <FaCalculator /> View Itemized Fare Breakdown
          </button>

          <button
            className="btn-book"
            onClick={handleBookRide}
            disabled={loading}
          >
            {loading ? 'Booking Ride...' : `Book ${vehicleCategory?.name || 'Ride'}`}
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
          <p>Connecting with nearby {vehicleCategory?.name || 'drivers'} in Dire Dawa area</p>
          <button className="btn-cancel" onClick={handleCancelRide}>
            Cancel Ride Request
          </button>
        </div>
      )}

      {/* Modals */}
      <SeatPickerModal
        isOpen={showSeatPicker}
        onClose={() => setShowSeatPicker(false)}
        selectedSeats={selectedSeats}
        onConfirmSeats={setSelectedSeats}
        passengersCount={passengersCount}
      />

      <FareBreakdownModal
        isOpen={showFareBreakdown}
        onClose={() => setShowFareBreakdown(false)}
        fareDetails={{
          baseFare: vehicleCategory?.baseFare || 50,
          distanceKm: distanceKm,
          perKmRate: vehicleCategory?.perKm || 15,
          surgeMultiplier: 1.0,
          promoDiscount: appliedPromo ? appliedPromo.discountAmount : 0,
          totalFare: estimatedFare,
          categoryName: vehicleCategory?.name
        }}
      />

      <Navbar />
    </div>
  );
};

export default HomePage;

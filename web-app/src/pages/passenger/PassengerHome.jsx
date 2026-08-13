import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCar, FaMapMarkerAlt, FaCreditCard, FaStar, FaHistory, FaExclamationTriangle,
  FaExchangeAlt, FaClock, FaMoneyBillWave, FaPhone, FaRoute, FaWallet,
  FaUserShield, FaUsers, FaMobileAlt, FaBell, FaMotorcycle,
  FaShuttleVan, FaBus, FaBolt, FaShareAlt, FaTimes, FaCheck, FaChevronRight,
  FaLocationArrow, FaSpinner, FaTimesCircle, FaSmile, FaThumbsUp, FaTag, FaChair, FaComments, FaQrcode, FaWifi, FaSms, FaCalculator, FaArrowRight
} from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FlexibleMap from '../../components/common/FlexibleMap';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, ratingsAPI, sosAPI, paymentsAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import Modal, { ConfirmModal } from '../../components/common/Modal';
import VehicleCategorySelector from '../../components/passenger/VehicleCategorySelector';
import SeatPickerModal from '../../components/passenger/SeatPickerModal';
import DigitalTicketModal from '../../components/passenger/DigitalTicketModal';
import InAppChat from '../../components/passenger/InAppChat';
import FareBreakdownModal from '../../components/passenger/FareBreakdownModal';
import WalletTopupModal from '../../components/passenger/WalletTopupModal';
import './Passenger.css';

const SOS_TYPES = [
  { type: 'accident', label: '🚗 Accident' },
  { type: 'medical', label: '🚑 Medical Emergency' },
  { type: 'harassment', label: '👮 Harassment / Security' },
  { type: 'theft', label: '💰 Theft' },
  { type: 'fire', label: '🔥 Fire' },
  { type: 'breakdown', label: '⚙️ Vehicle Breakdown' },
  { type: 'other', label: '⚠️ Other Emergency' },
];

// Import VEHICLE_CATEGORIES as the single source of truth for vehicle data
import { VEHICLE_CATEGORIES } from '../../components/passenger/VehicleCategorySelector';

// Normalise VEHICLE_CATEGORIES into the shape PassengerHome expects:
// adds .label (= .name), .priceKm (= .perKm), .priceMin, .color
const VEHICLES = VEHICLE_CATEGORIES.map(c => ({
  ...c,
  label: c.name,
  priceKm: c.perKm,
  priceMin: c.id === 'bajaj' ? 2 : c.id === 'economy' ? 3 : c.id === 'comfort' ? 4 : 2,
  color: c.id === 'bajaj' ? '#10b981' : c.id === 'economy' ? '#2563eb' : c.id === 'comfort' ? '#8b5cf6' : '#ef4444',
}));

const pickupIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#16a34a;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const dropoffIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#dc2626;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">D</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const driverIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#2563eb;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">&#128663;</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function haversineDistance(lat1, lon1, lat2, lon2) {
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
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── Dire Dawa Intra-City Locations (neighborhoods, markets, hospitals, schools, landmarks) ───
const DIRE_DAWA_PLACES = [
  // Neighborhoods / Ketena
  { label: 'Sabian, Dire Dawa', lat: 9.5950, lon: 41.8600 },
  { label: 'Kezira, Dire Dawa', lat: 9.6080, lon: 41.8450 },
  { label: 'Addis Ketema, Dire Dawa', lat: 9.5990, lon: 41.8530 },
  { label: 'Gendekore, Dire Dawa', lat: 9.6120, lon: 41.8390 },
  { label: 'Dire Dawa City Center', lat: 9.6009, lon: 41.8508 },
  { label: 'Melka Jebdu, Dire Dawa', lat: 9.5880, lon: 41.8700 },
  { label: 'Legehare, Dire Dawa', lat: 9.6050, lon: 41.8470 },
  { label: 'Taiwan, Dire Dawa', lat: 9.6030, lon: 41.8540 },
  { label: 'Ashewa, Dire Dawa', lat: 9.6090, lon: 41.8610 },
  { label: 'Megala, Dire Dawa', lat: 9.5910, lon: 41.8650 },
  { label: 'Buramedo, Dire Dawa', lat: 9.5870, lon: 41.8430 },
  { label: 'Kebele 01, Dire Dawa', lat: 9.6015, lon: 41.8495 },
  { label: 'Kebele 05, Dire Dawa', lat: 9.6035, lon: 41.8515 },
  { label: 'Kebele 08, Dire Dawa', lat: 9.5970, lon: 41.8560 },

  // Markets & Commercial
  { label: 'Dire Dawa Main Market (Kezira Market)', lat: 9.6072, lon: 41.8445 },
  { label: 'Taiwan Market, Dire Dawa', lat: 9.6028, lon: 41.8542 },
  { label: 'Sabian Market, Dire Dawa', lat: 9.5955, lon: 41.8605 },
  { label: 'Katar Market, Dire Dawa', lat: 9.5985, lon: 41.8480 },
  { label: 'Jijiga Ber Market, Dire Dawa', lat: 9.6100, lon: 41.8380 },

  // Hospitals & Health
  { label: 'Dire Dawa Referral Hospital', lat: 9.6015, lon: 41.8430 },
  { label: 'Dil Chora Hospital, Dire Dawa', lat: 9.6055, lon: 41.8555 },
  { label: 'Sabian Health Center, Dire Dawa', lat: 9.5940, lon: 41.8610 },
  { label: 'Dilchora Referral Hospital', lat: 9.6058, lon: 41.8558 },
  { label: 'Red Cross Clinic, Dire Dawa', lat: 9.6010, lon: 41.8470 },

  // Schools & Universities
  { label: 'Dire Dawa University', lat: 9.6133, lon: 41.8617 },
  { label: 'Dire Dawa Preparatory School', lat: 9.6020, lon: 41.8510 },
  { label: 'Kezira Primary School, Dire Dawa', lat: 9.6075, lon: 41.8448 },
  { label: 'Sabian Secondary School', lat: 9.5960, lon: 41.8595 },
  { label: 'Dire Dawa TVET College', lat: 9.6040, lon: 41.8500 },

  // Transport & Hotels
  { label: 'Dire Dawa Bus Station (Autobus Tera)', lat: 9.6005, lon: 41.8398 },
  { label: 'Dire Dawa Railway Station', lat: 9.5998, lon: 41.8462 },
  { label: 'Dire Dawa Airport', lat: 9.6247, lon: 41.8542 },
  { label: 'Samrat Hotel, Dire Dawa', lat: 9.6018, lon: 41.8488 },
  { label: 'Ras Hotel, Dire Dawa', lat: 9.6022, lon: 41.8505 },
  { label: 'Ethiopia Hotel, Dire Dawa', lat: 9.6012, lon: 41.8498 },

  // Government & Landmarks
  { label: 'Dire Dawa City Administration', lat: 9.6008, lon: 41.8492 },
  { label: 'Dire Dawa Police Station', lat: 9.6002, lon: 41.8478 },
  { label: 'Dire Dawa Post Office', lat: 9.6011, lon: 41.8501 },
  { label: 'Commercial Bank of Ethiopia, Dire Dawa', lat: 9.6015, lon: 41.8505 },
  { label: 'Awash Bank, Dire Dawa', lat: 9.6020, lon: 41.8510 },
  { label: 'Dire Dawa Stadium', lat: 9.6085, lon: 41.8440 },
  { label: 'Central Mosque, Dire Dawa', lat: 9.6009, lon: 41.8520 },
  { label: 'St. Gabriel Church, Dire Dawa', lat: 9.5995, lon: 41.8490 },
];

// ─── Intercity / National destinations ───
const INTERCITY_PLACES = [
  { label: 'Harar, Ethiopia', lat: 9.3115, lon: 42.1199 },
  { label: 'Jigjiga, Ethiopia', lat: 9.3506, lon: 42.7933 },
  { label: 'Addis Ababa, Ethiopia', lat: 9.0192, lon: 38.7525 },
  { label: 'Adama (Nazret), Ethiopia', lat: 8.5400, lon: 39.2700 },
  { label: 'Hawassa, Ethiopia', lat: 7.0621, lon: 38.4763 },
  { label: 'Bahir Dar, Ethiopia', lat: 11.5938, lon: 37.3909 },
  { label: 'Mekelle, Ethiopia', lat: 13.4967, lon: 39.4753 },
  { label: 'Jimma, Ethiopia', lat: 7.6789, lon: 36.8340 },
  { label: 'Dessie, Ethiopia', lat: 11.1321, lon: 39.6353 },
  { label: 'Chiro, West Hararghe', lat: 9.0667, lon: 40.8667 },
  { label: 'Asebe Teferi, Oromia', lat: 9.0667, lon: 40.8667 },
];

const HARDCODED_CITIES = [...DIRE_DAWA_PLACES, ...INTERCITY_PLACES];

const isWithinDireDawa = (label, coords) => {
  if (label && label.toLowerCase().includes('dire dawa')) return true;
  if (coords && coords.length === 2) {
    const [lat, lon] = coords;
    return lat >= 9.55 && lat <= 9.66 && lon >= 41.80 && lon <= 41.92;
  }
  return false;
};

const PassengerHome = () => {
  const { t } = useLanguage();
  const { user, socket, tripStatusUpdate, rideAccepted, driverLocation, notifications } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [rideType, setRideType] = useState('intraCity');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [rideState, setRideState] = useState('idle');
  const [bookingStep, setBookingStep] = useState(1);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [completedRide, setCompletedRide] = useState(null);
  const [rating, setRating] = useState(0);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalTrips: 0, totalSpent: 0, favoriteRoutes: 0 });
  const [mapCenter, setMapCenter] = useState([9.6009, 41.8508]);
  const [promoCode, setPromoCode] = useState('');
  const [surgeMultiplier, setSurgeMultiplier] = useState(1);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingTags, setRatingTags] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [driverLocationState, setDriverLocationState] = useState(null);
  const [searchingDrivers, setSearchingDrivers] = useState(0);
  const [foundDriverInfo, setFoundDriverInfo] = useState(null);
  const [driverArrived, setDriverArrived] = useState(false);
  const [liveFare, setLiveFare] = useState(0);
  const [tripTimer, setTripTimer] = useState(0);
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  // Real-world production state
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengersCount, setPassengersCount] = useState(1);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showWalletTopup, setShowWalletTopup] = useState(false);
  const [walletBalance, setWalletBalance] = useState(150);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosLocation, setSosLocation] = useState(null);
  const [sosSending, setSosSending] = useState(false);
  const [sosType, setSosType] = useState(null);
  const [sosDescription, setSosDescription] = useState('');

  useEffect(() => {
    if (dropoff) {
      setRideType(isWithinDireDawa(dropoff, dropoffCoords) ? 'intraCity' : 'intercity');
      setBookingStep(prev => Math.max(prev, 2));
    }
  }, [dropoff, dropoffCoords]);

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

  const handleSMSFallback = () => {
    const textBody = `DIRS RIDE ${rideType} ${selectedVehicle?.id || 'standard'} FROM ${pickup || 'Pickup'} TO ${dropoff || 'Dropoff'}`;
    window.location.href = `sms:+251911000000?body=${encodeURIComponent(textBody)}`;
  };

  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const searchingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => { fetchRecentTrips(); fetchStats(); }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter([lat, lng]);
        setPickupCoords([lat, lng]);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' }, signal: controller.signal }
          );
          clearTimeout(timeoutId);
          const data = await res.json();
          if (data.display_name) setPickup(data.display_name);
        } catch (_) {
          setPickup('Current Location');
        }
      },
      () => {
        setMapCenter([9.6009, 41.8508]);
        setPickupCoords([9.6009, 41.8508]);
        setPickup('Dire Dawa, Ethiopia');
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (rideAccepted && activeRide && rideState === 'searching') {
      setFoundDriverInfo(rideAccepted.driver || {
        name: rideAccepted.driverName || 'Driver',
        phone: rideAccepted.driverPhone || '',
        rating: rideAccepted.driverRating || 4.5,
        vehicle: rideAccepted.vehicle || { make: 'Car', model: '', color: 'White', plateNumber: '--' },
      });
      setRideState('driver_found');

      if (rideAccepted.tripId && socket) {
        socket.emit('join_trip', rideAccepted.tripId);
      }
    }
  }, [rideAccepted, activeRide, rideState, socket]);

  // Restore an existing active trip on mount so the passenger always sees
  // the live ride card (with Call / Chat / Share / SOS) after a reload.
  useEffect(() => {
    let cancelled = false;
    const restoreActiveRide = async () => {
      try {
        const res = await ridesAPI.passengerTrips({ limit: 100 });
        if (cancelled) return;
        const trips = res.data?.trips || [];
        const active = trips.find((t) => ['driver_arriving', 'driver_arrived', 'in_progress'].includes(t.status));
        if (!active) return;

        const rawDriver = active.driver || {};
        const du = rawDriver.user || {};
        setActiveRide(active);
        setFoundDriverInfo({
          id: rawDriver._id,
          name: (du.firstName ? `${du.firstName} ${du.lastName || ''}`.trim() : 'Driver'),
          phone: rawDriver.phoneNumber || du.phoneNumber || '',
          rating: rawDriver.rating?.average ?? rawDriver.rating ?? '4.5',
          profilePhoto: du.profilePhoto || '',
          vehicle: {
            make: rawDriver.vehicle?.make || 'Car',
            model: rawDriver.vehicle?.model || '',
            color: rawDriver.vehicle?.color || 'White',
            plateNumber: rawDriver.vehicle?.plateNumber || '--'
          }
        });

        if (active.status === 'driver_arriving') {
          setRideState('driver_arriving');
        } else {
          if (active.status === 'driver_arrived') setDriverArrived(true);
          setRideState('in_trip');
        }
        const fareVal = Number(active.fare?.totalFare) || Number(active.fare?.total) || Number(active.estimatedFare) || 0;
        if (fareVal) setLiveFare(fareVal);
      } catch (err) {
        console.error('Failed to restore active ride:', err);
      }
    };
    restoreActiveRide();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (driverLocation && rideState === 'driver_found') {
      setDriverLocationState(driverLocation);
    }
  }, [driverLocation, rideState]);

  useEffect(() => {
    if (tripStatusUpdate && activeRide) {
      const status = tripStatusUpdate.status;
      if (status === 'driver_arriving') {
        setRideState('driver_arriving');
      } else if (status === 'driver_arrived') {
        setDriverArrived(true);
        toast.success('Your driver has arrived!');
      } else if (status === 'in_progress') {
        setRideState('in_trip');
        setTripTimer(0);
        if (activeRide?.estimatedFare) setLiveFare(activeRide.estimatedFare);
      } else if (status === 'completed') {
        setCompletedRide(tripStatusUpdate.ride || activeRide);
        setRideState('complete');
        clearInterval(timerIntervalRef.current);
      } else if (status === 'cancelled') {
        toast.warning('Ride was cancelled');
        resetBookingState();
      }
    }
  }, [tripStatusUpdate, activeRide, toast]);

  useEffect(() => {
    if (rideState === 'in_trip') {
      timerIntervalRef.current = setInterval(() => {
        setTripTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [rideState]);

  const resetBookingState = () => {
    setRideState('idle');
    setBookingStep(1);
    setActiveRide(null);
    setFoundDriverInfo(null);
    setDriverLocationState(null);
    setDriverArrived(false);
    setLiveFare(0);
    setTripTimer(0);
    setSearchingDrivers(0);
    setSelectedVehicle(null);
    setSelectedSeats([]);
    setPromoCode('');
    setScheduleEnabled(false);
    setScheduledTime('');
    clearInterval(searchingIntervalRef.current);
    clearInterval(timerIntervalRef.current);
  };

  const fetchRecentTrips = async () => {
    try {
      const res = await ridesAPI.passengerTrips({ limit: 3, status: 'completed' });
      setRecentTrips(res.data.trips || []);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await ridesAPI.passengerTrips({ limit: 100 });
      const trips = res.data.trips || [];
      const totalSpent = trips.reduce((sum, t) => sum + (Number(t.fare?.totalFare) || Number(t.fare?.total) || 0), 0);
      const uniqueRoutes = new Set(
        trips.map((t) => `${t.pickupLocation?.address}-${t.dropoffLocation?.address}`)
      ).size;
      setStats({ totalTrips: trips.length, totalSpent, favoriteRoutes: uniqueRoutes });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchSuggestions = useCallback(
    debounce(async (query, setter) => {
      if (query.length < 2) {
        setter([]);
        return;
      }
      const lowerQuery = query.toLowerCase();

      // For intraCity, only show Dire Dawa places first; for intercity show all
      const localPool = rideType === 'intraCity'
        ? [...DIRE_DAWA_PLACES, ...INTERCITY_PLACES]
        : [...INTERCITY_PLACES, ...DIRE_DAWA_PLACES];

      const localMatches = localPool.filter(c =>
        c.label.toLowerCase().includes(lowerQuery)
      );

      if (query.length < 3) {
        setter(localMatches.slice(0, 8));
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Bias search toward Dire Dawa bounding box for intraCity
        const isDireSearch = rideType === 'intraCity';
        const viewbox = isDireSearch
          ? '&viewbox=41.80,9.55,41.92,9.66&bounded=1'
          : '';
        const countrycodes = '&countrycodes=et';

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6${countrycodes}${viewbox}`,
          {
            headers: { 'Accept-Language': 'en' },
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        const data = await res.json();
        const remoteResults = data.map((item) => ({
          label: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));

        // Local Dire Dawa places always appear first, then remote
        const combined = [...localMatches, ...remoteResults];
        const seen = new Set();
        const unique = combined.filter(item => {
          const key = `${parseFloat(item.lat).toFixed(3)},${parseFloat(item.lon).toFixed(3)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setter(unique.slice(0, 8));
      } catch (_) {
        setter(localMatches.slice(0, 8));
      }
    }, 400),
    [rideType]
  );

  const swapLocations = () => {
    setPickup(dropoff);
    setDropoff(pickup);
    setPickupCoords(dropoffCoords);
    setDropoffCoords(pickupCoords);
  };

  const calcFare = (vehicle) => {
    if (!vehicle) return { base: 0, distance: 0, time: 0, platform: 0, total: 0, promoDiscount: 0, distKm: 5 };
    const base = vehicle.baseFare;
    let distKm = 5;
    if (pickupCoords && dropoffCoords) {
      distKm = haversineDistance(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]);
    }
    const distance = Math.round(vehicle.priceKm * distKm);
    const time = Math.round(vehicle.priceMin * Math.max(5, Math.round(distKm * 2)));
    const platform = Math.round((base + distance + time) * 0.1);
    let grossTotal = Math.round((base + distance + time + platform) * surgeMultiplier);
    if (rideType === 'intercity') {
      grossTotal = grossTotal * (passengersCount || 1);
    }
    let promoDiscount = 0;
    if (promoCode && promoCode.toUpperCase() === 'DIRE2026') {
      promoDiscount = 30;
    }
    const total = Math.max(20, grossTotal - promoDiscount);
    return { base, distance, time, platform, total, promoDiscount, distKm };
  };

  const hasBothLocations = pickupCoords && dropoffCoords;
  const fare = calcFare(selectedVehicle || VEHICLES[0]);

  const handleOpenBookingConfirm = () => {
    if (!pickup.trim() || !dropoff.trim()) {
      toast.error('Please enter pickup and dropoff locations');
      return;
    }
    if (!pickupCoords || !dropoffCoords) {
      toast.error('Please select addresses from suggestions');
      return;
    }
    if (!selectedVehicle) {
      setSelectedVehicle(VEHICLES[0]);
    }
    setShowBookingConfirm(true);
  };

  const handleConfirmBooking = async () => {
    setShowBookingConfirm(false);
    setLoading(true);
    setRideState('searching');
    setSearchingDrivers(1);
    setFoundDriverInfo(null);
    setDriverLocationState(null);

    searchingIntervalRef.current = setInterval(() => {
      setSearchingDrivers(prev => {
        if (prev >= 8) {
          clearInterval(searchingIntervalRef.current);
          return 8;
        }
        return prev + 1;
      });
    }, 600);

    const currentVehicle = selectedVehicle || VEHICLES[0];

    try {
      const fareCalc = calcFare(currentVehicle);
      const res = await ridesAPI.create({
        pickupLocation: { address: pickup, coordinates: pickupCoords },
        dropoffLocation: { address: dropoff, coordinates: dropoffCoords },
        rideType,
        vehicleType: currentVehicle.id,
        paymentMethod,
        estimatedFare: fareCalc.total,
        promoCode: promoCode || undefined,
        scheduledTime: scheduleEnabled && scheduledTime ? new Date(scheduledTime).toISOString() : undefined,
      });

      const rideData = res.data.rideRequest || res.data.ride || {
        _id: res.data.rideRequestId || 'demo-' + Date.now(),
        pickupLocation: { address: pickup, coordinates: pickupCoords },
        dropoffLocation: { address: dropoff, coordinates: dropoffCoords },
        estimatedFare: fareCalc.total,
        vehicleType: currentVehicle.id,
        rideType,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setActiveRide(rideData);

      // Persist ride to local storage so it instantly appears in My Trips & History
      try {
        const localRides = JSON.parse(localStorage.getItem('dirs_passenger_rides') || '[]');
        const updated = [rideData, ...localRides.filter(r => r._id !== rideData._id)];
        localStorage.setItem('dirs_passenger_rides', JSON.stringify(updated));
      } catch (_) {}

      if (socket) {
        socket.emit('ride_request', {
          rideRequestId: rideData._id,
          pickupLocation: { address: pickup, coordinates: pickupCoords },
          dropoffLocation: { address: dropoff, coordinates: dropoffCoords },
          vehicleType: currentVehicle.id,
          estimatedFare: fareCalc.total,
          passengerId: user?._id,
        });
      }

      // Only run auto-match fallback if single-device demo mode is enabled
      if (isDemoMode) {
        setTimeout(() => {
          setRideState((currentState) => {
            if (currentState === 'searching') {
              clearInterval(searchingIntervalRef.current);
              const demoDriver = {
                name: 'Abebe Kebede (Verified Driver)',
                phone: '+251911889900',
                rating: '4.9',
                vehicle: {
                  make: currentVehicle.label,
                  model: '2024 Edition',
                  color: 'Blue & White',
                  plateNumber: 'DIR-3-B4592'
                }
              };
              setFoundDriverInfo(demoDriver);
              toast.success(`Driver Abebe accepted your ${currentVehicle.label} ride!`);

              // Update persisted ride status
              try {
                const localRides = JSON.parse(localStorage.getItem('dirs_passenger_rides') || '[]');
                const matchedRide = { ...rideData, status: 'accepted', driver: { firstName: 'Abebe', lastName: 'Kebede', rating: 4.9, phoneNumber: '+251911889900' } };
                const updated = [matchedRide, ...localRides.filter(r => r._id !== rideData._id)];
                localStorage.setItem('dirs_passenger_rides', JSON.stringify(updated));
              } catch (_) {}

              return 'driver_found';
            }
            return currentState;
          });
        }, 3500);
      } else {
        // Real mode: timeout after 30 seconds if no driver found
        setTimeout(() => {
          setRideState((currentState) => {
            if (currentState === 'searching') {
              clearInterval(searchingIntervalRef.current);
              setRideState('no_driver');
              return 'no_driver';
            }
            return currentState;
          });
        }, 30000);
      }

    } catch (err) {
      console.warn('Backend API note:', err);
      // Fallback for seamless demo testing if backend request fails
      setTimeout(() => {
        setRideState((currentState) => {
          if (currentState === 'searching') {
            clearInterval(searchingIntervalRef.current);
            setFoundDriverInfo({
              name: 'Abebe Kebede (Verified Driver)',
              phone: '+251911889900',
              rating: '4.9',
              vehicle: {
                make: currentVehicle.label,
                model: '2024 Edition',
                color: 'Blue & White',
                plateNumber: 'DIR-3-B4592'
              }
            });
            toast.success(`Driver matched: ${currentVehicle.label}!`);
            return 'driver_found';
          }
          return currentState;
        });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (activeRide?._id && activeRide._id !== 'demo') {
      try {
        await ridesAPI.cancel(activeRide._id, 'Cancelled by passenger');
      } catch (err) {
        console.error(err);
      }
    }
    toast.success('Ride cancelled');
    resetBookingState();
  };

  const handleSubmitRating = async () => {
    if (activeRide?._id && activeRide._id !== 'demo' && rating > 0) {
      try {
        const fullComment = [...ratingTags, ratingComment].filter(Boolean).join(', ');
        await ratingsAPI.create(activeRide._id, { rating, comment: fullComment });
      } catch (err) {
        console.error(err);
      }
    }
    toast.success('Thank you for your feedback!');
    resetBookingState();
    setCompletedRide(null);
    setRating(0);
    setRatingComment('');
    setRatingTags([]);
    setPickup('');
    setDropoff('');
    setPickupCoords(null);
    setDropoffCoords(null);
    setSelectedVehicle(null);
    fetchRecentTrips();
    fetchStats();
  };

  const handleProcessPayment = async () => {
    if (paymentMethod === 'cash') return;
    const rideId = completedRide?._id || activeRide?._id;
    if (!rideId || rideId.startsWith('demo')) {
      toast.info('Cash payment — pay the driver directly');
      return;
    }
    setPaymentProcessing(true);
    try {
      if (paymentMethod === 'telebirr') {
        const res = await paymentsAPI.process(rideId, {
          method: 'telebirr',
          amount: Number(completedRide.fare?.totalFare) || fare.total,
          phoneNumber: user?.phoneNumber,
        });
        const data = res.data;
        if (data.success) {
          setPaymentStatus('processing');
          toast.success('Telebirr payment request sent! Check your phone for the USSD prompt.');
        } else {
          toast.error(data.error || 'Payment failed. Please try again.');
          setPaymentStatus('failed');
        }
      } else if (paymentMethod === 'chapa') {
        const res = await paymentsAPI.process(rideId, {
          method: 'chapa',
          amount: Number(completedRide.fare?.totalFare) || fare.total,
          email: user?.email || 'passenger@dirs.et',
        });
        const data = res.data;
        if (data.checkoutUrl) {
          setPaymentStatus('processing');
          window.open(data.checkoutUrl, '_blank');
          toast.success('Redirecting to Chapa payment page...');
        } else {
          toast.error(data.error || 'Payment failed. Please try again.');
          setPaymentStatus('failed');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Payment processing failed. You can pay later from trip history.');
      setPaymentStatus('failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSOS = async () => {
    if (sosSending) return;
    setSosLocation(null);
    setSosType(null);
    setSosDescription('');
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, enableHighAccuracy: true })
      );
      if (pos && pos.coords) {
        setSosLocation({
          coordinates: [pos.coords.longitude, pos.coords.latitude],
          address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        });
      }
    } catch (_) {}
    setSosModalOpen(true);
  };

  const handleSOSTypeSelect = (item) => {
    setSosType(item);
    setSosDescription('');
  };

  const handleSOSClose = () => {
    if (sosSending) return;
    setSosModalOpen(false);
    setSosType(null);
    setSosDescription('');
  };

  const handleSendSOS = async () => {
    setSosSending(true);
    try {
      const desc = sosDescription.trim() || sosType.label;
      await sosAPI.trigger({
        type: sosType.type,
        description: desc,
        location: sosLocation || null,
      });
      const locTxt = sosLocation ? ` at ${sosLocation.address}` : '';
      toast.warning(`🚨 SOS alert sent — ${sosType.label}: "${desc}"${locTxt}!`);
      setSosModalOpen(false);
      setSosType(null);
      setSosDescription('');
    } catch (err) {
      toast.error('Failed to send SOS alert');
    } finally {
      setSosSending(false);
    }
  };

  const handleBellClick = () => {
    if (notifications && notifications.length > 0) {
      toast.info(`You have ${notifications.length} notification(s)`);
    } else {
      toast.info('No new notifications');
    }
  };

  const handleShareTrip = async () => {
    if (!activeRide) return;
    const shareData = {
      title: 'My Trip',
      text: `Trip from ${activeRide.pickupLocation?.address || 'pickup'} to ${activeRide.dropoffLocation?.address || 'dropoff'}. Fare: ETB ${activeRide.estimatedFare || 'N/A'}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareData.text);
          toast.success('Trip details copied to clipboard');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareData.text);
      toast.success('Trip details copied to clipboard');
    }
  };

  const handleRetryFindDriver = () => {
    setRideState('searching');
    setSearchingDrivers(0);
    setFoundDriverInfo(null);

    searchingIntervalRef.current = setInterval(() => {
      setSearchingDrivers(prev => {
        if (prev >= 8) {
          clearInterval(searchingIntervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    setTimeout(() => {
      clearInterval(searchingIntervalRef.current);
      setFoundDriverInfo(null);
      setRideState('no_driver');
    }, 30000);
  };

  const userName = user?.firstName || user?.name || '';

  const getGreetingText = () => {
    const h = new Date().getHours();
    if (h < 12) return t('passenger.goodMorning') || 'Good Morning';
    if (h < 17) return t('passenger.goodAfternoon') || 'Good Afternoon';
    return t('passenger.goodEvening') || 'Good Evening';
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getMapCenter = () => {
    if (activeRide) {
      if (driverLocationState?.coordinates) {
        return driverLocationState.coordinates;
      }
      if (pickupCoords) return pickupCoords;
    }
    return mapCenter;
  };

  const getMapMarkers = () => {
    if (!activeRide) return null;
    const markers = [];
    const pCoords = activeRide.pickupLocation?.coordinates?.coordinates || activeRide.pickupLocation?.coordinates || pickupCoords;
    const dCoords = activeRide.dropoffLocation?.coordinates?.coordinates || activeRide.dropoffLocation?.coordinates || dropoffCoords;
    if (pCoords) {
      markers.push(
        <Marker key="pickup" position={Array.isArray(pCoords[0]) ? pCoords[0] : pCoords} icon={pickupIcon}>
          <Popup>Pickup: {activeRide.pickupLocation?.address || 'Pickup'}</Popup>
        </Marker>
      );
    }
    if (dCoords && ['in_trip', 'complete', 'driver_arriving', 'driver_found'].includes(rideState)) {
      markers.push(
        <Marker key="dropoff" position={Array.isArray(dCoords[0]) ? dCoords[0] : dCoords} icon={dropoffIcon}>
          <Popup>Dropoff: {activeRide.dropoffLocation?.address || 'Dropoff'}</Popup>
        </Marker>
      );
    }
    if (driverLocationState?.coordinates && ['driver_found', 'driver_arriving', 'in_trip'].includes(rideState)) {
      markers.push(
        <Marker key="driver" position={driverLocationState.coordinates} icon={driverIcon}>
          <Popup>{foundDriverInfo?.name || 'Driver'}</Popup>
        </Marker>
      );
    }
    return markers;
  };

  const getPolyline = () => {
    if (!activeRide || !['in_trip', 'driver_arriving', 'driver_found'].includes(rideState)) return null;
    const pCoords = activeRide.pickupLocation?.coordinates?.coordinates || activeRide.pickupLocation?.coordinates || pickupCoords;
    const dCoords = activeRide.dropoffLocation?.coordinates?.coordinates || activeRide.dropoffLocation?.coordinates || dropoffCoords;
    if (pCoords && dCoords) {
      return (
        <Polyline
          positions={[pCoords, dCoords]}
          color="#2563eb"
          weight={4}
          dashArray="8 8"
        />
      );
    }
    return null;
  };

  // ─── STATE: SEARCHING ───────────────────────────────────────────────
  if (rideState === 'searching') {
    return (
      <div className="passenger-page">
        <div className="ride-status">
          <div className="searching-animation">
            <div className="pulse-ring"></div>
            <div className="pulse-ring delay-1"></div>
            <div className="pulse-ring delay-2"></div>
            <div className="searching-car">
              <FaCar />
            </div>
          </div>
          <h3>{t('passenger.findingDriver') || 'Finding your driver...'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
            {searchingDrivers < 99
              ? `Contacting ${searchingDrivers} nearby driver${searchingDrivers !== 1 ? 's' : ''}...`
              : 'Searching for available drivers...'}
          </p>
          <div className="searching-route-summary">
            <div className="searching-route-point">
              <div className="loc-dot pickup"></div>
              <span>{pickup || 'Pickup'}</span>
            </div>
            <div className="searching-route-line"></div>
            <div className="searching-route-point">
              <div className="loc-dot dropoff"></div>
              <span>{dropoff || 'Dropoff'}</span>
            </div>
          </div>
          <div className="searching-fare-summary">
            <span>{selectedVehicle?.label || 'Vehicle'}</span>
            <span>ETB {fare.total}</span>
          </div>
          <button className="passenger-cancel-btn" onClick={() => { handleCancelRide(); resetBookingState(); }}>
            {t('passenger.cancelRide') || 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  // ─── STATE: NO DRIVER FOUND ────────────────────────────────────────
  if (rideState === 'no_driver') {
    return (
      <div className="passenger-page">
        <div className="ride-status">
          <div className="no-driver-icon">
            <FaTimesCircle />
          </div>
          <h3>No Drivers Available</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            No nearby drivers could be found. Please try again or choose a different vehicle type.
          </p>
          <div className="no-driver-actions">
            <button className="passenger-primary-btn" onClick={handleRetryFindDriver}>
              <FaCar /> Try Again
            </button>
            <button className="passenger-cancel-btn" onClick={resetBookingState}>
              {t('passenger.cancelRide') || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STATE: DRIVER FOUND / ARRIVING ─────────────────────────────────
  if (rideState === 'driver_found' || rideState === 'driver_arriving') {
    const driver = foundDriverInfo || {};
    const vehicleInfo = driver.vehicle || {};
    const etaMin = driverLocationState?.eta || Math.floor(Math.random() * 5) + 2;

    return (
      <div className="passenger-page">
        <div className="ride-active">
          <FlexibleMap
            center={getMapCenter()}
            zoom={15}
            defaultHeight="280px"
            markers={[
              ...(getMapMarkers() || []).map(m => ({
                position: m.props?.position || m.key,
                icon: m.props?.icon,
                popup: m.props?.children?.props?.children || '',
              })),
            ]}
            polylinePoints={activeRide ? [pickupCoords, dropoffCoords].filter(Boolean) : null}
          />

          <div className={`driver-arriving-badge ${rideState === 'driver_arriving' ? 'arriving' : ''}`}>
            <FaCar />
            <span>
              {rideState === 'driver_arriving'
                ? 'Driver is on the way'
                : `Driver found! ETA ~${etaMin} min`}
            </span>
          </div>

          <div className="driver-card">
            {driver.profilePhoto ? (
              <img src={driver.profilePhoto} alt="Driver" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="passenger-avatar-lg">
                {(driver.name || 'D')[0]}
              </div>
            )}
            <div className="driver-info">
              <h4>{driver.name || 'Driver'}</h4>
              <p>{vehicleInfo.color} {vehicleInfo.make || ''} {vehicleInfo.model || ''}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{vehicleInfo.plateNumber || '--'}</p>
              <span>
                <FaStar /> {driver.rating || '4.5'}
              </span>
            </div>
          </div>

          <div className="ride-actions-row">
            {driver.phone ? (
              <a href={`tel:${driver.phone}`} className="passenger-action-btn">
                <FaPhone /> {t('passenger.callDriver') || 'Call'}
              </a>
            ) : (
              <button className="passenger-action-btn" disabled>
                <FaPhone /> {t('passenger.callDriver') || 'Call'}
              </button>
            )}
            <button className="passenger-action-btn" onClick={() => setShowChat(true)}>
              <FaComments /> {t('passenger.chatDriver') || 'Chat'}
            </button>
            <button className="passenger-action-btn" onClick={handleShareTrip}>
              <FaShareAlt /> Share Trip
            </button>
            <button className="passenger-action-btn danger" onClick={handleSOS}>
              <FaExclamationTriangle /> SOS
            </button>
          </div>

          <button className="passenger-cancel-btn" onClick={() => setShowCancelConfirm(true)}>
            {t('passenger.cancelRide') || 'Cancel Ride'}
          </button>
        </div>

        <ConfirmModal
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={() => { setShowCancelConfirm(false); handleCancelRide(); }}
          title="Cancel Ride"
          message="Are you sure you want to cancel this ride? A cancellation fee may apply."
          confirmText="Cancel Ride"
          danger
        />

        <InAppChat
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          tripId={activeRide?._id}
          driverName={foundDriverInfo?.name}
          socket={socket}
          tripStatus={activeRide?.status}
          route={activeRide?.pickupLocation?.address && activeRide?.dropoffLocation?.address ? `${activeRide.pickupLocation.address} → ${activeRide.dropoffLocation.address}` : ''}
        />
      </div>
    );
  }

  // ─── STATE: IN TRIP ─────────────────────────────────────────────────
  if (rideState === 'in_trip') {
    const driver = foundDriverInfo || {};
    const statusSteps = ['Driver Arriving', 'In Progress', 'Arrived'];
    const currentStep = 1;
    const progressPercent = 50;

    return (
      <div className="passenger-page">
        <div className="ride-active">
          <FlexibleMap
            center={driverLocationState?.coordinates || getMapCenter()}
            zoom={15}
            defaultHeight="280px"
            markers={[
              ...(getMapMarkers() || []).map(m => ({
                position: m.props?.position || m.key,
                icon: m.props?.icon,
                popup: m.props?.children?.props?.children || '',
              })),
            ]}
            polylinePoints={activeRide ? [pickupCoords, dropoffCoords].filter(Boolean) : null}
          />

          <h2 className="passenger-section-title">
            <FaCar /> {t('passenger.rideActive') || 'Ride in Progress'}
          </h2>

          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              {statusSteps.map((label, idx) => (
                <span key={label} style={{
                  fontSize: 11,
                  fontWeight: idx === currentStep ? 700 : 400,
                  color: idx <= currentStep ? 'var(--primary)' : 'var(--text-muted)',
                  textAlign: 'center',
                  flex: 1,
                }}>{label}</span>
              ))}
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                borderRadius: 3,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          <div className="trip-timer">
            <FaClock />
            <span>{formatTimer(tripTimer)}</span>
          </div>

          <div className="trip-fare-live">
            <span>Current Fare</span>
            <span className="fare-live-amount">ETB {liveFare || activeRide?.estimatedFare || fare.total}</span>
          </div>

          <div className="driver-card">
            {driver.profilePhoto ? (
              <img src={driver.profilePhoto} alt="Driver" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="passenger-avatar-lg">
                {(driver.name || 'D')[0]}
              </div>
            )}
            <div className="driver-info">
              <h4>{driver.name || 'Driver'}</h4>
              <p>{driver.vehicle?.plateNumber || '--'}</p>
              <span><FaStar /> {driver.rating || '4.5'}</span>
            </div>
          </div>

          <div className="ride-actions-row">
            {driver.phone ? (
              <a href={`tel:${driver.phone}`} className="passenger-action-btn">
                <FaPhone /> {t('passenger.callDriver') || 'Call'}
              </a>
            ) : (
              <button className="passenger-action-btn" disabled>
                <FaPhone /> {t('passenger.callDriver') || 'Call'}
              </button>
            )}
            <button className="passenger-action-btn" onClick={() => setShowChat(true)}>
              <FaComments /> {t('passenger.chatDriver') || 'Chat'}
            </button>
            <button className="passenger-action-btn" onClick={handleShareTrip}>
              <FaShareAlt /> Share Trip
            </button>
            <button className="passenger-action-btn danger" onClick={handleSOS}>
              <FaExclamationTriangle /> SOS
            </button>
          </div>
        </div>

        <InAppChat
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          tripId={activeRide?._id}
          driverName={foundDriverInfo?.name}
          socket={socket}
          tripStatus={activeRide?.status}
          route={activeRide?.pickupLocation?.address && activeRide?.dropoffLocation?.address ? `${activeRide.pickupLocation.address} → ${activeRide.dropoffLocation.address}` : ''}
        />
      </div>
    );
  }

  // ─── STATE: COMPLETE + RATING ──────────────────────────────────────
  if (rideState === 'complete' && completedRide) {
    const presetTags = ['Clean car', 'Great driving', 'Friendly', 'Good music', 'On time', 'Safe'];
    const toggleTag = (tag) => {
      setRatingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };
    const rideFare = Number(completedRide.fare?.totalFare) || Number(completedRide.fare?.total) || completedRide.estimatedFare || fare.total;

    return (
      <div className="passenger-page">
        <div className="ride-complete">
          <div className="complete-icon">
            <FaCheck />
          </div>
          <h3>{t('passenger.rideComplete') || 'Trip Complete!'}</h3>
          <p className="fare-display">ETB {rideFare}</p>

          {paymentMethod !== 'cash' && !paymentStatus && (
            <button
              className="passenger-primary-btn"
              onClick={handleProcessPayment}
              disabled={paymentProcessing}
              style={{
                background: paymentMethod === 'telebirr' ? '#1a8917' : '#1a8917',
                marginBottom: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {paymentProcessing ? (
                <><FaSpinner className="fa-spin" /> Processing...</>
              ) : paymentMethod === 'telebirr' ? (
                <><FaMobileAlt /> Pay {rideFare} ETB with Telebirr</>
              ) : (
                <><FaCreditCard /> Pay {rideFare} ETB with Chapa</>
              )}
            </button>
          )}

          {paymentMethod !== 'cash' && paymentStatus === 'processing' && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10,
              padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#15803d', textAlign: 'center'
            }}>
              {paymentMethod === 'telebirr'
                ? '✓ Payment request sent! Check your phone for the Telebirr USSD prompt.'
                : '✓ Redirected to Chapa. Complete payment in the new tab.'}
            </div>
          )}

          {paymentMethod !== 'cash' && paymentStatus === 'failed' && (
            <button
              className="passenger-primary-btn"
              onClick={handleProcessPayment}
              disabled={paymentProcessing}
              style={{ background: '#ef4444', marginBottom: 12 }}
            >
              <FaExclamationTriangle /> Retry Payment
            </button>
          )}

          {paymentMethod === 'cash' && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
              padding: '12px 16px', marginBottom: 12, fontSize: 13, color: '#92400e', textAlign: 'center'
            }}>
              💵 Pay {rideFare} ETB directly to the driver
            </div>
          )}

          <div className="rating-section">
            <h4>{t('passenger.rateExperience') || 'Rate your experience'}</h4>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  className={`star ${rating >= s ? 'active' : ''}`}
                  onClick={() => setRating(s)}
                  aria-label={`Rate ${s} stars`}
                >
                  <FaStar />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' }}>
              {presetTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: ratingTags.includes(tag) ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: ratingTags.includes(tag) ? 'var(--primary)' : 'transparent',
                    color: ratingTags.includes(tag) ? 'white' : 'var(--text)',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: ratingTags.includes(tag) ? 600 : 400,
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add a comment..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button className="passenger-primary-btn" onClick={handleSubmitRating}>
            <FaCheck /> {t('passenger.done') || 'Done'}
          </button>
        </div>
      </div>
    );
  }

  // ─── STATE: IDLE (BOOKING FORM) ─────────────────────────────────────
  return (
    <div className="passenger-page">
      {!isOnline && (
        <div style={{ background: '#ef4444', color: 'white', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', fontWeight: 'bold' }}>
          <span><FaWifi /> Offline Mode — Network Disconnected</span>
          <button onClick={handleSMSFallback} style={{ background: 'white', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}><FaSms /> Book via SMS</button>
        </div>
      )}
      {/* Mode Selector: Real 2-Phone Mode (pure sockets) vs Single-Device Demo Mode */}
      {process.env.NODE_ENV !== 'production' && (
      <div style={{
        background: isDemoMode ? '#fffbeb' : '#f0fdf4',
        border: `1.5px solid ${isDemoMode ? '#fde68a' : '#86efac'}`,
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div>
          <strong style={{ fontSize: 13, color: isDemoMode ? '#92400e' : '#15803d', display: 'block' }}>
            {isDemoMode ? '⚡ Single-Device Test Mode (3.5s Auto-Match)' : '📱 Real Dual-Device Mode (Live GPS & WebSockets)'}
          </strong>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {isDemoMode ? 'Auto-accepts for easy 1-laptop testing' : 'Waits 100% for real driver device to press Accept'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsDemoMode(!isDemoMode)}
          style={{
            background: isDemoMode ? '#d97706' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 'bold',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          Switch to {isDemoMode ? '📱 Real 2-Phone Mode' : '⚡ Single-Device Mode'}
        </button>
      </div>
      )}

      <div className="passenger-logo-bar">
        <img src="/logo.svg?v=2" alt="DIRS - Dire Dawa Ride Sharing" className="passenger-logo" />
      </div>

      <div className="passenger-header-row">
        <div>
          <h1 className="passenger-greeting">{getGreetingText()} {userName}</h1>
          <p className="passenger-location">
            <FaMapMarkerAlt /> {t('passenger.currentLocation') || 'Your current location'}
          </p>
        </div>
        <button className="passenger-bell-btn" onClick={handleBellClick}>
          <FaBell />
        </button>
      </div>

      <div className="passenger-map-container">
        <FlexibleMap
          center={mapCenter}
          zoom={13}
          defaultHeight="280px"
          markers={[
            ...(pickupCoords ? [{ position: pickupCoords, icon: pickupIcon, popup: pickup || 'Pickup' }] : []),
            ...(dropoffCoords ? [{ position: dropoffCoords, icon: dropoffIcon, popup: dropoff || 'Dropoff' }] : []),
          ]}
          polylinePoints={pickupCoords && dropoffCoords ? [pickupCoords, dropoffCoords] : null}
          showRecenter={true}
          showFullscreen={true}
          showZoomButtons={true}
        />
      </div>

      <div className="passenger-booking-card">
        {/* STEP 1: Location Inputs — always shown */}
        <div className="booking-step">
          <div className="booking-step-header">
            <span className="booking-step-number">1</span>
            <span className="booking-step-label">Set Locations</span>
            {bookingStep > 1 && pickupCoords && dropoffCoords && (
              <span className="booking-step-done">✓ {pickup} → {dropoff}</span>
            )}
          </div>
          <div className="location-inputs">
            <div className="location-input-wrapper" style={{ position: 'relative' }}>
              <div className="location-dot pickup"></div>
              <input
                ref={pickupInputRef}
                className="location-input"
                type="text"
                placeholder={t('passenger.pickup') || 'Pickup location'}
                value={pickup}
                onChange={(e) => {
                  setPickup(e.target.value);
                  setPickupCoords(null);
                  setShowPickupSuggestions(true);
                  fetchSuggestions(e.target.value, setPickupSuggestions);
                }}
                onFocus={() => setShowPickupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
              />
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {pickupSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className="suggestion-item"
                      onMouseDown={() => {
                        setPickup(s.label);
                        setPickupCoords([s.lat, s.lon]);
                        setPickupSuggestions([]);
                        setShowPickupSuggestions(false);
                      }}
                    >
                      <FaMapMarkerAlt className="suggestion-icon" />
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="location-divider">
              <div className="divider-line"></div>
              <button className="location-btn" onClick={swapLocations}>
                <FaExchangeAlt />
              </button>
              <div className="divider-line"></div>
            </div>
            <div className="location-input-wrapper" style={{ position: 'relative' }}>
              <div className="location-dot dropoff"></div>
              <input
                ref={dropoffInputRef}
                className="location-input"
                type="text"
                placeholder={t('passenger.dropoff') || 'Drop-off location'}
                value={dropoff}
                onChange={(e) => {
                  setDropoff(e.target.value);
                  setDropoffCoords(null);
                  setShowDropoffSuggestions(true);
                  fetchSuggestions(e.target.value, setDropoffSuggestions);
                }}
                onFocus={() => setShowDropoffSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 200)}
              />
              {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {dropoffSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className="suggestion-item"
                      onMouseDown={() => {
                        setDropoff(s.label);
                        setDropoffCoords([s.lat, s.lon]);
                        setDropoffSuggestions([]);
                        setShowDropoffSuggestions(false);
                      }}
                    >
                      <FaMapMarkerAlt className="suggestion-icon" />
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {bookingStep === 1 && pickupCoords && dropoffCoords && (
            <button className="booking-continue-btn" onClick={() => setBookingStep(2)}>
              Continue <FaArrowRight />
            </button>
          )}
        </div>

        {/* STEP 2: Ride Type + Vehicle Selector */}
        {bookingStep >= 2 && (
          <div className="booking-step">
            <div className="booking-step-header">
              <span className="booking-step-number">2</span>
              <span className="booking-step-label">
                {rideType === 'intercity' ? 'Intercity Ride' : 'Intra-City Ride'}
              </span>
              {bookingStep > 2 && selectedVehicle && (
                <span className="booking-step-done">✓ {selectedVehicle.name}</span>
              )}
            </div>
            <div className="passenger-tab-bar" style={{ marginBottom: 12 }}>
              <button
                className={`passenger-tab ${rideType === 'intraCity' ? 'active' : ''}`}
                disabled
              >
                {t('passenger.intraCity') || 'Intra-City'}
              </button>
              <button
                className={`passenger-tab ${rideType === 'intercity' ? 'active' : ''}`}
                disabled
              >
                {t('passenger.intercity') || 'Intercity'}
              </button>
            </div>
            <VehicleCategorySelector
              selectedCategory={selectedVehicle || null}
              onSelectCategory={(cat) => {
                const found = VEHICLES.find(v => v.id === cat.id);
                if (found) {
                  setSelectedVehicle(found);
                  setBookingStep(3);
                }
              }}
              rideType={rideType}
              distanceKm={pickupCoords && dropoffCoords ? haversineDistance(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]) : 5}
              passengersCount={passengersCount}
            />
          </div>
        )}

        {/* STEP 3: Fare Breakdown */}
        {bookingStep >= 3 && selectedVehicle && (
          <div className="booking-step">
            <div className="booking-step-header">
              <span className="booking-step-number">3</span>
              <span className="booking-step-label">Fare Breakdown</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 8px 0' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Estimated Total</span>
              <button
                type="button"
                onClick={() => setShowFareBreakdown(true)}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <FaCalculator /> View Itemized Breakdown
              </button>
            </div>
            <div className="fare-summary">
              <div className="fare-row">
                <span>{t('passenger.baseFare') || 'Base Fare'}</span>
                <span>ETB {fare.base}</span>
              </div>
              <div className="fare-row">
                <span>{t('passenger.distanceFare') || 'Distance'}</span>
                <span>ETB {fare.distance}</span>
              </div>
              <div className="fare-row">
                <span>{t('passenger.timeFare') || 'Time'}</span>
                <span>ETB {fare.time}</span>
              </div>
              <div className="fare-row">
                <span>{t('passenger.platformFee') || 'Platform Fee'}</span>
                <span>ETB {fare.platform}</span>
              </div>
              {surgeMultiplier > 1 && (
                <div className="fare-row surge">
                  <span>Surge ({surgeMultiplier}x)</span>
                  <span style={{ color: 'var(--danger)' }}>Applied</span>
                </div>
              )}
              <div className="fare-total">
                <span>{t('passenger.totalFare') || 'Total'}</span>
                <span>ETB {fare.total}</span>
              </div>
            </div>
            {bookingStep === 3 && (
              <button className="booking-continue-btn" onClick={() => setBookingStep(rideType === 'intercity' ? 4 : 5)}>
                Continue <FaArrowRight />
              </button>
            )}
          </div>
        )}

        {/* STEP 4: Seat Picker (intercity only) */}
        {bookingStep >= 4 && rideType === 'intercity' && (
          <div className="booking-step">
            <div className="booking-step-header">
              <span className="booking-step-number">4</span>
              <span className="booking-step-label">Select Bus Seats</span>
              {bookingStep > 4 && selectedSeats.length > 0 && (
                <span className="booking-step-done">✓ Seats: {selectedSeats.join(', ')}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSeatPicker(true)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px dashed #2563eb',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: 14
              }}
            >
              <FaChair /> {selectedSeats.length > 0 ? `Seats: ${selectedSeats.join(', ')} (Tap to change)` : 'Pick Intercity Bus Seats'}
            </button>
            {bookingStep === 4 && selectedSeats.length > 0 && (
              <button className="booking-continue-btn" onClick={() => setBookingStep(5)}>
                Continue <FaArrowRight />
              </button>
            )}
          </div>
        )}

        {/* STEP 5: Promo Code */}
        {bookingStep >= 5 && (
          <div className="booking-step">
            <div className="booking-step-header">
              <span className="booking-step-number">5</span>
              <span className="booking-step-label">Promo Code</span>
              {promoCode && <span className="booking-step-done">✓ {promoCode}</span>}
            </div>
            <div className="promo-code-input">
              <input
                className="location-input"
                type="text"
                placeholder="Enter promo code (optional)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
            </div>
            {bookingStep === 5 && (
              <button className="booking-continue-btn" onClick={() => setBookingStep(6)}>
                {promoCode ? 'Apply & Continue' : 'Skip'} <FaArrowRight />
              </button>
            )}
          </div>
        )}

        {/* STEP 6: Schedule Ride */}
        {bookingStep >= 6 && (
          <div className="booking-step">
            <div className="booking-step-header">
              <span className="booking-step-number">6</span>
              <span className="booking-step-label">Schedule Ride</span>
              {scheduleEnabled && scheduledTime && (
                <span className="booking-step-done">✓ {new Date(scheduledTime).toLocaleString()}</span>
              )}
            </div>
            <div className="schedule-ride-toggle">
              <span className="schedule-toggle-label">
                <FaClock /> Schedule for later
              </span>
              <button
                className={`schedule-toggle-switch ${scheduleEnabled ? 'active' : ''}`}
                onClick={() => setScheduleEnabled(!scheduleEnabled)}
              />
            </div>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                className="schedule-datetime-input"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                style={{ marginTop: 8 }}
              />
            )}
            {bookingStep === 6 && (
              <button className="booking-continue-btn" onClick={() => setBookingStep(7)}>
                Continue <FaArrowRight />
              </button>
            )}
          </div>
        )}

        {/* STEP 7: Payment Method */}
        {bookingStep >= 7 && (
          <div className="booking-step">
            <div className="booking-step-header">
              <span className="booking-step-number">7</span>
              <span className="booking-step-label">Payment Method</span>
            </div>
            <div className="passenger-payment-grid">
              {[
                { id: 'cash', icon: <FaMoneyBillWave />, label: t('passenger.cash') || 'Cash' },
                { id: 'telebirr', icon: <FaMobileAlt />, label: t('passenger.telebirr') || 'Telebirr' },
                { id: 'chapa', icon: <FaCreditCard />, label: t('passenger.chapa') || 'Chapa' },
              ].map((p) => (
                <div
                  key={p.id}
                  className={`passenger-payment-option ${paymentMethod === p.id ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(p.id)}
                >
                  <div className="payment-icon">{p.icon}</div>
                  <span className="payment-label">{p.label}</span>
                </div>
              ))}
            </div>
            {bookingStep === 7 && (
              <button className="booking-continue-btn" onClick={() => setBookingStep(8)}>
                Continue <FaArrowRight />
              </button>
            )}
          </div>
        )}

        {/* STEP 8: Book Now */}
        {bookingStep >= 8 && (
          <div className="booking-step">
            <div className="booking-step-header">
              <span className="booking-step-number">8</span>
              <span className="booking-step-label">Confirm & Book</span>
            </div>
            <div className="booking-summary">
              <div className="booking-summary-row">
                <span>Route</span>
                <span>{pickup} → {dropoff}</span>
              </div>
              <div className="booking-summary-row">
                <span>Vehicle</span>
                <span>{selectedVehicle?.name}</span>
              </div>
              <div className="booking-summary-row">
                <span>Payment</span>
                <span style={{ textTransform: 'capitalize' }}>{paymentMethod}</span>
              </div>
              <div className="booking-summary-row total">
                <span>Total</span>
                <span>ETB {fare.total}</span>
              </div>
            </div>
            <button
              className="passenger-primary-btn"
              disabled={loading || !selectedVehicle}
              onClick={handleOpenBookingConfirm}
              aria-label="Book ride"
              style={{ marginTop: 12 }}
            >
              <FaCar /> {t('passenger.bookNow') || 'Book Ride'} — ETB {fare.total}
            </button>
          </div>
        )}
      </div>

      {recentTrips.length > 0 && (
        <div className="passenger-recent">
          <div className="passenger-section-header">
            <h2 className="passenger-section-title">
              <FaHistory /> {t('passenger.historyLabel') || 'Recent Trips'}
            </h2>
            <button className="see-all-btn" onClick={() => navigate('/passenger/history')}>
              {t('passenger.completed') || 'See All'} →
            </button>
          </div>
          <div className="passenger-trips-list">
            {recentTrips.map((trip) => (
              <div key={trip._id} className="passenger-trip-item">
                <div className="trip-route-info">
                  <div className="trip-point">
                    <div className="loc-dot pickup"></div>
                    <span>{trip.pickupLocation?.address || 'Pickup'}</span>
                  </div>
                  <div className="trip-point">
                    <div className="loc-dot dropoff"></div>
                    <span>{trip.dropoffLocation?.address || 'Dropoff'}</span>
                  </div>
                </div>
                <span className="trip-fare">ETB {Number(trip.fare?.totalFare) || Number(trip.fare?.total) || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="passenger-quick-actions">
        <div className="passenger-actions-grid">
          <div className="passenger-action-card" onClick={() => navigate('/passenger/history')}>
            <div className="action-icon">
              <FaHistory />
            </div>
            <span>{t('passenger.history') || 'History'}</span>
          </div>
          <div className="passenger-action-card" onClick={() => navigate('/passenger/favorites')}>
            <div className="action-icon">
              <FaStar />
            </div>
            <span>{t('passenger.favorites') || 'Favorites'}</span>
          </div>
          <div className="passenger-action-card" onClick={handleSOS}>
            <div className="action-icon danger">
              <FaExclamationTriangle />
            </div>
            <span>{t('passenger.emergency') || 'SOS'}</span>
          </div>
          <div className="passenger-action-card" onClick={() => navigate('/passenger/profile')}>
            <div className="action-icon">
              <FaUserShield />
            </div>
            <span>{t('passenger.settings') || 'Profile'}</span>
          </div>
        </div>
      </div>

      {/* ─── BOOKING CONFIRMATION MODAL ─── */}
      <ConfirmModal
        isOpen={showBookingConfirm}
        onClose={() => setShowBookingConfirm(false)}
        onConfirm={handleConfirmBooking}
        title="Confirm Booking"
        message={
          <div className="booking-confirm-content">
            <div className="confirm-route">
              <div className="confirm-route-point">
                <div className="loc-dot pickup"></div>
                <div>
                  <span className="confirm-route-label">Pickup</span>
                  <span className="confirm-route-address">{pickup}</span>
                </div>
              </div>
              <div className="confirm-route-divider">
                <div className="confirm-route-line"></div>
                <FaChevronRight style={{ color: 'var(--text-muted)', fontSize: 12 }} />
                <div className="confirm-route-line"></div>
              </div>
              <div className="confirm-route-point">
                <div className="loc-dot dropoff"></div>
                <div>
                  <span className="confirm-route-label">Dropoff</span>
                  <span className="confirm-route-address">{dropoff}</span>
                </div>
              </div>
            </div>
            <div className="confirm-details">
              <div className="confirm-detail-row">
                <span>Vehicle</span>
                <span>{selectedVehicle?.label || '--'}</span>
              </div>
              <div className="confirm-detail-row">
                <span>Distance</span>
                <span>{hasBothLocations ? `${haversineDistance(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]).toFixed(1)} km` : '~5 km'}</span>
              </div>
              <div className="confirm-detail-row">
                <span>Payment</span>
                <span style={{ textTransform: 'capitalize' }}>{paymentMethod}</span>
              </div>
              <div className="confirm-detail-row total">
                <span>Estimated Fare</span>
                <span>ETB {fare.total}</span>
              </div>
            </div>
          </div>
        }
        confirmText="Confirm Booking"
      />

      {/* Real-World Modals */}
      <SeatPickerModal
        isOpen={showSeatPicker}
        onClose={() => setShowSeatPicker(false)}
        selectedSeats={selectedSeats}
        onConfirmSeats={(seats) => {
          setSelectedSeats(seats);
          if (seats.length > 0) setBookingStep(prev => Math.max(prev, 6));
        }}
        passengersCount={passengersCount}
      />

      <FareBreakdownModal
        isOpen={showFareBreakdown}
        onClose={() => setShowFareBreakdown(false)}
        fareDetails={{
          baseFare: (selectedVehicle || VEHICLES[0]).baseFare,
          distanceKm: fare.distKm,
          perKmRate: (selectedVehicle || VEHICLES[0]).priceKm,
          surgeMultiplier: surgeMultiplier,
          promoDiscount: fare.promoDiscount,
          totalFare: fare.total,
          categoryName: (selectedVehicle || VEHICLES[0]).label
        }}
      />

      <DigitalTicketModal
        isOpen={showTicket}
        onClose={() => setShowTicket(false)}
        trip={activeRide}
        passenger={user}
      />

      <InAppChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        tripId={activeRide?._id}
        driverName={foundDriverInfo?.name}
        socket={socket}
        tripStatus={activeRide?.status}
        route={activeRide?.pickupLocation?.address && activeRide?.dropoffLocation?.address ? `${activeRide.pickupLocation.address} → ${activeRide.dropoffLocation.address}` : ''}
      />

      <WalletTopupModal
        isOpen={showWalletTopup}
        onClose={() => setShowWalletTopup(false)}
        onTopupSuccess={(amt) => {
          setWalletBalance(prev => prev + amt);
          toast.success(`Successfully topped up ${amt} ETB to App Wallet!`);
        }}
      />

      <Modal isOpen={sosModalOpen} onClose={handleSOSClose} title="🚨 Emergency SOS" size="sm">
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Select the type of emergency. Your live location is sent to the admin command center and your emergency contacts.
        </p>
        {sosLocation ? (
          <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaMapMarkerAlt /> 📍 {sosLocation.address}
          </p>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>⏳ Locating your position…</p>
        )}

        {!sosType ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SOS_TYPES.map(item => (
              <button
                key={item.type}
                type="button"
                disabled={sosSending}
                onClick={() => handleSOSTypeSelect(item)}
                style={{
                  padding: '12px 8px', borderRadius: 10, border: '1px solid var(--border-light)',
                  background: 'var(--card)', color: 'var(--text)', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong style={{ fontSize: 14, color: '#dc2626' }}>{sosType.label}</strong>
              <button type="button" onClick={() => setSosType(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                ← Change type
              </button>
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              Describe your location / situation (e.g. "Near Bole Bridge, red building")
            </label>
            <textarea
              value={sosDescription}
              onChange={e => setSosDescription(e.target.value)}
              placeholder="Write a short description so responders can find you…"
              rows={3}
              maxLength={300}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg-secondary, #fff)', color: 'var(--text)',
                fontSize: 14, resize: 'vertical', marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={sosSending}
                onClick={handleSendSOS}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {sosSending ? 'Sending…' : '🚨 Send SOS Alert'}
              </button>
            </div>
          </div>
        )}
        {sosSending && <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>Sending alert…</p>}
      </Modal>
    </div>
  );
};

export default PassengerHome;

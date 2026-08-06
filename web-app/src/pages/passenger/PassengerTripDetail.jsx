import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaCar, FaStar, FaPhone, FaShareAlt, FaExclamationTriangle,
  FaClock, FaCheckCircle, FaArrowLeft,
  FaRoute, FaUser, FaMotorcycle, FaShuttleVan, FaBus, FaBolt,
  FaPlay, FaFlag, FaSms, FaTimes, FaRoute as FaRouteIcon, FaDownload,
  FaQuestionCircle, FaSuitcase, FaDollarSign, FaShieldAlt, FaUserSlash, FaEllipsisH
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, sosAPI, ratingsAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Passenger.css';

const STATUS_STEPS = [
  { key: 'pending', labelKey: 'passenger.requested', icon: <FaClock /> },
  { key: 'accepted', labelKey: 'passenger.accepted', icon: <FaCheckCircle /> },
  { key: 'arrived', labelKey: 'passenger.arrived', icon: <FaMapMarkerAlt /> },
  { key: 'in_progress', labelKey: 'passenger.inProgress', icon: <FaCar /> },
  { key: 'completed', labelKey: 'passenger.completedStatus', icon: <FaFlag /> },
];

const getVehicleIcon = (type) => {
  switch (type) {
    case 'bajaj': return <FaShuttleVan />;
    case 'minivan': case 'bus': return <FaBus />;
    case 'bike': return <FaMotorcycle />;
    case 'electric': return <FaBolt />;
    default: return <FaCar />;
  }
};

const PassengerTripDetail = () => {
  const { tripId } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [searchParams] = useSearchParams();
  const isHelpMode = searchParams.get('help') === 'true';

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Report issue state
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    fetchTripDetail();
  }, [tripId]);

  const fetchTripDetail = async () => {
    setLoading(true);
    try {
      const res = await ridesAPI.tripDetails(tripId);
      setTrip(res.data.trip || res.data);
    } catch (err) {
      toast.error('Failed to load trip details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const REPORT_OPTIONS = [
    { key: 'lost_item', label: 'Lost item', icon: FaSuitcase },
    { key: 'fare_dispute', label: 'Fare dispute', icon: FaDollarSign },
    { key: 'safety_concern', label: 'Safety concern', icon: FaShieldAlt },
    { key: 'driver_behavior', label: 'Driver behavior', icon: FaUserSlash },
    { key: 'other', label: 'Other', icon: FaEllipsisH },
  ];

  const handleReportIssue = async () => {
    if (!reportCategory) {
      toast.error('Please select an issue type');
      return;
    }
    setSubmittingReport(true);
    try {
      await sosAPI.trigger({
        tripId,
        description: `[${reportCategory}] ${reportDescription}`,
        location: null,
      });
      toast.success('Issue reported successfully. We will get back to you.');
      setReportCategory('');
      setReportDescription('');
    } catch (err) {
      toast.error('Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSOS = async () => {
    try {
      let location = null;
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        location = { coordinates: [pos.coords.longitude, pos.coords.latitude], address: '' };
      } catch (_) {}
      await sosAPI.trigger({ location, tripId, description: 'SOS triggered from trip detail' });
      toast.warning('SOS alert sent!');
    } catch (err) {
      toast.error('Failed to send SOS');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Trip Details',
        text: `Trip from ${trip?.pickupLocation?.address || 'pickup'} to ${trip?.dropoffLocation?.address || 'dropoff'}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const callDriver = () => {
    if (trip?.driver?.phone) {
      window.location.href = `tel:${trip.driver.phone}`;
    }
  };

  const handleDownloadReceipt = () => {
    const fare = trip.fare || {};
    const driver = trip.driver || {};
    const pickup = trip.pickupLocation?.address || 'N/A';
    const dropoff = trip.dropoffLocation?.address || 'N/A';
    const date = new Date(trip.createdAt).toLocaleString();

    const receipt = `
========================================
           TRIP RECEIPT
========================================
Date: ${date}
Trip ID: ${trip._id}
----------------------------------------
FROM: ${pickup}
TO:   ${dropoff}
----------------------------------------
Vehicle: ${trip.vehicleType || 'N/A'}
Status: ${trip.status || 'N/A'}
----------------------------------------
Fare Breakdown:
  Base Fare:     ETB ${fare.baseFare || 0}
  Distance:      ETB ${fare.distanceFare || 0}
  Time:          ETB ${fare.timeFare || 0}
  Surge:         ETB ${fare.surge || 0}
  Platform Fee:  ETB ${fare.platformFee || 0}
----------------------------------------
TOTAL:           ETB ${fare.total || trip.estimatedFare || 0}
----------------------------------------
Driver: ${driver.firstName || 'N/A'} ${driver.lastName || ''}
Rating: ${trip.rating?.rating || 'N/A'}/5
========================================
        Thank you for riding!
========================================
    `.trim();

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${trip._id || 'trip'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded');
  };

  const getStatusIndex = (status) => {
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const currentStep = trip ? getStatusIndex(trip.status) : 0;

  if (loading) {
    return (
      <div className="passenger-page">
        <div className="passenger-header-row">
          <button onClick={() => navigate(-1)} style={{ background: 'var(--card)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <FaArrowLeft />
          </button>
          <h1 className="passenger-greeting" style={{ fontSize: 18 }}>{t('passenger.tripDetailLoading')}</h1>
        </div>
        <div className="trips-list">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="passenger-page">
        <div className="passenger-header-row">
          <button onClick={() => navigate(-1)} style={{ background: 'var(--card)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <FaArrowLeft />
          </button>
          <h1 className="passenger-greeting" style={{ fontSize: 18 }}>{t('passenger.tripNotFound')}</h1>
        </div>
        <div className="passenger-booking-card" style={{ textAlign: 'center', padding: 40 }}>
          <FaExclamationTriangle size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)' }}>{t('passenger.tripNotFoundDesc')}</p>
          <button className="passenger-primary-btn" onClick={() => navigate('/passenger/trips')} style={{ marginTop: 16 }}>
            {t('passenger.backToTrips')}
          </button>
        </div>
      </div>
    );
  }

  const fare = trip.fare || {};
  const driver = trip.driver || {};
  const pickup = trip.pickupLocation?.address || 'Pickup location';
  const dropoff = trip.dropoffLocation?.address || 'Drop-off location';

  return (
    <div className="passenger-page">
      {/* Header */}
      <div className="passenger-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="passenger-greeting" style={{ fontSize: 18 }}>{t('passenger.tripDetails')}</h1>
            <p className="passenger-location" style={{ fontSize: 12 }}>
              <FaClock /> {new Date(trip.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="passenger-booking-card" style={{ padding: 0, overflow: 'hidden', height: 200, position: 'relative', background: 'var(--bg-secondary)' }}>
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
          position: 'relative',
        }}>
          {/* Simulated map with route line */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', top: '30%', left: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, boxShadow: '0 2px 8px rgba(16,185,129,0.4)' }}>
                <FaMapMarkerAlt />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--secondary)', background: 'white', padding: '2px 6px', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>Pickup</span>
            </div>
            <div style={{ position: 'absolute', top: '55%', right: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, boxShadow: '0 2px 8px rgba(220,38,38,0.4)' }}>
                <FaMapMarkerAlt />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--danger)', background: 'white', padding: '2px 6px', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>Dropoff</span>
            </div>
            {/* Route line */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <path d="M 38% 32% Q 50% 50% 72% 58%" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="8,4" opacity="0.6" />
            </svg>
          </div>
          <FaRouteIcon size={60} style={{ color: 'var(--primary)', opacity: 0.1, position: 'absolute', bottom: 20, right: 20 }} />
        </div>
      </div>

      {/* Trip Route Info */}
      <div className="passenger-booking-card" style={{ marginTop: 12 }}>
        <div className="location-inputs">
          <div className="location-input-wrapper">
            <div className="location-dot pickup"></div>
            <span style={{ padding: '14px 0', fontSize: 14, color: 'var(--text)' }}>{pickup}</span>
          </div>
          <div className="location-divider">
            <div className="divider-line"></div>
            <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}><FaRouteIcon size={12} color="var(--text-muted)" /></div>
            <div className="divider-line"></div>
          </div>
          <div className="location-input-wrapper">
            <div className="location-dot dropoff"></div>
            <span style={{ padding: '14px 0', fontSize: 14, color: 'var(--text)' }}>{dropoff}</span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="passenger-booking-card" style={{ marginTop: 12 }}>
        <h3 className="passenger-subsection" style={{ marginTop: 0 }}>{t('passenger.tripStatus')}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 8px' }}>
          {/* Progress line */}
          <div style={{
            position: 'absolute', top: 16, left: 20, right: 20, height: 3,
            background: 'var(--border)', borderRadius: 2,
          }}>
            <div style={{
              width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`,
              height: '100%', background: 'var(--primary)', borderRadius: 2,
              transition: 'width 0.5s ease',
            }} />
          </div>
          {STATUS_STEPS.map((step, idx) => (
            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: idx <= currentStep ? 'var(--primary)' : 'var(--bg-secondary)',
                color: idx <= currentStep ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, border: idx <= currentStep ? 'none' : '2px solid var(--border)',
                transition: 'all 0.3s ease',
              }}>
                {step.icon}
              </div>
              <span style={{
                fontSize: 9, marginTop: 6, fontWeight: idx === currentStep ? 700 : 500,
                color: idx === currentStep ? 'var(--primary)' : 'var(--text-muted)',
                textAlign: 'center', lineHeight: 1.2,
              }}>{t(step.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Info Card */}
      {driver._id && (
        <div className="passenger-booking-card" style={{ marginTop: 12 }}>
          <h3 className="passenger-subsection" style={{ marginTop: 0 }}>{t('passenger.driverInfo')}</h3>
          <div className="driver-card" style={{ border: 'none', padding: 0, margin: 0, background: 'transparent' }}>
            {driver.profilePhoto ? (
              <img src={driver.profilePhoto} alt="Driver" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="passenger-avatar-lg">
                {(driver.firstName || 'D')[0]}{(driver.lastName || '')[0]}
              </div>
            )}
            <div className="driver-info" style={{ flex: 1 }}>
              <h4>{driver.firstName} {driver.lastName}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {getVehicleIcon(trip.vehicleType)} {trip.vehicleType || 'Sedan'} {driver.vehiclePlate && `• ${driver.vehiclePlate}`}
              </p>
              <span style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaStar /> {driver.rating || '4.8'}
              </span>
            </div>
            <a href={`tel:${driver.phone}`} className="call-btn-sm" onClick={callDriver}>
              <FaPhone />
            </a>
          </div>
        </div>
      )}

      {/* Fare Breakdown */}
      <div className="passenger-booking-card" style={{ marginTop: 12 }}>
        <h3 className="passenger-subsection" style={{ marginTop: 0 }}>{t('passenger.fareBreakdown')}</h3>
        <div className="fare-summary" style={{ background: 'transparent', padding: 0 }}>
          {fare.baseFare !== undefined && (
            <div className="fare-row"><span>{t('passenger.baseFare') || 'Base Fare'}</span><span>ETB {fare.baseFare || 0}</span></div>
          )}
          {fare.distanceFare !== undefined && (
            <div className="fare-row"><span>{t('passenger.distanceFare') || 'Distance'}</span><span>ETB {fare.distanceFare || 0}</span></div>
          )}
          {fare.timeFare !== undefined && (
            <div className="fare-row"><span>{t('passenger.timeFare') || 'Time'}</span><span>ETB {fare.timeFare || 0}</span></div>
          )}
          {fare.surge > 0 && (
            <div className="fare-row"><span>{t('passenger.surge')}</span><span>ETB {fare.surge}</span></div>
          )}
          {fare.platformFee !== undefined && (
            <div className="fare-row"><span>{t('passenger.platformFee') || 'Platform Fee'}</span><span>ETB {fare.platformFee || 0}</span></div>
          )}
          <div className="fare-total">
            <span>{t('passenger.totalFare') || 'Total'}</span>
            <span>ETB {fare.total || trip.estimatedFare || 0}</span>
          </div>
        </div>
      </div>

      {/* Rating Display */}
      {trip.rating && (
        <div className="passenger-booking-card" style={{ marginTop: 12 }}>
          <h3 className="passenger-subsection" style={{ marginTop: 0 }}>{t('passenger.yourRating')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <FaStar key={s} size={18} style={{ color: s <= (trip.rating.rating || 0) ? 'var(--accent)' : 'var(--text-muted)' }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{trip.rating.rating}/5</span>
          </div>
          {trip.rating.comment && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, fontStyle: 'italic' }}>"{trip.rating.comment}"</p>
          )}
        </div>
      )}

      {/* Report Issue Section (help mode) */}
      {isHelpMode && trip?.status === 'completed' && (
        <div className="report-issue-section">
          <h3><FaQuestionCircle style={{ color: 'var(--primary)' }} /> Report Issue</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Select the issue you experienced with this trip
          </p>
          {REPORT_OPTIONS.map(opt => (
            <div
              key={opt.key}
              className={`report-option ${reportCategory === opt.key ? 'selected' : ''}`}
              onClick={() => setReportCategory(opt.key)}
            >
              <opt.icon size={14} />
              {opt.label}
            </div>
          ))}
          {reportCategory && (
            <>
              <textarea
                className="report-description"
                placeholder="Describe the issue in detail (optional)..."
                value={reportDescription}
                onChange={e => setReportDescription(e.target.value)}
              />
              <Button
                variant="primary"
                fullWidth
                loading={submittingReport}
                onClick={handleReportIssue}
                style={{ marginTop: 10 }}
              >
                Submit Report
              </Button>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="passenger-action-btn" onClick={callDriver} style={{ flex: 1 }}>
          <FaPhone /> {t('passenger.callDriver')}
        </button>
        <button className="passenger-action-btn" onClick={handleShare} style={{ flex: 1 }}>
          <FaShareAlt /> {t('passenger.share')}
        </button>
        <button className="passenger-action-btn" onClick={handleDownloadReceipt} style={{ flex: 1 }}>
          <FaDownload /> Receipt
        </button>
        <button className="passenger-action-btn danger" onClick={handleSOS}>
          <FaExclamationTriangle /> SOS
        </button>
      </div>


    </div>
  );
};

export default PassengerTripDetail;

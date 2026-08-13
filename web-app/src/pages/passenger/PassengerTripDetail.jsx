import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import {
  FaMapMarkerAlt, FaCar, FaStar, FaPhone, FaShareAlt, FaExclamationTriangle,
  FaClock, FaCheckCircle, FaArrowLeft,
  FaRoute, FaUser, FaMotorcycle, FaShuttleVan, FaBus, FaBolt,
  FaPlay, FaFlag, FaSms, FaTimes, FaRoute as FaRouteIcon, FaDownload,
  FaQuestionCircle, FaSuitcase, FaDollarSign, FaShieldAlt, FaUserSlash, FaEllipsisH,
  FaComments, FaQrcode
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ridesAPI, sosAPI, reportAPI, ratingsAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { Button } from '../../components/common';
import Modal from '../../components/common/Modal';
import FlexibleMap from '../../components/common/FlexibleMap';
import InAppChat from '../../components/passenger/InAppChat';
import DigitalTicketModal from '../../components/passenger/DigitalTicketModal';
import './Passenger.css';

const pickupIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#16a34a;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>',
  iconSize: [28, 28], iconAnchor: [14, 14],
});
const dropoffIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#dc2626;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">D</div>',
  iconSize: [28, 28], iconAnchor: [14, 14],
});

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
  const { user, socket } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [searchParams] = useSearchParams();
  const isHelpMode = searchParams.get('help') === 'true';

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trips');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Real-world modals state
  const [showChat, setShowChat] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [showReportSection, setShowReportSection] = useState(false);

  // Report issue state
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // SOS state
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosLocation, setSosLocation] = useState(null);
  const [sosSending, setSosSending] = useState(false);
  const [sosType, setSosType] = useState(null);
  const [sosDescription, setSosDescription] = useState('');

  const SOS_TYPES = [
    { type: 'accident', label: '🚗 Accident' },
    { type: 'medical', label: '🚑 Medical Emergency' },
    { type: 'harassment', label: '👮 Harassment / Security' },
    { type: 'theft', label: '💰 Theft' },
    { type: 'fire', label: '🔥 Fire' },
    { type: 'breakdown', label: '⚙️ Vehicle Breakdown' },
    { type: 'other', label: '⚠️ Other Emergency' },
  ];

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
    { key: 'vehicle_damage', label: 'Lost item', icon: FaSuitcase },
    { key: 'payment_evasion', label: 'Fare dispute', icon: FaDollarSign },
    { key: 'harassment', label: 'Safety concern', icon: FaShieldAlt },
    { key: 'reckless_driving', label: 'Driver behavior', icon: FaUserSlash },
    { key: 'other', label: 'Other', icon: FaEllipsisH },
  ];

  const handleReportIssue = async () => {
    if (!reportCategory) {
      toast.error('Please select an issue type');
      return;
    }
    setSubmittingReport(true);
    try {
      const categoryLabel = REPORT_OPTIONS.find(o => o.key === reportCategory)?.label || 'Issue';

      let location = null;
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, enableHighAccuracy: true })
        );
        if (pos && pos.coords) {
          location = {
            coordinates: [pos.coords.longitude, pos.coords.latitude],
            address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          };
        }
      } catch (_) {}
      if (!location && (trip?.pickupLocation?.address || trip?.dropoffLocation?.address)) {
        location = {
          coordinates: trip?.pickupLocation?.coordinates?.coordinates || trip?.pickupLocation?.coordinates,
          address: `${trip?.pickupLocation?.address || ''} → ${trip?.dropoffLocation?.address || ''}`.trim()
        };
      }

      await reportAPI.create({
        tripId,
        category: reportCategory,
        description: reportDescription.trim() || categoryLabel,
        severity: reportCategory === 'harassment' ? 'high' : 'medium',
        location,
      });
      toast.success('Issue reported successfully. We will get back to you.');
      setReportCategory('');
      setReportDescription('');
      setShowReportSection(false);
    } catch (err) {
      toast.error('Failed to submit report');
    } finally {
      setSubmittingReport(false);
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
        tripId,
        location: sosLocation || null,
      });
      const locTxt = sosLocation ? ` at ${sosLocation.address}` : '';
      toast.warning(`🚨 SOS alert sent — ${sosType.label}: "${desc}"${locTxt}!`);
      setSosModalOpen(false);
      setSosType(null);
      setSosDescription('');
    } catch (err) {
      toast.error('Failed to send SOS');
    } finally {
      setSosSending(false);
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
    const phone = trip?.driver?.user?.phoneNumber || trip?.driver?.phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.info('Driver phone number is not available yet');
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
  // Smart coordinate parser to ensure [lat, lng] is always in Dire Dawa/Ethiopia bounds
  const parseCoords = (input) => {
    if (!input) return null;
    const coords = input.coordinates || input;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    let [v1, v2] = [parseFloat(coords[0]), parseFloat(coords[1])];
    if (isNaN(v1) || isNaN(v2)) return null;
    // In Ethiopia: Lat is ~3..15, Lng is ~33..48
    if (v1 > 30 && v2 < 20) return [v2, v1];
    return [v1, v2];
  };

  const pickupCoords = parseCoords(trip.pickupLocation);
  const dropoffCoords = parseCoords(trip.dropoffLocation);
  const mapCenter = pickupCoords || dropoffCoords || [9.6009, 41.8508];

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

      {/* Pickup/Dropoff Header Card */}
      <div className="passenger-booking-card" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--secondary)', flexShrink: 0 }}></div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{pickup}</span>
        </div>
        <div style={{ marginLeft: 4, width: 2, height: 12, background: 'var(--border)', borderRadius: 1 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }}></div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{dropoff}</span>
        </div>
      </div>

      {/* Map Area with FlexibleMap */}
      <div className="passenger-booking-card" style={{ padding: 0, overflow: 'hidden', height: 320, borderRadius: 16 }}>
        <FlexibleMap
          center={mapCenter}
          zoom={14}
          defaultHeight="320px"
          markers={[
            ...(pickupCoords ? [{ position: pickupCoords, icon: pickupIcon, popup: `🟢 Pickup: ${pickup}` }] : []),
            ...(dropoffCoords ? [{ position: dropoffCoords, icon: dropoffIcon, popup: `🔴 Dropoff: ${dropoff}` }] : []),
          ]}
          polylinePoints={
            pickupCoords && dropoffCoords ? [pickupCoords, dropoffCoords] : []
          }
          showRecenter={true}
          showFullscreen={true}
          showZoomButtons={true}
        />
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

      {/* Report Issue Section */}
      {(isHelpMode || showReportSection) && (
        <div className="report-issue-section" style={{ background: '#fff', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaQuestionCircle style={{ color: 'var(--primary)' }} /> Report Issue
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
            Select the issue you experienced with this trip
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 14 }}>
            {REPORT_OPTIONS.map(opt => {
              const IconComp = opt.icon;
              const isSelected = reportCategory === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setReportCategory(opt.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                    background: isSelected ? '#eff6ff' : '#f8fafc',
                    color: isSelected ? '#2563eb' : '#334155',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComp size={15} style={{ color: isSelected ? '#2563eb' : '#64748b' }} />
                  {opt.label}
                </button>
              );
            })}
          </div>
          {reportCategory && (
            <>
              <textarea
                className="report-description"
                placeholder="Describe the issue in detail (optional)..."
                value={reportDescription}
                onChange={e => setReportDescription(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 80 }}
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
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button type="button" className="passenger-action-btn" onClick={() => setShowChat(true)} style={{ flex: 1, background: '#2563eb', color: 'white' }}>
          <FaComments /> Chat with Driver
        </button>
        <button type="button" className="passenger-action-btn" onClick={() => setShowTicket(true)} style={{ flex: 1, background: '#1e293b', color: 'white' }}>
          <FaQrcode /> Digital Ticket
        </button>
        <button type="button" className="passenger-action-btn" onClick={callDriver} style={{ flex: 1 }}>
          <FaPhone /> {t('passenger.callDriver') || 'Call Driver'}
        </button>
        <button type="button" className="passenger-action-btn" onClick={handleShare} style={{ flex: 1 }}>
          <FaShareAlt /> {t('passenger.share') || 'Share'}
        </button>
        <button type="button" className="passenger-action-btn" onClick={() => setShowReportSection(!showReportSection)} style={{ flex: 1, background: '#f59e0b', color: 'white' }}>
          <FaQuestionCircle /> Report Issue
        </button>
        <button type="button" className="passenger-action-btn danger" onClick={handleSOS}>
          <FaExclamationTriangle /> SOS
        </button>
      </div>

      {/* Real-World Modals */}
      <InAppChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        tripId={tripId}
        driverName={trip?.driver?.user?.firstName ? `${trip.driver.user.firstName} ${trip.driver.user.lastName || ''}` : 'Driver'}
        socket={socket}
        tripStatus={trip?.status}
        route={trip?.pickup?.address && trip?.dropoff?.address ? `${trip.pickup.address} → ${trip.dropoff.address}` : ''}
      />

      <DigitalTicketModal
        isOpen={showTicket}
        onClose={() => setShowTicket(false)}
        trip={trip}
        passenger={user}
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
                onClick={() => setSosType(item)}
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

export default PassengerTripDetail;

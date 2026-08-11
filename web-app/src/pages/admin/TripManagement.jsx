import React, { useState, useEffect } from 'react';
import {
  FaRoute, FaCar, FaUser, FaMapMarkerAlt, FaClock, FaMoneyBillWave,
  FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaEdit, FaBan, FaHistory, FaStar, FaComment, FaMapPin, FaArrowRight,
  FaExchangeAlt, FaUserCheck, FaDownload, FaChartLine, FaRedo, FaTag,
  FaHandHoldingUsd, FaExclamation, FaFileExport, FaCalendar
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const TripManagement = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTripDetailModal, setShowTripDetailModal] = useState(false);
  const [showFareAdjustmentModal, setShowFareAdjustmentModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [newFare, setNewFare] = useState('');
  const [fareReason, setFareReason] = useState('');
  const [disputeResolution, setDisputeResolution] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [noShowParty, setNoShowParty] = useState('driver');
  const [noShowReason, setNoShowReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  useEffect(() => {
    fetchTrips();
  }, []);

  const normalizeTrip = (trip) => {
    const driverUser = trip.driver?.user || trip.driver || {};
    const passengerUser = trip.passenger || {};
    const vehicle = trip.vehicle || {};
    const pickup = trip.pickupLocation || {};
    const dropoff = trip.dropoffLocation || {};
    const fareObj = trip.fare || {};
    const totalFare = typeof fareObj === 'number' ? fareObj : (fareObj.totalFare || 0);
    const driverName = `${driverUser.firstName || ''} ${driverUser.lastName || ''}`.trim() || 'Unknown Driver';
    const passengerName = `${passengerUser.firstName || ''} ${passengerUser.lastName || ''}`.trim() || 'Unknown Passenger';
    const vehicleType = vehicle.make ? `${vehicle.make} ${vehicle.model || ''}`.trim() : (trip.vehicleType || 'N/A');
    const distance = trip.actualDistance || trip.distance || 0;
    const durationMin = trip.actualDuration ? Math.round(trip.actualDuration / 60) : 0;
    const duration = trip.duration || (durationMin ? `${durationMin} min` : 'N/A');
    const from = pickup.address || trip.from || 'Unknown';
    const to = dropoff.address || trip.to || 'Unknown';
    const status = trip.status || 'unknown';
    const rating = trip.driverRating;
    const driverRating = typeof rating === 'number' ? rating : (rating?.average || rating?.score || 0);
    return {
      ...trip,
      id: trip._id || trip.id,
      driverName,
      passengerName,
      from,
      to,
      distance,
      duration,
      vehicleType,
      fare: totalFare,
      status,
      driverRating,
      disputeReason: trip.disputeIssue || trip.disputeReason || null,
    };
  };

  const fetchTrips = async () => {
    try {
      const res = await adminAPI.trips();
      const data = res.data;
      const raw = Array.isArray(data) ? data : (data?.trips || data?.data || []);
      setTrips(raw.map(normalizeTrip));
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      setTrips([
        { id: 1, driverName: 'Ahmed Ali', passengerName: 'Sara Tesfaye', from: 'Bole', to: 'Megenagna', distance: 8.5, duration: '25 min', fare: 150, status: 'completed', vehicleType: 'Toyota Corolla', driverRating: 4.8 },
        { id: 2, driverName: 'Mohammed Hussein', passengerName: 'Bekele Alemu', from: 'Kazanchis', to: 'Piassa', distance: 5.2, duration: '18 min', fare: 120, status: 'in_progress', vehicleType: 'Hyundai Accent', driverRating: 4.5 },
        { id: 3, driverName: 'Kedir Jemal', passengerName: 'Helen Mengistu', from: 'Megenagna', to: 'Bole', distance: 8.5, duration: '22 min', fare: 145, status: 'disputed', vehicleType: 'Nissan Sunny', driverRating: 4.9, disputeReason: 'Route deviation' },
        { id: 4, driverName: 'Dawit Abate', passengerName: 'Dawit Kebede', from: 'Piassa', to: 'Kazanchis', distance: 5.2, duration: '15 min', fare: 115, status: 'completed', vehicleType: 'Toyota Vitz', driverRating: 4.6 },
        { id: 5, driverName: 'Yohannes Tesfaye', passengerName: 'Kalkidan Zewde', from: 'Bole', to: 'Airport', distance: 12.0, duration: '35 min', fare: 220, status: 'cancelled', vehicleType: 'Hyundai i20', driverRating: 4.7 },
        { id: 6, driverName: 'Ahmed Ali', passengerName: 'Yosef Tadesse', from: 'Megenagna', to: 'Bole', distance: 8.5, duration: '20 min', fare: 150, status: 'in_progress', vehicleType: 'Toyota Corolla', driverRating: 4.8 },
      ]);
      setLoading(false);
    }
  };

  const handleViewTripDetails = async (tripId) => {
    try {
      const res = await adminAPI.getTripDetails(tripId);
      setSelectedTrip(normalizeTrip(res.data?.trip || res.data));
      setShowTripDetailModal(true);
    } catch (err) {
      toast.error('Failed to fetch trip details');
    }
  };

  const handleAdjustFare = async () => {
    if (!newFare || !fareReason) {
      toast.error('Please provide new fare and reason');
      return;
    }
    try {
      await adminAPI.adjustFare(selectedTrip.id, newFare, fareReason);
      toast.success('Fare adjusted successfully');
      setShowFareAdjustmentModal(false);
      setNewFare('');
      setFareReason('');
      fetchTrips();
    } catch (err) {
      toast.error('Failed to adjust fare');
    }
  };

  const handleResolveDispute = async () => {
    if (!disputeResolution) {
      toast.error('Please provide resolution details');
      return;
    }
    try {
      await adminAPI.resolveDispute(selectedTrip.id, disputeResolution);
      toast.success('Dispute resolved successfully');
      setShowDisputeModal(false);
      setDisputeResolution('');
      fetchTrips();
    } catch (err) {
      toast.error('Failed to resolve dispute');
    }
  };

  const handleCompleteTrip = async () => {
    try {
      await adminAPI.completeTrip(selectedTrip.id, 'Completed by admin');
      toast.success('Trip completed successfully');
      setShowTripDetailModal(false);
      fetchTrips();
    } catch (err) {
      toast.error('Failed to complete trip');
    }
  };

  const handleCancelTrip = async () => {
    if (!cancelReason) {
      toast.error('Please provide cancellation reason');
      return;
    }
    try {
      await adminAPI.cancelTrip(selectedTrip.id, cancelReason, 'admin');
      toast.success('Trip cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      setShowTripDetailModal(false);
      fetchTrips();
    } catch (err) {
      toast.error('Failed to cancel trip');
    }
  };

  const handleReassignDriver = async () => {
    if (!newDriverId) {
      toast.error('Please select a driver');
      return;
    }
    try {
      await adminAPI.reassignDriver(selectedTrip.id, newDriverId);
      toast.success('Driver reassigned successfully');
      setShowReassignModal(false);
      setNewDriverId('');
      setShowTripDetailModal(false);
      fetchTrips();
    } catch (err) {
      toast.error('Failed to reassign driver');
    }
  };

  const handleMarkNoShow = async () => {
    if (!noShowReason) {
      toast.error('Please provide reason');
      return;
    }
    try {
      await adminAPI.markNoShow(selectedTrip.id, noShowParty, noShowReason);
      toast.success('No-show recorded successfully');
      setShowNoShowModal(false);
      setNoShowReason('');
      fetchTrips();
    } catch (err) {
      toast.error('Failed to record no-show');
    }
  };

  const handleProcessRefund = async () => {
    if (!refundAmount || !refundReason) {
      toast.error('Please provide amount and reason');
      return;
    }
    try {
      await adminAPI.processRefund(selectedTrip.id, refundAmount, refundReason);
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      fetchTrips();
    } catch (err) {
      toast.error('Failed to process refund');
    }
  };

  const handleProcessPayout = async () => {
    try {
      await adminAPI.processDriverPayout(selectedTrip.id);
      toast.success('Payout processed successfully');
      setShowPayoutModal(false);
      fetchTrips();
    } catch (err) {
      toast.error('Failed to process payout');
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode || !promoDiscount) {
      toast.error('Please provide promo code and discount amount');
      return;
    }
    try {
      await adminAPI.applyPromoCode(selectedTrip.id, promoCode, promoDiscount);
      toast.success('Promo code applied successfully');
      setShowPromoModal(false);
      setPromoCode('');
      setPromoDiscount('');
      fetchTrips();
    } catch (err) {
      toast.error('Failed to apply promo code');
    }
  };

  const handleViewAnalytics = async () => {
    try {
      const res = await adminAPI.getTripAnalytics({});
      setAnalytics(res.data);
      setShowAnalyticsModal(true);
    } catch (err) {
      toast.error('Failed to fetch analytics');
    }
  };

  const handleExportData = async (format) => {
    try {
      const res = await adminAPI.exportTripData({ format });
      if (format === 'csv') {
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trips_export.csv';
        a.click();
        toast.success('Export successful');
      }
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;
    const matchesSearch = trip.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.passengerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.to?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getTripStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'disputed': return '#f59e0b';
      case 'pending': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 100 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', borderRadius: 12, marginBottom: 16, color: 'white' }}>
        <FaRoute style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>Trip Management</span>
      </div>

      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-greeting">
            {t('admin.tripManagement') || 'Trip Management'}
          </div>
          <div className="admin-role-badge">
            <FaRoute /> {trips.length} {t('admin.totalTrips') || 'Total Trips'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={handleViewAnalytics}>
            <FaChartLine />
          </button>
          <button className="admin-icon-btn" onClick={() => handleExportData('csv')}>
            <FaFileExport />
          </button>
          <button className="admin-icon-btn" onClick={fetchTrips}>
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="admin-search">
        <FaSearch />
        <input
          type="text"
          placeholder={t('admin.searchTrips') || 'Search trips...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="admin-filter-tabs" style={{ gap: 6, marginBottom: 16 }}>
        {[
          { key: 'all', label: t('admin.all') || 'All' },
          { key: 'in_progress', label: t('admin.inProgress') || 'In Progress' },
          { key: 'completed', label: t('admin.completed') || 'Completed' },
          { key: 'disputed', label: t('admin.disputed') || 'Disputed' },
          { key: 'cancelled', label: t('admin.cancelled') || 'Cancelled' },
        ].map(tab => {
          const count = tab.key === 'all' ? trips.length : trips.filter(t => t.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setFilterStatus(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              borderRadius: 16, border: filterStatus === tab.key ? 'none' : '1px solid #e5e7eb',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filterStatus === tab.key ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'white',
              color: filterStatus === tab.key ? 'white' : '#6b7280', transition: 'all 0.2s ease',
            }}>
              {tab.label}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 20, height: 20, borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: filterStatus === tab.key ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                color: filterStatus === tab.key ? 'white' : '#6b7280',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Trip Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        {[
          { icon: <FaRoute />, val: trips.filter(t => t.status === 'in_progress').length, label: t('admin.activeTrips') || 'Active', color: '#3b82f6' },
          { icon: <FaCheckCircle />, val: trips.filter(t => t.status === 'completed').length, label: t('admin.completed') || 'Completed', color: '#10b981' },
          { icon: <FaExclamationTriangle />, val: trips.filter(t => t.status === 'disputed').length, label: t('admin.disputed') || 'Disputed', color: '#f59e0b' },
          { icon: <FaMoneyBillWave />, val: `ETB ${trips.reduce((acc, t) => acc + (t.fare?.totalFare || t.fare || 0), 0).toLocaleString()}`, label: t('admin.totalRevenue') || 'Total Revenue', color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
            <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Trips List */}
      <div className="admin-section-title">
        <FaRoute /> {t('admin.allTrips') || 'All Trips'} ({filteredTrips.length})
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        {filteredTrips.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <FaRoute style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
            <p style={{ color: 'var(--text-muted)' }}>No trips found</p>
          </div>
        ) : filteredTrips.map((trip, idx) => (
          <div
            key={trip._id || trip.id}
            style={{
              padding: '14px 16px',
              borderBottom: idx < filteredTrips.length - 1 ? '1px solid var(--border-light)' : 'none',
              background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))'; }}
          >
            {/* Top row: Route, Status, Rating */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${getTripStatusColor(trip.status)}15`, color: getTripStatusColor(trip.status), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaRoute style={{ fontSize: 14 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                    <FaMapPin style={{ fontSize: 11, color: '#10b981', marginRight: 4 }} />{trip.from}
                    <FaArrowRight style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 6px' }} />
                    <FaMapPin style={{ fontSize: 11, color: '#ef4444', marginRight: 4 }} />{trip.to}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <FaUser style={{ marginRight: 4 }} />{trip.passengerName} · <FaCar style={{ margin: '0 4px' }} />{trip.driverName}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                  <FaStar style={{ fontSize: 11 }} /> {trip.driverRating?.toFixed(1) || '0.0'}
                </span>
                <span style={{ background: `${getTripStatusColor(trip.status)}15`, color: getTripStatusColor(trip.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{trip.status?.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Middle row: Stats */}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, flexWrap: 'wrap' }}>
              <span><FaClock style={{ color: '#6b7280', marginRight: 4 }} />{trip.duration}</span>
              <span><FaCar style={{ color: '#3b82f6', marginRight: 4 }} />{trip.vehicleType}</span>
              <span>{trip.distance} km</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>ETB {trip.fare?.totalFare || trip.fare || 0}</span>
              {trip.disputeReason && <span style={{ color: '#ef4444' }}><FaExclamationTriangle style={{ marginRight: 4 }} />{trip.disputeReason}</span>}
            </div>

            {/* Bottom row: Action Buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
              <button className="driver-action-btn driver-btn-view" onClick={() => handleViewTripDetails(trip._id || trip.id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}><FaEye style={{ fontSize: 10 }} /> View</button>
              {trip.status === 'completed' && <button className="driver-action-btn driver-btn-view" onClick={() => { setSelectedTrip(trip); setShowFareAdjustmentModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#8b5cf6', color: 'white', fontWeight: 600 }}><FaEdit style={{ fontSize: 10 }} /> Fare</button>}
              {trip.status === 'completed' && <button className="driver-action-btn driver-btn-reactivate" onClick={() => { setSelectedTrip(trip); setShowRefundModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}><FaHandHoldingUsd style={{ fontSize: 10 }} /> Refund</button>}
              {trip.status === 'completed' && <button className="driver-action-btn driver-btn-message" onClick={() => { setSelectedTrip(trip); setShowPayoutModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0891b2', color: 'white', fontWeight: 600 }}><FaMoneyBillWave style={{ fontSize: 10 }} /> Payout</button>}
              {trip.status === 'completed' && <button className="driver-action-btn driver-btn-warn" onClick={() => { setSelectedTrip(trip); setShowPromoModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ec4899', color: 'white', fontWeight: 600 }}><FaTag style={{ fontSize: 10 }} /> Promo</button>}
              {trip.status === 'in_progress' && <button className="driver-action-btn driver-btn-reactivate" onClick={handleCompleteTrip} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}><FaCheckCircle style={{ fontSize: 10 }} /> Complete</button>}
              {trip.status === 'in_progress' && <button className="driver-action-btn driver-btn-ban" onClick={() => { setSelectedTrip(trip); setShowCancelModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white', fontWeight: 600 }}><FaBan style={{ fontSize: 10 }} /> Cancel</button>}
              {trip.status === 'in_progress' && <button className="driver-action-btn driver-btn-view" onClick={() => { setSelectedTrip(trip); setShowReassignModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#8b5cf6', color: 'white', fontWeight: 600 }}><FaExchangeAlt style={{ fontSize: 10 }} /> Reassign</button>}
              {trip.status === 'in_progress' && <button className="driver-action-btn driver-btn-warn" onClick={() => { setSelectedTrip(trip); setShowNoShowModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: 'white', fontWeight: 600 }}><FaUserCheck style={{ fontSize: 10 }} /> No-Show</button>}
              {trip.status === 'disputed' && <button className="driver-action-btn driver-btn-warn" onClick={() => { setSelectedTrip(trip); setShowDisputeModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: 'white', fontWeight: 600 }}><FaComment style={{ fontSize: 10 }} /> Resolve</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Trip Detail Modal */}
      {showTripDetailModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowTripDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.tripDetails') || 'Trip Details'}</h3>
              <button className="modal-close" onClick={() => setShowTripDetailModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripId')}</span>
                <span className="detail-val">{selectedTrip.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.driver')}</span>
                <span className="detail-val">{selectedTrip.driverName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.passenger')}</span>
                <span className="detail-val">{selectedTrip.passengerName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.from')}</span>
                <span className="detail-val">{selectedTrip.from}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.to')}</span>
                <span className="detail-val">{selectedTrip.to}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.distance')}</span>
                <span className="detail-val">{selectedTrip.distance} km</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.duration')}</span>
                <span className="detail-val">{selectedTrip.duration}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.fare')}</span>
                <span className="detail-val">ETB {selectedTrip.fare}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.status')}</span>
                <span className="detail-val">{selectedTrip.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.vehicleType')}</span>
                <span className="detail-val">{selectedTrip.vehicleType}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.rating')}</span>
                <span className="detail-val">{selectedTrip.driverRating?.toFixed(1) || 0} ⭐</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <button className="driver-action-btn driver-btn-view" onClick={() => { setShowTripDetailModal(false); setShowFareAdjustmentModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}><FaEdit style={{ fontSize: 10 }} /> {t('admin.adjustFare') || 'Adjust Fare'}</button>
                {selectedTrip.status === 'in_progress' && <button className="driver-action-btn driver-btn-reactivate" onClick={handleCompleteTrip} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}><FaCheckCircle style={{ fontSize: 10 }} /> {t('admin.completeTrip') || 'Complete'}</button>}
                {selectedTrip.status === 'in_progress' && <button className="driver-action-btn driver-btn-ban" onClick={() => { setShowTripDetailModal(false); setShowCancelModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white', fontWeight: 600 }}><FaBan style={{ fontSize: 10 }} /> {t('admin.cancelTrip') || 'Cancel'}</button>}
                {selectedTrip.status === 'in_progress' && <button className="driver-action-btn driver-btn-view" onClick={() => { setShowTripDetailModal(false); setShowReassignModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#8b5cf6', color: 'white', fontWeight: 600 }}><FaExchangeAlt style={{ fontSize: 10 }} /> {t('admin.reassignDriver') || 'Reassign'}</button>}
                {selectedTrip.status === 'in_progress' && <button className="driver-action-btn driver-btn-warn" onClick={() => { setShowTripDetailModal(false); setShowNoShowModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: 'white', fontWeight: 600 }}><FaUserCheck style={{ fontSize: 10 }} /> {t('admin.markNoShow') || 'No-Show'}</button>}
                <button className="driver-action-btn driver-btn-message" onClick={() => { setShowTripDetailModal(false); setShowRefundModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0891b2', color: 'white', fontWeight: 600 }}><FaHandHoldingUsd style={{ fontSize: 10 }} /> {t('admin.processRefund') || 'Refund'}</button>
                <button className="driver-action-btn driver-btn-reactivate" onClick={() => { setShowTripDetailModal(false); setShowPayoutModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}><FaMoneyBillWave style={{ fontSize: 10 }} /> {t('admin.processPayout') || 'Payout'}</button>
                <button className="driver-action-btn driver-btn-warn" onClick={() => { setShowTripDetailModal(false); setShowPromoModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: 'white', fontWeight: 600 }}><FaTag style={{ fontSize: 10 }} /> {t('admin.applyPromo') || 'Promo'}</button>
                {selectedTrip.status === 'disputed' && <button className="driver-action-btn driver-btn-warn" onClick={() => { setShowTripDetailModal(false); setShowDisputeModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: 'white', fontWeight: 600 }}><FaComment style={{ fontSize: 10 }} /> {t('admin.resolveDispute') || 'Resolve'}</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fare Adjustment Modal */}
      {showFareAdjustmentModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowFareAdjustmentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.adjustFare') || 'Adjust Fare'}</h3>
              <button className="modal-close" onClick={() => setShowFareAdjustmentModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.currentFare')}</span>
                <span className="detail-val">ETB {selectedTrip.fare}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.newFare') || 'New Fare (ETB)'}
                </label>
                <input
                  type="number"
                  value={newFare}
                  onChange={(e) => setNewFare(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.reason') || 'Reason for Adjustment'}
                </label>
                <textarea
                  value={fareReason}
                  onChange={(e) => setFareReason(e.target.value)}
                  placeholder={t('admin.enterReason') || 'Enter reason...'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleAdjustFare}
              >
                <FaCheckCircle /> {t('admin.confirmAdjustment') || 'Confirm Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {showDisputeModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.resolveDispute') || 'Resolve Dispute'}</h3>
              <button className="modal-close" onClick={() => setShowDisputeModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripId')}</span>
                <span className="detail-val">{selectedTrip.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.disputeReason')}</span>
                <span className="detail-val">{selectedTrip.disputeReason || 'Not specified'}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.resolution') || 'Resolution Details'}
                </label>
                <textarea
                  value={disputeResolution}
                  onChange={(e) => setDisputeResolution(e.target.value)}
                  placeholder={t('admin.enterResolution') || 'Enter resolution details...'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleResolveDispute}
              >
                <FaCheckCircle /> {t('admin.confirmResolution') || 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Trip Modal */}
      {showCancelModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.cancelTrip') || 'Cancel Trip'}</h3>
              <button className="modal-close" onClick={() => setShowCancelModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripId')}</span>
                <span className="detail-val">{selectedTrip.id}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.cancellationReason') || 'Cancellation Reason'}
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={t('admin.enterReason') || 'Enter reason...'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16, background: '#ef4444' }}
                onClick={handleCancelTrip}
              >
                <FaBan /> {t('admin.confirmCancel') || 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Driver Modal */}
      {showReassignModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowReassignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.reassignDriver') || 'Reassign Driver'}</h3>
              <button className="modal-close" onClick={() => setShowReassignModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripId')}</span>
                <span className="detail-val">{selectedTrip.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.currentDriver')}</span>
                <span className="detail-val">{selectedTrip.driverName}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.selectNewDriver') || 'Select New Driver'}
                </label>
                <select
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">{t('admin.selectDriver') || 'Select a driver...'}</option>
                  <option value="driver1">Driver 1 - Ahmed Ali</option>
                  <option value="driver2">Driver 2 - Mohammed Hussein</option>
                  <option value="driver3">Driver 3 - Kedir Jemal</option>
                </select>
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16, background: '#8b5cf6' }}
                onClick={handleReassignDriver}
              >
                <FaExchangeAlt /> {t('admin.confirmReassign') || 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No-Show Modal */}
      {showNoShowModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowNoShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.markNoShow') || 'Mark No-Show'}</h3>
              <button className="modal-close" onClick={() => setShowNoShowModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripId')}</span>
                <span className="detail-val">{selectedTrip.id}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.party') || 'Party'}
                </label>
                <select
                  value={noShowParty}
                  onChange={(e) => setNoShowParty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="driver">{t('admin.driver') || 'Driver'}</option>
                  <option value="passenger">{t('admin.passenger') || 'Passenger'}</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.reason') || 'Reason'}
                </label>
                <textarea
                  value={noShowReason}
                  onChange={(e) => setNoShowReason(e.target.value)}
                  placeholder={t('admin.enterReason') || 'Enter reason...'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16, background: '#f59e0b' }}
                onClick={handleMarkNoShow}
              >
                <FaUserCheck /> {t('admin.confirmNoShow') || 'Confirm No-Show'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.processRefund') || 'Process Refund'}</h3>
              <button className="modal-close" onClick={() => setShowRefundModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripId')}</span>
                <span className="detail-val">{selectedTrip.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.originalFare')}</span>
                <span className="detail-val">ETB {selectedTrip.fare || selectedTrip.fare?.totalFare || 0}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.refundAmount') || 'Refund Amount (ETB)'}
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.reason') || 'Reason'}
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder={t('admin.enterReason') || 'Enter reason...'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16, background: '#06b6d4' }}
                onClick={handleProcessRefund}
              >
                <FaHandHoldingUsd /> {t('admin.confirmRefund') || 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowPayoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.processPayout') || 'Process Driver Payout'}</h3>
              <button className="modal-close" onClick={() => setShowPayoutModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripId')}</span>
                <span className="detail-val">{selectedTrip.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.totalFare')}</span>
                <span className="detail-val">ETB {selectedTrip.fare || selectedTrip.fare?.totalFare || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.driver')}</span>
                <span className="detail-val">{selectedTrip.driverName}</span>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: '#15803d' }}>
                  {t('admin.payoutInfo') || 'Driver will receive 90% of fare after 10% platform commission'}
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16, background: '#14b8a6' }}
                onClick={handleProcessPayout}
              >
                <FaMoneyBillWave /> {t('admin.confirmPayout') || 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Code Modal */}
      {showPromoModal && selectedTrip && (
        <div className="modal-overlay" onClick={() => setShowPromoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.applyPromo') || 'Apply Promo Code'}</h3>
              <button className="modal-close" onClick={() => setShowPromoModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripId')}</span>
                <span className="detail-val">{selectedTrip.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.currentFare')}</span>
                <span className="detail-val">ETB {selectedTrip.fare || selectedTrip.fare?.totalFare || 0}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.promoCode') || 'Promo Code'}
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="PROMO123"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.discountAmount') || 'Discount Amount (ETB)'}
                </label>
                <input
                  type="number"
                  value={promoDiscount}
                  onChange={(e) => setPromoDiscount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16, background: '#ec4899' }}
                onClick={handleApplyPromoCode}
              >
                <FaTag /> {t('admin.applyPromoCode') || 'Apply Promo Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && analytics && (
        <div className="modal-overlay" onClick={() => setShowAnalyticsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>{t('admin.tripAnalytics') || 'Trip Analytics'}</h3>
              <button className="modal-close" onClick={() => setShowAnalyticsModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="admin-stats-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                    <FaRoute />
                  </div>
                  <div>
                    <div className="admin-stat-value">{analytics.totalTrips}</div>
                    <div className="admin-stat-label">{t('admin.totalTrips') || 'Total Trips'}</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                    <FaCheckCircle />
                  </div>
                  <div>
                    <div className="admin-stat-value">{analytics.completionRate}%</div>
                    <div className="admin-stat-label">{t('admin.completionRate') || 'Completion Rate'}</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                    <FaClock />
                  </div>
                  <div>
                    <div className="admin-stat-value">{analytics.avgDuration} min</div>
                    <div className="admin-stat-label">{t('admin.avgDuration') || 'Avg Duration'}</div>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                    <FaBan />
                  </div>
                  <div>
                    <div className="admin-stat-value">{analytics.cancelledTrips}</div>
                    <div className="admin-stat-label">{t('admin.cancelled') || 'Cancelled'}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  {t('admin.topRoutes') || 'Top Routes by Revenue'}
                </h4>
                {(analytics.revenueByRoute || []).slice(0, 5).map((route, idx) => (
                  <div key={idx} style={{ padding: 8, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{route._id.pickup} → {route._id.dropoff}</span>
                    <span style={{ fontWeight: 600 }}>ETB {route.totalRevenue?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  {t('admin.peakHours') || 'Peak Hours'}
                </h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(analytics.peakHours || []).slice(0, 6).map((hour, idx) => (
                    <span key={idx} style={{ 
                      padding: '4px 12px', 
                      background: '#dbeafe', 
                      borderRadius: 12, 
                      fontSize: 12 
                    }}>
                      {hour._id}:00 - {hour._id + 1}:00 ({hour.count} trips)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagement;

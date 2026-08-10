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

  const fetchTrips = async () => {
    try {
      const res = await adminAPI.trips();
      const data = res.data;
      setTrips(Array.isArray(data) ? data : (data?.trips || data?.data || []));
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      // Use mock data as fallback
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
      setSelectedTrip(res.data);
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

      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          {t('admin.all') || 'All'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'in_progress' ? 'active' : ''}`}
          onClick={() => setFilterStatus('in_progress')}
        >
          {t('admin.inProgress') || 'In Progress'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          {t('admin.completed') || 'Completed'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'disputed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('disputed')}
        >
          {t('admin.disputed') || 'Disputed'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilterStatus('cancelled')}
        >
          {t('admin.cancelled') || 'Cancelled'}
        </button>
      </div>

      {/* Trip Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaRoute />
          </div>
          <div>
            <div className="admin-stat-value">{trips.filter(t => t.status === 'in_progress').length}</div>
            <div className="admin-stat-label">{t('admin.activeTrips') || 'Active'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaCheckCircle />
          </div>
          <div>
            <div className="admin-stat-value">{trips.filter(t => t.status === 'completed').length}</div>
            <div className="admin-stat-label">{t('admin.completed') || 'Completed'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaExclamationTriangle />
          </div>
          <div>
            <div className="admin-stat-value">{trips.filter(t => t.status === 'disputed').length}</div>
            <div className="admin-stat-label">{t('admin.disputed') || 'Disputed'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed' }}>
            <FaMoneyBillWave />
          </div>
          <div>
            <div className="admin-stat-value">
              ETB {trips.reduce((acc, t) => acc + (t.fare?.totalFare || t.fare || 0), 0).toLocaleString()}
            </div>
            <div className="admin-stat-label">{t('admin.totalRevenue') || 'Total Revenue'}</div>
          </div>
        </div>
      </div>

      {/* Trips List */}
      <div className="admin-section-title">
        <FaRoute /> {t('admin.allTrips') || 'All Trips'}
      </div>
      <div className="admin-activity-list">
        {filteredTrips.map((trip) => (
          <div key={trip.id} className="admin-activity-item">
            <div className="admin-activity-icon" style={{
              background: 'rgba(59, 130, 246, 0.08)',
              color: getTripStatusColor(trip.status)
            }}>
              <FaRoute />
            </div>
            <div className="admin-activity-info">
              <div className="admin-activity-text">
                {trip.driverName} → {trip.passengerName}
              </div>
              <div className="admin-activity-time">
                <FaMapPin /> {trip.from} <FaArrowRight /> {trip.to}
              </div>
              <div className="admin-activity-time">
                <FaClock /> {trip.duration} • ETB {trip.fare?.totalFare || trip.fare || 0}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="status-badge" style={{
                background: trip.status === 'completed' ? '#dcfce7' :
                         trip.status === 'in_progress' ? '#dbeafe' :
                         trip.status === 'disputed' ? '#fef3c7' :
                         trip.status === 'cancelled' ? '#fef2f2' : '#f3f4f6',
                color: trip.status === 'completed' ? '#15803d' :
                       trip.status === 'in_progress' ? '#1d4ed8' :
                       trip.status === 'disputed' ? '#92400e' :
                       trip.status === 'cancelled' ? '#dc2626' : '#6b7280'
              }}>
                {trip.status}
              </div>
              <button
                className="admin-icon-btn"
                style={{ width: 32, height: 32 }}
                onClick={() => handleViewTripDetails(trip.id)}
              >
                <FaEye />
              </button>
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
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowTripDetailModal(false);
                    setShowFareAdjustmentModal(true);
                  }}
                >
                  <FaEdit /> {t('admin.adjustFare') || 'Adjust Fare'}
                </button>
                {selectedTrip.status === 'in_progress' && (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#10b981' }}
                    onClick={handleCompleteTrip}
                  >
                    <FaCheckCircle /> {t('admin.completeTrip') || 'Complete Trip'}
                  </button>
                )}
                {selectedTrip.status === 'in_progress' && (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#ef4444' }}
                    onClick={() => {
                      setShowTripDetailModal(false);
                      setShowCancelModal(true);
                    }}
                  >
                    <FaBan /> {t('admin.cancelTrip') || 'Cancel Trip'}
                  </button>
                )}
                {selectedTrip.status === 'in_progress' && (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#8b5cf6' }}
                    onClick={() => {
                      setShowTripDetailModal(false);
                      setShowReassignModal(true);
                    }}
                  >
                    <FaExchangeAlt /> {t('admin.reassignDriver') || 'Reassign Driver'}
                  </button>
                )}
                {selectedTrip.status === 'in_progress' && (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#f59e0b' }}
                    onClick={() => {
                      setShowTripDetailModal(false);
                      setShowNoShowModal(true);
                    }}
                  >
                    <FaUserCheck /> {t('admin.markNoShow') || 'Mark No-Show'}
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  style={{ background: '#06b6d4' }}
                  onClick={() => {
                    setShowTripDetailModal(false);
                    setShowRefundModal(true);
                  }}
                >
                  <FaHandHoldingUsd /> {t('admin.processRefund') || 'Process Refund'}
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: '#14b8a6' }}
                  onClick={() => {
                    setShowTripDetailModal(false);
                    setShowPayoutModal(true);
                  }}
                >
                  <FaMoneyBillWave /> {t('admin.processPayout') || 'Process Payout'}
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: '#ec4899' }}
                  onClick={() => {
                    setShowTripDetailModal(false);
                    setShowPromoModal(true);
                  }}
                >
                  <FaTag /> {t('admin.applyPromo') || 'Apply Promo Code'}
                </button>
                {selectedTrip.status === 'disputed' && (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#f59e0b' }}
                    onClick={() => {
                      setShowTripDetailModal(false);
                      setShowDisputeModal(true);
                    }}
                  >
                    <FaComment /> {t('admin.resolveDispute') || 'Resolve Dispute'}
                  </button>
                )}
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

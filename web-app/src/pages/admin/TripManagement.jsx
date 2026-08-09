import React, { useState, useEffect } from 'react';
import {
  FaRoute, FaCar, FaUser, FaMapMarkerAlt, FaClock, FaMoneyBillWave,
  FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaEdit, FaBan, FaHistory, FaStar, FaComment, FaMapPin, FaArrowRight
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
  const [newFare, setNewFare] = useState('');
  const [fareReason, setFareReason] = useState('');
  const [disputeResolution, setDisputeResolution] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await adminAPI.trips();
      setTrips(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
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
              ETB {trips.reduce((acc, t) => acc + (t.fare || 0), 0).toLocaleString()}
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
                <FaClock /> {trip.duration} • ETB {trip.fare}
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
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowTripDetailModal(false);
                    setShowFareAdjustmentModal(true);
                  }}
                >
                  <FaEdit /> {t('admin.adjustFare') || 'Adjust Fare'}
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
    </div>
  );
};

export default TripManagement;

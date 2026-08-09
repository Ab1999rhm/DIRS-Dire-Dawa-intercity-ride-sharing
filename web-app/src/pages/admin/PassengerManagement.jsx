import React, { useState, useEffect } from 'react';
import {
  FaUsers, FaUserCheck, FaUserTimes, FaStar, FaWallet, FaSearch,
  FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaClock, FaBan,
  FaMoneyBillWave, FaIdCard, FaCreditCard, FaHistory, FaExclamationTriangle
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const PassengerManagement = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [passengers, setPassengers] = useState([]);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      const res = await adminAPI.users();
      const passengerData = (res.data || []).filter(u => u.role === 'passenger');
      setPassengers(passengerData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch passengers:', err);
      setLoading(false);
    }
  };

  const handleSuspendPassenger = async (passengerId, reason) => {
    try {
      await adminAPI.suspendUser(passengerId, reason);
      toast.success('Passenger suspended');
      fetchPassengers();
    } catch (err) {
      toast.error('Failed to suspend passenger');
    }
  };

  const handleReactivatePassenger = async (passengerId) => {
    try {
      await adminAPI.reactivateUser(passengerId);
      toast.success('Passenger reactivated');
      fetchPassengers();
    } catch (err) {
      toast.error('Failed to reactivate passenger');
    }
  };

  const handleViewWallet = async (passengerId) => {
    try {
      const res = await adminAPI.getPassengerWallet(passengerId);
      setSelectedPassenger({ ...res.data, id: passengerId });
      setShowWalletModal(true);
    } catch (err) {
      toast.error('Failed to fetch wallet information');
    }
  };

  const handleProcessRefund = async () => {
    if (!refundAmount || !refundReason) {
      toast.error('Please provide amount and reason');
      return;
    }
    try {
      await adminAPI.processRefund(selectedPassenger.id, refundAmount, refundReason);
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      fetchPassengers();
    } catch (err) {
      toast.error('Failed to process refund');
    }
  };

  const filteredPassengers = passengers.filter(passenger => {
    const matchesStatus = filterStatus === 'all' || passenger.status === filterStatus;
    const matchesSearch = passenger.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         passenger.phoneNumber?.includes(searchQuery) ||
                         passenger.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getPassengerStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#ef4444';
      case 'inactive': return '#6b7280';
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
            {t('admin.passengerManagement') || 'Passenger Management'}
          </div>
          <div className="admin-role-badge">
            <FaUsers /> {passengers.length} {t('admin.totalPassengers') || 'Total Passengers'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchPassengers}>
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="admin-search">
        <FaSearch />
        <input
          type="text"
          placeholder={t('admin.searchPassengers') || 'Search passengers...'}
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
          className={`admin-filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          {t('admin.active') || 'Active'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'suspended' ? 'active' : ''}`}
          onClick={() => setFilterStatus('suspended')}
        >
          {t('admin.suspended') || 'Suspended'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'inactive' ? 'active' : ''}`}
          onClick={() => setFilterStatus('inactive')}
        >
          {t('admin.inactive') || 'Inactive'}
        </button>
      </div>

      {/* Passenger Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaUserCheck />
          </div>
          <div>
            <div className="admin-stat-value">{passengers.filter(p => p.status === 'active').length}</div>
            <div className="admin-stat-label">{t('admin.active') || 'Active'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
            <FaBan />
          </div>
          <div>
            <div className="admin-stat-value">{passengers.filter(p => p.status === 'suspended').length}</div>
            <div className="admin-stat-label">{t('admin.suspended') || 'Suspended'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaWallet />
          </div>
          <div>
            <div className="admin-stat-value">
              ETB {passengers.reduce((acc, p) => acc + (p.walletBalance || 0), 0).toLocaleString()}
            </div>
            <div className="admin-stat-label">{t('admin.totalWalletBalance') || 'Total Balance'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaStar />
          </div>
          <div>
            <div className="admin-stat-value">{passengers.length > 0 ? (passengers.reduce((acc, p) => acc + (p.rating || 0), 0) / passengers.length).toFixed(1) : '0.0'}</div>
            <div className="admin-stat-label">{t('admin.avgRating') || 'Avg Rating'}</div>
          </div>
        </div>
      </div>

      {/* Passengers List */}
      <div className="admin-section-title">
        <FaUsers /> {t('admin.allPassengers') || 'All Passengers'}
      </div>
      <div className="admin-activity-list">
        {filteredPassengers.map((passenger) => (
          <div key={passenger.id} className="admin-activity-item">
            <div className="admin-activity-icon" style={{
              background: 'rgba(59, 130, 246, 0.08)',
              color: getPassengerStatusColor(passenger.status)
            }}>
              <FaIdCard />
            </div>
            <div className="admin-activity-info">
              <div className="admin-activity-text">{passenger.name}</div>
              <div className="admin-activity-time">
                {passenger.phoneNumber} • {passenger.email}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="status-badge" style={{
                background: passenger.status === 'active' ? '#dcfce7' :
                         passenger.status === 'suspended' ? '#fef2f2' : '#f3f4f6',
                color: passenger.status === 'active' ? '#15803d' :
                       passenger.status === 'suspended' ? '#dc2626' : '#6b7280'
              }}>
                {passenger.status}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="admin-icon-btn"
                  style={{ width: 32, height: 32 }}
                  onClick={() => handleViewWallet(passenger.id)}
                >
                  <FaWallet />
                </button>
                {passenger.status === 'active' && (
                  <button
                    className="admin-icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => handleSuspendPassenger(passenger.id, 'Policy violation')}
                  >
                    <FaBan />
                  </button>
                )}
                {passenger.status === 'suspended' && (
                  <button
                    className="admin-icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => handleReactivatePassenger(passenger.id)}
                  >
                    <FaUserCheck />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wallet Modal */}
      {showWalletModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.passengerWallet') || 'Passenger Wallet'}</h3>
              <button className="modal-close" onClick={() => setShowWalletModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.name')}</span>
                <span className="detail-val">{selectedPassenger.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.phoneNumber')}</span>
                <span className="detail-val">{selectedPassenger.phoneNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.currentBalance')}</span>
                <span className="detail-val">ETB {selectedPassenger.walletBalance?.toLocaleString() || 0}</div>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.totalSpent')}</span>
                <span className="detail-val">ETB {selectedPassenger.totalSpent?.toLocaleString() || 0}</div>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.totalTrips')}</span>
                <span className="detail-val">{selectedPassenger.totalTrips || 0}</div>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.rating')}</span>
                <span className="detail-val">{selectedPassenger.rating?.toFixed(1) || 0} ⭐</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => {
                  setShowWalletModal(false);
                  setShowRefundModal(true);
                }}
              >
                <FaMoneyBillWave /> {t('admin.processRefund') || 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPassenger && (
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
                <span className="detail-key">{t('admin.passenger')}</span>
                <span className="detail-val">{selectedPassenger.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.currentBalance')}</span>
                <span className="detail-val">ETB {selectedPassenger.walletBalance?.toLocaleString() || 0}</div>
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
                  {t('admin.refundReason') || 'Refund Reason'}
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder={t('admin.enterReason') || 'Enter reason for refund...'}
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
                onClick={handleProcessRefund}
              >
                <FaCheckCircle /> {t('admin.confirmRefund') || 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerManagement;

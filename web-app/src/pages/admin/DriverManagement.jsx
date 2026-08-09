import React, { useState, useEffect } from 'react';
import {
  FaCar, FaUserCheck, FaUserTimes, FaFileAlt, FaStar, FaMoneyBillWave,
  FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaClock,
  FaExclamationTriangle, FaBan, FaWallet, FaChartLine, FaIdCard, FaCarSide
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const DriverManagement = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [verificationData, setVerificationData] = useState({});

  useEffect(() => {
    fetchDrivers();
    fetchPendingDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await adminAPI.drivers();
      const d = res.data; setDrivers(Array.isArray(d) ? d : (d?.data || d?.drivers || []));
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
      // Use mock data as fallback
      setDrivers([
        { id: 1, name: 'Ahmed Ali', phoneNumber: '+251911234567', vehicle: 'Toyota Corolla', status: 'active', rating: 4.8, totalEarnings: 45000, commissionPaid: 4500, netEarnings: 40500, tripsCompleted: 120, monthlyEarnings: 8500 },
        { id: 2, name: 'Mohammed Hussein', phoneNumber: '+251922345678', vehicle: 'Hyundai Accent', status: 'active', rating: 4.5, totalEarnings: 38000, commissionPaid: 3800, netEarnings: 34200, tripsCompleted: 95, monthlyEarnings: 7200 },
        { id: 3, name: 'Kedir Jemal', phoneNumber: '+251933456789', vehicle: 'Nissan Sunny', status: 'suspended', rating: 4.9, totalEarnings: 52000, commissionPaid: 5200, netEarnings: 46800, tripsCompleted: 140, monthlyEarnings: 0 },
        { id: 4, name: 'Dawit Abate', phoneNumber: '+251944567890', vehicle: 'Toyota Vitz', status: 'active', rating: 4.6, totalEarnings: 29000, commissionPaid: 2900, netEarnings: 26100, tripsCompleted: 80, monthlyEarnings: 5800 },
        { id: 5, name: 'Yohannes Tesfaye', phoneNumber: '+251955678901', vehicle: 'Hyundai i20', status: 'active', rating: 4.7, totalEarnings: 41000, commissionPaid: 4100, netEarnings: 36900, tripsCompleted: 110, monthlyEarnings: 7900 },
      ]);
      setLoading(false);
    }
  };

  const fetchPendingDrivers = async () => {
    try {
      const res = await adminAPI.pendingDrivers();
      const d = res.data; setPendingDrivers(Array.isArray(d) ? d : (d?.data || d?.drivers || []));
    } catch (err) {
      console.error('Failed to fetch pending drivers:', err);
      // Use mock data as fallback
      setPendingDrivers([
        { id: 6, name: 'Abel Bekele', phoneNumber: '+251966789012', vehicle: 'Toyota Yaris' },
        { id: 7, name: 'Solomon Mengistu', phoneNumber: '+251977890123', vehicle: 'Nissan Micra' },
      ]);
    }
  };

  const handleApproveDriver = async (driverId) => {
    try {
      await adminAPI.approveDriver(driverId);
      toast.success('Driver approved successfully');
      fetchPendingDrivers();
      fetchDrivers();
    } catch (err) {
      toast.error('Failed to approve driver');
    }
  };

  const handleRejectDriver = async (driverId, reason) => {
    try {
      await adminAPI.rejectDriver(driverId, reason);
      toast.success('Driver rejected');
      fetchPendingDrivers();
      fetchDrivers();
    } catch (err) {
      toast.error('Failed to reject driver');
    }
  };

  const handleSuspendDriver = async (driverId, reason) => {
    try {
      await adminAPI.suspendDriver(driverId, reason);
      toast.success('Driver suspended');
      fetchDrivers();
    } catch (err) {
      toast.error('Failed to suspend driver');
    }
  };

  const handleViewDocuments = async (driverId) => {
    try {
      const res = await adminAPI.getDriverDocuments(driverId);
      setSelectedDriver(res.data);
      setShowVerificationModal(true);
    } catch (err) {
      toast.error('Failed to fetch documents');
    }
  };

  const handleViewEarnings = async (driverId) => {
    try {
      const res = await adminAPI.getDriverEarnings(driverId);
      setSelectedDriver(res.data);
      setShowEarningsModal(true);
    } catch (err) {
      toast.error('Failed to fetch earnings');
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
    const driverName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
    const matchesSearch = driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (driver.phoneNumber || '').includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const getDriverStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
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
            {t('admin.driverManagement') || 'Driver Management'}
          </div>
          <div className="admin-role-badge">
            <FaCar /> {drivers.length} {t('admin.totalDrivers') || 'Total Drivers'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchDrivers}>
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Pending Drivers Alert */}
      {pendingDrivers.length > 0 && (
        <div className="admin-section-title" style={{ color: '#f59e0b' }}>
          <FaClock /> {t('admin.pendingVerifications') || 'Pending Verifications'} ({pendingDrivers.length})
        </div>
      )}
      {pendingDrivers.length > 0 && (
        <div className="admin-activity-list" style={{ marginBottom: 20, borderColor: '#f59e0b' }}>
          {pendingDrivers.map((driver) => (
            <div key={driver._id || driver.id} className="admin-activity-item" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
              <div className="admin-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <FaIdCard />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{`${driver.firstName || ''} ${driver.lastName || ''}`}</div>
                <div className="admin-activity-time">
                  {driver.vehicle || 'N/A'} • {driver.phoneNumber}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleViewDocuments(driver._id || driver.id)}
                >
                  <FaEye />
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ background: '#10b981' }}
                  onClick={() => handleApproveDriver(driver._id || driver.id)}
                >
                  <FaCheckCircle />
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRejectDriver(driver._id || driver.id, 'Incomplete documents')}
                >
                  <FaTimesCircle />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filter */}
      <div className="admin-search">
        <FaSearch />
        <input
          type="text"
          placeholder={t('admin.searchDrivers') || 'Search drivers...'}
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
          className={`admin-filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          {t('admin.pending') || 'Pending'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'suspended' ? 'active' : ''}`}
          onClick={() => setFilterStatus('suspended')}
        >
          {t('admin.suspended') || 'Suspended'}
        </button>
      </div>

      {/* Driver Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaUserCheck />
          </div>
          <div>
            <div className="admin-stat-value">{drivers.filter(d => d.status === 'active').length}</div>
            <div className="admin-stat-label">{t('admin.activeDrivers') || 'Active'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaClock />
          </div>
          <div>
            <div className="admin-stat-value">{pendingDrivers.length}</div>
            <div className="admin-stat-label">{t('admin.pending') || 'Pending'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
            <FaBan />
          </div>
          <div>
            <div className="admin-stat-value">{drivers.filter(d => d.status === 'suspended').length}</div>
            <div className="admin-stat-label">{t('admin.suspended') || 'Suspended'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaStar />
          </div>
          <div>
            <div className="admin-stat-value">{drivers.length > 0 ? (drivers.reduce((acc, d) => acc + (d.rating || 0), 0) / drivers.length).toFixed(1) : '0.0'}</div>
            <div className="admin-stat-label">{t('admin.avgRating') || 'Avg Rating'}</div>
          </div>
        </div>
      </div>

      {/* Drivers List */}
      <div className="admin-section-title">
        <FaCar /> {t('admin.allDrivers') || 'All Drivers'}
      </div>
      <div className="admin-activity-list">
        {filteredDrivers.map((driver) => (
          <div key={driver._id || driver.id} className="admin-activity-item">
            <div className="admin-activity-icon" style={{
              background: 'rgba(59, 130, 246, 0.08)',
              color: getDriverStatusColor(driver.status)
            }}>
              <FaCarSide />
            </div>
            <div className="admin-activity-info">
              <div className="admin-activity-text">{`${driver.firstName || ''} ${driver.lastName || ''}`}</div>
              <div className="admin-activity-time">
                {driver.vehicle || 'N/A'} • {driver.phoneNumber}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="status-badge" style={{
                background: driver.status === 'active' ? '#dcfce7' :
                         driver.status === 'pending' ? '#fef3c7' :
                         driver.status === 'suspended' ? '#fef2f2' : '#f3f4f6',
                color: driver.status === 'active' ? '#15803d' :
                       driver.status === 'pending' ? '#92400e' :
                       driver.status === 'suspended' ? '#dc2626' : '#6b7280'
              }}>
                {driver.status}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="admin-icon-btn"
                  style={{ width: 32, height: 32 }}
                  onClick={() => handleViewEarnings(driver._id || driver.id)}
                >
                  <FaWallet />
                </button>
                {driver.status === 'active' && (
                  <button
                    className="admin-icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => handleSuspendDriver(driver._id || driver.id, 'Policy violation')}
                  >
                    <FaBan />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Documents Verification Modal */}
      {showVerificationModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowVerificationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.driverVerification') || 'Driver Verification'}</h3>
              <button className="modal-close" onClick={() => setShowVerificationModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.name')}</span>
                <span className="detail-val">{selectedDriver.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.phoneNumber')}</span>
                <span className="detail-val">{selectedDriver.phoneNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.vehicle')}</span>
                <span className="detail-val">{selectedDriver.vehicle}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.licenseNumber')}</span>
                <span className="detail-val">{selectedDriver.licenseNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.licenseExpiry')}</span>
                <span className="detail-val">{selectedDriver.licenseExpiry}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.vehicleRegistration')}</span>
                <span className="detail-val">{selectedDriver.vehicleRegistration}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.insuranceExpiry')}</span>
                <span className="detail-val">{selectedDriver.insuranceExpiry}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleApproveDriver(selectedDriver.id);
                    setShowVerificationModal(false);
                  }}
                >
                  <FaCheckCircle /> {t('admin.approve') || 'Approve'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    handleRejectDriver(selectedDriver.id, verificationData.reason || 'Incomplete documents');
                    setShowVerificationModal(false);
                  }}
                >
                  <FaTimesCircle /> {t('admin.reject') || 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Modal */}
      {showEarningsModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowEarningsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.driverEarnings') || 'Driver Earnings'}</h3>
              <button className="modal-close" onClick={() => setShowEarningsModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.name')}</span>
                <span className="detail-val">{selectedDriver.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.totalEarnings')}</span>
                <span className="detail-val">ETB {selectedDriver.totalEarnings?.toLocaleString() || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.commissionPaid')}</span>
                <span className="detail-val">ETB {selectedDriver.commissionPaid?.toLocaleString() || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.netEarnings')}</span>
                <span className="detail-val">ETB {selectedDriver.netEarnings?.toLocaleString() || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripsCompleted')}</span>
                <span className="detail-val">{selectedDriver.tripsCompleted || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.rating')}</span>
                <span className="detail-val">{selectedDriver.rating?.toFixed(1) || 0} ⭐</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.thisMonth')}</span>
                <span className="detail-val">ETB {selectedDriver.monthlyEarnings?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;

import React, { useState, useEffect } from 'react';
import {
  FaUsers, FaUserCheck, FaUserTimes, FaStar, FaWallet, FaSearch,
  FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaClock, FaBan,
  FaMoneyBillWave, FaIdCard, FaCreditCard, FaHistory, FaExclamationTriangle,
  FaEnvelope, FaShieldAlt, FaMapMarkerAlt, FaChartBar, FaDownload,
  FaBell, FaSms, FaFileAlt, FaCar, FaTimes, FaPlus, FaExclamationCircle
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
  const [activeTab, setActiveTab] = useState('all');
  const [detailTab, setDetailTab] = useState('overview');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageMode, setMessageMode] = useState('message');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [messageText, setMessageText] = useState('');
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addFundsReason, setAddFundsReason] = useState('');
  const [passengerTrips, setPassengerTrips] = useState([]);
  const [passengerTransactions, setPassengerTransactions] = useState([]);

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      const res = await adminAPI.users();
      const d = res.data;
      const passengerData = (Array.isArray(d) ? d : (d?.data || d?.users || [])).filter(u => u.role === 'passenger');
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
      setShowSuspendModal(false);
      setSuspendReason('');
    } catch (err) {
      toast.error('Failed to suspend passenger');
    }
  };

  const handleBanPassenger = async (passengerId, reason) => {
    try {
      await adminAPI.banPassenger(passengerId, reason);
      toast.success('Passenger banned');
      fetchPassengers();
      setShowBanModal(false);
      setBanReason('');
    } catch (err) {
      toast.error('Failed to ban passenger');
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

  const handleAddFunds = async () => {
    if (!addFundsAmount || !addFundsReason) {
      toast.error('Please provide amount and reason');
      return;
    }
    try {
      await adminAPI.addPassengerFunds(selectedPassenger.id, addFundsAmount, addFundsReason);
      toast.success('Funds added successfully');
      setShowAddFundsModal(false);
      setAddFundsAmount('');
      setAddFundsReason('');
      fetchPassengers();
    } catch (err) {
      toast.error('Failed to add funds');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText) {
      toast.error('Please enter a message');
      return;
    }
    try {
      await adminAPI.sendPassengerMessage(selectedPassenger.id, messageText);
      toast.success('Message sent to passenger');
      setShowMessageModal(false);
      setMessageText('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleIssueWarning = async () => {
    if (!messageText) {
      toast.error('Please enter a reason');
      return;
    }
    try {
      await adminAPI.issuePassengerWarning(selectedPassenger.id, messageText);
      toast.success('Warning issued');
      setShowMessageModal(false);
      setMessageText('');
    } catch (err) {
      toast.error('Failed to issue warning');
    }
  };

  const openDetail = async (passenger, tab = 'overview') => {
    setSelectedPassenger(passenger);
    setDetailTab(tab);
    setShowDetailModal(true);
    
    // Fetch passenger trips and transactions
    try {
      const [tripsRes, transactionsRes] = await Promise.all([
        adminAPI.getPassengerTrips(passenger.id),
        adminAPI.getPassengerTransactions(passenger.id)
      ]);
      setPassengerTrips(tripsRes.data?.trips || []);
      setPassengerTransactions(transactionsRes.data?.transactions || []);
    } catch (err) {
      console.error('Failed to fetch passenger details:', err);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Status', 'Wallet Balance', 'Total Spent', 'Total Trips', 'Rating', 'Joined'];
    const rows = passengers.map(p => [
      `${p.firstName} ${p.lastName}`, p.phoneNumber, p.email, p.status, p.walletBalance || 0, p.totalSpent || 0, p.totalTrips || 0, p.rating || 0, p.createdAt || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passengers.csv';
    a.click();
    toast.success('Passenger data exported');
  };

  const filteredPassengers = passengers.filter(passenger => {
    const matchesStatus = filterStatus === 'all' || passenger.status === filterStatus;
    const matchesSearch = `${passenger.firstName || ''} ${passenger.lastName || ''}`.trim().toLowerCase().includes(searchQuery.toLowerCase()) ||
                         passenger.phoneNumber?.includes(searchQuery) ||
                         passenger.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getPassengerStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#ef4444';
      case 'banned': return '#7f1d1d';
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
          <button className="admin-icon-btn" onClick={exportCSV}>
            <FaDownload />
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
        <button className={`admin-filter-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          {t('admin.all') || 'All'}
        </button>
        <button className={`admin-filter-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          {t('admin.active') || 'Active'}
        </button>
        <button className={`admin-filter-tab ${activeTab === 'suspended' ? 'active' : ''}`} onClick={() => setActiveTab('suspended')}>
          {t('admin.suspended') || 'Suspended'}
        </button>
        <button className={`admin-filter-tab ${activeTab === 'behavior' ? 'active' : ''}`} onClick={() => setActiveTab('behavior')}>
          {t('admin.behavior') || 'Behavior'}
        </button>
        <button className={`admin-filter-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          {t('admin.analytics') || 'Analytics'}
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
            <div className="admin-stat-value">ETB {passengers.reduce((acc, p) => acc + (p.walletBalance || 0), 0).toLocaleString()}</div>
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

      {/* All Passengers Tab */}
      {activeTab === 'all' && (
        <>
          <div className="admin-section-title"><FaUsers /> {t('admin.allPassengers') || 'All Passengers'}</div>
          <div className="admin-activity-list">
            {filteredPassengers.map((passenger) => (
              <div key={passenger.id} className="admin-activity-item" style={{ cursor: 'pointer' }} onClick={() => openDetail(passenger, 'overview')}>
                <div className="admin-activity-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: getPassengerStatusColor(passenger.status) }}>
                  <FaIdCard />
                </div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text">{passenger.firstName} {passenger.lastName}</div>
                  <div className="admin-activity-time">{passenger.phoneNumber} • {passenger.email}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: '#6b7280' }}>
                    <span>⭐ {passenger.rating?.toFixed(1) || 'N/A'}</span>
                    <span>🚗 {passenger.totalTrips || 0} trips</span>
                    <span>💰 ETB {(passenger.totalSpent || 0).toLocaleString()}</span>
                    {passenger.complaints > 0 && <span style={{ color: '#ef4444' }}>📩 {passenger.complaints} complaints</span>}
                    {passenger.fraudFlags > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ FRAUD FLAG</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="status-badge" style={{
                    background: passenger.status === 'active' ? '#dcfce7' : passenger.status === 'suspended' ? '#fef2f2' : '#f3f4f6',
                    color: passenger.status === 'active' ? '#15803d' : passenger.status === 'suspended' ? '#dc2626' : '#6b7280'
                  }}>
                    {passenger.status}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="admin-icon-btn" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); handleViewWallet(passenger.id); }}>
                      <FaWallet />
                    </button>
                    {passenger.status === 'active' && (
                      <button className="admin-icon-btn" style={{ width: 32, height: 32 }} onClick={(e) => { e.stopPropagation(); setShowSuspendModal(true); setSelectedPassenger(passenger); }}>
                        <FaBan />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Behavior Tab */}
      {activeTab === 'behavior' && (
        <>
          <div className="admin-section-title"><FaExclamationTriangle /> {t('admin.behaviorMonitoring') || 'Behavior Monitoring'}</div>
          <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}><FaTimesCircle /></div>
              <div><div className="admin-stat-value">{passengers.reduce((acc, p) => acc + (p.cancellations || 0), 0)}</div><div className="admin-stat-label">Total Cancellations</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}><FaClock /></div>
              <div><div className="admin-stat-value">{passengers.reduce((acc, p) => acc + (p.noShows || 0), 0)}</div><div className="admin-stat-label">No-Shows</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}><FaExclamationCircle /></div>
              <div><div className="admin-stat-value">{passengers.filter(p => p.fraudFlags > 0).length}</div><div className="admin-stat-label">Fraud Flags</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(107, 114, 128, 0.08)', color: '#6b7280' }}><FaExclamationTriangle /></div>
              <div><div className="admin-stat-value">{passengers.reduce((acc, p) => acc + (p.complaints || 0), 0)}</div><div className="admin-stat-label">Complaints</div></div>
            </div>
          </div>
          <div className="admin-activity-list">
            {passengers.filter(p => p.cancellations > 5 || p.noShows > 3 || p.fraudFlags > 0 || p.complaints > 2).map(passenger => (
              <div key={passenger.id} className="admin-activity-item" style={{ cursor: 'pointer' }} onClick={() => openDetail(passenger, 'behavior')}>
                <div className="admin-activity-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}><FaExclamationTriangle /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text">{passenger.firstName} {passenger.lastName}</div>
                  <div className="admin-activity-time">{passenger.phoneNumber}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: '#6b7280' }}>
                    <span>❌ {passenger.cancellations || 0} cancellations</span>
                    <span>⏰ {passenger.noShows || 0} no-shows</span>
                    {passenger.fraudFlags > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {passenger.fraudFlags} fraud flags</span>}
                    {passenger.complaints > 0 && <span style={{ color: '#ef4444' }}>📩 {passenger.complaints} complaints</span>}
                  </div>
                </div>
                <div className="status-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Review Required</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          <div className="admin-section-title"><FaChartBar /> {t('admin.analytics') || 'Analytics'}</div>
          <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}><FaUsers /></div>
              <div><div className="admin-stat-value">{passengers.length}</div><div className="admin-stat-label">Total Passengers</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}><FaWallet /></div>
              <div><div className="admin-stat-value">ETB {passengers.reduce((acc, p) => acc + (p.totalSpent || 0), 0).toLocaleString()}</div><div className="admin-stat-label">Total Revenue</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}><FaCar /></div>
              <div><div className="admin-stat-value">{passengers.reduce((acc, p) => acc + (p.totalTrips || 0), 0)}</div><div className="admin-stat-label">Total Trips</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6' }}><FaStar /></div>
              <div><div className="admin-stat-value">{passengers.length > 0 ? (passengers.reduce((acc, p) => acc + (p.rating || 0), 0) / passengers.length).toFixed(1) : '0.0'}</div><div className="admin-stat-label">Avg Rating</div></div>
            </div>
          </div>
        </>
      )}

      {/* Passenger Detail Modal */}
      {showDetailModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{selectedPassenger.firstName} {selectedPassenger.lastName}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
              <button className={`btn btn-sm ${detailTab === 'overview' ? 'btn-primary' : ''}`} style={{ background: detailTab === 'overview' ? '#3b82f6' : '#f3f4f6' }} onClick={() => setDetailTab('overview')}>Overview</button>
              <button className={`btn btn-sm ${detailTab === 'financial' ? 'btn-primary' : ''}`} style={{ background: detailTab === 'financial' ? '#3b82f6' : '#f3f4f6' }} onClick={() => setDetailTab('financial')}>Financial</button>
              <button className={`btn btn-sm ${detailTab === 'history' ? 'btn-primary' : ''}`} style={{ background: detailTab === 'history' ? '#3b82f6' : '#f3f4f6' }} onClick={() => setDetailTab('history')}>Ride History</button>
              <button className={`btn btn-sm ${detailTab === 'behavior' ? 'btn-primary' : ''}`} style={{ background: detailTab === 'behavior' ? '#3b82f6' : '#f3f4f6' }} onClick={() => setDetailTab('behavior')}>Behavior</button>
              <button className={`btn btn-sm ${detailTab === 'actions' ? 'btn-primary' : ''}`} style={{ background: detailTab === 'actions' ? '#3b82f6' : '#f3f4f6' }} onClick={() => setDetailTab('actions')}>Actions</button>
            </div>

            {/* Overview */}
            {detailTab === 'overview' && (
              <div className="driver-detail">
                <div className="detail-row"><span className="detail-key">Name</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
                <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-val">{selectedPassenger.phoneNumber}</span></div>
                <div className="detail-row"><span className="detail-key">Email</span><span className="detail-val">{selectedPassenger.email}</span></div>
                <div className="detail-row"><span className="detail-key">Status</span><span className="detail-val" style={{ color: getPassengerStatusColor(selectedPassenger.status) }}>{selectedPassenger.status}</span></div>
                <div className="detail-row"><span className="detail-key">Rating</span><span className="detail-val">⭐ {selectedPassenger.rating?.toFixed(1) || 'N/A'}</span></div>
                <div className="detail-row"><span className="detail-key">Total Trips</span><span className="detail-val">{selectedPassenger.totalTrips || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Total Spent</span><span className="detail-val">ETB {(selectedPassenger.totalSpent || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Wallet Balance</span><span className="detail-val">ETB {(selectedPassenger.walletBalance || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Payment Method</span><span className="detail-val" style={{ textTransform: 'capitalize' }}>{selectedPassenger.paymentMethod || 'cash'}</span></div>
                <div className="detail-row"><span className="detail-key">Joined</span><span className="detail-val">{selectedPassenger.createdAt ? new Date(selectedPassenger.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                <div className="detail-row"><span className="detail-key">Last Seen</span><span className="detail-val">{selectedPassenger.lastSeen ? new Date(selectedPassenger.lastSeen).toLocaleDateString() : 'N/A'}</span></div>
                
                {/* Emergency Contacts */}
                {selectedPassenger.emergencyContacts && selectedPassenger.emergencyContacts.length > 0 && (
                  <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Emergency Contacts</div>
                    {selectedPassenger.emergencyContacts.map((contact, idx) => (
                      <div key={idx} style={{ padding: 8, background: 'white', borderRadius: 4, marginBottom: 4, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{contact.name}</span>
                        <span style={{ color: '#6b7280' }}>{contact.phone}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Saved Places */}
                {selectedPassenger.favoriteLocations && selectedPassenger.favoriteLocations.length > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Saved Places</div>
                    {selectedPassenger.favoriteLocations.map((place, idx) => (
                      <div key={idx} style={{ padding: 8, background: 'white', borderRadius: 4, marginBottom: 4, fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{place.name}</div>
                        <div style={{ color: '#6b7280' }}>{place.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Financial */}
            {detailTab === 'financial' && (
              <div className="driver-detail">
                <div className="detail-row"><span className="detail-key">Wallet Balance</span><span className="detail-val" style={{ color: '#10b981', fontWeight: 600 }}>ETB {(selectedPassenger.walletBalance || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Total Spent</span><span className="detail-val">ETB {(selectedPassenger.totalSpent || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Avg per Trip</span><span className="detail-val">ETB {selectedPassenger.totalTrips > 0 ? Math.round((selectedPassenger.totalSpent || 0) / selectedPassenger.totalTrips).toLocaleString() : 0}</span></div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={() => { setShowAddFundsModal(true); }}>Add Funds</button>
                  <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => { setShowRefundModal(true); }}>Process Refund</button>
                </div>
                {passengerTransactions.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Recent Transactions</div>
                    {passengerTransactions.slice(0, 5).map(tx => (
                      <div key={tx._id} style={{ padding: 8, background: '#f9fafb', borderRadius: 4, marginBottom: 4, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{tx.description || tx.type}</span>
                          <span style={{ color: tx.type === 'credit' ? '#10b981' : '#ef4444' }}>{tx.type === 'credit' ? '+' : '-'}ETB {tx.amount?.toLocaleString()}</span>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: 10 }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ride History */}
            {detailTab === 'history' && (
              <div className="driver-detail">
                <div className="detail-row"><span className="detail-key">Total Trips</span><span className="detail-val">{selectedPassenger.totalTrips || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Cancellations</span><span className="detail-val">{selectedPassenger.cancellations || 0}</span></div>
                <div className="detail-row"><span className="detail-key">No-Shows</span><span className="detail-val">{selectedPassenger.noShows || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Cancellation Rate</span><span className="detail-val">{selectedPassenger.totalTrips > 0 ? ((selectedPassenger.cancellations / selectedPassenger.totalTrips) * 100).toFixed(1) : 0}%</span></div>
                {passengerTrips.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Recent Trips</div>
                    {passengerTrips.slice(0, 5).map(trip => (
                      <div key={trip._id} style={{ padding: 8, background: '#f9fafb', borderRadius: 4, marginBottom: 4, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{trip.status}</span>
                          <span>ETB {trip.fare?.totalFare?.toLocaleString() || 0}</span>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: 10 }}>{new Date(trip.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Behavior */}
            {detailTab === 'behavior' && (
              <div className="driver-detail">
                <div className="detail-row"><span className="detail-key">Cancellations</span><span className="detail-val" style={{ color: (selectedPassenger.cancellations || 0) > 5 ? '#ef4444' : '#10b981' }}>{selectedPassenger.cancellations || 0}</span></div>
                <div className="detail-row"><span className="detail-key">No-Shows</span><span className="detail-val" style={{ color: (selectedPassenger.noShows || 0) > 3 ? '#ef4444' : '#10b981' }}>{selectedPassenger.noShows || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Fraud Flags</span><span className="detail-val" style={{ color: (selectedPassenger.fraudFlags || 0) > 0 ? '#dc2626' : '#10b981' }}>{selectedPassenger.fraudFlags || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Complaints</span><span className="detail-val" style={{ color: (selectedPassenger.complaints || 0) > 0 ? '#ef4444' : '#10b981' }}>{selectedPassenger.complaints || 0}</span></div>
                {(selectedPassenger.fraudFlags || 0) > 0 && (
                  <div style={{ marginTop: 8, padding: 8, background: '#fef2f2', borderRadius: 6, border: '1px solid #fecaca' }}>
                    <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠️ Fraud Flag - Review Required</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {detailTab === 'actions' && (
              <div className="driver-detail">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600 }}>Account Status</span>
                  <button className="btn btn-sm" style={{ background: selectedPassenger.status === 'active' ? '#10b981' : '#6b7280', color: 'white' }} onClick={() => selectedPassenger.status === 'active' ? handleSuspendPassenger(selectedPassenger.id, 'Deactivated by admin') : handleReactivatePassenger(selectedPassenger.id)}>
                    {selectedPassenger.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                <button className="btn" style={{ background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => { setShowMessageModal(true); setMessageMode('message'); setMessageText(''); }}>
                  <FaEnvelope /> Send Message
                </button>
                <button className="btn" style={{ background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => { setShowMessageModal(true); setMessageMode('warning'); setMessageText(''); }}>
                  <FaExclamationTriangle /> Issue Warning
                </button>
                <button className="btn" style={{ background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => { setShowSuspendModal(true); }}>
                  <FaBan /> Suspend Account
                </button>
                <button className="btn" style={{ background: '#7f1d1d15', color: '#7f1d1d', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => { setShowBanModal(true); }}>
                  <FaBan /> Permanently Ban
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>{messageMode === 'message' ? 'Send Message' : 'Issue Warning'}</h3>
              <button className="modal-close" onClick={() => setShowMessageModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">To</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{messageMode === 'message' ? 'Message' : 'Reason'}</label>
                <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder={messageMode === 'message' ? 'Enter your message...' : 'Enter reason for warning...'} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 80 }} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12, background: messageMode === 'message' ? '#3b82f6' : '#f59e0b' }} onClick={messageMode === 'message' ? handleSendMessage : handleIssueWarning}>{messageMode === 'message' ? 'Send Message' : 'Issue Warning'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowSuspendModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Suspend Passenger</h3>
              <button className="modal-close" onClick={() => setShowSuspendModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Passenger</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Reason</label>
                <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Enter reason for suspension..." style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 80 }} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12, background: '#ef4444' }} onClick={() => handleSuspendPassenger(selectedPassenger.id, suspendReason)}>Suspend</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Ban Passenger</h3>
              <button className="modal-close" onClick={() => setShowBanModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Passenger</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Reason</label>
                <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Enter reason for permanent ban..." style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 80 }} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12, background: '#7f1d1d' }} onClick={() => handleBanPassenger(selectedPassenger.id, banReason)}>Permanently Ban</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {showAddFundsModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowAddFundsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Add Funds</h3>
              <button className="modal-close" onClick={() => setShowAddFundsModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Passenger</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div className="detail-row"><span className="detail-key">Current Balance</span><span className="detail-val">ETB {(selectedPassenger.walletBalance || 0).toLocaleString()}</span></div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Amount (ETB)</label>
                <input type="number" value={addFundsAmount} onChange={e => setAddFundsAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Reason</label>
                <input type="text" value={addFundsReason} onChange={e => setAddFundsReason(e.target.value)} placeholder="Bonus, refund, etc." style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12, background: '#10b981' }} onClick={handleAddFunds}>Add Funds</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Process Refund</h3>
              <button className="modal-close" onClick={() => setShowRefundModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Passenger</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div className="detail-row"><span className="detail-key">Current Balance</span><span className="detail-val">ETB {(selectedPassenger.walletBalance || 0).toLocaleString()}</span></div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Refund Amount (ETB)</label>
                <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Reason</label>
                <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Enter reason for refund..." style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 80 }} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12, background: '#ef4444' }} onClick={handleProcessRefund}>Process Refund</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerManagement;

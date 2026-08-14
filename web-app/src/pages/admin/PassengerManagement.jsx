import React, { useState, useEffect } from 'react';
import {
  FaUsers, FaUserCheck, FaStar, FaWallet, FaSearch,
  FaEye, FaCheckCircle, FaTimesCircle, FaClock, FaBan,
  FaMoneyBillWave, FaIdCard, FaExclamationTriangle, FaExclamationCircle,
  FaEnvelope,
  FaUserSlash, FaToggleOn, FaDownload, FaSync, FaPlus,
  FaPaperPlane, FaChartBar, FaCar, FaTimes, FaCheck, FaTrash,
  FaUser, FaUserShield
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

  const handleDeletePassenger = async (passenger) => {
    if (!window.confirm(`Permanently delete ${passenger.firstName} ${passenger.lastName}'s account? This removes all of their data and cannot be undone. They will not be able to log in again.`)) return;
    try {
      await adminAPI.deleteUser(passenger._id || passenger.id);
      toast.success('Passenger permanently deleted');
      setSelectedPassenger(null);
      fetchPassengers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete passenger');
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
    
    try {
      const [tripsRes, transactionsRes] = await Promise.all([
        adminAPI.getPassengerTrips(passenger._id || passenger.id),
        adminAPI.getPassengerTransactions(passenger._id || passenger.id)
      ]);
      setPassengerTrips(Array.isArray(tripsRes.data) ? tripsRes.data : (tripsRes.data?.trips || []));
      setPassengerTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : (transactionsRes.data?.transactions || []));
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

  const getPassengerStatusBg = (status) => {
    switch (status) {
      case 'active': return 'rgba(16, 185, 129, 0.1)';
      case 'suspended': return 'rgba(239, 68, 68, 0.1)';
      case 'banned': return 'rgba(127, 29, 29, 0.1)';
      case 'inactive': return 'rgba(107, 114, 128, 0.1)';
      default: return 'rgba(59, 130, 246, 0.1)';
    }
  };

  const getRating = (p) => {
    if (typeof p.rating === 'number') return p.rating;
    if (p.rating && typeof p.rating === 'object') return p.rating.average || 0;
    return 0;
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
        <FaUserShield style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>Passenger Management</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.9 }}><FaUsers /> {passengers.length} {t('admin.totalPassengers') || 'Total Passengers'}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="admin-icon-btn" onClick={fetchPassengers} title="Refresh" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
            <FaCheckCircle />
          </button>
          <button className="admin-icon-btn" onClick={exportCSV} title="Export CSV" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
            <FaDownload />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="admin-search admin-animate-in-delay-1">
        <FaSearch />
        <input
          type="text"
          placeholder={t('admin.searchPassengers') || 'Search by name, phone, or email...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="admin-filter-tabs admin-animate-in-delay-1">
        {[
          { key: 'all', label: t('admin.all') || 'All', count: passengers.length },
          { key: 'active', label: t('admin.active') || 'Active', count: passengers.filter(p => p.status === 'active').length },
          { key: 'suspended', label: t('admin.suspended') || 'Suspended', count: passengers.filter(p => p.status === 'suspended').length },
          { key: 'behavior', label: t('admin.behavior') || 'Behavior', icon: <FaExclamationTriangle /> },
          { key: 'analytics', label: t('admin.analytics') || 'Analytics', icon: <FaChartBar /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            borderRadius: 16, border: activeTab === tab.key ? 'none' : '1px solid #e5e7eb',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: activeTab === tab.key ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'white',
            color: activeTab === tab.key ? 'white' : '#6b7280', transition: 'all 0.2s ease',
          }}>
            {tab.icon && tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 20, height: 20, borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                color: activeTab === tab.key ? 'white' : '#6b7280',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="admin-stats-grid admin-animate-in-delay-1" style={{ marginBottom: 20 }}>
        {[
          { icon: <FaUserCheck />, val: passengers.filter(p => p.status === 'active').length, label: t('admin.active') || 'Active', color: '#10b981' },
          { icon: <FaBan />, val: passengers.filter(p => p.status === 'suspended').length, label: t('admin.suspended') || 'Suspended', color: '#ef4444' },
          { icon: <FaWallet />, val: `ETB ${passengers.reduce((a, p) => a + (p.walletBalance || 0), 0).toLocaleString()}`, label: t('admin.totalWalletBalance') || 'Total Balance', color: '#3b82f6' },
          { icon: <FaStar />, val: passengers.length > 0 ? (passengers.reduce((a, p) => a + getRating(p), 0) / passengers.length).toFixed(1) : '0.0', label: t('admin.avgRating') || 'Avg Rating', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
            <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* All Passengers Tab */}
      {activeTab === 'all' && (<>
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        {filteredPassengers.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <FaUsers style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
            <p style={{ color: 'var(--text-muted)' }}>{t('admin.noPassengers') || 'No passengers found'}</p>
          </div>
        ) : filteredPassengers.map((passenger, idx) => (
          <div
            key={passenger._id || passenger.id}
            style={{
              padding: '14px 16px',
              borderBottom: idx < filteredPassengers.length - 1 ? '1px solid var(--border-light)' : 'none',
              background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => openDetail(passenger, 'overview')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))'; }}
          >
            {/* Top row: Name, Status, Rating */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${getPassengerStatusColor(passenger.status)}15`, color: getPassengerStatusColor(passenger.status), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaUser style={{ fontSize: 14 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{passenger.firstName} {passenger.lastName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{passenger.phoneNumber}{passenger.email ? ` · ${passenger.email}` : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                  <FaStar style={{ fontSize: 11 }} /> {getRating(passenger).toFixed(1)}
                </span>
                <span style={{ background: getPassengerStatusBg(passenger.status), color: getPassengerStatusColor(passenger.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{passenger.status}</span>
                {passenger.fraudFlags > 0 && <span style={{ fontSize: 9, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 2 }}><FaExclamationTriangle style={{ fontSize: 8 }} /> {passenger.fraudFlags}</span>}
              </div>
            </div>

            {/* Middle row: Stats */}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, flexWrap: 'wrap' }}>
              <span><FaCar style={{ color: '#3b82f6', marginRight: 4 }} />{passenger.totalTrips || 0} trips</span>
              <span><FaWallet style={{ color: '#10b981', marginRight: 4 }} />ETB {(passenger.totalSpent || 0).toLocaleString()}</span>
            </div>

            {/* Bottom row: Action Buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
              <button className="driver-action-btn driver-btn-view" onClick={() => openDetail(passenger, 'overview')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}><FaEye style={{ fontSize: 10 }} /> View</button>
              <button className="driver-action-btn driver-btn-message" onClick={() => { setSelectedPassenger(passenger); setShowMessageModal(true); setMessageMode('message'); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0891b2', color: 'white', fontWeight: 600 }}><FaEnvelope style={{ fontSize: 10 }} /> Message</button>
              <button className="driver-action-btn driver-btn-warn" onClick={() => { setSelectedPassenger(passenger); setShowMessageModal(true); setMessageMode('warning'); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: 'white', fontWeight: 600 }}><FaExclamationTriangle style={{ fontSize: 10 }} /> Warn</button>
              {passenger.status === 'active' && <button className="driver-action-btn driver-btn-suspend" onClick={() => { setSelectedPassenger(passenger); setShowSuspendModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#6b7280', color: 'white', fontWeight: 600 }}><FaBan style={{ fontSize: 10 }} /> Suspend</button>}
              {passenger.status !== 'banned' && <button className="driver-action-btn driver-btn-ban" onClick={() => { setSelectedPassenger(passenger); setShowBanModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white', fontWeight: 600 }}><FaTrash style={{ fontSize: 10 }} /> Ban</button>}
              <button className="driver-action-btn" onClick={() => handleDeletePassenger(passenger)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#7f1d1d', color: 'white', fontWeight: 600 }}><FaTrash style={{ fontSize: 10 }} /> Delete</button>
              {(passenger.status === 'suspended' || passenger.status === 'banned') && <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleReactivatePassenger(passenger._id || passenger.id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}><FaCheck style={{ fontSize: 10 }} /> Reactivate</button>}
            </div>
          </div>
        ))}
      </div>
      </>)}

      {/* Behavior Tab */}
      {activeTab === 'behavior' && (
        <div className="admin-animate-in-delay-3">
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
            {passengers.filter(p => (p.cancellations || 0) > 5 || (p.noShows || 0) > 3 || (p.fraudFlags || 0) > 0 || (p.complaints || 0) > 2).length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>All passengers have good behavior</p>
              </div>
            ) : (
              passengers.filter(p => (p.cancellations || 0) > 5 || (p.noShows || 0) > 3 || (p.fraudFlags || 0) > 0 || (p.complaints || 0) > 2).map(passenger => (
                <div key={passenger._id || passenger.id} className="admin-activity-item" style={{ cursor: 'pointer', padding: 16, borderLeft: '4px solid #ef4444', borderRadius: 10, marginBottom: 8 }} onClick={() => openDetail(passenger, 'behavior')}>
                  <div className="admin-activity-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><FaExclamationTriangle /></div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text" style={{ fontWeight: 600 }}>{passenger.firstName} {passenger.lastName}</div>
                    <div className="admin-activity-time">{passenger.phoneNumber}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ color: '#ef4444' }}>{passenger.cancellations || 0} cancellations</span>
                      <span style={{ color: '#f59e0b' }}>{passenger.noShows || 0} no-shows</span>
                      {passenger.fraudFlags > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>{passenger.fraudFlags} fraud flags</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button className="driver-action-btn driver-btn-view" onClick={() => openDetail(passenger, 'behavior')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}><FaEye style={{ fontSize: 10 }} /> Review</button>
                    {passenger.status === 'active' && <button className="driver-action-btn driver-btn-suspend" onClick={() => { setSelectedPassenger(passenger); setShowSuspendModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, background: '#6b7280', color: 'white', fontWeight: 600 }}><FaBan style={{ fontSize: 10 }} /> Suspend</button>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="admin-animate-in-delay-3">
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
              <div><div className="admin-stat-value">{passengers.length > 0 ? (passengers.reduce((acc, p) => acc + getRating(p), 0) / passengers.length).toFixed(1) : '0.0'}</div><div className="admin-stat-label">Avg Rating</div></div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PASSENGER DETAIL MODAL ===== */}
      {showDetailModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPassenger.firstName} {selectedPassenger.lastName}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><FaTimes /></button>
            </div>

            {/* Detail Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {['overview', 'financial', 'history', 'behavior', 'actions'].map(tab => (
                <button key={tab} className="btn btn-sm" style={{
                  background: detailTab === tab ? '#3b82f6' : 'var(--bg-secondary)',
                  color: detailTab === tab ? 'white' : 'var(--text-secondary)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }} onClick={() => setDetailTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview */}
            {detailTab === 'overview' && (
              <div className="driver-detail">
                <div className="detail-row"><span className="detail-key">Name</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
                <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-val">{selectedPassenger.phoneNumber}</span></div>
                <div className="detail-row"><span className="detail-key">Email</span><span className="detail-val">{selectedPassenger.email || 'N/A'}</span></div>
                <div className="detail-row"><span className="detail-key">FAN (National ID)</span><span className="detail-val">{selectedPassenger.nationalId || 'N/A'}</span></div>
                <div className="detail-row"><span className="detail-key">Status</span><span className="detail-val" style={{ color: getPassengerStatusColor(selectedPassenger.status), fontWeight: 600 }}>{selectedPassenger.status}</span></div>
                <div className="detail-row"><span className="detail-key">Rating</span><span className="detail-val">⭐ {getRating(selectedPassenger).toFixed(1)}</span></div>
                <div className="detail-row"><span className="detail-key">Total Trips</span><span className="detail-val">{selectedPassenger.totalTrips || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Total Spent</span><span className="detail-val">ETB {(selectedPassenger.totalSpent || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Wallet Balance</span><span className="detail-val" style={{ color: '#10b981', fontWeight: 600 }}>ETB {(selectedPassenger.walletBalance || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Joined</span><span className="detail-val">{selectedPassenger.createdAt ? new Date(selectedPassenger.createdAt).toLocaleDateString() : 'N/A'}</span></div>
              </div>
            )}

            {/* Financial */}
            {detailTab === 'financial' && (
              <div className="driver-detail">
                <div className="detail-row"><span className="detail-key">Wallet Balance</span><span className="detail-val" style={{ color: '#10b981', fontWeight: 600 }}>ETB {(selectedPassenger.walletBalance || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Total Spent</span><span className="detail-val">ETB {(selectedPassenger.totalSpent || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Avg per Trip</span><span className="detail-val">ETB {selectedPassenger.totalTrips > 0 ? Math.round((selectedPassenger.totalSpent || 0) / selectedPassenger.totalTrips).toLocaleString() : 0}</span></div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="driver-action-btn driver-btn-reactivate" onClick={() => setShowAddFundsModal(true)} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, flex: 1 }}>
                    <FaPlus /> Add Funds
                  </button>
                  <button className="driver-action-btn driver-btn-suspend" onClick={() => setShowRefundModal(true)} style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, flex: 1 }}>
                    <FaMoneyBillWave /> Refund
                  </button>
                </div>
                {passengerTransactions.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Recent Transactions</div>
                    {passengerTransactions.slice(0, 5).map(tx => (
                      <div key={tx._id} style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: 'var(--text-primary)' }}>{tx.description || tx.type}</span>
                          <span style={{ color: tx.type === 'credit' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{tx.type === 'credit' ? '+' : '-'}ETB {tx.amount?.toLocaleString()}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
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
                <div className="detail-row"><span className="detail-key">Completion Rate</span><span className="detail-val">{selectedPassenger.totalTrips > 0 ? ((1 - (selectedPassenger.cancellations || 0) / selectedPassenger.totalTrips) * 100).toFixed(1) : 0}%</span></div>
                {passengerTrips.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Recent Trips</div>
                    {passengerTrips.slice(0, 5).map(trip => (
                      <div key={trip._id} style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: 'var(--text-primary)' }}>{trip.status}</span>
                          <span style={{ fontWeight: 600 }}>ETB {trip.fare?.totalFare?.toLocaleString() || 0}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{new Date(trip.createdAt).toLocaleDateString()}</div>
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
                  <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                    <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠️ Fraud Flag - Review Required</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {detailTab === 'actions' && (
              <div className="driver-detail" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'var(--bg-secondary)', borderRadius: 10 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Account Status</span>
                  <button className="driver-action-btn" style={{ background: selectedPassenger.status === 'active' ? '#10b981' : '#6b7280', color: 'white', borderRadius: 8, padding: '6px 16px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }} onClick={() => selectedPassenger.status === 'active' ? handleSuspendPassenger(selectedPassenger._id || selectedPassenger.id, 'Deactivated by admin') : handleReactivatePassenger(selectedPassenger._id || selectedPassenger.id)}>
                    {selectedPassenger.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                <button className="driver-action-btn driver-btn-message" onClick={() => { setShowMessageModal(true); setMessageMode('message'); setMessageText(''); }} style={{ background: '#0891b2', color: 'white', display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}><FaEnvelope /> Send Message</button>
                <button className="driver-action-btn driver-btn-warn" onClick={() => { setShowMessageModal(true); setMessageMode('warning'); setMessageText(''); }} style={{ background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}><FaExclamationTriangle /> Issue Warning</button>
                <button className="driver-action-btn driver-btn-suspend" onClick={() => setShowSuspendModal(true)} style={{ background: '#6b7280', color: 'white', display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}><FaBan /> Suspend Account</button>
                <button className="driver-action-btn driver-btn-ban" onClick={() => setShowBanModal(true)} style={{ background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}><FaUserSlash /> Permanently Ban</button>
                <button className="driver-action-btn" onClick={() => handleDeletePassenger(selectedPassenger)} style={{ background: '#7f1d1d', color: 'white', display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}><FaTrash /> Permanently Delete Account</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MESSAGE MODAL ===== */}
      {showMessageModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{messageMode === 'message' ? 'Send Message' : 'Issue Warning'}</h3>
              <button className="modal-close" onClick={() => setShowMessageModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">To</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>{messageMode === 'message' ? 'Message' : 'Reason'}</label>
                <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder={messageMode === 'message' ? 'Enter your message...' : 'Enter reason for warning...'} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 100, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <button className="driver-action-btn" style={{ marginTop: 16, background: messageMode === 'message' ? '#0891b2' : '#f59e0b', color: 'white', width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }} onClick={messageMode === 'message' ? handleSendMessage : handleIssueWarning}>
                {messageMode === 'message' ? 'Send Message' : 'Issue Warning'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUSPEND MODAL ===== */}
      {showSuspendModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowSuspendModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Suspend Passenger</h3>
              <button className="modal-close" onClick={() => setShowSuspendModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Passenger</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Reason for Suspension</label>
                <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Enter reason for suspension..." style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 100, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <button className="driver-action-btn driver-btn-suspend" style={{ marginTop: 16, background: '#6b7280', color: 'white', width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }} onClick={() => handleSuspendPassenger(selectedPassenger._id || selectedPassenger.id, suspendReason)}>
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BAN MODAL ===== */}
      {showBanModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Permanently Ban Passenger</h3>
              <button className="modal-close" onClick={() => setShowBanModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Passenger</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠️ This action is permanent and cannot be undone.</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Reason for Ban</label>
                <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Enter reason for permanent ban..." style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 100, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <button className="driver-action-btn driver-btn-ban" style={{ marginTop: 16, background: '#ef4444', color: 'white', width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }} onClick={() => handleBanPassenger(selectedPassenger._id || selectedPassenger.id, banReason)}>
                Permanently Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD FUNDS MODAL ===== */}
      {showAddFundsModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowAddFundsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Funds to Wallet</h3>
              <button className="modal-close" onClick={() => setShowAddFundsModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Passenger</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div className="detail-row"><span className="detail-key">Current Balance</span><span className="detail-val" style={{ color: '#10b981', fontWeight: 600 }}>ETB {(selectedPassenger.walletBalance || 0).toLocaleString()}</span></div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Amount (ETB)</label>
                <input type="number" value={addFundsAmount} onChange={e => setAddFundsAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Reason</label>
                <input type="text" value={addFundsReason} onChange={e => setAddFundsReason(e.target.value)} placeholder="Bonus, refund, correction..." style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <button className="driver-action-btn driver-btn-reactivate" style={{ marginTop: 16, background: '#10b981', color: 'white', width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }} onClick={handleAddFunds}>
                Add Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REFUND MODAL ===== */}
      {showRefundModal && selectedPassenger && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Process Refund</h3>
              <button className="modal-close" onClick={() => setShowRefundModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Passenger</span><span className="detail-val">{selectedPassenger.firstName} {selectedPassenger.lastName}</span></div>
              <div className="detail-row"><span className="detail-key">Current Balance</span><span className="detail-val" style={{ color: '#10b981', fontWeight: 600 }}>ETB {(selectedPassenger.walletBalance || 0).toLocaleString()}</span></div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Refund Amount (ETB)</label>
                <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Reason for Refund</label>
                <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Enter reason for refund..." style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 100, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <button className="driver-action-btn driver-btn-suspend" style={{ marginTop: 16, background: '#ef4444', color: 'white', width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }} onClick={handleProcessRefund}>
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerManagement;

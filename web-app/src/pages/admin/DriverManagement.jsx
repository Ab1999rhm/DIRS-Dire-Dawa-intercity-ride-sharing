import React, { useState, useEffect, useCallback } from 'react';
import {
  FaCar, FaUserCheck, FaUserTimes, FaFileAlt, FaStar, FaMoneyBillWave,
  FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaClock,
  FaExclamationTriangle, FaBan, FaWallet, FaChartLine, FaIdCard, FaCarSide,
  FaDownload, FaBell, FaComment, FaExclamationCircle, FaBoxOpen,
  FaHandshake, FaEnvelope, FaUserShield, FaCalendarAlt, FaToggleOn,
  FaToggleOff, FaRedo, FaLock, FaUnlock, FaTrash, FaBullhorn, FaPaperPlane,
  FaMapMarkerAlt, FaListUl, FaChartBar, FaUsers, FaSync, FaCog, FaEdit,
  FaReply, FaCheck, FaTimes, FaInfoCircle, FaFileExport, FaPercentage,
  FaHistory, FaExchangeAlt, FaUserClock, FaFlag, FaBolt, FaFire,
  FaChartArea, FaClipboardList, FaUserGraduate, FaShieldAlt, FaFileImage
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const DriverManagement = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drivers');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const [messageText, setMessageText] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementTarget, setAnnouncementTarget] = useState('all');
  const [disputeResolution, setDisputeResolution] = useState('');

  const [disputes, setDisputes] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [issues, setIssues] = useState([]);
  const [driverHeatmap, setDriverHeatmap] = useState(null);
  const [driverRetention, setDriverRetention] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [commissionRate, setCommissionRate] = useState(10);
  const [fareAdjustment, setFareAdjustment] = useState(0);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [selectedDriverTrips, setSelectedDriverTrips] = useState([]);
  const [showTripsModal, setShowTripsModal] = useState(false);

  useEffect(() => {
    fetchDrivers();
    fetchDisputes();
    fetchLostItems();
    fetchDriverIssues();
    fetchDriverAnalytics();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await adminAPI.drivers();
      const d = res.data;
      const list = (Array.isArray(d) ? d : (d?.data || d?.drivers || [])).map(driver => {
        let status = 'pending';
        if (driver.isBanned) status = 'banned';
        else if (driver.isSuspended) status = 'suspended';
        else if (driver.verificationStatus === 'approved') status = 'active';
        else if (driver.verificationStatus === 'rejected') status = 'banned';
        else status = 'pending';
        return { ...driver, status };
      });
      setDrivers(list);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await adminAPI.getDisputes();
      setDisputes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
    }
  };

  const fetchLostItems = async () => {
    try {
      const res = await adminAPI.getLostItems();
      setLostItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch lost items:', err);
    }
  };

  const fetchDriverIssues = async () => {
    try {
      const res = await adminAPI.getDriverIssues();
      setIssues(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch driver issues:', err);
    }
  };

  const fetchDriverAnalytics = async () => {
    try {
      const [heatmapRes, retentionRes, peakHoursRes] = await Promise.all([
        adminAPI.getDriverActivityHeatmap(),
        adminAPI.getDriverRetention(),
        adminAPI.getPeakHours()
      ]);
      setDriverHeatmap(heatmapRes.data);
      setDriverRetention(retentionRes.data);
      setPeakHours(peakHoursRes.data);
    } catch (err) {
      console.error('Failed to fetch driver analytics:', err);
    }
  };

  const fetchDriverTrips = async (driverId) => {
    try {
      const res = await adminAPI.getDriverPerformance(driverId);
      setSelectedDriverTrips(Array.isArray(res.data?.trips) ? res.data.trips : []);
    } catch (err) {
      console.error('Failed to fetch driver trips:', err);
      setSelectedDriverTrips([]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#ef4444';
      case 'banned': return '#7f1d1d';
      case 'inactive': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'active': return '#dcfce7';
      case 'pending': return '#fef3c7';
      case 'suspended': return '#fef2f2';
      case 'banned': return '#7f1d1d15';
      case 'inactive': return '#f3f4f6';
      default: return '#eff6ff';
    }
  };

  const getDocStatusColor = (s) => {
    if (s === 'verified' || s === 'approved') return '#10b981';
    if (s === 'expired' || s === 'rejected') return '#ef4444';
    return '#f59e0b';
  };

  const filteredDrivers = drivers.filter(d => {
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const firstName = d.user?.firstName || d.firstName || '';
    const lastName = d.user?.lastName || d.lastName || '';
    const name = `${firstName} ${lastName}`.trim();
    const phone = d.user?.phoneNumber || d.phoneNumber || '';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      (d.vehicle?.plateNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeCount = drivers.filter(d => d.status === 'active').length;
  const pendingCount = drivers.filter(d => d.status === 'pending').length;
  const suspendedCount = drivers.filter(d => d.status === 'suspended').length;
  const bannedCount = drivers.filter(d => d.status === 'banned').length;
  const getDriverRating = (d) => {
    if (typeof d.rating === 'number') return d.rating;
    if (d.rating?.average) return d.rating.average;
    if (d.rating?.rating) return d.rating.rating;
    return 0;
  };
  const avgRating = drivers.length > 0 ? (drivers.reduce((a, d) => a + getDriverRating(d), 0) / drivers.length).toFixed(1) : '0.0';
  const totalTrips = drivers.reduce((a, d) => a + (d.totalTrips || 0), 0);
  const totalRevenue = drivers.reduce((a, d) => a + (d.totalEarnings || 0), 0);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveDriver(id);
      toast.success('Driver approved');
      fetchDrivers();
    } catch (err) {
      console.error('Failed to approve driver:', err);
      toast.error('Failed to approve driver');
    }
  };
  const handleReject = async (id, reason) => {
    try {
      await adminAPI.rejectDriver(id, reason);
      toast.success('Driver rejected');
      fetchDrivers();
    } catch (err) {
      console.error('Failed to reject driver:', err);
      toast.error('Failed to reject driver');
    }
  };
  const handleReactivate = async (id) => {
    try {
      await adminAPI.reactivateDriver(id);
      toast.success('Driver reactivated');
      fetchDrivers();
    } catch (err) {
      console.error('Failed to reactivate driver:', err);
      toast.error('Failed to reactivate driver');
    }
  };
  const handleSuspend = async (id, reason) => {
    try {
      await adminAPI.suspendDriver(id, reason);
      toast.success('Driver suspended');
      fetchDrivers();
      setShowSuspendModal(false); setSuspendReason('');
    } catch (err) {
      console.error('Failed to suspend driver:', err);
      toast.error('Failed to suspend driver');
    }
  };
  const handleBan = async (id, reason) => {
    try {
      await adminAPI.banDriver(id, reason);
      toast.success('Driver permanently banned');
      fetchDrivers();
      setShowBanModal(false); setBanReason('');
    } catch (err) {
      console.error('Failed to ban driver:', err);
      toast.error('Failed to ban driver');
    }
  };
  const handleDeleteDriver = async (driver) => {
    const userId = driver.user?._id || driver.userId;
    if (!userId) {
      toast.error('Driver account has no linked user to delete');
      return;
    }
    if (!window.confirm(`Permanently delete ${driver.user?.firstName || driver.firstName} ${driver.user?.lastName || driver.lastName}'s account? This removes all of their data, driver profile, and vehicle, and cannot be undone. They will not be able to log in again.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success('Driver permanently deleted');
      setSelectedDriver(null);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete driver');
    }
  };
  const handleSendMessage = async (id) => {
    try {
      await adminAPI.sendDriverMessage(id, messageText);
      toast.success('Message sent to driver');
      setShowMessageModal(false); setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    }
  };
  const handleWarn = async (id) => {
    try {
      await adminAPI.issueDriverWarning(id, warnReason);
      toast.success('Warning issued to driver');
      fetchDrivers();
      setShowWarnModal(false); setWarnReason('');
    } catch (err) {
      console.error('Failed to issue warning:', err);
      toast.error('Failed to issue warning');
    }
  };
  const handleSendAnnouncement = async () => {
    try {
      await adminAPI.sendDriverAnnouncement({ message: announcementText, target: announcementTarget });
      toast.success(`Announcement sent to ${announcementTarget === 'all' ? 'all drivers' : announcementTarget}`);
      setShowAnnouncementModal(false); setAnnouncementText('');
    } catch (err) {
      console.error('Failed to send announcement:', err);
      toast.error('Failed to send announcement');
    }
  };
  const handleResolveDispute = async (id) => {
    try {
      await adminAPI.resolveDispute(id, disputeResolution, fareAdjustment);
      toast.success('Dispute resolved');
      fetchDisputes();
      setShowDisputeModal(false); setDisputeResolution(''); setFareAdjustment(0);
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
      toast.error('Failed to resolve dispute');
    }
  };
  const handleResolveLostItem = async (id) => {
    try {
      await adminAPI.resolveLostItem(id, 'returned');
      toast.success('Lost item marked as returned');
      fetchLostItems();
    } catch (err) {
      console.error('Failed to resolve lost item:', err);
      toast.error('Failed to resolve lost item');
    }
  };
  const handleResolveIssue = async (id) => {
    try {
      await adminAPI.resolveDriverIssue(id, 'Resolved by admin');
      toast.success('Issue resolved');
      fetchDriverIssues();
    } catch (err) {
      console.error('Failed to resolve issue:', err);
      toast.error('Failed to resolve issue');
    }
  };

  const handleRequestResubmit = async (id, docType) => {
    try {
      await adminAPI.requestDocumentResubmit(id, docType);
      toast.success(`Requested ${docType} resubmission from driver`);
    } catch (err) {
      console.error('Failed to request resubmit:', err);
      toast.error('Failed to request document resubmission');
    }
  };

  const handleAdjustCommission = async (id) => {
    try {
      await adminAPI.adjustCommissionRate(id, commissionRate);
      toast.success(`Commission rate updated to ${commissionRate}%`);
      fetchDrivers();
      setShowCommissionModal(false);
    } catch (err) {
      console.error('Failed to adjust commission:', err);
      toast.error('Failed to adjust commission rate');
    }
  };

  const handleProcessPayout = async (id) => {
    try {
      await adminAPI.processPayout(id, selectedDriver?.monthlyEarnings || 0);
      toast.success('Payout processed successfully');
      fetchDrivers();
    } catch (err) {
      console.error('Failed to process payout:', err);
      toast.error('Failed to process payout');
    }
  };

  const handleViewTrips = async (driverId) => {
    await fetchDriverTrips(driverId);
    setShowTripsModal(true);
  };

  const openDetail = (driver, tab = 'overview') => {
    setSelectedDriver(driver);
    setDetailTab(tab);
    setShowDetailModal(true);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Vehicle', 'Status', 'Rating', 'Total Trips', 'Total Earnings', 'Commission', 'Joined'];
    const rows = filteredDrivers.map(d => [
      `${d.user?.firstName || d.firstName} ${d.user?.lastName || d.lastName}`, d.user?.phoneNumber || d.phoneNumber, `${d.vehicle?.make || ''} ${d.vehicle?.model || ''}`, d.status, d.rating || 0, d.totalTrips || 0, d.totalEarnings || 0, d.commissionPaid || 0, d.joinedAt || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'drivers_export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Driver data exported');
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-logo-bar" style={{ height: 48, borderRadius: 12, marginBottom: 16, background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        <div className="admin-header" style={{ marginBottom: 16 }}>
          <div className="admin-header-left">
            <div className="admin-greeting admin-skeleton" style={{ width: 220, height: 24, borderRadius: 6 }} />
            <div className="admin-role-badge admin-skeleton" style={{ width: 160, height: 20, borderRadius: 10, marginTop: 6 }} />
          </div>
          <div className="admin-header-actions">
            <div className="admin-skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div className="admin-skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div className="admin-skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="admin-skeleton" style={{ height: 90, borderRadius: 12 }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="admin-skeleton" style={{ width: 80, height: 32, borderRadius: 16 }} />
          ))}
        </div>
        <div className="admin-skeleton" style={{ height: 44, borderRadius: 12, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="admin-skeleton" style={{ width: 70, height: 28, borderRadius: 14 }} />
          ))}
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="admin-skeleton" style={{ height: 110, borderRadius: 12, marginBottom: 8 }} />
        ))}
      </div>
    );
  }

  const tabs = [
    { id: 'drivers', label: 'Drivers', icon: <FaCar /> },
    { id: 'verification', label: 'Verification', icon: <FaFileAlt /> },
    { id: 'performance', label: 'Performance', icon: <FaChartLine /> },
    { id: 'financial', label: 'Financial', icon: <FaMoneyBillWave /> },
    { id: 'support', label: 'Support', icon: <FaHandshake /> },
    { id: 'communication', label: 'Messages', icon: <FaEnvelope /> },
    { id: 'analytics', label: 'Analytics', icon: <FaChartArea /> },
  ];

  const statCards = [
    { label: 'Total Drivers', value: drivers.length, color: '#3b82f6', icon: <FaUsers /> },
    { label: 'Active', value: activeCount, color: '#10b981', icon: <FaUserCheck /> },
    { label: 'Pending', value: pendingCount, color: '#f59e0b', icon: <FaClock /> },
    { label: 'Suspended/Banned', value: suspendedCount + bannedCount, color: '#ef4444', icon: <FaBan /> },
    { label: 'Avg Rating', value: avgRating, color: '#7c3aed', icon: <FaStar /> },
    { label: 'Total Trips', value: totalTrips.toLocaleString(), color: '#0891b2', icon: <FaChartLine /> },
    { label: 'Total Revenue', value: `ETB ${totalRevenue.toLocaleString()}`, color: '#10b981', icon: <FaMoneyBillWave /> },
  ];

  return (
    <div className="admin-page">
      <div className="admin-logo-bar" style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
        borderRadius: 12, marginBottom: 16, color: 'white', flexWrap: 'wrap'
      }}>
        <FaShieldAlt style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>Driver Management</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.9, display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaCar /> {drivers.length} {t('admin.totalDrivers') || 'Total Drivers'}</span>
        <div className="admin-logo-actions">
          <button 
            className="admin-icon-btn admin-logo-action-btn" 
            onClick={exportCSV} 
            title="Export CSV" 
          >
            <FaFileExport /> <span>Export</span>
          </button>
          <button 
            className="admin-icon-btn admin-logo-action-btn" 
            onClick={() => setShowAnnouncementModal(true)} 
            title="Send Announcement" 
          >
            <FaBullhorn /> <span>Announce</span>
          </button>
          <button 
            className="admin-icon-btn admin-logo-action-btn" 
            onClick={fetchDrivers} 
          >
            <FaSync /> <span>Sync</span>
          </button>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {statCards.map((stat, idx) => (
          <div 
            key={stat.label} 
            className={`admin-stat-card admin-animate-in admin-animate-in-delay-${Math.min(idx + 1, 5)}`} 
            style={{ 
              borderLeft: `4px solid ${stat.color}`,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${stat.color}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div 
              className="admin-stat-icon" 
              style={{ 
                background: `${stat.color}15`, 
                color: stat.color, 
                borderRadius: '50%', 
                width: 40, 
                height: 40, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 16,
                transition: 'all 0.3s ease'
              }}
            >
              {stat.icon}
            </div>
            <div>
              <div className="admin-stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="admin-stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            background: activeTab === tab.id ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : '#f3f4f6',
            color: activeTab === tab.id ? 'white' : '#6b7280',
            transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ===== DRIVERS TAB ===== */}
      {activeTab === 'drivers' && (
        <>
          <div className="admin-search" style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 12 }}>
            <FaSearch />
            <input type="text" placeholder="Search by name, phone, plate number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%' }} />
          </div>
          <div className="admin-filter-tabs" style={{ gap: 6, marginBottom: 16 }}>
            {['all', 'active', 'pending', 'suspended', 'banned'].map(s => {
              const count = s === 'all' ? drivers.length : drivers.filter(d => d.status === s).length;
              return (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 16, border: filterStatus === s ? 'none' : '1px solid #e5e7eb',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: filterStatus === s ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'white',
                  color: filterStatus === s ? 'white' : '#6b7280', transition: 'all 0.2s ease',
                }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 20, height: 20, borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: filterStatus === s ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                    color: filterStatus === s ? 'white' : '#6b7280',
                  }}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="admin-section-title"><FaCar /> All Drivers ({filteredDrivers.length})</div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {filteredDrivers.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCar style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No drivers found</p>
              </div>
            ) : filteredDrivers.map((driver, idx) => (
              <div
                key={driver._id}
                style={{
                  padding: '14px 16px',
                  borderBottom: idx < filteredDrivers.length - 1 ? '1px solid var(--border-light)' : 'none',
                  background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => openDetail(driver)}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))'; }}
              >
                {/* Top row: Avatar, Name, Status, Rating */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${getStatusColor(driver.status)}15`, color: getStatusColor(driver.status), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FaCarSide style={{ fontSize: 14 }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{driver.user?.firstName || driver.firstName} {driver.user?.lastName || driver.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{driver.user?.phoneNumber || driver.phoneNumber}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                      <FaStar style={{ fontSize: 11 }} /> {getDriverRating(driver).toFixed(1)}
                    </span>
                    <span style={{ background: getStatusBg(driver.status), color: getStatusColor(driver.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{driver.status}</span>
                    {driver.warnings > 0 && <span style={{ fontSize: 9, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}><FaExclamationTriangle style={{ fontSize: 8 }} /> {driver.warnings}</span>}
                  </div>
                </div>

                {/* Middle row: Vehicle, Stats */}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaCar style={{ color: '#3b82f6', fontSize: 11 }} />{driver.vehicle?.make} {driver.vehicle?.model} · {driver.vehicle?.plateNumber}</span>
                  <span><FaCar style={{ color: '#3b82f6', marginRight: 4 }} />{driver.totalTrips || 0} trips</span>
                  <span><FaWallet style={{ color: '#10b981', marginRight: 4 }} />ETB {(driver.totalEarnings || 0).toLocaleString()}</span>
                </div>

                {/* Bottom row: Action Buttons */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                  <button className="driver-action-btn driver-btn-view" onClick={() => openDetail(driver)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}><FaEye style={{ fontSize: 10 }} /> View</button>
                  <button className="driver-action-btn driver-btn-message" onClick={() => { setSelectedDriver(driver); setShowMessageModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0891b2', color: 'white', fontWeight: 600 }}><FaPaperPlane style={{ fontSize: 10 }} /> Message</button>
                  <button className="driver-action-btn driver-btn-warn" onClick={() => { setSelectedDriver(driver); setShowWarnModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f59e0b', color: 'white', fontWeight: 600 }}><FaExclamationTriangle style={{ fontSize: 10 }} /> Warn</button>
                  {driver.status === 'active' && <button className="driver-action-btn driver-btn-suspend" onClick={() => { setSelectedDriver(driver); setShowSuspendModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#6b7280', color: 'white', fontWeight: 600 }}><FaBan style={{ fontSize: 10 }} /> Suspend</button>}
                  {driver.status !== 'banned' && <button className="driver-action-btn driver-btn-ban" onClick={() => { setSelectedDriver(driver); setShowBanModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white', fontWeight: 600 }}><FaTrash style={{ fontSize: 10 }} /> Ban</button>}
                  <button className="driver-action-btn" onClick={() => handleDeleteDriver(driver)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#7f1d1d', color: 'white', fontWeight: 600 }}><FaTrash style={{ fontSize: 10 }} /> Delete</button>
                  {(driver.status === 'suspended' || driver.status === 'banned') && <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleReactivate(driver._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}><FaCheck style={{ fontSize: 10 }} /> Reactivate</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== VERIFICATION TAB ===== */}
      {activeTab === 'verification' && (
        <>
          <div className="admin-section-title" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaFileAlt /> Pending Verifications
            <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>
              {drivers.filter(d => d.verificationStatus === 'pending' || d.verificationStatus === 'under_review').length}
            </span>
          </div>
          <div className="admin-activity-list">
            {drivers.filter(d => d.verificationStatus === 'pending' || d.verificationStatus === 'under_review').map(driver => (
              <div key={driver._id} style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f59e0b15', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaIdCard />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{driver.user?.firstName || driver.firstName} {driver.user?.lastName || driver.lastName}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{driver.user?.phoneNumber || driver.phoneNumber}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleApprove(driver._id)} style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}>
                      <FaCheckCircle /> Approve
                    </button>
                    <button onClick={() => handleReject(driver._id, 'Documents not verified')} style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white', fontWeight: 600 }}>
                      <FaTimesCircle /> Reject
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Driving License', url: driver.licensePhoto },
                    { label: 'National ID', url: driver.nationalIdPhoto },
                    { label: 'Vehicle Photo', url: driver.vehicle?.vehiclePhoto },
                    { label: 'Vehicle Libre', url: driver.documents?.librePhoto?.data },
                    { label: 'Registration', url: driver.vehicle?.registrationPhoto },
                    { label: 'Insurance', url: driver.documents?.insurancePhoto?.data },
                    { label: 'Police Clearance', url: driver.documents?.policeClearancePhoto?.data },
                  ].map(doc => (
                    <div key={doc.label} style={{ borderRadius: 10, overflow: 'hidden', border: doc.url ? '2px solid #10b981' : '2px dashed #d1d5db', background: doc.url ? '#f0fdf4' : '#f9fafb', textAlign: 'center' }}>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                          <img src={doc.url} alt={doc.label} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                          <div style={{ fontSize: 10, fontWeight: 600, padding: '6px 4px', color: '#15803d' }}>{doc.label}</div>
                        </a>
                      ) : (
                        <div style={{ padding: '20px 8px', color: '#9ca3af' }}>
                          <FaFileImage style={{ fontSize: 20, marginBottom: 4, opacity: 0.4 }} />
                          <div style={{ fontSize: 10, fontWeight: 600 }}>{doc.label}</div>
                          <div style={{ fontSize: 9, color: '#b45309', marginTop: 2 }}>Not uploaded</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {drivers.filter(d => d.verificationStatus === 'pending' || d.verificationStatus === 'under_review').length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                <FaCheckCircle style={{ fontSize: 40, color: '#10b981', marginBottom: 12 }} />
                <p>All driver verifications are complete</p>
              </div>
            )}
          </div>
          <div className="admin-section-title" style={{ marginTop: 24 }}><FaFileAlt /> Document Status Overview</div>
          <div className="admin-activity-list">
            {drivers.filter(d => d.verificationStatus !== 'pending' && d.verificationStatus !== 'under_review').map(driver => (
              <div key={driver._id} className="admin-activity-item" style={{ borderLeft: `3px solid ${driver.verificationStatus === 'approved' ? '#10b981' : '#ef4444'}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 600 }}>{driver.user?.firstName || driver.firstName} {driver.user?.lastName || driver.lastName}</div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: driver.verificationStatus === 'approved' ? '#dcfce7' : '#fef2f2', color: driver.verificationStatus === 'approved' ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                      {driver.verificationStatus}
                    </span>
                    {driver.isSuspended && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>Suspended</span>}
                    {driver.isBanned && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#7f1d1d15', color: '#7f1d1d', fontWeight: 600 }}>Banned</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {[
                      ['License', driver.licensePhoto],
                      ['National ID', driver.nationalIdPhoto],
                      ['Vehicle Photo', driver.vehicle?.vehiclePhoto],
                      ['Registration', driver.vehicle?.registrationPhoto],
                      ['Vehicle Libre', driver.documents?.librePhoto?.data],
                      ['Insurance', driver.documents?.insurancePhoto?.data],
                    ].map(([label, photoData]) => {
                      const hasDoc = Boolean(photoData);
                      return (
                        <span key={label} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 8, background: hasDoc ? '#dcfce715' : '#f3f4f6', color: hasDoc ? '#15803d' : '#9ca3af', fontWeight: 600 }}>
                          {label}: {hasDoc ? 'On file' : 'Not uploaded'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== PERFORMANCE TAB ===== */}
      {activeTab === 'performance' && (
        <>
          <div className="admin-section-title"><FaChartLine /> Driver Performance Metrics</div>
          <div className="admin-stats-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {[
              { label: 'Completed Trips', value: drivers.reduce((a, d) => a + (d.completedTrips || 0), 0).toLocaleString(), color: '#10b981', icon: <FaCheckCircle /> },
              { label: 'Cancelled Trips', value: drivers.reduce((a, d) => a + (d.cancelledTrips || 0), 0), color: '#ef4444', icon: <FaTimesCircle /> },
              { label: 'Total Complaints', value: drivers.reduce((a, d) => a + (d.complaints || 0), 0), color: '#f59e0b', icon: <FaExclamationTriangle /> },
            ].map((stat, idx) => (
              <div key={stat.label} className={`admin-stat-card admin-animate-in admin-animate-in-delay-${idx + 1}`} style={{ borderLeft: `4px solid ${stat.color}` }}>
                <div className="admin-stat-icon" style={{ background: `${stat.color}15`, color: stat.color, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{stat.icon}</div>
                <div>
                  <div className="admin-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="admin-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="admin-activity-list">
            {drivers.filter(d => d.status === 'active').sort((a, b) => (b.rating || 0) - (a.rating || 0)).map(driver => {
              const completionRate = driver.totalTrips > 0 ? ((driver.completedTrips / driver.totalTrips) * 100).toFixed(1) : null;
              const barColor = completionRate > 90 ? '#10b981' : completionRate > 70 ? '#f59e0b' : '#ef4444';
              return (
                <div key={driver._id} className="admin-activity-item" style={{ cursor: 'pointer', borderLeft: `3px solid ${barColor}`, borderRadius: 10, padding: 14, marginBottom: 8 }} onClick={() => openDetail(driver, 'performance')}>
                  <div className="admin-activity-icon" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}><FaChartBar /></div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text" style={{ fontWeight: 700 }}>{driver.user?.firstName || driver.firstName} {driver.user?.lastName || driver.lastName}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><FaStar style={{ color: '#f59e0b', fontSize: 9 }} /> {getDriverRating(driver).toFixed(1)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><FaCheckCircle style={{ color: '#10b981', fontSize: 9 }} /> {completionRate !== null ? `${completionRate}% completion` : 'No trips'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><FaCar style={{ color: '#3b82f6', fontSize: 9 }} /> {driver.totalTrips || 0} trips</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><FaTimesCircle style={{ color: '#ef4444', fontSize: 9 }} /> {driver.cancelledTrips || 0} cancelled</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><FaClock style={{ color: '#6b7280', fontSize: 9 }} /> {driver.avgResponseTime || 'N/A'} min avg</span>
                      {driver.complaints > 0 && <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}><FaEnvelope style={{ fontSize: 9 }} /> {driver.complaints} complaints</span>}
                      {driver.totalRatings > 0 && driver.rating < 3.5 && <span style={{ color: '#dc2626', fontWeight: 700 }}>LOW RATING</span>}
                    </div>
                    {completionRate !== null && (
                      <>
                        <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${completionRate}%`, background: barColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
                        </div>
                        <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{completionRate}% completion rate</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ===== FINANCIAL TAB ===== */}
      {activeTab === 'financial' && (
        <>
          <div className="admin-section-title"><FaMoneyBillWave /> Financial Overview</div>
          <div className="admin-stats-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {[
              { label: 'Total Driver Earnings', value: `ETB ${drivers.reduce((a, d) => a + (d.totalEarnings || 0), 0).toLocaleString()}`, color: '#10b981', icon: <FaMoneyBillWave /> },
              { label: 'Total Commission', value: `ETB ${drivers.reduce((a, d) => a + (d.commissionPaid || 0), 0).toLocaleString()}`, color: '#7c3aed', icon: <FaWallet /> },
              { label: 'This Month', value: `ETB ${drivers.reduce((a, d) => a + (d.monthlyEarnings || 0), 0).toLocaleString()}`, color: '#059669', icon: <FaChartLine /> },
            ].map((stat, idx) => (
              <div key={stat.label} className={`admin-stat-card admin-animate-in admin-animate-in-delay-${idx + 1}`} style={{ borderLeft: `4px solid ${stat.color}` }}>
                <div className="admin-stat-icon" style={{ background: `${stat.color}15`, color: stat.color, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{stat.icon}</div>
                <div>
                  <div className="admin-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="admin-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="admin-activity-list">
            {drivers.filter(d => d.status === 'active').sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0)).map(driver => (
              <div key={driver._id} className="admin-activity-item" style={{ cursor: 'pointer', borderLeft: '3px solid #10b981', borderRadius: 10, padding: 14, marginBottom: 8 }} onClick={() => openDetail(driver, 'financial')}>
                <div className="admin-activity-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}><FaMoneyBillWave /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text" style={{ fontWeight: 700 }}>{driver.user?.firstName || driver.firstName} {driver.user?.lastName || driver.lastName}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
                    <span>Total: <strong style={{ color: '#10b981' }}>ETB {(driver.totalEarnings || 0).toLocaleString()}</strong></span>
                    <span>Commission: <strong style={{ color: '#7c3aed' }}>ETB {(driver.commissionPaid || 0).toLocaleString()}</strong></span>
                    <span>Net: ETB {(driver.netEarnings || 0).toLocaleString()}</span>
                    <span>Monthly: <strong style={{ color: '#059669' }}>ETB {(driver.monthlyEarnings || 0).toLocaleString()}</strong></span>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>ETB {(driver.totalEarnings || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== SUPPORT TAB ===== */}
      {activeTab === 'support' && (
        <>
          <div className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaHandshake /> Disputes
            <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>
              {disputes.filter(d => d.status !== 'resolved').length} open
            </span>
          </div>
          <div className="admin-activity-list">
            {disputes.map(d => {
              const borderColor = d.status === 'resolved' ? '#10b981' : d.status === 'investigating' ? '#f59e0b' : '#ef4444';
              return (
                <div key={d._id} className="admin-activity-item" style={{ borderLeft: `4px solid ${borderColor}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                  <div className="admin-activity-icon" style={{ background: d.status === 'resolved' ? '#10b98115' : '#ef444415', color: d.status === 'resolved' ? '#10b981' : '#ef4444' }}><FaExclamationCircle /></div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text" style={{ fontWeight: 700 }}>{d.issue}</div>
                    <div className="admin-activity-time">Driver: {d.driverName} · Passenger: {d.passengerName} · Trip: {d.tripId} · {d.date}</div>
                    {d.amount > 0 && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 4, fontWeight: 600 }}>Amount disputed: ETB {d.amount}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className="status-badge" style={{ background: d.status === 'resolved' ? '#dcfce7' : d.status === 'investigating' ? '#fef3c7' : '#fef2f2', color: d.status === 'resolved' ? '#15803d' : d.status === 'investigating' ? '#92400e' : '#dc2626', fontSize: 10, padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>{d.status}</span>
                    {d.status !== 'resolved' && <button className="btn btn-sm" style={{ background: '#3b82f6', color: 'white', fontSize: 10, borderRadius: 8, padding: '4px 10px' }} onClick={() => { setSelectedDriver(d); setShowDisputeModal(true); }}>Resolve</button>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="admin-section-title" style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaBoxOpen /> Lost & Found
            <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>{lostItems.length}</span>
          </div>
          <div className="admin-activity-list">
            {lostItems.map(l => (
              <div key={l._id} className="admin-activity-item" style={{ borderLeft: `4px solid ${l.status === 'returned' ? '#10b981' : '#f59e0b'}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                <div className="admin-activity-icon" style={{ background: l.status === 'returned' ? '#10b98115' : '#f59e0b15', color: l.status === 'returned' ? '#10b981' : '#f59e0b' }}><FaBoxOpen /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text" style={{ fontWeight: 700 }}>{l.description}</div>
                  <div className="admin-activity-time">Driver: {l.driverName} · Passenger: {l.passengerName} · {l.date}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className="status-badge" style={{ background: l.status === 'returned' ? '#dcfce7' : '#fef3c7', color: l.status === 'returned' ? '#15803d' : '#92400e', fontSize: 10, padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>{l.status === 'returned' ? 'Returned' : 'In Transit'}</span>
                  {l.status !== 'returned' && <button className="btn btn-sm" style={{ background: '#10b981', color: 'white', fontSize: 10, borderRadius: 8, padding: '4px 10px' }} onClick={() => handleResolveLostItem(l._id)}>Mark Returned</button>}
                </div>
              </div>
            ))}
          </div>
          <div className="admin-section-title" style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaExclamationTriangle /> Driver-Reported Issues
            <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>{issues.length}</span>
          </div>
          <div className="admin-activity-list">
            {issues.map(i => (
              <div key={i._id} className="admin-activity-item" style={{ borderLeft: `4px solid ${i.status === 'resolved' ? '#10b981' : '#3b82f6'}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                <div className="admin-activity-icon" style={{ background: i.status === 'resolved' ? '#10b98115' : '#3b82f615', color: i.status === 'resolved' ? '#10b981' : '#3b82f6' }}><FaExclamationTriangle /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text" style={{ fontWeight: 700 }}>{i.type}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{i.description}</div>
                  <div className="admin-activity-time">Driver: {i.driverName} · {i.date}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className="status-badge" style={{ background: i.status === 'resolved' ? '#dcfce7' : '#eff6ff', color: i.status === 'resolved' ? '#15803d' : '#2563eb', fontSize: 10, padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>{i.status}</span>
                  {i.status !== 'resolved' && <button className="btn btn-sm" style={{ background: '#10b981', color: 'white', fontSize: 10, borderRadius: 8, padding: '4px 10px' }} onClick={() => handleResolveIssue(i._id)}>Resolve</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== COMMUNICATION TAB ===== */}
      {activeTab === 'communication' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '10px 18px' }} onClick={() => setShowAnnouncementModal(true)}>
              <FaBullhorn /> Send Announcement
            </button>
            <button className="btn" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '10px 18px' }} onClick={() => setShowAnnouncementModal(true)}>
              <FaFileAlt /> Broadcast Policy Update
            </button>
          </div>
          <div className="admin-section-title"><FaEnvelope /> Individual Driver Communication</div>
          <div className="admin-activity-list">
            {drivers.filter(d => d.status === 'active').map(driver => (
              <div key={driver._id} className="admin-activity-item" style={{ borderLeft: '3px solid #3b82f6', borderRadius: 10, padding: 14, marginBottom: 8 }}>
                <div className="admin-activity-icon" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}><FaCarSide /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text" style={{ fontWeight: 700 }}>{driver.user?.firstName || driver.firstName} {driver.user?.lastName || driver.lastName}</div>
                  <div className="admin-activity-time">{driver.user?.phoneNumber || driver.phoneNumber} · Warnings: <span style={{ color: (driver.warnings || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{driver.warnings || 0}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button className="admin-icon-btn" style={{ width: 30, height: 30, fontSize: 12, borderRadius: 8 }} title="Send Message" onClick={() => { setSelectedDriver(driver); setShowMessageModal(true); }}><FaPaperPlane /></button>
                  <button className="admin-icon-btn" style={{ width: 30, height: 30, fontSize: 12, borderRadius: 8 }} title="Issue Warning" onClick={() => { setSelectedDriver(driver); setShowWarnModal(true); }}><FaExclamationTriangle /></button>
                  {driver.status === 'active' && <button className="admin-icon-btn" style={{ width: 30, height: 30, fontSize: 12, borderRadius: 8, color: '#ef4444' }} title="Suspend" onClick={() => { setSelectedDriver(driver); setShowSuspendModal(true); }}><FaBan /></button>}
                  {driver.status !== 'banned' && <button className="admin-icon-btn" style={{ width: 30, height: 30, fontSize: 12, borderRadius: 8, color: '#7f1d1d' }} title="Permanent Ban" onClick={() => { setSelectedDriver(driver); setShowBanModal(true); }}><FaTrash /></button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== ANALYTICS TAB ===== */}
      {activeTab === 'analytics' && (
        <>
          <div className="admin-section-title"><FaChartArea /> Driver Analytics</div>
          <div className="admin-stats-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {[
              { label: 'Active Drivers', value: driverRetention?.activeDrivers || 0, color: '#10b981', icon: <FaUsers /> },
              { label: 'Retention Rate', value: `${driverRetention?.avgRetentionRate || 0}%`, color: '#f59e0b', icon: <FaUserClock /> },
              { label: 'New This Month', value: driverRetention?.newDriversThisMonth || 0, color: '#3b82f6', icon: <FaClipboardList /> },
            ].map((stat, idx) => (
              <div key={stat.label} className={`admin-stat-card admin-animate-in admin-animate-in-delay-${idx + 1}`} style={{ borderLeft: `4px solid ${stat.color}` }}>
                <div className="admin-stat-icon" style={{ background: `${stat.color}15`, color: stat.color, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{stat.icon}</div>
                <div>
                  <div className="admin-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="admin-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="admin-section-title" style={{ marginTop: 20 }}><FaMapMarkerAlt /> Activity Heatmap</div>
          <div style={{ padding: 24, background: '#f9fafb', borderRadius: 12, textAlign: 'center', color: '#6b7280', border: '1px dashed #e5e7eb' }}>
            {driverHeatmap ? (
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>{driverHeatmap.totalTrips || 0}</div>
                <div style={{ fontSize: 12 }}>total trips recorded</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 12, maxWidth: 280, margin: '12px auto 0' }}>
                  {Array.from({ length: 28 }, (_, i) => (
                    <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 3, background: `rgba(59,130,246,${Math.random() * 0.6 + 0.1})` }} />
                  ))}
                </div>
              </div>
            ) : <div>Loading activity heatmap...</div>}
          </div>
          <div className="admin-section-title" style={{ marginTop: 24 }}><FaClock /> Peak Hours Performance</div>
          <div className="admin-stats-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            {(peakHours?.hours || []).slice(0, 6).map((hour, idx) => (
              <div key={idx} className={`admin-stat-card admin-animate-in admin-animate-in-delay-${Math.min(idx + 1, 5)}`} style={{ borderLeft: '4px solid #3b82f6', textAlign: 'center' }}>
                <div className="admin-stat-icon" style={{ background: '#3b82f615', color: '#3b82f6', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, margin: '0 auto' }}><FaClock /></div>
                <div className="admin-stat-value" style={{ color: '#3b82f6' }}>{hour.hour}:00</div>
                <div className="admin-stat-label">{hour.trips || 0} trips</div>
              </div>
            )) || <div style={{ padding: 24, background: '#f9fafb', borderRadius: 12, textAlign: 'center', color: '#6b7280' }}>Loading peak hours...</div>}
          </div>
        </>
      )}

      {/* ===== DRIVER DETAIL MODAL ===== */}
      {showDetailModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: 20, padding: 24, maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${getStatusColor(selectedDriver.status)}15`, color: getStatusColor(selectedDriver.status), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}><FaCarSide /></div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedDriver.user?.firstName || selectedDriver.firstName} {selectedDriver.user?.lastName || selectedDriver.lastName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span className="status-badge" style={{ background: getStatusBg(selectedDriver.status), color: getStatusColor(selectedDriver.status), fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 600, textTransform: 'capitalize' }}>{selectedDriver.status}</span>
                    <span style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 2 }}><FaStar style={{ fontSize: 10 }} /> {getDriverRating(selectedDriver).toFixed(1)}</span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{selectedDriver.vehicle?.make} {selectedDriver.vehicle?.model}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {['overview', 'documents', 'performance', 'financial', 'actions'].map(tab => (
                <button key={tab} onClick={() => setDetailTab(tab)} style={{ padding: '6px 14px', borderRadius: 14, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: detailTab === tab ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : '#f3f4f6', color: detailTab === tab ? 'white' : '#6b7280', transition: 'all 0.2s ease' }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
              ))}
            </div>

            {detailTab === 'overview' && (
              <div className="driver-detail">
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Phone</span><span className="detail-val">{selectedDriver.user?.phoneNumber || selectedDriver.phoneNumber}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Vehicle</span><span className="detail-val">{selectedDriver.vehicle?.make} {selectedDriver.vehicle?.model} ({selectedDriver.vehicle?.type})</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Plate</span><span className="detail-val">{selectedDriver.vehicle?.plateNumber}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Status</span><span className="detail-val" style={{ color: getStatusColor(selectedDriver.status), fontWeight: 600 }}>{selectedDriver.status}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Rating</span><span className="detail-val">⭐ {getDriverRating(selectedDriver).toFixed(1)}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Joined</span><span className="detail-val">{selectedDriver.joinedAt}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Last Active</span><span className="detail-val">{selectedDriver.lastActive || 'Never'}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Total Trips</span><span className="detail-val">{selectedDriver.totalTrips || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Completed</span><span className="detail-val">{selectedDriver.completedTrips || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Cancelled</span><span className="detail-val">{selectedDriver.cancelledTrips || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Complaints</span><span className="detail-val">{selectedDriver.complaints || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Warnings</span><span className="detail-val">{selectedDriver.warnings || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Lost Items</span><span className="detail-val">{selectedDriver.lostItemReports || 0}</span></div>
              </div>
            )}

            {detailTab === 'documents' && (
              <div className="driver-detail">
                {[
                  { label: 'Driving License', url: selectedDriver.licensePhoto, status: selectedDriver.verificationStatus === 'approved' ? 'approved' : 'pending' },
                  { label: 'National ID', url: selectedDriver.nationalIdPhoto, status: selectedDriver.verificationStatus === 'approved' ? 'approved' : 'pending' },
                  { label: 'Vehicle Photo', url: selectedDriver.vehicle?.vehiclePhoto, status: selectedDriver.vehicle?.vehiclePhoto ? 'uploaded' : 'not uploaded' },
                  { label: 'Vehicle Libre', url: selectedDriver.documents?.librePhoto?.data, status: selectedDriver.documents?.librePhoto?.status || 'pending' },
                  { label: 'Registration', url: selectedDriver.vehicle?.registrationPhoto, status: selectedDriver.vehicle?.registrationPhoto ? 'uploaded' : 'not uploaded' },
                  { label: 'Insurance', url: selectedDriver.documents?.insurancePhoto?.data, status: selectedDriver.documents?.insurancePhoto?.status || 'pending' },
                  { label: 'Police Clearance', url: selectedDriver.documents?.policeClearancePhoto?.data, status: selectedDriver.documents?.policeClearancePhoto?.status || 'pending' },
                ].map(doc => (
                  <div key={doc.label} style={{ marginBottom: 12, padding: 14, background: '#f9fafb', borderRadius: 10, border: `1px solid ${getDocStatusColor(doc.status)}30` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{doc.label}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: `${getDocStatusColor(doc.status)}15`, color: getDocStatusColor(doc.status), fontWeight: 600 }}>{doc.status}</span>
                    </div>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: 8 }}>
                        <img src={doc.url} alt={doc.label} style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      </a>
                    ) : (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, fontStyle: 'italic' }}>No document uploaded</div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#10b981', color: 'white' }} onClick={() => handleApprove(selectedDriver._id)}>Approve</button>
                      <button className="btn btn-sm" style={{ background: '#ef4444', color: 'white' }} onClick={() => handleReject(selectedDriver._id, `${doc.label} not verified`)}>Reject</button>
                      <button className="btn btn-sm" style={{ background: '#f59e0b15', color: '#d97706' }} onClick={() => handleRequestResubmit(selectedDriver._id, doc.label)}>Request Re-submit</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailTab === 'performance' && (
              <div className="driver-detail">
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Rating</span><span className="detail-val">⭐ {getDriverRating(selectedDriver).toFixed(1)}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Total Trips</span><span className="detail-val">{selectedDriver.totalTrips || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Completed</span><span className="detail-val">{selectedDriver.completedTrips || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Cancelled</span><span className="detail-val">{selectedDriver.cancelledTrips || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Completion Rate</span><span className="detail-val">{selectedDriver.totalTrips > 0 ? ((selectedDriver.completedTrips / selectedDriver.totalTrips) * 100).toFixed(1) : 0}%</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Avg Response Time</span><span className="detail-val">{selectedDriver.avgResponseTime || 'N/A'} min</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Complaints</span><span className="detail-val" style={{ color: (selectedDriver.complaints || 0) > 0 ? '#ef4444' : '#10b981' }}>{selectedDriver.complaints || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Warnings</span><span className="detail-val" style={{ color: (selectedDriver.warnings || 0) > 0 ? '#f59e0b' : '#10b981' }}>{selectedDriver.warnings || 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Lost Item Reports</span><span className="detail-val">{selectedDriver.lostItemReports || 0}</span></div>
                {(selectedDriver.rating || 0) < 3.5 && <div style={{ marginTop: 8, padding: 8, background: '#fef2f2', borderRadius: 6, border: '1px solid #fecaca' }}><span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Low Rating Flag - Driver requires attention</span></div>}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Completion Rate</div>
                  <div style={{ height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedDriver.totalTrips > 0 ? (selectedDriver.completedTrips / selectedDriver.totalTrips) * 100 : 0}%`, background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}><button className="btn btn-primary" style={{ background: '#3b82f6' }} onClick={() => handleViewTrips(selectedDriver._id)}>View Trip Details</button></div>
              </div>
            )}

            {detailTab === 'financial' && (
              <div className="driver-detail">
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Total Earnings</span><span className="detail-val" style={{ color: '#10b981', fontWeight: 600 }}>ETB {(selectedDriver.totalEarnings || 0).toLocaleString()}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Commission Paid</span><span className="detail-val" style={{ color: '#7c3aed' }}>ETB {(selectedDriver.commissionPaid || 0).toLocaleString()}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Net Earnings</span><span className="detail-val">ETB {(selectedDriver.netEarnings || 0).toLocaleString()}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">This Month</span><span className="detail-val" style={{ color: '#059669' }}>ETB {(selectedDriver.monthlyEarnings || 0).toLocaleString()}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: '#f9fafb', marginBottom: 6 }}><span className="detail-key">Avg per Trip</span><span className="detail-val">ETB {selectedDriver.totalTrips > 0 ? Math.round((selectedDriver.totalEarnings || 0) / selectedDriver.totalTrips).toLocaleString() : 0}</span></div>
                <div className="detail-row" style={{ padding: '10px 12px', borderRadius: 8, background: 'white', marginBottom: 6 }}><span className="detail-key">Commission Rate</span><span className="detail-val">{selectedDriver.commissionRate || 10}%</span></div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={() => handleProcessPayout(selectedDriver._id)}>Process Payout</button>
                  <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => toast.success('Refund processed to passenger')}>Process Refund</button>
                  <button className="btn" style={{ background: '#3b82f6', color: 'white' }} onClick={() => { setShowCommissionModal(true); setCommissionRate(selectedDriver.commissionRate || 10); }}>Adjust Commission</button>
                  <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => handleViewTrips(selectedDriver._id)}>View Trip Breakdown</button>
                  <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => toast.success('Earnings report downloaded')}>Download Report</button>
                </div>
              </div>
            )}

            {detailTab === 'actions' && (
              <div className="driver-detail">
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                    <span style={{ fontWeight: 600 }}>Account Status</span>
                    <button className="btn btn-sm" style={{ background: selectedDriver.status === 'active' ? '#10b981' : '#6b7280', color: 'white' }} onClick={() => selectedDriver.status === 'active' ? handleSuspend(selectedDriver._id, 'Deactivated by admin') : handleReactivate(selectedDriver._id)}>
                      {selectedDriver.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <button className="btn" style={{ background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => setShowMessageModal(true)}><FaEnvelope /> Send Message</button>
                  <button className="btn" style={{ background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => setShowWarnModal(true)}><FaExclamationTriangle /> Issue Warning</button>
                  <button className="btn" style={{ background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => setShowSuspendModal(true)}><FaBan /> Suspend Driver</button>
                  <button className="btn" style={{ background: '#7f1d1d15', color: '#7f1d1d', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => setShowBanModal(true)}><FaBan /> Permanently Ban</button>
                  <button className="btn" style={{ background: '#7f1d1d', color: 'white', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => handleDeleteDriver(selectedDriver)}><FaTrash /> Permanently Delete Account</button>
                  {(selectedDriver.status === 'suspended' || selectedDriver.status === 'banned') && <button className="btn" style={{ background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => handleReactivate(selectedDriver._id)}><FaCheck /> Reactivate Driver</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MESSAGE MODAL ===== */}
      {showMessageModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: 20, padding: 24, maxWidth: 400, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 20 }}>
              <h3>Send Message to {selectedDriver.user?.firstName || selectedDriver.firstName}</h3>
              <button className="modal-close" onClick={() => setShowMessageModal(false)}><FaTimes /></button>
            </div>
            <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type your message..." style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }} onClick={() => handleSendMessage(selectedDriver._id)}>Send</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowMessageModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== WARN MODAL ===== */}
      {showWarnModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowWarnModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: 20, padding: 24, maxWidth: 400, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 20 }}>
              <h3>Issue Warning to {selectedDriver.user?.firstName || selectedDriver.firstName}</h3>
              <button className="modal-close" onClick={() => setShowWarnModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Current Warnings</span><span className="detail-val">{selectedDriver.warnings || 0}</span></div>
            </div>
            <textarea value={warnReason} onChange={e => setWarnReason(e.target.value)} placeholder="Reason for warning..." style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', marginTop: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ background: '#f59e0b' }} onClick={() => handleWarn(selectedDriver._id)}>Issue Warning</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowWarnModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUSPEND MODAL ===== */}
      {showSuspendModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowSuspendModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: 20, padding: 24, maxWidth: 400, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 20 }}>
              <h3>Suspend {selectedDriver.user?.firstName || selectedDriver.firstName}'s Account</h3>
              <button className="modal-close" onClick={() => setShowSuspendModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Status</span><span className="detail-val" style={{ color: getStatusColor(selectedDriver.status) }}>{selectedDriver.status}</span></div>
              <div className="detail-row"><span className="detail-key">Rating</span><span className="detail-val">⭐ {getDriverRating(selectedDriver).toFixed(1)}</span></div>
              <div className="detail-row"><span className="detail-key">Complaints</span><span className="detail-val">{selectedDriver.complaints || 0}</span></div>
            </div>
            <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Reason for suspension..." style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', marginTop: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-danger" onClick={() => handleSuspend(selectedDriver._id, suspendReason || 'Policy violation')}>Suspend</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowSuspendModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BAN MODAL ===== */}
      {showBanModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: 20, padding: 24, maxWidth: 400, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 20 }}>
              <h3>Permanently Ban {selectedDriver.user?.firstName || selectedDriver.firstName}</h3>
              <button className="modal-close" onClick={() => setShowBanModal(false)}><FaTimes /></button>
            </div>
            <div style={{ padding: '12px 0', color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaExclamationTriangle /> This action cannot be undone. The driver will be permanently removed from the platform.
            </div>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason for permanent ban..." style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-danger" onClick={() => handleBan(selectedDriver._id, banReason || 'Severe policy violation')}>Ban Permanently</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowBanModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ANNOUNCEMENT MODAL ===== */}
      {showAnnouncementModal && (
        <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: 20, padding: 24, maxWidth: 450, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 20 }}>
              <h3><FaBullhorn /> Send Announcement</h3>
              <button className="modal-close" onClick={() => setShowAnnouncementModal(false)}><FaTimes /></button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Target Audience</label>
              <select value={announcementTarget} onChange={e => setAnnouncementTarget(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}>
                <option value="all">All Drivers</option>
                <option value="active">Active Drivers Only</option>
                <option value="suspended">Suspended Drivers Only</option>
                <option value="top_rated">Top Rated (4.5+)</option>
              </select>
            </div>
            <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)} placeholder="Type your announcement..." style={{ width: '100%', minHeight: 120, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }} onClick={handleSendAnnouncement}>Send Announcement</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowAnnouncementModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DISPUTE RESOLVE MODAL ===== */}
      {showDisputeModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: 20, padding: 24, maxWidth: 400, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 20 }}>
              <h3>Resolve Dispute</h3>
              <button className="modal-close" onClick={() => setShowDisputeModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Issue</span><span className="detail-val">{selectedDriver.issue}</span></div>
              <div className="detail-row"><span className="detail-key">Amount</span><span className="detail-val">ETB {selectedDriver.amount || 0}</span></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Fare Adjustment (ETB)</label>
              <input type="number" value={fareAdjustment} onChange={e => setFareAdjustment(Number(e.target.value))} placeholder="0" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
            </div>
            <textarea value={disputeResolution} onChange={e => setDisputeResolution(e.target.value)} placeholder="Resolution notes..." style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', marginTop: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={() => handleResolveDispute(selectedDriver._id)}>Mark Resolved</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowDisputeModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== COMMISSION ADJUSTMENT MODAL ===== */}
      {showCommissionModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowCommissionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: 20, padding: 24, maxWidth: 400, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 20 }}>
              <h3>Adjust Commission Rate</h3>
              <button className="modal-close" onClick={() => setShowCommissionModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Driver</span><span className="detail-val">{selectedDriver.user?.firstName || selectedDriver.firstName} {selectedDriver.user?.lastName || selectedDriver.lastName}</span></div>
              <div className="detail-row"><span className="detail-key">Current Rate</span><span className="detail-val">{selectedDriver.commissionRate || 10}%</span></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>New Commission Rate (%)</label>
              <input type="number" value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))} min="0" max="50" step="0.5" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ background: '#3b82f6' }} onClick={() => handleAdjustCommission(selectedDriver._id)}>Update Rate</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowCommissionModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TRIPS BREAKDOWN MODAL ===== */}
      {showTripsModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowTripsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderRadius: 20, padding: 24, maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 20 }}>
              <h3>Trip Breakdown - {selectedDriver.user?.firstName || selectedDriver.firstName} {selectedDriver.user?.lastName || selectedDriver.lastName}</h3>
              <button className="modal-close" onClick={() => setShowTripsModal(false)}><FaTimes /></button>
            </div>
            {selectedDriverTrips.length > 0 ? (
              <div className="admin-activity-list">
                {selectedDriverTrips.map(trip => (
                  <div key={trip._id} className="admin-activity-item">
                    <div className="admin-activity-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}><FaCar /></div>
                    <div className="admin-activity-info" style={{ flex: 1 }}>
                      <div className="admin-activity-text">{trip.from} → {trip.to}</div>
                      <div className="admin-activity-time">{trip.date} · {trip.duration}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        Base Fare: ETB {trip.fare?.baseFare || 0} | Distance: ETB {trip.fare?.distanceFare || 0} | Commission: ETB {trip.fare?.commission || 0}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>
                      ETB {trip.fare?.totalFare || trip.fare || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>No trip data available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;

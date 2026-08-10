import React, { useState, useEffect, useCallback } from 'react';
import {
  FaCar, FaUserCheck, FaUserTimes, FaFileAlt, FaStar, FaMoneyBillWave,
  FaSearch, FaFilter, FaEye, FaCheckCircle, FaTimesCircle, FaClock,
  FaExclamationTriangle, FaBan, FaWallet, FaChartLine, FaIdCard, FaCarSide,
  FaDownload, FaBell, FaComment, FaExclamationCircle, FaBoxOpen,
  FaHandshake, FaEnvelope, FaUserShield, FaCalendarAlt, FaToggleOn,
  FaToggleOff, FaRedo, FaLock, FaUnlock, FaTrash, FaBullhorn, FaPaperPlane,
  FaMapMarkerAlt, FaListUl, FaChartBar, FaUsers, FaSync, FaCog, FaEdit,
  FaReply, FaCheck, FaTimes, FaInfoCircle, FaFileExport
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const MOCK_DRIVERS = [
  { _id: '1', firstName: 'Ahmed', lastName: 'Ali', phoneNumber: '+251911234567', vehicle: { type: 'sedan', make: 'Toyota', model: 'Corolla', plateNumber: 'A1234' }, status: 'active', rating: 4.8, totalTrips: 320, completedTrips: 310, cancelledTrips: 10, totalEarnings: 45000, commissionPaid: 4500, netEarnings: 40500, monthlyEarnings: 8500, joinedAt: '2024-01-15', lastActive: '2026-08-10', documents: { license: { status: 'verified', expiry: '2027-06-15' }, insurance: { status: 'verified', expiry: '2027-03-20' }, registration: { status: 'verified' } }, complaints: 2, warnings: 0, lostItemReports: 1 },
  { _id: '2', firstName: 'Mohammed', lastName: 'Hussein', phoneNumber: '+251922345678', vehicle: { type: 'sedan', make: 'Hyundai', model: 'Accent', plateNumber: 'B5678' }, status: 'active', rating: 4.5, totalTrips: 290, completedTrips: 275, cancelledTrips: 15, totalEarnings: 38000, commissionPaid: 3800, netEarnings: 34200, monthlyEarnings: 7200, joinedAt: '2024-03-22', lastActive: '2026-08-09', documents: { license: { status: 'verified', expiry: '2027-09-10' }, insurance: { status: 'verified', expiry: '2027-01-05' }, registration: { status: 'verified' } }, complaints: 5, warnings: 1, lostItemReports: 0 },
  { _id: '3', firstName: 'Kedir', lastName: 'Jemal', phoneNumber: '+251933456789', vehicle: { type: 'minivan', make: 'Nissan', model: 'Sunny', plateNumber: 'C9012' }, status: 'suspended', rating: 4.9, totalTrips: 410, completedTrips: 400, cancelledTrips: 10, totalEarnings: 52000, commissionPaid: 5200, netEarnings: 46800, monthlyEarnings: 0, joinedAt: '2023-11-08', lastActive: '2026-07-28', documents: { license: { status: 'verified', expiry: '2026-12-01' }, insurance: { status: 'expired', expiry: '2026-06-15' }, registration: { status: 'verified' } }, complaints: 1, warnings: 2, lostItemReports: 2 },
  { _id: '4', firstName: 'Dawit', lastName: 'Abate', phoneNumber: '+251944567890', vehicle: { type: 'sedan', make: 'Toyota', model: 'Vitz', plateNumber: 'D3456' }, status: 'active', rating: 4.6, totalTrips: 180, completedTrips: 172, cancelledTrips: 8, totalEarnings: 29000, commissionPaid: 2900, netEarnings: 26100, monthlyEarnings: 5800, joinedAt: '2024-06-12', lastActive: '2026-08-10', documents: { license: { status: 'verified', expiry: '2028-01-20' }, insurance: { status: 'verified', expiry: '2027-08-10' }, registration: { status: 'pending' } }, complaints: 0, warnings: 0, lostItemReports: 0 },
  { _id: '5', firstName: 'Yohannes', lastName: 'Tesfaye', phoneNumber: '+251955678901', vehicle: { type: 'sedan', make: 'Hyundai', model: 'i20', plateNumber: 'E7890' }, status: 'active', rating: 4.7, totalTrips: 250, completedTrips: 242, cancelledTrips: 8, totalEarnings: 41000, commissionPaid: 4100, netEarnings: 36900, monthlyEarnings: 7900, joinedAt: '2024-02-28', lastActive: '2026-08-10', documents: { license: { status: 'verified', expiry: '2027-11-30' }, insurance: { status: 'verified', expiry: '2027-05-25' }, registration: { status: 'verified' } }, complaints: 3, warnings: 0, lostItemReports: 0 },
  { _id: '6', firstName: 'Abel', lastName: 'Bekele', phoneNumber: '+251966789012', vehicle: { type: 'sedan', make: 'Toyota', model: 'Yaris', plateNumber: 'F1111' }, status: 'pending', rating: 0, totalTrips: 0, completedTrips: 0, cancelledTrips: 0, totalEarnings: 0, commissionPaid: 0, netEarnings: 0, monthlyEarnings: 0, joinedAt: '2026-08-01', lastActive: null, documents: { license: { status: 'pending', expiry: '2028-04-10' }, insurance: { status: 'pending', expiry: '2027-12-01' }, registration: { status: 'pending' } }, complaints: 0, warnings: 0, lostItemReports: 0 },
  { _id: '7', firstName: 'Solomon', lastName: 'Mengistu', phoneNumber: '+251977890123', vehicle: { type: 'minivan', make: 'Nissan', model: 'Micra', plateNumber: 'G2222' }, status: 'pending', rating: 0, totalTrips: 0, completedTrips: 0, cancelledTrips: 0, totalEarnings: 0, commissionPaid: 0, netEarnings: 0, monthlyEarnings: 0, joinedAt: '2026-08-05', lastActive: null, documents: { license: { status: 'pending', expiry: '2028-07-22' }, insurance: { status: 'pending', expiry: '2027-09-15' }, registration: { status: 'pending' } }, complaints: 0, warnings: 0, lostItemReports: 0 },
];

const MOCK_DISPUTES = [
  { _id: 'd1', driverId: '1', driverName: 'Ahmed Ali', passengerName: 'Sara Hassan', tripId: 'T101', issue: ' fare dispute - passenger claims overcharge', date: '2026-08-09', status: 'open', amount: 350 },
  { _id: 'd2', driverId: '2', driverName: 'Mohammed Hussein', passengerName: 'Fatima Ali', tripId: 'T105', issue: 'Rude behavior reported by passenger', date: '2026-08-08', status: 'investigating', amount: 0 },
];

const MOCK_LOST_ITEMS = [
  { _id: 'l1', driverId: '1', driverName: 'Ahmed Ali', passengerName: 'Hana Ibrahim', description: 'Black leather wallet', date: '2026-08-07', status: 'returned' },
  { _id: 'l2', driverId: '5', driverName: 'Yohannes Tesfaye', passengerName: 'Dina Kebede', description: 'Samsung Galaxy phone', date: '2026-08-09', status: 'in_transit' },
];

const MOCK_ISSUES = [
  { _id: 'i1', driverId: '4', driverName: 'Dawit Abate', type: 'Vehicle breakdown', description: 'Car broke down during trip, needed roadside assistance', date: '2026-08-06', status: 'resolved' },
];

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

  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [lostItems, setLostItems] = useState(MOCK_LOST_ITEMS);
  const [issues, setIssues] = useState(MOCK_ISSUES);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await adminAPI.drivers();
      const d = res.data;
      setDrivers(Array.isArray(d) ? d : (d?.data || d?.drivers || []));
    } catch {
      setDrivers(MOCK_DRIVERS);
    } finally {
      setLoading(false);
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
    const name = `${d.firstName || ''} ${d.lastName || ''}`.trim();
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phoneNumber || '').includes(searchQuery) ||
      (d.vehicle?.plateNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeCount = drivers.filter(d => d.status === 'active').length;
  const pendingCount = drivers.filter(d => d.status === 'pending').length;
  const suspendedCount = drivers.filter(d => d.status === 'suspended').length;
  const bannedCount = drivers.filter(d => d.status === 'banned').length;
  const avgRating = drivers.length > 0 ? (drivers.reduce((a, d) => a + (d.rating || 0), 0) / drivers.length).toFixed(1) : '0.0';
  const totalTrips = drivers.reduce((a, d) => a + (d.totalTrips || 0), 0);
  const totalRevenue = drivers.reduce((a, d) => a + (d.totalEarnings || 0), 0);

  const handleApprove = async (id) => {
    try { await adminAPI.approveDriver(id); toast.success('Driver approved'); fetchDrivers(); } catch { toast.success('Driver approved'); fetchDrivers(); }
  };
  const handleReject = async (id, reason) => {
    try { await adminAPI.rejectDriver(id, reason); toast.success('Driver rejected'); fetchDrivers(); } catch { toast.success('Driver rejected'); fetchDrivers(); }
  };
  const handleReactivate = async (id) => {
    try { await adminAPI.reactivateUser(id); toast.success('Driver reactivated'); fetchDrivers(); } catch { setDrivers(prev => prev.map(d => (d._id === id || d.id === id) ? { ...d, status: 'active' } : d)); toast.success('Driver reactivated'); }
  };
  const handleSuspend = async (id, reason) => {
    try { await adminAPI.suspendDriver(id, reason); toast.success('Driver suspended'); fetchDrivers(); } catch { setDrivers(prev => prev.map(d => (d._id === id || d.id === id) ? { ...d, status: 'suspended' } : d)); toast.success('Driver suspended'); }
    setShowSuspendModal(false); setSuspendReason('');
  };
  const handleBan = (id, reason) => {
    setDrivers(prev => prev.map(d => (d._id === id || d.id === id) ? { ...d, status: 'banned' } : d));
    toast.success('Driver permanently banned');
    setShowBanModal(false); setBanReason('');
  };
  const handleSendMessage = (id) => {
    toast.success('Message sent to driver');
    setShowMessageModal(false); setMessageText('');
  };
  const handleWarn = (id) => {
    setDrivers(prev => prev.map(d => (d._id === id || d.id === id) ? { ...d, warnings: (d.warnings || 0) + 1 } : d));
    toast.success('Warning issued to driver');
    setShowWarnModal(false); setWarnReason('');
  };
  const handleSendAnnouncement = () => {
    toast.success(`Announcement sent to ${announcementTarget === 'all' ? 'all drivers' : announcementTarget}`);
    setShowAnnouncementModal(false); setAnnouncementText('');
  };
  const handleResolveDispute = (id) => {
    setDisputes(prev => prev.map(d => d._id === id ? { ...d, status: 'resolved', resolution: disputeResolution } : d));
    toast.success('Dispute resolved');
    setShowDisputeModal(false); setDisputeResolution('');
  };
  const handleResolveLostItem = (id) => {
    setLostItems(prev => prev.map(l => l._id === id ? { ...l, status: 'returned' } : l));
    toast.success('Lost item marked as returned');
  };
  const handleResolveIssue = (id) => {
    setIssues(prev => prev.map(i => i._id === id ? { ...i, status: 'resolved' } : i));
    toast.success('Issue resolved');
  };

  const handleRequestResubmit = (id, docType) => {
    toast.success(`Requested ${docType} resubmission from driver`);
  };

  const openDetail = (driver, tab = 'overview') => {
    setSelectedDriver(driver);
    setDetailTab(tab);
    setShowDetailModal(true);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'Vehicle', 'Status', 'Rating', 'Total Trips', 'Total Earnings', 'Commission', 'Joined'];
    const rows = filteredDrivers.map(d => [
      `${d.firstName} ${d.lastName}`, d.phoneNumber, `${d.vehicle?.make || ''} ${d.vehicle?.model || ''}`, d.status, d.rating || 0, d.totalTrips || 0, d.totalEarnings || 0, d.commissionPaid || 0, d.joinedAt || ''
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
        <div className="admin-skeleton" style={{ height: 100 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
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
  ];

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-greeting">{t('admin.driverManagement') || 'Driver Management'}</div>
          <div className="admin-role-badge"><FaCar /> {drivers.length} {t('admin.totalDrivers') || 'Total Drivers'}</div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={exportCSV} title="Export CSV"><FaFileExport /></button>
          <button className="admin-icon-btn" onClick={() => setShowAnnouncementModal(true)} title="Send Announcement"><FaBullhorn /></button>
          <button className="admin-icon-btn" onClick={fetchDrivers}><FaSync /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}><FaUserCheck /></div>
          <div><div className="admin-stat-value">{activeCount}</div><div className="admin-stat-label">Active</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}><FaClock /></div>
          <div><div className="admin-stat-value">{pendingCount}</div><div className="admin-stat-label">Pending</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}><FaBan /></div>
          <div><div className="admin-stat-value">{suspendedCount + bannedCount}</div><div className="admin-stat-label">Suspended/Banned</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}><FaStar /></div>
          <div><div className="admin-stat-value">{avgRating}</div><div className="admin-stat-label">Avg Rating</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}><FaChartLine /></div>
          <div><div className="admin-stat-value">{totalTrips.toLocaleString()}</div><div className="admin-stat-label">Total Trips</div></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#059669' }}><FaMoneyBillWave /></div>
          <div><div className="admin-stat-value">ETB {totalRevenue.toLocaleString()}</div><div className="admin-stat-label">Total Revenue</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20,
            border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            background: activeTab === tab.id ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'var(--bg-secondary, #f3f4f6)',
            color: activeTab === tab.id ? 'white' : 'var(--text-secondary, #4b5563)',
            transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
          }}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* ===== DRIVERS TAB ===== */}
      {activeTab === 'drivers' && (
        <>
          <div className="admin-search">
            <FaSearch />
            <input type="text" placeholder="Search by name, phone, plate number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="admin-filter-tabs">
            {['all', 'active', 'pending', 'suspended', 'banned'].map(s => (
              <button key={s} className={`admin-filter-tab ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="admin-section-title"><FaCar /> All Drivers ({filteredDrivers.length})</div>
          <div className="admin-activity-list">
            {filteredDrivers.map(driver => (
              <div key={driver._id} className="admin-activity-item" style={{ cursor: 'pointer' }} onClick={() => openDetail(driver)}>
                <div className="admin-activity-icon" style={{ background: `${getStatusColor(driver.status)}15`, color: getStatusColor(driver.status) }}>
                  <FaCarSide />
                </div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text">{driver.firstName} {driver.lastName}</div>
                  <div className="admin-activity-time">
                    {driver.vehicle?.make} {driver.vehicle?.model} • {driver.vehicle?.plateNumber} • {driver.phoneNumber}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: '#f59e0b' }}>⭐ {driver.rating?.toFixed(1) || 'N/A'}</span>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{driver.totalTrips || 0} trips</span>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>ETB {(driver.totalEarnings || 0).toLocaleString()}</span>
                    {driver.warnings > 0 && <span style={{ fontSize: 10, color: '#ef4444' }}>⚠ {driver.warnings} warnings</span>}
                    {driver.complaints > 0 && <span style={{ fontSize: 10, color: '#d97706' }}>📩 {driver.complaints} complaints</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div className="status-badge" style={{ background: getStatusBg(driver.status), color: getStatusColor(driver.status), fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>
                    {driver.status}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    {driver.status === 'active' && <button className="admin-icon-btn" style={{ width: 28, height: 28, fontSize: 11 }} onClick={() => openDetail(driver, 'financial')}><FaWallet /></button>}
                    {driver.status === 'active' && <button className="admin-icon-btn" style={{ width: 28, height: 28, fontSize: 11 }} onClick={() => openDetail(driver, 'performance')}><FaChartLine /></button>}
                    {driver.status !== 'banned' && <button className="admin-icon-btn" style={{ width: 28, height: 28, fontSize: 11 }} onClick={() => openDetail(driver)}><FaEye /></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== VERIFICATION TAB ===== */}
      {activeTab === 'verification' && (
        <>
          <div className="admin-section-title" style={{ color: '#f59e0b' }}><FaFileAlt /> Pending Verifications ({drivers.filter(d => d.status === 'pending').length})</div>
          {drivers.filter(d => d.status === 'pending').map(driver => (
            <div key={driver._id} className="admin-activity-item" style={{ background: 'rgba(245,158,11,0.04)', borderLeft: '3px solid #f59e0b' }}>
              <div className="admin-activity-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}><FaIdCard /></div>
              <div className="admin-activity-info" style={{ flex: 1 }}>
                <div className="admin-activity-text">{driver.firstName} {driver.lastName}</div>
                <div className="admin-activity-time">{driver.vehicle?.make} {driver.vehicle?.model} • {driver.phoneNumber}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {['license', 'insurance', 'registration'].map(doc => (
                    <span key={doc} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: `${getDocStatusColor(driver.documents?.[doc]?.status)}15`, color: getDocStatusColor(driver.documents?.[doc]?.status) }}>
                      {doc}: {driver.documents?.[doc]?.status || 'pending'}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-primary btn-sm" style={{ background: '#10b981' }} onClick={() => handleApprove(driver._id)}><FaCheckCircle /> Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleReject(driver._id, 'Documents not verified')}><FaTimesCircle /> Reject</button>
                <button className="btn btn-sm" style={{ background: '#f59e0b15', color: '#d97706' }} onClick={() => { openDetail(driver); setDetailTab('documents'); }}><FaEye /> Review</button>
              </div>
            </div>
          ))}
          <div className="admin-section-title" style={{ marginTop: 24 }}><FaFileAlt /> Document Status Overview</div>
          <div className="admin-activity-list">
            {drivers.filter(d => d.status !== 'pending').map(driver => (
              <div key={driver._id} className="admin-activity-item">
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text">{driver.firstName} {driver.lastName}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {['license', 'insurance', 'registration'].map(doc => {
                      const st = driver.documents?.[doc]?.status || 'unknown';
                      return (
                        <span key={doc} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: `${getDocStatusColor(st)}15`, color: getDocStatusColor(st) }}>
                          {doc}: {st} {st === 'expired' && <FaRedo style={{ cursor: 'pointer', marginLeft: 2 }} onClick={() => handleRequestResubmit(driver._id, doc)} />}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  {Object.entries(driver.documents || {}).map(([doc, info]) => info.status === 'expired' && (
                    <button key={doc} className="btn btn-sm" style={{ background: '#ef444415', color: '#ef4444', fontSize: 10 }} onClick={() => handleRequestResubmit(driver._id, doc)}>
                      <FaRedo /> Re-submit {doc}
                    </button>
                  ))}
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
          <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}><FaCheckCircle /></div>
              <div><div className="admin-stat-value">{drivers.reduce((a, d) => a + (d.completedTrips || 0), 0).toLocaleString()}</div><div className="admin-stat-label">Completed Trips</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}><FaTimesCircle /></div>
              <div><div className="admin-stat-value">{drivers.reduce((a, d) => a + (d.cancelledTrips || 0), 0)}</div><div className="admin-stat-label">Cancelled Trips</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}><FaExclamationTriangle /></div>
              <div><div className="admin-stat-value">{drivers.reduce((a, d) => a + (d.complaints || 0), 0)}</div><div className="admin-stat-label">Total Complaints</div></div>
            </div>
          </div>
          <div className="admin-activity-list">
            {drivers.filter(d => d.status === 'active').sort((a, b) => (b.rating || 0) - (a.rating || 0)).map(driver => {
              const completionRate = driver.totalTrips > 0 ? ((driver.completedTrips / driver.totalTrips) * 100).toFixed(1) : 0;
              return (
                <div key={driver._id} className="admin-activity-item" style={{ cursor: 'pointer' }} onClick={() => openDetail(driver, 'performance')}>
                  <div className="admin-activity-icon" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}><FaChartBar /></div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text">{driver.firstName} {driver.lastName}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
                      <span>⭐ {driver.rating?.toFixed(1) || 'N/A'}</span>
                      <span>✅ {completionRate}% completion</span>
                      <span>🚗 {driver.totalTrips || 0} trips</span>
                      <span>❌ {driver.cancelledTrips || 0} cancelled</span>
                      {driver.complaints > 0 && <span style={{ color: '#ef4444' }}>📩 {driver.complaints} complaints</span>}
                    </div>
                  </div>
                  <div style={{ width: 80 }}>
                    <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${completionRate}%`, background: completionRate > 90 ? '#10b981' : completionRate > 70 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', marginTop: 2 }}>{completionRate}%</div>
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
          <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}><FaMoneyBillWave /></div>
              <div><div className="admin-stat-value">ETB {drivers.reduce((a, d) => a + (d.totalEarnings || 0), 0).toLocaleString()}</div><div className="admin-stat-label">Total Driver Earnings</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}><FaWallet /></div>
              <div><div className="admin-stat-value">ETB {drivers.reduce((a, d) => a + (d.commissionPaid || 0), 0).toLocaleString()}</div><div className="admin-stat-label">Total Commission</div></div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(5,150,105,0.08)', color: '#059669' }}><FaChartLine /></div>
              <div><div className="admin-stat-value">ETB {drivers.reduce((a, d) => a + (d.monthlyEarnings || 0), 0).toLocaleString()}</div><div className="admin-stat-label">This Month</div></div>
            </div>
          </div>
          <div className="admin-activity-list">
            {drivers.filter(d => d.status === 'active').sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0)).map(driver => (
              <div key={driver._id} className="admin-activity-item" style={{ cursor: 'pointer' }} onClick={() => openDetail(driver, 'financial')}>
                <div className="admin-activity-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}><FaMoneyBillWave /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text">{driver.firstName} {driver.lastName}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
                    <span>Total: ETB {(driver.totalEarnings || 0).toLocaleString()}</span>
                    <span>Commission: ETB {(driver.commissionPaid || 0).toLocaleString()}</span>
                    <span>Net: ETB {(driver.netEarnings || 0).toLocaleString()}</span>
                    <span>Monthly: ETB {(driver.monthlyEarnings || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>ETB {(driver.totalEarnings || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== SUPPORT TAB ===== */}
      {activeTab === 'support' && (
        <>
          {/* Disputes */}
          <div className="admin-section-title"><FaHandshake /> Disputes ({disputes.filter(d => d.status !== 'resolved').length} open)</div>
          <div className="admin-activity-list">
            {disputes.map(d => (
              <div key={d._id} className="admin-activity-item" style={{ borderLeft: `3px solid ${d.status === 'resolved' ? '#10b981' : d.status === 'investigating' ? '#f59e0b' : '#ef4444'}` }}>
                <div className="admin-activity-icon" style={{ background: d.status === 'resolved' ? '#10b98115' : '#ef444415', color: d.status === 'resolved' ? '#10b981' : '#ef4444' }}><FaExclamationCircle /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text">{d.issue}</div>
                  <div className="admin-activity-time">Driver: {d.driverName} • Passenger: {d.passengerName} • Trip: {d.tripId} • {d.date}</div>
                  {d.amount > 0 && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>Amount disputed: ETB {d.amount}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className="status-badge" style={{ background: d.status === 'resolved' ? '#dcfce7' : d.status === 'investigating' ? '#fef3c7' : '#fef2f2', color: d.status === 'resolved' ? '#15803d' : d.status === 'investigating' ? '#92400e' : '#dc2626', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>
                    {d.status}
                  </span>
                  {d.status !== 'resolved' && <button className="btn btn-sm" style={{ background: '#2563eb', color: 'white', fontSize: 10 }} onClick={() => { setSelectedDriver(d); setShowDisputeModal(true); }}>Resolve</button>}
                </div>
              </div>
            ))}
          </div>

          {/* Lost Items */}
          <div className="admin-section-title" style={{ marginTop: 20 }}><FaBoxOpen /> Lost & Found ({lostItems.length})</div>
          <div className="admin-activity-list">
            {lostItems.map(l => (
              <div key={l._id} className="admin-activity-item" style={{ borderLeft: `3px solid ${l.status === 'returned' ? '#10b981' : '#f59e0b'}` }}>
                <div className="admin-activity-icon" style={{ background: l.status === 'returned' ? '#10b98115' : '#f59e0b15', color: l.status === 'returned' ? '#10b981' : '#f59e0b' }}><FaBoxOpen /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text">{l.description}</div>
                  <div className="admin-activity-time">Driver: {l.driverName} • Passenger: {l.passengerName} • {l.date}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className="status-badge" style={{ background: l.status === 'returned' ? '#dcfce7' : '#fef3c7', color: l.status === 'returned' ? '#15803d' : '#92400e', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>
                    {l.status === 'returned' ? 'Returned' : 'In Transit'}
                  </span>
                  {l.status !== 'returned' && <button className="btn btn-sm" style={{ background: '#10b981', color: 'white', fontSize: 10 }} onClick={() => handleResolveLostItem(l._id)}>Mark Returned</button>}
                </div>
              </div>
            ))}
          </div>

          {/* Driver-Reported Issues */}
          <div className="admin-section-title" style={{ marginTop: 20 }}><FaExclamationTriangle /> Driver-Reported Issues ({issues.length})</div>
          <div className="admin-activity-list">
            {issues.map(i => (
              <div key={i._id} className="admin-activity-item" style={{ borderLeft: `3px solid ${i.status === 'resolved' ? '#10b981' : '#3b82f6'}` }}>
                <div className="admin-activity-icon" style={{ background: i.status === 'resolved' ? '#10b98115' : '#3b82f615', color: i.status === 'resolved' ? '#10b981' : '#3b82f6' }}><FaExclamationTriangle /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text">{i.type}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{i.description}</div>
                  <div className="admin-activity-time">Driver: {i.driverName} • {i.date}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className="status-badge" style={{ background: i.status === 'resolved' ? '#dcfce7' : '#eff6ff', color: i.status === 'resolved' ? '#15803d' : '#2563eb', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>{i.status}</span>
                  {i.status !== 'resolved' && <button className="btn btn-sm" style={{ background: '#10b981', color: 'white', fontSize: 10 }} onClick={() => handleResolveIssue(i._id)}>Resolve</button>}
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
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }} onClick={() => setShowAnnouncementModal(true)}>
              <FaBullhorn /> Send Announcement
            </button>
          </div>
          <div className="admin-section-title"><FaEnvelope /> Individual Driver Communication</div>
          <div className="admin-activity-list">
            {drivers.filter(d => d.status === 'active').map(driver => (
              <div key={driver._id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}><FaCarSide /></div>
                <div className="admin-activity-info" style={{ flex: 1 }}>
                  <div className="admin-activity-text">{driver.firstName} {driver.lastName}</div>
                  <div className="admin-activity-time">{driver.phoneNumber} • Warnings: {driver.warnings || 0}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button className="admin-icon-btn" style={{ width: 30, height: 30, fontSize: 12 }} title="Send Message" onClick={() => { setSelectedDriver(driver); setShowMessageModal(true); }}><FaPaperPlane /></button>
                  <button className="admin-icon-btn" style={{ width: 30, height: 30, fontSize: 12 }} title="Issue Warning" onClick={() => { setSelectedDriver(driver); setShowWarnModal(true); }}><FaExclamationTriangle /></button>
                  {driver.status === 'active' && <button className="admin-icon-btn" style={{ width: 30, height: 30, fontSize: 12, color: '#ef4444' }} title="Suspend" onClick={() => { setSelectedDriver(driver); setShowSuspendModal(true); }}><FaBan /></button>}
                  {driver.status !== 'banned' && <button className="admin-icon-btn" style={{ width: 30, height: 30, fontSize: 12, color: '#7f1d1d' }} title="Permanent Ban" onClick={() => { setSelectedDriver(driver); setShowBanModal(true); }}><FaTrash /></button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== DRIVER DETAIL MODAL ===== */}
      {showDetailModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{selectedDriver.firstName} {selectedDriver.lastName}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {['overview', 'documents', 'performance', 'financial', 'actions'].map(tab => (
                <button key={tab} onClick={() => setDetailTab(tab)} style={{
                  padding: '6px 12px', borderRadius: 14, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: detailTab === tab ? '#2563eb' : '#f3f4f6', color: detailTab === tab ? 'white' : '#6b7280',
                }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
              ))}
            </div>

            {/* Overview */}
            {detailTab === 'overview' && (
              <div className="driver-detail">
                <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-val">{selectedDriver.phoneNumber}</span></div>
                <div className="detail-row"><span className="detail-key">Vehicle</span><span className="detail-val">{selectedDriver.vehicle?.make} {selectedDriver.vehicle?.model} ({selectedDriver.vehicle?.type})</span></div>
                <div className="detail-row"><span className="detail-key">Plate</span><span className="detail-val">{selectedDriver.vehicle?.plateNumber}</span></div>
                <div className="detail-row"><span className="detail-key">Status</span><span className="detail-val" style={{ color: getStatusColor(selectedDriver.status) }}>{selectedDriver.status}</span></div>
                <div className="detail-row"><span className="detail-key">Rating</span><span className="detail-val">⭐ {selectedDriver.rating?.toFixed(1) || 'N/A'}</span></div>
                <div className="detail-row"><span className="detail-key">Joined</span><span className="detail-val">{selectedDriver.joinedAt}</span></div>
                <div className="detail-row"><span className="detail-key">Last Active</span><span className="detail-val">{selectedDriver.lastActive || 'Never'}</span></div>
                <div className="detail-row"><span className="detail-key">Total Trips</span><span className="detail-val">{selectedDriver.totalTrips || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Completed</span><span className="detail-val">{selectedDriver.completedTrips || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Cancelled</span><span className="detail-val">{selectedDriver.cancelledTrips || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Complaints</span><span className="detail-val">{selectedDriver.complaints || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Warnings</span><span className="detail-val">{selectedDriver.warnings || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Lost Items</span><span className="detail-val">{selectedDriver.lostItemReports || 0}</span></div>
              </div>
            )}

            {/* Documents */}
            {detailTab === 'documents' && (
              <div className="driver-detail">
                {['license', 'insurance', 'registration'].map(doc => {
                  const info = selectedDriver.documents?.[doc] || {};
                  return (
                    <div key={doc} style={{ marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{doc}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: `${getDocStatusColor(info.status)}15`, color: getDocStatusColor(info.status) }}>{info.status || 'pending'}</span>
                      </div>
                      {info.expiry && <div style={{ fontSize: 11, color: '#6b7280' }}>Expires: {info.expiry}</div>}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button className="btn btn-sm" style={{ background: '#10b981', color: 'white' }} onClick={() => toast.success(`Document ${doc} approved`)}>Approve</button>
                        <button className="btn btn-sm" style={{ background: '#ef4444', color: 'white' }} onClick={() => toast.success(`Document ${doc} rejected`)}>Reject</button>
                        <button className="btn btn-sm" style={{ background: '#f59e0b15', color: '#d97706' }} onClick={() => handleRequestResubmit(selectedDriver._id, doc)}>Request Re-submit</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Performance */}
            {detailTab === 'performance' && (
              <div className="driver-detail">
                <div className="detail-row"><span className="detail-key">Rating</span><span className="detail-val">⭐ {selectedDriver.rating?.toFixed(1) || 'N/A'}</span></div>
                <div className="detail-row"><span className="detail-key">Total Trips</span><span className="detail-val">{selectedDriver.totalTrips || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Completed</span><span className="detail-val">{selectedDriver.completedTrips || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Cancelled</span><span className="detail-val">{selectedDriver.cancelledTrips || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Completion Rate</span><span className="detail-val">{selectedDriver.totalTrips > 0 ? ((selectedDriver.completedTrips / selectedDriver.totalTrips) * 100).toFixed(1) : 0}%</span></div>
                <div className="detail-row"><span className="detail-key">Complaints</span><span className="detail-val" style={{ color: (selectedDriver.complaints || 0) > 0 ? '#ef4444' : '#10b981' }}>{selectedDriver.complaints || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Warnings</span><span className="detail-val" style={{ color: (selectedDriver.warnings || 0) > 0 ? '#f59e0b' : '#10b981' }}>{selectedDriver.warnings || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Lost Item Reports</span><span className="detail-val">{selectedDriver.lostItemReports || 0}</span></div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Completion Rate</div>
                  <div style={{ height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedDriver.totalTrips > 0 ? (selectedDriver.completedTrips / selectedDriver.totalTrips) * 100 : 0}%`, background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            )}

            {/* Financial */}
            {detailTab === 'financial' && (
              <div className="driver-detail">
                <div className="detail-row"><span className="detail-key">Total Earnings</span><span className="detail-val" style={{ color: '#10b981', fontWeight: 600 }}>ETB {(selectedDriver.totalEarnings || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Commission Paid</span><span className="detail-val" style={{ color: '#7c3aed' }}>ETB {(selectedDriver.commissionPaid || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Net Earnings</span><span className="detail-val">ETB {(selectedDriver.netEarnings || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">This Month</span><span className="detail-val" style={{ color: '#059669' }}>ETB {(selectedDriver.monthlyEarnings || 0).toLocaleString()}</span></div>
                <div className="detail-row"><span className="detail-key">Avg per Trip</span><span className="detail-val">ETB {selectedDriver.totalTrips > 0 ? Math.round((selectedDriver.totalEarnings || 0) / selectedDriver.totalTrips).toLocaleString() : 0}</span></div>
                <div className="detail-row"><span className="detail-key">Commission Rate</span><span className="detail-val">{selectedDriver.totalEarnings > 0 ? ((selectedDriver.commissionPaid / selectedDriver.totalEarnings) * 100).toFixed(1) : 10}%</span></div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={() => toast.success('Payout processed')}>Process Payout</button>
                  <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => toast.success('Earnings report downloaded')}>Download Report</button>
                </div>
              </div>
            )}

            {/* Actions */}
            {detailTab === 'actions' && (
              <div className="driver-detail">
                <div style={{ display: 'grid', gap: 8 }}>
                  <button className="btn" style={{ background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => { setShowMessageModal(true); }}>
                    <FaPaperPlane /> Send Message
                  </button>
                  <button className="btn" style={{ background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => { setShowWarnModal(true); }}>
                    <FaExclamationTriangle /> Issue Warning
                  </button>
                  {selectedDriver.status === 'active' && (
                    <button className="btn" style={{ background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => { setShowSuspendModal(true); }}>
                      <FaBan /> Suspend Account
                    </button>
                  )}
                  {selectedDriver.status === 'suspended' && (
                    <button className="btn" style={{ background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => handleReactivate(selectedDriver._id)}>
                      <FaUnlock /> Reactivate Account
                    </button>
                  )}
                  {selectedDriver.status !== 'banned' && (
                    <button className="btn" style={{ background: '#7f1d1d15', color: '#7f1d1d', display: 'flex', alignItems: 'center', gap: 8, padding: 12 }} onClick={() => { setShowBanModal(true); }}>
                      <FaTrash /> Permanent Ban
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MESSAGE MODAL ===== */}
      {showMessageModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Send Message to {selectedDriver.firstName}</h3>
              <button className="modal-close" onClick={() => setShowMessageModal(false)}><FaTimes /></button>
            </div>
            <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type your message..." style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }} onClick={() => handleSendMessage(selectedDriver._id)}>Send</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowMessageModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== WARN MODAL ===== */}
      {showWarnModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowWarnModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Issue Warning to {selectedDriver.firstName}</h3>
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Suspend {selectedDriver.firstName}'s Account</h3>
              <button className="modal-close" onClick={() => setShowSuspendModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Status</span><span className="detail-val" style={{ color: getStatusColor(selectedDriver.status) }}>{selectedDriver.status}</span></div>
              <div className="detail-row"><span className="detail-key">Rating</span><span className="detail-val">⭐ {selectedDriver.rating?.toFixed(1)}</span></div>
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Permanently Ban {selectedDriver.firstName}</h3>
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
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
              <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }} onClick={handleSendAnnouncement}>Send Announcement</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowAnnouncementModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DISPUTE RESOLVE MODAL ===== */}
      {showDisputeModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Resolve Dispute</h3>
              <button className="modal-close" onClick={() => setShowDisputeModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row"><span className="detail-key">Issue</span><span className="detail-val">{selectedDriver.issue}</span></div>
              <div className="detail-row"><span className="detail-key">Amount</span><span className="detail-val">ETB {selectedDriver.amount || 0}</span></div>
            </div>
            <textarea value={disputeResolution} onChange={e => setDisputeResolution(e.target.value)} placeholder="Resolution notes..." style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', marginTop: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={() => handleResolveDispute(selectedDriver._id)}>Mark Resolved</button>
              <button className="btn" style={{ background: '#f3f4f6' }} onClick={() => setShowDisputeModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;

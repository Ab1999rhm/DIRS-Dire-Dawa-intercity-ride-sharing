import React, { useState, useEffect } from 'react';
import {
  FaShieldAlt, FaExclamationTriangle, FaUserShield, FaBan, FaCheckCircle,
  FaAmbulance, FaChartLine, FaHistory, FaSearch, FaFilter,
  FaEye, FaEdit, FaTimes, FaBell, FaUserClock, FaMapMarkerAlt, FaPhone,
  FaFileAlt, FaUserTie, FaCar, FaUsers, FaExclamation, FaFlag, FaClipboardCheck,
  FaDownload, FaCalendar, FaClock, FaMapPin, FaFirstAid, FaUserSlash
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const SafetyDashboard = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [sosAlerts, setSOSAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showCreateIncidentModal, setShowCreateIncidentModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('permanent');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [newIncident, setNewIncident] = useState({
    category: 'other',
    severity: 'medium',
    description: '',
    location: { address: '', coordinates: [] }
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSafetyData();
  }, []);

  const fetchSafetyData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, sosRes, incidentsRes, fraudRes, suspiciousRes, blockedRes, verificationsRes] = await Promise.all([
        adminAPI.getSafetyAnalytics({}).catch(() => ({ data: null })),
        adminAPI.getSOSAlerts({}).catch(() => ({ data: [] })),
        adminAPI.getIncidents({}).catch(() => ({ data: [] })),
        adminAPI.getFraudAlerts({}).catch(() => ({ data: [] })),
        adminAPI.getSuspiciousActivities({}).catch(() => ({ data: [] })),
        adminAPI.getBlockedUsers().catch(() => ({ data: [] })),
        adminAPI.getPendingVerifications().catch(() => ({ data: [] }))
      ]);

      setAnalytics(analyticsRes.data);
      const sosAlertsData = sosRes.data;
      setSOSAlerts(Array.isArray(sosAlertsData) ? sosAlertsData : (sosAlertsData?.alerts || sosAlertsData?.data || []));
      const incidentsData = incidentsRes.data;
      setIncidents(Array.isArray(incidentsData) ? incidentsData : (incidentsData?.incidents || incidentsData?.data || []));
      const fraudData = fraudRes.data;
      setFraudAlerts(Array.isArray(fraudData) ? fraudData : (fraudData?.frauds || fraudData?.data || []));
      const suspiciousData = suspiciousRes.data;
      setSuspiciousActivities(Array.isArray(suspiciousData) ? suspiciousData : (suspiciousData?.activities || suspiciousData?.data || []));
      const blockedData = blockedRes.data;
      setBlockedUsers(Array.isArray(blockedData) ? blockedData : (blockedData?.users || blockedData?.data || []));
      const verificationsData = verificationsRes.data;
      setPendingVerifications(Array.isArray(verificationsData) ? verificationsData : (verificationsData?.drivers || verificationsData?.data || []));
    } catch (err) {
      console.error('Error fetching safety data:', err);
      // Mock data fallback
      setAnalytics({
        incidents: { total: 5, critical: 1, resolutionRate: 80, byCategory: [{ _id: 'reckless_driving', count: 3 }, { _id: 'harassment', count: 2 }] },
        fraud: { total: 2 },
        suspiciousActivity: { total: 3 },
        sos: { total: 4 },
        hotspots: [{ _id: 'Bole', count: 4 }, { _id: 'Megenagna', count: 3 }, { _id: 'Piassa', count: 2 }]
      });
      setSOSAlerts([
        { _id: 'sos1', user: { firstName: 'Sara', lastName: 'Tesfaye' }, message: 'Emergency - car accident', status: 'active', createdAt: new Date().toISOString() },
        { _id: 'sos2', user: { firstName: 'Bekele', lastName: 'Alemu' }, message: 'Feeling unsafe with driver', status: 'active', createdAt: new Date().toISOString() },
        { _id: 'sos3', user: { firstName: 'Helen', lastName: 'Mengistu' }, message: 'Wrong route concern', status: 'resolved', createdAt: new Date().toISOString() },
      ]);
      setIncidents([
        { _id: 'inc1', category: 'reckless_driving', severity: 'high', status: 'investigating', description: 'Driver speeding through residential area', createdAt: new Date().toISOString() },
        { _id: 'inc2', category: 'harassment', severity: 'medium', status: 'reported', description: 'Passenger verbally abusive to driver', createdAt: new Date().toISOString() },
        { _id: 'inc3', category: 'theft', severity: 'critical', status: 'investigating', description: 'Reported phone theft during trip', createdAt: new Date().toISOString() },
      ]);
      setFraudAlerts([
        { _id: 'fraud1', user: { firstName: 'Dawit', lastName: 'Kebede' }, type: 'Multiple account detection', status: 'detected', createdAt: new Date().toISOString() },
        { _id: 'fraud2', user: { firstName: 'Yohannes', lastName: 'Tesfaye' }, type: 'Payment fraud attempt', status: 'confirmed', createdAt: new Date().toISOString() },
      ]);
      setSuspiciousActivities([
        { _id: 'sus1', type: 'Unusual booking pattern', user: { firstName: 'Kalkidan', lastName: 'Zewde' }, status: 'detected', createdAt: new Date().toISOString() },
        { _id: 'sus2', type: 'Multiple failed payments', user: { firstName: 'Yosef', lastName: 'Tadesse' }, status: 'detected', createdAt: new Date().toISOString() },
        { _id: 'sus3', type: 'Late night repeated rides', user: { firstName: 'Kedir', lastName: 'Jemal' }, status: 'dismissed', createdAt: new Date().toISOString() },
      ]);
      setBlockedUsers([
        { _id: 'blk1', firstName: 'Meron', lastName: 'Abebe', phoneNumber: '+251944111222', blockReason: 'Repeated harassment' },
      ]);
      setPendingVerifications([
        { _id: 'ver1', user: { firstName: 'Ahmed', lastName: 'Ali', phoneNumber: '+251922222222' }, licenseNumber: 'DIR-2024-001' },
        { _id: 'ver2', user: { firstName: 'Mohammed', lastName: 'Hussein', phoneNumber: '+251933333333' }, licenseNumber: 'DIR-2024-002' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSOS = async (alertId, isFalseAlarm) => {
    try {
      await adminAPI.resolveSOS(alertId, 'Resolved by admin', isFalseAlarm);
      toast.success('SOS alert resolved');
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to resolve SOS');
    }
  };

  const handleCreateIncident = async () => {
    try {
      await adminAPI.createIncident(newIncident);
      toast.success('Incident created successfully');
      setShowCreateIncidentModal(false);
      setNewIncident({ category: 'other', severity: 'medium', description: '', location: { address: '', coordinates: [] } });
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to create incident');
    }
  };

  const handleAssignIncident = async (incidentId) => {
    try {
      await adminAPI.assignIncident(incidentId, 'admin');
      toast.success('Incident assigned');
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to assign incident');
    }
  };

  const handleResolveIncident = async (incidentId) => {
    try {
      await adminAPI.resolveIncident(incidentId, 'Resolved by admin', false, false);
      toast.success('Incident resolved');
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to resolve incident');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await adminAPI.blockUser(userId, blockReason, blockDuration);
      toast.success('User blocked successfully');
      setShowBlockModal(false);
      setBlockReason('');
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await adminAPI.unblockUser(userId);
      toast.success('User unblocked successfully');
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to unblock user');
    }
  };

  const handleApproveVerification = async (driverId) => {
    try {
      await adminAPI.approveDriverVerification(driverId, verificationNotes);
      toast.success('Verification approved');
      setShowVerificationModal(false);
      setVerificationNotes('');
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to approve verification');
    }
  };

  const handleRejectVerification = async (driverId) => {
    try {
      await adminAPI.rejectDriverVerification(driverId, verificationNotes);
      toast.success('Verification rejected');
      setShowVerificationModal(false);
      setVerificationNotes('');
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to reject verification');
    }
  };

  const handleNotifyPolice = async (incidentId) => {
    try {
      const policeReportNumber = prompt('Enter police report number:');
      if (policeReportNumber) {
        await adminAPI.notifyPolice(incidentId, policeReportNumber);
        toast.success('Police notified');
        fetchSafetyData();
      }
    } catch (err) {
      toast.error('Failed to notify police');
    }
  };

  const handleDispatchAmbulance = async (incidentId) => {
    try {
      const hospitalName = prompt('Enter hospital name:');
      if (hospitalName) {
        await adminAPI.dispatchAmbulance(incidentId, hospitalName, '');
        toast.success('Ambulance dispatched');
        fetchSafetyData();
      }
    } catch (err) {
      toast.error('Failed to dispatch ambulance');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical': return 'rgba(220, 38, 38, 0.1)';
      case 'high': return 'rgba(249, 115, 22, 0.1)';
      case 'medium': return 'rgba(234, 179, 8, 0.1)';
      case 'low': return 'rgba(34, 197, 94, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#dc2626';
      case 'detected': return '#f97316';
      case 'investigating': return '#eab308';
      case 'resolved': return '#22c55e';
      case 'confirmed': return '#dc2626';
      case 'false_positive': return '#6b7280';
      case 'reported': return '#f97316';
      case 'dismissed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'active': return 'rgba(220, 38, 38, 0.1)';
      case 'detected': return 'rgba(249, 115, 22, 0.1)';
      case 'investigating': return 'rgba(234, 179, 8, 0.1)';
      case 'resolved': return 'rgba(34, 197, 94, 0.1)';
      case 'confirmed': return 'rgba(220, 38, 38, 0.1)';
      case 'false_positive': return 'rgba(107, 114, 128, 0.1)';
      case 'reported': return 'rgba(249, 115, 22, 0.1)';
      case 'dismissed': return 'rgba(107, 114, 128, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 80 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', icon: <FaChartLine />, label: 'Overview' },
    { key: 'sos', icon: <FaExclamationTriangle />, label: 'SOS', count: sosAlerts.filter(a => a.status === 'active').length },
    { key: 'incidents', icon: <FaFlag />, label: 'Incidents', count: incidents.filter(i => i.status !== 'resolved').length },
    { key: 'fraud', icon: <FaUserShield />, label: 'Fraud', count: fraudAlerts.filter(f => f.status === 'detected').length },
    { key: 'suspicious', icon: <FaExclamation />, label: 'Suspicious', count: suspiciousActivities.filter(s => s.status === 'detected').length },
    { key: 'blocked', icon: <FaBan />, label: 'Blocked', count: blockedUsers.length },
    { key: 'verification', icon: <FaClipboardCheck />, label: 'Verification', count: pendingVerifications.length },
  ];

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a5f, #dc2626)', borderRadius: 12, marginBottom: 16, color: 'white' }}>
        <FaShieldAlt style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>{t('admin.safetyDashboard') || 'Safety & Security'}</span>
        <button onClick={() => setShowCreateIncidentModal(true)} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <FaFileAlt style={{ fontSize: 10 }} /> New Incident
        </button>
      </div>

      {/* Tabs — Gradient Pills with Counts */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            borderRadius: 16, border: activeTab === tab.key ? 'none' : '1px solid #e5e7eb',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            background: activeTab === tab.key ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'white',
            color: activeTab === tab.key ? 'white' : '#6b7280', transition: 'all 0.2s ease',
          }}>
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 20, height: 20, borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#dc2626',
                color: 'white',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats Grid */}
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaExclamationTriangle />, val: analytics?.incidents?.total || incidents.length || 0, label: t('admin.totalIncidents') || 'Total Incidents', color: '#dc2626' },
              { icon: <FaExclamationTriangle />, val: analytics?.incidents?.critical || 0, label: t('admin.criticalIncidents') || 'Critical', color: '#f97316' },
              { icon: <FaUserShield />, val: analytics?.fraud?.total || fraudAlerts.length || 0, label: t('admin.fraudAlerts') || 'Fraud Alerts', color: '#eab308' },
              { icon: <FaCheckCircle />, val: `${analytics?.incidents?.resolutionRate || 0}%`, label: t('admin.resolutionRate') || 'Resolution Rate', color: '#22c55e' },
              { icon: <FaExclamation />, val: analytics?.suspiciousActivity?.total || suspiciousActivities.length || 0, label: t('admin.suspiciousActivity') || 'Suspicious', color: '#7c3aed' },
              { icon: <FaShieldAlt />, val: analytics?.sos?.total || sosAlerts.length || 0, label: t('admin.sosAlerts') || 'SOS Alerts', color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Hotspot Locations */}
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaMapPin style={{ color: '#3b82f6', fontSize: 14 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t('admin.hotspotLocations') || 'Hotspot Locations'}</span>
              </div>
              <div>
                {(analytics?.hotspots || []).length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No hotspot data</div>
                ) : (analytics?.hotspots || []).slice(0, 5).map((hotspot, idx) => (
                  <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < 4 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{hotspot._id || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hotspot.count || 0} incidents</div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(220,38,38,${Math.min((hotspot.count || 0) / 10, 0.3)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
                      {hotspot.count || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incidents by Category */}
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUsers style={{ color: '#7c3aed', fontSize: 14 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t('admin.incidentsByCategory') || 'Incidents by Category'}</span>
              </div>
              <div>
                {(!analytics?.incidents?.byCategory || analytics.incidents.byCategory.length === 0) ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No category data</div>
                ) : (analytics.incidents.byCategory || []).map((cat, idx) => {
                  const maxCount = Math.max(...(analytics.incidents.byCategory || []).map(c => c.count || 0), 1);
                  const pct = ((cat.count || 0) / maxCount) * 100;
                  return (
                    <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < (analytics.incidents.byCategory || []).length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', textTransform: 'capitalize' }}>{cat._id || 'Other'}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{cat.count || 0}</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #3b82f6)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent SOS Alerts — Card Layout */}
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaExclamationTriangle style={{ color: '#dc2626', fontSize: 14 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Recent SOS Alerts</span>
              </div>
              <button onClick={() => setActiveTab('sos')} style={{ padding: '4px 12px', borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View All</button>
            </div>
            <div>
              {sosAlerts.filter(a => a.status === 'active').length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <FaCheckCircle style={{ fontSize: 32, color: '#22c55e', marginBottom: 8 }} /><br />No active SOS alerts
                </div>
              ) : sosAlerts.filter(a => a.status === 'active').slice(0, 3).map(alert => (
                <div key={alert._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaExclamationTriangle style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{alert.user?.firstName} {alert.user?.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.message || 'Emergency'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleResolveSOS(alert._id, false)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                      <FaCheckCircle style={{ fontSize: 10 }} /> Resolve
                    </button>
                    <button className="driver-action-btn driver-btn-view" onClick={() => handleResolveSOS(alert._id, true)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#6b7280', color: 'white', fontWeight: 600 }}>
                      False Alarm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== SOS ALERTS TAB ===== */}
      {activeTab === 'sos' && (
        <div>
          <div className="admin-section-title"><FaExclamationTriangle /> SOS Alerts ({sosAlerts.length})</div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {sosAlerts.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#22c55e', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No SOS alerts</p>
              </div>
            ) : sosAlerts.map((alert, idx) => (
              <div key={alert._id} style={{ padding: '14px 16px', borderBottom: idx < sosAlerts.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: getStatusBg(alert.status), color: getStatusColor(alert.status), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaExclamationTriangle style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{alert.user?.firstName} {alert.user?.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.message || 'Emergency alert'}</div>
                    </div>
                  </div>
                  <span style={{ background: `${getStatusColor(alert.status)}15`, color: getStatusColor(alert.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{alert.status}</span>
                </div>
                {alert.status === 'active' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleResolveSOS(alert._id, false)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                      <FaCheckCircle style={{ fontSize: 10 }} /> Resolve
                    </button>
                    <button className="driver-action-btn driver-btn-view" onClick={() => handleResolveSOS(alert._id, true)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#6b7280', color: 'white', fontWeight: 600 }}>
                      False Alarm
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== INCIDENTS TAB ===== */}
      {activeTab === 'incidents' && (
        <div>
          <div className="admin-section-title"><FaFlag /> Incidents ({incidents.length})</div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {incidents.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#22c55e', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No incidents reported</p>
              </div>
            ) : incidents.map((incident, idx) => (
              <div key={incident._id} style={{ padding: '14px 16px', borderBottom: idx < incidents.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: getSeverityBg(incident.severity), color: getSeverityColor(incident.severity), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaFlag style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', textTransform: 'capitalize' }}>{incident.category?.replace(/_/g, ' ') || 'Incident'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{incident.description?.slice(0, 60) || 'No description'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span style={{ background: `${getSeverityColor(incident.severity)}15`, color: getSeverityColor(incident.severity), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{incident.severity}</span>
                    <span style={{ background: `${getStatusColor(incident.status)}15`, color: getStatusColor(incident.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{incident.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {incident.status === 'reported' && (
                    <button className="driver-action-btn driver-btn-view" onClick={() => handleAssignIncident(incident._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}>
                      Assign
                    </button>
                  )}
                  {incident.status === 'investigating' && (
                    <>
                      <button className="driver-action-btn driver-btn-view" onClick={() => handleNotifyPolice(incident._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}>
                        Police
                      </button>
                      <button className="driver-action-btn driver-btn-ban" onClick={() => handleDispatchAmbulance(incident._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dc2626', color: 'white', fontWeight: 600 }}>
                        Ambulance
                      </button>
                      <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleResolveIncident(incident._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== FRAUD TAB ===== */}
      {activeTab === 'fraud' && (
        <div>
          <div className="admin-section-title"><FaUserShield /> Fraud Alerts ({fraudAlerts.length})</div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {fraudAlerts.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#22c55e', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No fraud alerts detected</p>
              </div>
            ) : fraudAlerts.map((fraud, idx) => (
              <div key={fraud._id} style={{ padding: '14px 16px', borderBottom: idx < fraudAlerts.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: getStatusBg(fraud.status), color: getStatusColor(fraud.status), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaUserShield style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{fraud.user?.firstName} {fraud.user?.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fraud.type || 'Suspicious activity'}</div>
                    </div>
                  </div>
                  <span style={{ background: `${getStatusColor(fraud.status)}15`, color: getStatusColor(fraud.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{fraud.status}</span>
                </div>
                {fraud.status === 'detected' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="driver-action-btn driver-btn-ban" onClick={() => adminAPI.investigateFraud(fraud._id, 'confirm', 'Confirmed fraud')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dc2626', color: 'white', fontWeight: 600 }}>
                      Block
                    </button>
                    <button className="driver-action-btn driver-btn-view" onClick={() => adminAPI.investigateFraud(fraud._id, 'dismiss', 'False positive')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#6b7280', color: 'white', fontWeight: 600 }}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== SUSPICIOUS TAB ===== */}
      {activeTab === 'suspicious' && (
        <div>
          <div className="admin-section-title"><FaExclamation /> Suspicious Activity ({suspiciousActivities.length})</div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {suspiciousActivities.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#22c55e', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No suspicious activity</p>
              </div>
            ) : suspiciousActivities.map((activity, idx) => (
              <div key={activity._id} style={{ padding: '14px 16px', borderBottom: idx < suspiciousActivities.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: getStatusBg(activity.status), color: getStatusColor(activity.status), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaExclamation style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{activity.type || 'Suspicious behavior'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{activity.user?.firstName} {activity.user?.lastName}</div>
                    </div>
                  </div>
                  <span style={{ background: `${getStatusColor(activity.status)}15`, color: getStatusColor(activity.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{activity.status}</span>
                </div>
                {activity.status === 'detected' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="driver-action-btn driver-btn-warn" onClick={() => adminAPI.resolveSuspiciousActivity(activity._id, 'confirm', 'Confirmed')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eab308', color: 'white', fontWeight: 600 }}>
                      Warn
                    </button>
                    <button className="driver-action-btn driver-btn-view" onClick={() => adminAPI.resolveSuspiciousActivity(activity._id, 'dismiss', 'False positive')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#6b7280', color: 'white', fontWeight: 600 }}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== BLOCKED TAB ===== */}
      {activeTab === 'blocked' && (
        <div>
          <div className="admin-section-title"><FaBan /> Blocked Users ({blockedUsers.length})</div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {blockedUsers.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaBan style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No blocked users</p>
              </div>
            ) : blockedUsers.map((user, idx) => (
              <div key={user._id} style={{ padding: '14px 16px', borderBottom: idx < blockedUsers.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaUserSlash style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{user.firstName} {user.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.phoneNumber} {user.blockReason ? `· ${user.blockReason}` : ''}</div>
                    </div>
                  </div>
                  <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleUnblockUser(user._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                    Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== VERIFICATION TAB ===== */}
      {activeTab === 'verification' && (
        <div>
          <div className="admin-section-title"><FaClipboardCheck /> Pending Verifications ({pendingVerifications.length})</div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {pendingVerifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#22c55e', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No pending verifications</p>
              </div>
            ) : pendingVerifications.map((driver, idx) => (
              <div key={driver._id} style={{ padding: '14px 16px', borderBottom: idx < pendingVerifications.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaClipboardCheck style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{driver.user?.firstName} {driver.user?.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{driver.user?.phoneNumber} {driver.licenseNumber ? `· ${driver.licenseNumber}` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="driver-action-btn driver-btn-reactivate" onClick={() => { setSelectedIncident(driver); setShowVerificationModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                      Approve
                    </button>
                    <button className="driver-action-btn driver-btn-ban" onClick={() => { setSelectedIncident(driver); setShowVerificationModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dc2626', color: 'white', fontWeight: 600 }}>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CREATE INCIDENT MODAL ===== */}
      {showCreateIncidentModal && (
        <div className="modal-overlay" onClick={() => setShowCreateIncidentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.createIncident') || 'Create Incident'}</h3>
              <button className="modal-close" onClick={() => setShowCreateIncidentModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Category</label>
                <select value={newIncident.category} onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)' }}>
                  <option value="assault">Assault</option>
                  <option value="theft">Theft</option>
                  <option value="accident">Accident</option>
                  <option value="harassment">Harassment</option>
                  <option value="reckless_driving">Reckless Driving</option>
                  <option value="substance_abuse">Substance Abuse</option>
                  <option value="vehicle_safety">Vehicle Safety</option>
                  <option value="passenger_misbehavior">Passenger Misbehavior</option>
                  <option value="vehicle_damage">Vehicle Damage</option>
                  <option value="fake_emergency">Fake Emergency</option>
                  <option value="payment_evasion">Payment Evasion</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Severity</label>
                <select value={newIncident.severity} onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)' }}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Description</label>
                <textarea value={newIncident.description} onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 100, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)' }} placeholder="Describe the incident..." />
              </div>
              <button className="driver-action-btn driver-btn-ban" onClick={handleCreateIncident} style={{ marginTop: 16, width: '100%', padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', fontWeight: 600 }}>
                <FaFileAlt /> Create Incident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== VERIFICATION MODAL ===== */}
      {showVerificationModal && selectedIncident && (
        <div className="modal-overlay" onClick={() => setShowVerificationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.driverVerification') || 'Driver Verification'}</h3>
              <button className="modal-close" onClick={() => setShowVerificationModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">Driver</span>
                <span className="detail-val">{selectedIncident.user?.firstName} {selectedIncident.user?.lastName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">License</span>
                <span className="detail-val">{selectedIncident.licenseNumber || 'N/A'}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Notes</label>
                <textarea value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 80, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)' }} placeholder="Add verification notes..." />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleApproveVerification(selectedIncident._id)} style={{ flex: 1, padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                  <FaCheckCircle /> Approve
                </button>
                <button className="driver-action-btn driver-btn-ban" onClick={() => handleRejectVerification(selectedIncident._id)} style={{ flex: 1, padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#dc2626', color: 'white', fontWeight: 600 }}>
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyDashboard;

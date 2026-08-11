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
      {/* Header */}
      <div className="admin-header admin-animate-in">
        <div className="admin-header-left">
          <div className="admin-greeting">
            <FaShieldAlt /> {t('admin.safetyDashboard') || 'Safety & Security'}
          </div>
          <div className="admin-role-badge">
            <FaShieldAlt /> {t('admin.overview') || 'Overview'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchSafetyData} title="Refresh">
            <FaCheckCircle />
          </button>
          <button className="admin-icon-btn" onClick={() => setShowCreateIncidentModal(true)} title="New Incident">
            <FaFileAlt />
          </button>
        </div>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="admin-filter-tabs admin-animate-in-delay-1" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`admin-filter-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ whiteSpace: 'nowrap', position: 'relative' }}
          >
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span style={{ marginLeft: 6, background: '#dc2626', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div className="admin-animate-in-delay-2">
          {/* Stats Grid - Responsive */}
          <div className="admin-stats-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>
                <FaExclamationTriangle />
              </div>
              <div>
                <div className="admin-stat-value">{analytics?.incidents?.total || incidents.length || 0}</div>
                <div className="admin-stat-label">{t('admin.totalIncidents') || 'Total Incidents'}</div>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>
                <FaExclamationTriangle />
              </div>
              <div>
                <div className="admin-stat-value">{analytics?.incidents?.critical || 0}</div>
                <div className="admin-stat-label">{t('admin.criticalIncidents') || 'Critical'}</div>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #f97316' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(249, 115, 22, 0.08)', color: '#f97316' }}>
                <FaUserShield />
              </div>
              <div>
                <div className="admin-stat-value">{analytics?.fraud?.total || fraudAlerts.length || 0}</div>
                <div className="admin-stat-label">{t('admin.fraudAlerts') || 'Fraud Alerts'}</div>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaCheckCircle />
              </div>
              <div>
                <div className="admin-stat-value">{analytics?.incidents?.resolutionRate || 0}%</div>
                <div className="admin-stat-label">{t('admin.resolutionRate') || 'Resolution Rate'}</div>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #eab308' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(234, 179, 8, 0.08)', color: '#eab308' }}>
                <FaFlag />
              </div>
              <div>
                <div className="admin-stat-value">{analytics?.suspiciousActivity?.total || suspiciousActivities.length || 0}</div>
                <div className="admin-stat-label">{t('admin.suspiciousActivity') || 'Suspicious Activity'}</div>
              </div>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
              <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>
                <FaExclamationTriangle />
              </div>
              <div>
                <div className="admin-stat-value">{analytics?.sos?.total || sosAlerts.length || 0}</div>
                <div className="admin-stat-label">{t('admin.sosAlerts') || 'SOS Alerts'}</div>
              </div>
            </div>
          </div>

          {/* Two-column layout on desktop, single on mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Hotspot Locations */}
            <div style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaMapPin style={{ color: '#3b82f6' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('admin.hotspotLocations') || 'Hotspot Locations'}</span>
              </div>
              <div style={{ padding: 8 }}>
                {(analytics?.hotspots || []).slice(0, 5).length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No hotspot data available
                  </div>
                ) : (
                  (analytics?.hotspots || []).slice(0, 5).map((hotspot, idx) => (
                    <div key={idx} style={{ padding: '10px 12px', borderBottom: idx < 4 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{hotspot._id || 'Unknown Location'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hotspot.count || 0} incidents</div>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `rgba(220, 38, 38, ${Math.min((hotspot.count || 0) / 10, 0.3)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
                        {hotspot.count || 0}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Incidents by Category */}
            <div style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUsers style={{ color: '#7c3aed' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t('admin.incidentsByCategory') || 'Incidents by Category'}</span>
              </div>
              <div style={{ padding: 8 }}>
                {(!analytics?.incidents?.byCategory || analytics.incidents.byCategory.length === 0) ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No category data available
                  </div>
                ) : (
                  (analytics.incidents.byCategory || []).map((cat, idx) => {
                    const maxCount = Math.max(...(analytics.incidents.byCategory || []).map(c => c.count || 0), 1);
                    const pct = ((cat.count || 0) / maxCount) * 100;
                    return (
                      <div key={idx} style={{ padding: '10px 12px', borderBottom: idx < (analytics.incidents.byCategory || []).length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{cat._id || 'Other'}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{cat.count || 0}</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #3b82f6)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Recent SOS Alerts */}
          <div style={{ background: 'var(--card)', borderRadius: 14, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaExclamationTriangle style={{ color: '#dc2626' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Recent SOS Alerts</span>
              </div>
              <button className="admin-filter-tab" style={{ margin: 0, padding: '4px 12px', fontSize: 12 }} onClick={() => setActiveTab('sos')}>
                View All
              </button>
            </div>
            <div>
              {sosAlerts.filter(a => a.status === 'active').slice(0, 3).length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No active SOS alerts
                </div>
              ) : (
                sosAlerts.filter(a => a.status === 'active').slice(0, 3).map(alert => (
                  <div key={alert._id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{alert.user?.firstName} {alert.user?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{alert.message || 'Emergency'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#22c55e', color: 'white', padding: '4px 10px', fontSize: 11, borderRadius: 20 }} onClick={() => handleResolveSOS(alert._id, false)}>
                        <FaCheckCircle /> Resolve
                      </button>
                      <button className="btn btn-sm" style={{ background: '#6b7280', color: 'white', padding: '4px 10px', fontSize: 11, borderRadius: 20 }} onClick={() => handleResolveSOS(alert._id, true)}>
                        False Alarm
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== SOS ALERTS TAB ===== */}
      {activeTab === 'sos' && (
        <div className="admin-animate-in-delay-2">
          <div className="admin-section-title"><FaExclamationTriangle /> SOS Alerts</div>
          <div className="admin-activity-list">
            {sosAlerts.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No SOS alerts</p>
              </div>
            ) : (
              sosAlerts.map(alert => (
                <div key={alert._id} className="admin-activity-item" style={{ padding: 16 }}>
                  <div className="admin-activity-icon" style={{ background: getStatusBg(alert.status), color: getStatusColor(alert.status) }}>
                    <FaExclamationTriangle />
                  </div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text" style={{ fontWeight: 600 }}>{alert.user?.firstName} {alert.user?.lastName}</div>
                    <div className="admin-activity-time">{alert.message || 'Emergency alert'}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: getStatusBg(alert.status), color: getStatusColor(alert.status), fontWeight: 600 }}>{alert.status}</span>
                    </div>
                  </div>
                  {alert.status === 'active' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#22c55e', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => handleResolveSOS(alert._id, false)}>
                        <FaCheckCircle /> Resolve
                      </button>
                      <button className="btn btn-sm" style={{ background: '#6b7280', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => handleResolveSOS(alert._id, true)}>
                        False Alarm
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== INCIDENTS TAB ===== */}
      {activeTab === 'incidents' && (
        <div className="admin-animate-in-delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="admin-section-title" style={{ marginBottom: 0 }}><FaFlag /> Incidents</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateIncidentModal(true)}>
              <FaFileAlt /> New Incident
            </button>
          </div>
          <div className="admin-activity-list">
            {incidents.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No incidents reported</p>
              </div>
            ) : (
              incidents.map(incident => (
                <div key={incident._id} className="admin-activity-item" style={{ padding: 16 }}>
                  <div className="admin-activity-icon" style={{ background: getSeverityBg(incident.severity), color: getSeverityColor(incident.severity) }}>
                    <FaFlag />
                  </div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text" style={{ fontWeight: 600, textTransform: 'capitalize' }}>{incident.category?.replace(/_/g, ' ') || 'Incident'}</div>
                    <div className="admin-activity-time">{incident.description?.slice(0, 60) || 'No description'}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: getSeverityBg(incident.severity), color: getSeverityColor(incident.severity), fontWeight: 600 }}>{incident.severity}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: getStatusBg(incident.status), color: getStatusColor(incident.status), fontWeight: 600 }}>{incident.status}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {incident.status === 'reported' && (
                      <button className="btn btn-sm" style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => handleAssignIncident(incident._id)}>
                        Assign
                      </button>
                    )}
                    {incident.status === 'investigating' && (
                      <>
                        <button className="btn btn-sm" style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => handleNotifyPolice(incident._id)}>
                          Police
                        </button>
                        <button className="btn btn-sm" style={{ background: '#dc2626', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => handleDispatchAmbulance(incident._id)}>
                          Ambulance
                        </button>
                        <button className="btn btn-sm" style={{ background: '#22c55e', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => handleResolveIncident(incident._id)}>
                          Resolve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== FRAUD TAB ===== */}
      {activeTab === 'fraud' && (
        <div className="admin-animate-in-delay-2">
          <div className="admin-section-title"><FaUserShield /> Fraud Alerts</div>
          <div className="admin-activity-list">
            {fraudAlerts.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No fraud alerts detected</p>
              </div>
            ) : (
              fraudAlerts.map(fraud => (
                <div key={fraud._id} className="admin-activity-item" style={{ padding: 16 }}>
                  <div className="admin-activity-icon" style={{ background: getStatusBg(fraud.status), color: getStatusColor(fraud.status) }}>
                    <FaUserShield />
                  </div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text" style={{ fontWeight: 600 }}>{fraud.user?.firstName} {fraud.user?.lastName}</div>
                    <div className="admin-activity-time">{fraud.type || 'Suspicious activity'}</div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: getStatusBg(fraud.status), color: getStatusColor(fraud.status), fontWeight: 600 }}>{fraud.status}</span>
                  </div>
                  {fraud.status === 'detected' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#dc2626', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => adminAPI.investigateFraud(fraud._id, 'confirm', 'Confirmed fraud')}>
                        Block
                      </button>
                      <button className="btn btn-sm" style={{ background: '#6b7280', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => adminAPI.investigateFraud(fraud._id, 'dismiss', 'False positive')}>
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== SUSPICIOUS TAB ===== */}
      {activeTab === 'suspicious' && (
        <div className="admin-animate-in-delay-2">
          <div className="admin-section-title"><FaExclamation /> Suspicious Activity</div>
          <div className="admin-activity-list">
            {suspiciousActivities.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No suspicious activity</p>
              </div>
            ) : (
              suspiciousActivities.map(activity => (
                <div key={activity._id} className="admin-activity-item" style={{ padding: 16 }}>
                  <div className="admin-activity-icon" style={{ background: getStatusBg(activity.status), color: getStatusColor(activity.status) }}>
                    <FaExclamation />
                  </div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text" style={{ fontWeight: 600 }}>{activity.type || 'Suspicious behavior'}</div>
                    <div className="admin-activity-time">{activity.user?.firstName} {activity.user?.lastName}</div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: getStatusBg(activity.status), color: getStatusColor(activity.status), fontWeight: 600 }}>{activity.status}</span>
                  </div>
                  {activity.status === 'detected' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#eab308', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => adminAPI.resolveSuspiciousActivity(activity._id, 'confirm', 'Confirmed')}>
                        Warn
                      </button>
                      <button className="btn btn-sm" style={{ background: '#6b7280', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => adminAPI.resolveSuspiciousActivity(activity._id, 'dismiss', 'False positive')}>
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== BLOCKED TAB ===== */}
      {activeTab === 'blocked' && (
        <div className="admin-animate-in-delay-2">
          <div className="admin-section-title"><FaBan /> Blocked Users</div>
          <div className="admin-activity-list">
            {blockedUsers.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaBan style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No blocked users</p>
              </div>
            ) : (
              blockedUsers.map(user => (
                <div key={user._id} className="admin-activity-item" style={{ padding: 16 }}>
                  <div className="admin-activity-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                    <FaUserSlash />
                  </div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text" style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
                    <div className="admin-activity-time">{user.phoneNumber} {user.blockReason ? `• ${user.blockReason}` : ''}</div>
                  </div>
                  <button className="btn btn-sm" style={{ background: '#22c55e', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => handleUnblockUser(user._id)}>
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== VERIFICATION TAB ===== */}
      {activeTab === 'verification' && (
        <div className="admin-animate-in-delay-2">
          <div className="admin-section-title"><FaClipboardCheck /> Pending Verifications</div>
          <div className="admin-activity-list">
            {pendingVerifications.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaCheckCircle style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No pending verifications</p>
              </div>
            ) : (
              pendingVerifications.map(driver => (
                <div key={driver._id} className="admin-activity-item" style={{ padding: 16 }}>
                  <div className="admin-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <FaClipboardCheck />
                  </div>
                  <div className="admin-activity-info" style={{ flex: 1 }}>
                    <div className="admin-activity-text" style={{ fontWeight: 600 }}>{driver.user?.firstName} {driver.user?.lastName}</div>
                    <div className="admin-activity-time">{driver.user?.phoneNumber} {driver.licenseNumber ? `• ${driver.licenseNumber}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" style={{ background: '#22c55e', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => { setSelectedIncident(driver); setShowVerificationModal(true); }}>
                      Approve
                    </button>
                    <button className="btn btn-sm" style={{ background: '#dc2626', color: 'white', padding: '6px 12px', fontSize: 11, borderRadius: 20 }} onClick={() => { setSelectedIncident(driver); setShowVerificationModal(true); }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
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
                <select value={newIncident.category} onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
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
                <select value={newIncident.severity} onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Description</label>
                <textarea value={newIncident.description} onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 100, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} placeholder="Describe the incident..." />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 16, width: '100%', padding: 12, borderRadius: 10 }} onClick={handleCreateIncident}>
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
                <textarea value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 80, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} placeholder="Add verification notes..." />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn btn-primary" style={{ background: '#22c55e', flex: 1, padding: 12, borderRadius: 10 }} onClick={() => handleApproveVerification(selectedIncident._id)}>
                  <FaCheckCircle /> Approve
                </button>
                <button className="btn btn-primary" style={{ background: '#dc2626', flex: 1, padding: 12, borderRadius: 10 }} onClick={() => handleRejectVerification(selectedIncident._id)}>
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

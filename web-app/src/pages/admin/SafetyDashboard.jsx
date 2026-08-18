import React, { useState, useEffect, useCallback } from 'react';
import {
  FaShieldAlt, FaExclamationTriangle, FaUserShield, FaBan, FaCheckCircle,
  FaAmbulance, FaChartLine, FaHistory, FaSearch, FaFilter,
  FaEye, FaEdit, FaTimes, FaBell, FaUserClock, FaMapMarkerAlt, FaPhone,
  FaFileAlt, FaUserTie, FaCar, FaUsers, FaExclamation, FaFlag, FaClipboardCheck,
  FaDownload, FaCalendar, FaClock, FaMapPin, FaFirstAid, FaUserSlash,
  FaFireAlt, FaCarCrash, FaHandRock, FaMedkit, FaWrench
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const SafetyDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
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
  const [dispatchModal, setDispatchModal] = useState(null);
  const [dispatchContacts, setDispatchContacts] = useState([]);
  const [dispatchRecipients, setDispatchRecipients] = useState([]);
  const [dispatchInput, setDispatchInput] = useState('');
  const [dispatchSending, setDispatchSending] = useState(false);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [showSOSDetailModal, setShowSOSDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [respondSOS, setRespondSOS] = useState(null);
  const [responseAction, setResponseAction] = useState('acknowledged');
  const [responseNotes, setResponseNotes] = useState('');

  useEffect(() => {
    fetchSafetyData();
  }, []);

  useEffect(() => {
    let socket;
    try {
      const { io } = require('socket.io-client');
      const url = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://dirs-dire-dawa-intercity-ride-sharing.onrender.com';
      socket = io(url, { transports: ['polling', 'websocket'] });
      socket.on('sos_alert', (alert) => {
        setSOSAlerts(prev => {
          if (prev.some(a => a._id === alert._id)) return prev;
          return [alert, ...prev];
        });
        toast.error(`🚨 SOS Alert: ${alert.user?.firstName || 'User'} — ${alert.message || 'Emergency'}`);
      });
      socket.on('incident_created', (incident) => {
        setIncidents(prev => {
          if (prev.some(i => i._id === incident._id)) return prev;
          return [incident, ...prev];
        });
      });
    } catch (e) { /* socket not critical */ }
    return () => { if (socket) socket.disconnect(); };
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

  const handleResolveSOS = async (alertId, isFalseAlarm, notes) => {
    try {
      await adminAPI.resolveSOS(alertId, notes || 'Resolved by admin', isFalseAlarm);
      setSOSAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: isFalseAlarm ? 'false_alarm' : 'resolved', resolvedBy: { firstName: 'Admin' }, resolvedAt: new Date().toISOString() } : a));
      if (selectedSOS?._id === alertId) {
        setSelectedSOS(prev => ({ ...prev, status: isFalseAlarm ? 'false_alarm' : 'resolved' }));
      }
      toast.success(isFalseAlarm ? 'Marked as false alarm' : 'SOS alert resolved');
    } catch (err) {
      toast.error('Failed to resolve SOS');
    }
  };

  const openRespondModal = (alert) => {
    setRespondSOS(alert);
    setResponseAction('acknowledged');
    setResponseNotes('');
    setShowResponseModal(true);
  };

  const handleRespondToSOS = async () => {
    if (!respondSOS) return;
    try {
      await adminAPI.respondToSOS(respondSOS._id, responseAction, responseNotes);
      setSOSAlerts(prev => prev.map(a => a._id === respondSOS._id ? { ...a, status: 'responded', respondedAt: new Date().toISOString(), adminActions: [...(a.adminActions || []), { action: responseAction, notes: responseNotes, performedAt: new Date().toISOString() }] } : a));
      if (selectedSOS?._id === respondSOS._id) {
        setSelectedSOS(prev => ({ ...prev, status: 'responded', respondedAt: new Date().toISOString() }));
      }
      toast.success('Response recorded');
      setShowResponseModal(false);
    } catch (err) {
      toast.error('Failed to record response');
    }
  };

  const handleDispatchSOS = async (alert, dispatchType, reportNumber, notes) => {
    try {
      await adminAPI.dispatchSOS(alert._id, dispatchType, reportNumber, notes);
      setSOSAlerts(prev => prev.map(a => a._id === alert._id ? { ...a, status: 'dispatched', dispatchedAt: new Date().toISOString(), dispatchType, dispatchReportNumber: reportNumber } : a));
      if (selectedSOS?._id === alert._id) {
        setSelectedSOS(prev => ({ ...prev, status: 'dispatched', dispatchedAt: new Date().toISOString(), dispatchType }));
      }
      toast.success(`${dispatchType === 'police' ? 'Police' : 'Ambulance'} dispatched`);
    } catch (err) {
      toast.error('Failed to record dispatch');
    }
  };

  const handleCreateIncident = async () => {
    try {
      const res = await adminAPI.createIncident(newIncident);
      const created = res.data?.incident || res.data;
      if (created?._id) setIncidents(prev => [created, ...prev]);
      toast.success('Incident created successfully');
      setShowCreateIncidentModal(false);
      setNewIncident({ category: 'other', severity: 'medium', description: '', location: { address: '', coordinates: [] } });
    } catch (err) {
      toast.error('Failed to create incident');
    }
  };

  const handleAssignIncident = async (incidentId) => {
    if (!user?._id) {
      toast.error('Unable to identify the current admin');
      return;
    }
    try {
      await adminAPI.assignIncident(incidentId, user._id);
      setIncidents(prev => prev.map(i => i._id === incidentId ? { ...i, status: 'investigating', assignedTo: { firstName: user.firstName, lastName: user.lastName } } : i));
      toast.success('Incident assigned');
    } catch (err) {
      toast.error('Failed to assign incident');
    }
  };

  const handleResolveIncident = async (incidentId) => {
    try {
      await adminAPI.resolveIncident(incidentId, 'Resolved by admin', false, false);
      setIncidents(prev => prev.map(i => i._id === incidentId ? { ...i, status: 'resolved', resolvedBy: { firstName: 'Admin' }, resolvedAt: new Date().toISOString() } : i));
      toast.success('Incident resolved');
    } catch (err) {
      toast.error('Failed to resolve incident');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await adminAPI.blockUser(userId, blockReason, blockDuration);
      setBlockedUsers(prev => [...prev, { _id: userId, firstName: 'User', lastName: '', phoneNumber: '', blockReason }]);
      toast.success('User blocked successfully');
      setShowBlockModal(false);
      setBlockReason('');
    } catch (err) {
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await adminAPI.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User unblocked successfully');
    } catch (err) {
      toast.error('Failed to unblock user');
    }
  };

  const handleApproveVerification = async (driverId) => {
    try {
      await adminAPI.approveDriverVerification(driverId, verificationNotes);
      setPendingVerifications(prev => prev.filter(d => d._id !== driverId));
      toast.success('Verification approved');
      setShowVerificationModal(false);
      setVerificationNotes('');
    } catch (err) {
      toast.error('Failed to approve verification');
    }
  };

  const handleRejectVerification = async (driverId) => {
    try {
      await adminAPI.rejectDriverVerification(driverId, verificationNotes);
      setPendingVerifications(prev => prev.filter(d => d._id !== driverId));
      toast.success('Verification rejected');
      setShowVerificationModal(false);
      setVerificationNotes('');
    } catch (err) {
      toast.error('Failed to reject verification');
    }
  };

  const handleNotifyPolice = async (incidentId) => {
    try {
      const incident = incidents.find(i => i._id === incidentId);
      if (!incident) return;
      const res = await adminAPI.getDispatchContacts({ type: 'police' });
      const d = res.data;
      const contacts = Array.isArray(d) ? d : (d?.contacts || []);
      setDispatchContacts(contacts.filter(c => c.active !== false));
      setDispatchRecipients([]);
      setDispatchInput(incident.policeReportNumber || '');
      setDispatchModal({ incident, type: 'police' });
    } catch (err) {
      toast.error('Failed to load police contacts');
    }
  };

  const handleDispatchAmbulance = async (incidentId) => {
    try {
      const incident = incidents.find(i => i._id === incidentId);
      if (!incident) return;
      const res = await adminAPI.getDispatchContacts({ type: 'hospital' });
      const d = res.data;
      const contacts = Array.isArray(d) ? d : (d?.contacts || []);
      setDispatchContacts(contacts.filter(c => c.active !== false));
      setDispatchRecipients([]);
      setDispatchInput(incident.hospitalName || '');
      setDispatchModal({ incident, type: 'hospital' });
    } catch (err) {
      toast.error('Failed to load hospital contacts');
    }
  };

  const handleSendDispatch = async () => {
    if (!dispatchModal) return;
    const { incident, type, fromSOS, sosAlert, sosDispatchType } = dispatchModal;
    if (type === 'police' && !dispatchInput.trim()) {
      toast.error('Enter the police report number');
      return;
    }
    setDispatchSending(true);
    try {
      if (type === 'police') {
        await adminAPI.notifyPolice(incident._id, dispatchInput.trim(), dispatchRecipients);
      } else {
        await adminAPI.dispatchAmbulance(incident._id, dispatchInput.trim() || 'Assigned hospital', '', dispatchRecipients);
      }
      if (fromSOS && sosAlert?._id) {
        try {
          await adminAPI.dispatchSOS(sosAlert._id, sosDispatchType || 'police', dispatchInput.trim() || '', 'Dispatched via admin dashboard');
          setSOSAlerts(prev => prev.map(a => a._id === sosAlert._id ? { ...a, status: 'dispatched', dispatchedAt: new Date().toISOString(), dispatchType: sosDispatchType || 'police' } : a));
        } catch (e) { /* non-blocking */ }
      }
      const count = dispatchRecipients.length;
      toast.success(type === 'police'
        ? `Police notified${count ? `, dispatched to ${count} station${count > 1 ? 's' : ''}` : ` (no recipients)`}`
        : `Ambulance dispatched${count ? `, sent to ${count} hospital${count > 1 ? 's' : ''}` : ` (no recipients)`}`);
      setDispatchModal(null);
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to send dispatch');
    } finally {
      setDispatchSending(false);
    }
  };

  const toggleRecipient = (id) => {
    setDispatchRecipients(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const SOS_TYPE_ICONS = {
    accident: FaCarCrash, medical: FaMedkit, harassment: FaHandRock, theft: FaExclamationTriangle,
    fire: FaFireAlt, breakdown: FaWrench, other: FaShieldAlt, general: FaExclamationTriangle,
  };

  const SOS_TYPE_LABELS = {
    accident: 'Accident', medical: 'Medical Emergency', harassment: 'Harassment', theft: 'Theft',
    fire: 'Fire Emergency', breakdown: 'Vehicle Breakdown', other: 'Other Emergency', general: 'General SOS',
  };

  const handleDispatchFromSOS = async (alert, dispatchType) => {
    try {
      const res = await adminAPI.getDispatchContacts({ type: dispatchType === 'ambulance' ? 'hospital' : 'police' });
      const d = res.data;
      const contacts = Array.isArray(d) ? d : (d?.contacts || []);
      setDispatchContacts(contacts.filter(c => c.active !== false));
      setDispatchRecipients([]);
      setDispatchInput('');
      setDispatchModal({ incident: { _id: alert._id, category: alert.type || 'other', severity: 'critical', description: alert.message, location: alert.location }, type: dispatchType === 'ambulance' ? 'hospital' : 'police', fromSOS: true, sosAlert: alert, sosDispatchType: dispatchType || 'police' });
    } catch (err) {
      toast.error('Failed to load contacts');
    }
  };

  const INCIDENT_TYPE_LABELS = {
    vehicle_damage: 'Lost Item',
    payment_evasion: 'Fare Dispute',
    harassment: 'Safety Concern',
    reckless_driving: 'Driver Behavior',
    assault: 'Assault',
    theft: 'Theft',
    accident: 'Accident',
    substance_abuse: 'Substance Abuse',
    vehicle_safety: 'Vehicle Safety',
    passenger_misbehavior: 'Passenger Misbehavior',
    fake_emergency: 'Fake Emergency',
    other: 'Other',
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
      case 'responded': return '#3b82f6';
      case 'dispatched': return '#f97316';
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
      case 'responded': return 'rgba(59, 130, 246, 0.1)';
      case 'dispatched': return 'rgba(249, 115, 22, 0.1)';
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
    { key: 'sos', icon: <FaExclamationTriangle />, label: 'SOS', count: sosAlerts.filter(a => ['active', 'responded', 'dispatched'].includes(a.status)).length },
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
              {sosAlerts.filter(a => ['active', 'responded', 'dispatched'].includes(a.status)).length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <FaCheckCircle style={{ fontSize: 32, color: '#22c55e', marginBottom: 8 }} /><br />No active SOS alerts
                </div>
              ) : sosAlerts.filter(a => ['active', 'responded', 'dispatched'].includes(a.status)).slice(0, 3).map(alert => {
                const TypeIcon = SOS_TYPE_ICONS[alert.type] || FaExclamationTriangle;
                return (
                <div key={alert._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => { setSelectedSOS(alert); setShowSOSDetailModal(true); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TypeIcon style={{ fontSize: 14 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{alert.user?.firstName} {alert.user?.lastName}{alert.userName && !alert.user?.firstName ? alert.userName : ''}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{SOS_TYPE_LABELS[alert.type] || 'General'} — {alert.message || 'Emergency'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
                          {alert.userPhone && <span><FaPhone style={{ fontSize: 8, marginRight: 2 }} />{alert.userPhone}</span>}
                          {alert.location?.address && <span><FaMapMarkerAlt style={{ fontSize: 8, marginRight: 2 }} />{alert.location.address}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button className="driver-action-btn driver-btn-view" onClick={() => openRespondModal(alert)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}>
                        <FaBell style={{ fontSize: 10 }} /> Respond
                      </button>
                      <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleResolveSOS(alert._id, false)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                        <FaCheckCircle style={{ fontSize: 10 }} /> Resolve
                      </button>
                    </div>
                  </div>
                </div>
              )})}
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
            ) : sosAlerts.map((alert, idx) => {
              const TypeIcon = SOS_TYPE_ICONS[alert.type] || FaExclamationTriangle;
              return (
              <div key={alert._id} style={{ padding: '14px 16px', borderBottom: idx < sosAlerts.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }} onClick={() => { setSelectedSOS(alert); setShowSOSDetailModal(true); }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary, #f9fafb)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: getStatusBg(alert.status), color: getStatusColor(alert.status), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TypeIcon style={{ fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{alert.user?.firstName} {alert.user?.lastName}{alert.userName && !alert.user?.firstName ? alert.userName : ''}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{SOS_TYPE_LABELS[alert.type] || alert.type || 'General'} — {alert.message || 'Emergency alert'}</div>
                    </div>
                  </div>
                  <span style={{ background: `${getStatusColor(alert.status)}15`, color: getStatusColor(alert.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{alert.status?.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, flexWrap: 'wrap' }}>
                  {alert.userPhone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><FaPhone style={{ fontSize: 9 }} />{alert.userPhone}</span>}
                  {(alert.location?.address || (alert.location?.coordinates?.length === 2)) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><FaMapMarkerAlt style={{ fontSize: 9 }} />{alert.location?.address || `${alert.location.coordinates[1]?.toFixed(4)}, ${alert.location.coordinates[0]?.toFixed(4)}`}</span>}
                  {alert.trip && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><FaCar style={{ fontSize: 9 }} />Trip linked</span>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><FaClock style={{ fontSize: 9 }} />{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
                {alert.status === 'active' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                    <button className="driver-action-btn driver-btn-view" onClick={() => openRespondModal(alert)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}>
                      <FaBell style={{ fontSize: 10 }} /> Respond
                    </button>
                    <button className="driver-action-btn driver-btn-ban" onClick={() => handleDispatchFromSOS(alert, 'police')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dc2626', color: 'white', fontWeight: 600 }}>
                      <FaShieldAlt style={{ fontSize: 10 }} /> Police
                    </button>
                    <button className="driver-action-btn driver-btn-ban" onClick={() => handleDispatchFromSOS(alert, 'ambulance')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f97316', color: 'white', fontWeight: 600 }}>
                      <FaAmbulance style={{ fontSize: 10 }} /> Ambulance
                    </button>
                    <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleResolveSOS(alert._id, false)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                      <FaCheckCircle style={{ fontSize: 10 }} /> Resolve
                    </button>
                    <button className="driver-action-btn driver-btn-view" onClick={() => handleResolveSOS(alert._id, true)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#6b7280', color: 'white', fontWeight: 600 }}>
                      False Alarm
                    </button>
                  </div>
                )}
                {alert.status === 'responded' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                    <button className="driver-action-btn driver-btn-ban" onClick={() => handleDispatchFromSOS(alert, 'police')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dc2626', color: 'white', fontWeight: 600 }}>
                      <FaShieldAlt style={{ fontSize: 10 }} /> Police
                    </button>
                    <button className="driver-action-btn driver-btn-ban" onClick={() => handleDispatchFromSOS(alert, 'ambulance')} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f97316', color: 'white', fontWeight: 600 }}>
                      <FaAmbulance style={{ fontSize: 10 }} /> Ambulance
                    </button>
                    <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleResolveSOS(alert._id, false)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                      <FaCheckCircle style={{ fontSize: 10 }} /> Resolve
                    </button>
                  </div>
                )}
                {alert.status === 'dispatched' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                    <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleResolveSOS(alert._id, false)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                      <FaCheckCircle style={{ fontSize: 10 }} /> Resolve
                    </button>
                  </div>
                )}
              </div>
            )})}
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
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', textTransform: 'capitalize' }}>{INCIDENT_TYPE_LABELS[incident.category] || (incident.category?.replace(/_/g, ' ') || 'Incident')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{incident.description?.slice(0, 60) || 'No description'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Reported by {incident.reportedBy?.firstName ? `${incident.reportedBy.firstName} ${incident.reportedBy.lastName}` : 'User'}{incident.reportedBy?.phoneNumber ? ` • ${incident.reportedBy.phoneNumber}` : ''} • {new Date(incident.createdAt).toLocaleString()}
                        {(incident.location?.address || incident.locationAddress) && <div style={{ marginTop: 2 }}><FaMapMarkerAlt style={{ fontSize: 9, marginRight: 3 }} />{incident.location?.address || incident.locationAddress}</div>}
                      </div>
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
    {/* ===== DISPATCH MODAL ===== */}
      {dispatchModal && (
        <div className="modal-overlay" onClick={() => setDispatchModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{dispatchModal.fromSOS ? '🚨 Dispatch from SOS Alert' : dispatchModal.type === 'police' ? '🚔 Dispatch to Police' : '🚑 Dispatch Ambulance to Hospital'}</h3>
              <button className="modal-close" onClick={() => setDispatchModal(null)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 10, padding: 10, marginTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', textTransform: 'capitalize' }}>{INCIDENT_TYPE_LABELS[dispatchModal.incident.category] || (dispatchModal.incident.category?.replace(/_/g, ' ') || 'Incident')}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{dispatchModal.incident.description || 'No description'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Severity: <span style={{ textTransform: 'capitalize' }}>{dispatchModal.incident.severity}</span>
                  {((dispatchModal.incident.location?.address) || dispatchModal.incident.locationAddress) ? ` • ${dispatchModal.incident.location?.address || dispatchModal.incident.locationAddress}` : ''}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  {dispatchModal.type === 'police' ? 'Police Report Number' : 'Hospital Name'}
                </label>
                <input
                  value={dispatchInput}
                  onChange={(e) => setDispatchInput(e.target.value)}
                  placeholder={dispatchModal.type === 'police' ? 'e.g. PR-2026-0042' : 'e.g. Dil Chora Hospital'}
                  style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Send dispatch to ({dispatchRecipients.length} selected)</label>
                  <button onClick={() => setDispatchRecipients(dispatchContacts.length ? dispatchContacts.map(c => c._id) : [])} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Select all</button>
                </div>
                {dispatchContacts.length === 0 ? (
                  <div style={{ padding: 12, background: 'var(--bg-secondary, #f9fafb)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                    No active {dispatchModal.type === 'police' ? 'police stations' : 'hospitals'} registered. Add them on the <strong>Dispatch Contacts</strong> page. Dispatch will be saved but no email sent.
                  </div>
                ) : (
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 10 }}>
                    {dispatchContacts.map((contact) => (
                      <label key={contact._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                        <input type="checkbox" checked={dispatchRecipients.includes(contact._id)} onChange={() => toggleRecipient(contact._id)} />
                        <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1 }}>{contact.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{contact.email || contact.phoneNumber || ''}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button className="driver-action-btn driver-btn-ban" onClick={handleSendDispatch} disabled={dispatchSending} style={{ marginTop: 16, width: '100%', padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: dispatchSending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', fontWeight: 600, opacity: dispatchSending ? 0.6 : 1 }}>
                {dispatchSending ? 'Sending...' : `Send Dispatch to ${dispatchRecipients.length} ${dispatchRecipients.length === 1 ? 'recipient' : 'recipients'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* ===== RESPONSE MODAL ===== */}
      {showResponseModal && respondSOS && (
        <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Admin Response</h3>
              <button className="modal-close" onClick={() => setShowResponseModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 10, padding: 10, marginTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{respondSOS.user?.firstName} {respondSOS.user?.lastName}{respondSOS.userName && !respondSOS.user?.firstName ? respondSOS.userName : ''}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{respondSOS.message || 'Emergency alert'}</div>
                {respondSOS.userPhone && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}><FaPhone style={{ fontSize: 9, marginRight: 3 }} />{respondSOS.userPhone}</div>}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>What did you do?</label>
                <select value={responseAction} onChange={(e) => setResponseAction(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)' }}>
                  <option value="acknowledged">Acknowledged the alert</option>
                  <option value="called_user">Called the user</option>
                  <option value="dispatched_police">Dispatched police</option>
                  <option value="dispatched_ambulance">Dispatched ambulance</option>
                  <option value="contacted_emergency_contact">Contacted emergency contact</option>
                  <option value="located_user">Located the user</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Notes</label>
                <textarea value={responseNotes} onChange={(e) => setResponseNotes(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 80, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)' }} placeholder="Describe what you did (called the user, confirmed safety, etc.)" />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={handleRespondToSOS} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FaCheckCircle /> Record Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    {/* ===== SOS DETAIL MODAL ===== */}
      {showSOSDetailModal && selectedSOS && (
        <div className="modal-overlay" onClick={() => setShowSOSDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header" style={{ background: selectedSOS.status === 'active' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {React.createElement(SOS_TYPE_ICONS[selectedSOS.type] || FaExclamationTriangle, { style: { fontSize: 18 } })}
                <h3 style={{ margin: 0 }}>{SOS_TYPE_LABELS[selectedSOS.type] || 'SOS Alert'}</h3>
              </div>
              <button className="modal-close" onClick={() => setShowSOSDetailModal(false)} style={{ color: 'white' }}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              {/* Status badge */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12 }}>
                <span style={{ background: `${getStatusColor(selectedSOS.status)}15`, color: getStatusColor(selectedSOS.status), fontSize: 11, padding: '4px 12px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{selectedSOS.status?.replace('_', ' ')}</span>
                <span style={{ background: `${getSeverityColor('critical')}15`, color: getSeverityColor('critical'), fontSize: 11, padding: '4px 12px', borderRadius: 12, fontWeight: 700 }}>URGENT</span>
              </div>

              {/* User info */}
              <div style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>REPORTED BY</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{selectedSOS.user?.firstName} {selectedSOS.user?.lastName}{selectedSOS.userName && !selectedSOS.user?.firstName ? selectedSOS.userName : ''}</div>
                {selectedSOS.userPhone && (
                  <a href={`tel:${selectedSOS.userPhone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                    <FaPhone style={{ fontSize: 10 }} /> {selectedSOS.userPhone} — Call Now
                  </a>
                )}
              </div>

              {/* Message */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>MESSAGE</div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{selectedSOS.message || 'No message provided'}</div>
              </div>

              {/* Location */}
              {selectedSOS.location && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>LOCATION</div>
                  {selectedSOS.location.address ? (
                    <a href={`https://www.google.com/maps?q=${selectedSOS.location.coordinates?.[1]},${selectedSOS.location.coordinates?.[0]}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FaMapMarkerAlt /> {selectedSOS.location.address}
                    </a>
                  ) : selectedSOS.location.coordinates?.length === 2 ? (
                    <a href={`https://www.google.com/maps?q=${selectedSOS.location.coordinates[1]},${selectedSOS.location.coordinates[0]}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FaMapMarkerAlt /> {selectedSOS.location.coordinates[1]?.toFixed(5)}, {selectedSOS.location.coordinates[0]?.toFixed(5)} (Open in Maps)
                    </a>
                  ) : null}
                </div>
              )}

              {/* Trip */}
              {selectedSOS.trip && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>LINKED TRIP</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FaCar /> {typeof selectedSOS.trip === 'object' ? `Trip #${selectedSOS.trip._id?.slice(-6)}` : `Trip #${String(selectedSOS.trip).slice(-6)}`}
                  </div>
                </div>
              )}

              {/* Notified contacts */}
              {selectedSOS.notifiedContacts?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>NOTIFIED CONTACTS</div>
                  {selectedSOS.notifiedContacts.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text)', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{c.name} — {c.phoneNumber}</span>
                      <span style={{ color: c.acknowledged ? '#22c55e' : '#f97316', fontSize: 10, fontWeight: 600 }}>{c.acknowledged ? 'Acknowledged' : 'Notified'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Time & Resolution */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>CREATED</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{new Date(selectedSOS.createdAt).toLocaleString()}</div>
                </div>
                {selectedSOS.resolvedAt && (
                  <div style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>RESOLVED</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{new Date(selectedSOS.resolvedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
              {selectedSOS.resolutionNotes && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>RESOLUTION NOTES</div>
                  <div style={{ fontSize: 12, color: 'var(--text)' }}>{selectedSOS.resolutionNotes}</div>
                </div>
              )}

              {/* Admin actions timeline */}
              {selectedSOS.adminActions?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>ADMIN ACTION LOG</div>
                  <div style={{ borderLeft: '2px solid var(--border-light)', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedSOS.adminActions.map((action, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -17, top: 3, width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{action.action?.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{action.notes}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(action.performedAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {selectedSOS.status === 'active' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { openRespondModal(selectedSOS); }} style={{ padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FaBell /> Respond
                  </button>
                  <button onClick={() => { setShowSOSDetailModal(false); handleDispatchFromSOS(selectedSOS, 'police'); }} style={{ padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FaShieldAlt /> Police
                  </button>
                  <button onClick={() => { setShowSOSDetailModal(false); handleDispatchFromSOS(selectedSOS, 'ambulance'); }} style={{ padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#f97316', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FaAmbulance /> Ambulance
                  </button>
                  <button onClick={() => { handleResolveSOS(selectedSOS._id, false); setShowSOSDetailModal(false); }} style={{ padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#22c55e', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FaCheckCircle /> Resolve
                  </button>
                  <button onClick={() => { handleResolveSOS(selectedSOS._id, true); setShowSOSDetailModal(false); }} style={{ gridColumn: '1 / -1', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#6b7280', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FaBan /> False Alarm
                  </button>
                </div>
              )}
              {selectedSOS.status === 'responded' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { setShowSOSDetailModal(false); handleDispatchFromSOS(selectedSOS, 'police'); }} style={{ padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FaShieldAlt /> Police
                  </button>
                  <button onClick={() => { setShowSOSDetailModal(false); handleDispatchFromSOS(selectedSOS, 'ambulance'); }} style={{ padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#f97316', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FaAmbulance /> Ambulance
                  </button>
                  <button onClick={() => { handleResolveSOS(selectedSOS._id, false); setShowSOSDetailModal(false); }} style={{ gridColumn: '1 / -1', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#22c55e', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FaCheckCircle /> Resolve
                  </button>
                </div>
              )}
              {selectedSOS.status === 'dispatched' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { handleResolveSOS(selectedSOS._id, false); setShowSOSDetailModal(false); }} style={{ gridColumn: '1 / -1', padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#22c55e', color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FaCheckCircle /> Resolve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyDashboard;

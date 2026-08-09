import React, { useState, useEffect } from 'react';
import {
  FaShieldAlt, FaExclamationTriangle, FaUserSecret, FaSearch, FaFilter,
  FaEye, FaBan, FaCheckCircle, FaTimesCircle, FaClock, FaMapMarkerAlt,
  FaFileAlt, FaBell, FaFlag, FaUserSlash, FaHistory, FaChartLine
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const SafetySecurity = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReport, setIncidentReport] = useState('');

  useEffect(() => {
    fetchSafetyData();
  }, []);

  const fetchSafetyData = async () => {
    try {
      const [fraudRes, suspiciousRes, incidentsRes] = await Promise.all([
        adminAPI.getFraudAlerts(),
        adminAPI.getSuspiciousActivity(),
        Promise.resolve({ data: [] }) // Placeholder for incidents
      ]);
      setFraudAlerts(fraudRes.data || []);
      setSuspiciousActivity(suspiciousRes.data || []);
      setIncidents(incidentsRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch safety data:', err);
      setLoading(false);
    }
  };

  const handleReportIncident = async () => {
    if (!incidentReport) {
      toast.error('Please provide incident details');
      return;
    }
    try {
      await adminAPI.reportIncident({ description: incidentReport });
      toast.success('Incident reported successfully');
      setShowIncidentModal(false);
      setIncidentReport('');
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to report incident');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await adminAPI.suspendUser(userId, 'Security violation detected');
      toast.success('User blocked successfully');
      fetchSafetyData();
    } catch (err) {
      toast.error('Failed to block user');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getAlertTypeColor = (type) => {
    switch (type) {
      case 'fraud': return '#ef4444';
      case 'suspicious': return '#f59e0b';
      case 'security': return '#3b82f6';
      default: return '#6b7280';
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
            {t('admin.safetySecurity') || 'Safety & Security'}
          </div>
          <div className="admin-role-badge">
            <FaShieldAlt /> {t('admin.security') || 'Security'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchSafetyData}>
            <FaSearch />
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowIncidentModal(true)}
          >
            <FaFileAlt /> {t('admin.reportIncident') || 'Report Incident'}
          </button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
            <FaExclamationTriangle />
          </div>
          <div>
            <div className="admin-stat-value">{fraudAlerts.length}</div>
            <div className="admin-stat-label">{t('admin.fraudAlerts') || 'Fraud Alerts'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaUserSecret />
          </div>
          <div>
            <div className="admin-stat-value">{suspiciousActivity.length}</div>
            <div className="admin-stat-label">{t('admin.suspiciousActivity') || 'Suspicious Activity'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaFileAlt />
          </div>
          <div>
            <div className="admin-stat-value">{incidents.length}</div>
            <div className="admin-stat-label">{t('admin.incidents') || 'Incidents'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaCheckCircle />
          </div>
          <div>
            <div className="admin-stat-value">{t('admin.systemSecure') || 'Secure'}</div>
            <div className="admin-stat-label">{t('admin.systemStatus') || 'System Status'}</div>
          </div>
        </div>
      </div>

      {/* Fraud Alerts */}
      {fraudAlerts.length > 0 && (
        <>
          <div className="admin-section-title" style={{ color: '#ef4444' }}>
            <FaExclamationTriangle /> {t('admin.fraudAlerts') || 'Fraud Alerts'} ({fraudAlerts.length})
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20, borderColor: '#ef4444' }}>
            {fraudAlerts.map((alert) => (
              <div key={alert.id} className="admin-activity-item" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                <div className="admin-activity-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <FaExclamationTriangle />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text" style={{ color: '#ef4444', fontWeight: 700 }}>
                    {alert.type}
                  </div>
                  <div className="admin-activity-time">
                    {alert.userId} • {alert.description}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleBlockUser(alert.userId)}
                  >
                    <FaUserSlash />
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      // Mark as resolved
                      setFraudAlerts(fraudAlerts.filter(a => a.id !== alert.id));
                      toast.success('Alert resolved');
                    }}
                  >
                    <FaCheckCircle />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Suspicious Activity */}
      {suspiciousActivity.length > 0 && (
        <>
          <div className="admin-section-title" style={{ color: '#f59e0b' }}>
            <FaUserSecret /> {t('admin.suspiciousActivity') || 'Suspicious Activity'} ({suspiciousActivity.length})
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20, borderColor: '#f59e0b' }}>
            {suspiciousActivity.map((activity) => (
              <div key={activity.id} className="admin-activity-item" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
                <div className="admin-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <FaUserSecret />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{activity.type}</div>
                  <div className="admin-activity-time">
                    {activity.userId} • {activity.description}
                  </div>
                </div>
                <div className="status-badge" style={{
                  background: activity.severity === 'high' ? '#fef2f2' : '#fef3c7',
                  color: activity.severity === 'high' ? '#dc2626' : '#92400e'
                }}>
                  {activity.severity}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Search and Filter */}
      <div className="admin-search">
        <FaSearch />
        <input
          type="text"
          placeholder={t('admin.searchSecurity') || 'Search security events...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          {t('admin.all') || 'All'}
        </button>
        <button
          className={`admin-filter-tab ${filterType === 'fraud' ? 'active' : ''}`}
          onClick={() => setFilterType('fraud')}
        >
          {t('admin.fraud') || 'Fraud'}
        </button>
        <button
          className={`admin-filter-tab ${filterType === 'suspicious' ? 'active' : ''}`}
          onClick={() => setFilterType('suspicious')}
        >
          {t('admin.suspicious') || 'Suspicious'}
        </button>
        <button
          className={`admin-filter-tab ${filterType === 'incident' ? 'active' : ''}`}
          onClick={() => setFilterType('incident')}
        >
          {t('admin.incident') || 'Incident'}
        </button>
      </div>

      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${filterSeverity === 'all' ? 'active' : ''}`}
          onClick={() => setFilterSeverity('all')}
        >
          {t('admin.allSeverities') || 'All Severities'}
        </button>
        <button
          className={`admin-filter-tab ${filterSeverity === 'critical' ? 'active' : ''}`}
          onClick={() => setFilterSeverity('critical')}
        >
          {t('admin.critical') || 'Critical'}
        </button>
        <button
          className={`admin-filter-tab ${filterSeverity === 'high' ? 'active' : ''}`}
          onClick={() => setFilterSeverity('high')}
        >
          {t('admin.high') || 'High'}
        </button>
        <button
          className={`admin-filter-tab ${filterSeverity === 'medium' ? 'active' : ''}`}
          onClick={() => setFilterSeverity('medium')}
        >
          {t('admin.medium') || 'Medium'}
        </button>
      </div>

      {/* Security Events List */}
      <div className="admin-section-title">
        <FaHistory /> {t('admin.securityEvents') || 'Security Events'}
      </div>
      <div className="admin-activity-list">
        {[...fraudAlerts, ...suspiciousActivity, ...incidents]
          .filter(event => {
            const matchesType = filterType === 'all' || 
              (filterType === 'fraud' && fraudAlerts.includes(event)) ||
              (filterType === 'suspicious' && suspiciousActivity.includes(event)) ||
              (filterType === 'incident' && incidents.includes(event));
            const matchesSeverity = filterSeverity === 'all' || event.severity === filterSeverity;
            const matchesSearch = event.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 event.description?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSeverity && matchesSearch;
          })
          .map((event) => (
            <div key={event.id} className="admin-activity-item">
              <div className="admin-activity-icon" style={{
                background: 'rgba(59, 130, 246, 0.08)',
                color: getAlertTypeColor(event.type || 'security')
              }}>
                {event.type === 'fraud' ? <FaExclamationTriangle /> :
                 event.type === 'suspicious' ? <FaUserSecret /> : <FaShieldAlt />}
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{event.type || event.description}</div>
                <div className="admin-activity-time">
                  {event.userId} • {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="status-badge" style={{
                background: event.severity === 'critical' ? '#fef2f2' :
                         event.severity === 'high' ? '#fef3c7' :
                         event.severity === 'medium' ? '#dbeafe' : '#dcfce7',
                color: event.severity === 'critical' ? '#dc2626' :
                       event.severity === 'high' ? '#92400e' :
                       event.severity === 'medium' ? '#1d4ed8' : '#15803d'
              }}>
                {event.severity || 'medium'}
              </div>
            </div>
          ))}
      </div>

      {/* Report Incident Modal */}
      {showIncidentModal && (
        <div className="modal-overlay" onClick={() => setShowIncidentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.reportIncident') || 'Report Incident'}</h3>
              <button className="modal-close" onClick={() => setShowIncidentModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.incidentDetails') || 'Incident Details'}
                </label>
                <textarea
                  value={incidentReport}
                  onChange={(e) => setIncidentReport(e.target.value)}
                  placeholder={t('admin.describeIncident') || 'Describe the incident...'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '120px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleReportIncident}
              >
                <FaFlag /> {t('admin.submitReport') || 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetySecurity;

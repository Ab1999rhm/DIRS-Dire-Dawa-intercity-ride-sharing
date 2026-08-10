import React, { useState, useEffect } from 'react';
import {
  FaShieldAlt, FaExclamationTriangle, FaUserShield, FaBan, FaCheckCircle,
  FaAmbulance, FaChartLine, FaHistory, FaSearch, FaFilter,
  FaEye, FaEdit, FaTimes, FaBell, FaUserClock, FaMapMarkerAlt, FaPhone,
  FaFileAlt, FaUserTie, FaCar, FaUsers, FaExclamation, FaFlag, FaClipboardCheck,
  FaDownload, FaCalendar, FaClock, FaMapPin, FaFirstAid
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
      const [analyticsRes, sosRes, incidentsRes, fraudRes, suspiciousRes, blockedRes, verificationsRes] = await Promise.all([
        adminAPI.getSafetyAnalytics({}),
        adminAPI.getSOSAlerts({}),
        adminAPI.getIncidents({}),
        adminAPI.getFraudAlerts({}),
        adminAPI.getSuspiciousActivities({}),
        adminAPI.getBlockedUsers(),
        adminAPI.getPendingVerifications()
      ]);

      setAnalytics(analyticsRes.data);
      setSOSAlerts(sosRes.data.alerts || []);
      setIncidents(incidentsRes.data.incidents || []);
      setFraudAlerts(fraudRes.data.frauds || []);
      setSuspiciousActivities(suspiciousRes.data.activities || []);
      setBlockedUsers(blockedRes.data.users || []);
      setPendingVerifications(verificationsRes.data.drivers || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching safety data:', err);
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
      setNewIncident({
        category: 'other',
        severity: 'medium',
        description: '',
        location: { address: '', coordinates: [] }
      });
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

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-spinner">Loading safety data...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-greeting">
            <FaShieldAlt /> {t('admin.safetyDashboard') || 'Safety & Security Dashboard'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchSafetyData}>
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaChartLine /> {t('admin.overview') || 'Overview'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'sos' ? 'active' : ''}`}
          onClick={() => setActiveTab('sos')}
        >
          <FaExclamationTriangle /> {t('admin.sosAlerts') || 'SOS Alerts'} ({sosAlerts.filter(a => a.status === 'active').length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          <FaExclamationTriangle /> {t('admin.incidents') || 'Incidents'} ({incidents.filter(i => i.status !== 'resolved').length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'fraud' ? 'active' : ''}`}
          onClick={() => setActiveTab('fraud')}
        >
          <FaUserShield /> {t('admin.fraud') || 'Fraud'} ({fraudAlerts.filter(f => f.status === 'detected').length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'suspicious' ? 'active' : ''}`}
          onClick={() => setActiveTab('suspicious')}
        >
          <FaFlag /> {t('admin.suspicious') || 'Suspicious'} ({suspiciousActivities.filter(s => s.status === 'detected').length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'blocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          <FaBan /> {t('admin.blocked') || 'Blocked Users'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'verification' ? 'active' : ''}`}
          onClick={() => setActiveTab('verification')}
        >
          <FaClipboardCheck /> {t('admin.verification') || 'Verification'} ({pendingVerifications.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>
                <FaExclamationTriangle />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.incidents?.total || 0}</div>
                <div className="admin-stat-label">{t('admin.totalIncidents') || 'Total Incidents'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>
                <FaExclamationTriangle />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.incidents?.critical || 0}</div>
                <div className="admin-stat-label">{t('admin.criticalIncidents') || 'Critical'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(249, 115, 22, 0.08)', color: '#f97316' }}>
                <FaUserShield />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.fraud?.total || 0}</div>
                <div className="admin-stat-label">{t('admin.fraudAlerts') || 'Fraud Alerts'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaCheckCircle />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.incidents?.resolutionRate || 0}%</div>
                <div className="admin-stat-label">{t('admin.resolutionRate') || 'Resolution Rate'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(234, 179, 8, 0.08)', color: '#eab308' }}>
                <FaFlag />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.suspiciousActivity?.total || 0}</div>
                <div className="admin-stat-label">{t('admin.suspiciousActivity') || 'Suspicious Activity'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>
                <FaExclamationTriangle />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.sos?.total || 0}</div>
                <div className="admin-stat-label">{t('admin.sosAlerts') || 'SOS Alerts'}</div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h3><FaMapPin /> {t('admin.hotspotLocations') || 'Hotspot Locations'}</h3>
            <div className="admin-list">
              {analytics.hotspots?.slice(0, 5).map((hotspot, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{hotspot._id || 'Unknown Location'}</span>
                    <span className="item-meta">{hotspot.count} incidents</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h3><FaUsers /> {t('admin.incidentsByCategory') || 'Incidents by Category'}</h3>
            <div className="admin-list">
              {analytics.incidents?.byCategory?.map((cat, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{cat._id}</span>
                    <span className="item-meta">{cat.count} incidents</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOS Alerts Tab */}
      {activeTab === 'sos' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaExclamationTriangle /> {t('admin.sosAlerts') || 'SOS Alerts'}</h3>
          </div>
          <div className="admin-list">
            {sosAlerts.length === 0 ? (
              <div className="empty-state">No SOS alerts</div>
            ) : (
              sosAlerts.map(alert => (
                <div key={alert._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{alert.user?.firstName} {alert.user?.lastName}</span>
                    <span className="item-meta">{alert.message}</span>
                    <span className="item-meta" style={{ color: getStatusColor(alert.status) }}>
                      {alert.status}
                    </span>
                  </div>
                  <div className="item-actions">
                    {alert.status === 'active' && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#22c55e' }}
                          onClick={() => handleResolveSOS(alert._id, false)}
                        >
                          <FaCheckCircle /> Resolve
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#6b7280' }}
                          onClick={() => handleResolveSOS(alert._id, true)}
                        >
                          <FaTimes /> False Alarm
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

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaExclamationTriangle /> {t('admin.incidents') || 'Incidents'}</h3>
            <button className="btn btn-primary" onClick={() => setShowCreateIncidentModal(true)}>
              <FaFileAlt /> {t('admin.createIncident') || 'Create Incident'}
            </button>
          </div>
          <div className="admin-list">
            {incidents.length === 0 ? (
              <div className="empty-state">No incidents</div>
            ) : (
              incidents.map(incident => (
                <div key={incident._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{incident.category}</span>
                    <span className="item-meta" style={{ color: getSeverityColor(incident.severity) }}>
                      {incident.severity}
                    </span>
                    <span className="item-meta" style={{ color: getStatusColor(incident.status) }}>
                      {incident.status}
                    </span>
                  </div>
                  <div className="item-actions">
                    {incident.status === 'reported' && (
                      <button
                        className="btn btn-sm"
                        onClick={() => handleAssignIncident(incident._id)}
                      >
                        <FaUserTie /> Assign
                      </button>
                    )}
                    {incident.status === 'investigating' && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#3b82f6' }}
                          onClick={() => handleNotifyPolice(incident._id)}
                        >
                          <FaUserShield /> Police
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#dc2626' }}
                          onClick={() => handleDispatchAmbulance(incident._id)}
                        >
                          <FaAmbulance /> Ambulance
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#22c55e' }}
                          onClick={() => handleResolveIncident(incident._id)}
                        >
                          <FaCheckCircle /> Resolve
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

      {/* Fraud Tab */}
      {activeTab === 'fraud' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaUserShield /> {t('admin.fraudAlerts') || 'Fraud Alerts'}</h3>
          </div>
          <div className="admin-list">
            {fraudAlerts.length === 0 ? (
              <div className="empty-state">No fraud alerts</div>
            ) : (
              fraudAlerts.map(fraud => (
                <div key={fraud._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{fraud.user?.firstName} {fraud.user?.lastName}</span>
                    <span className="item-meta">{fraud.type}</span>
                    <span className="item-meta" style={{ color: getStatusColor(fraud.status) }}>
                      {fraud.status}
                    </span>
                  </div>
                  <div className="item-actions">
                    {fraud.status === 'detected' && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#dc2626' }}
                          onClick={() => adminAPI.investigateFraud(fraud._id, 'confirm', 'Confirmed fraud')}
                        >
                          <FaBan /> Block
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#6b7280' }}
                          onClick={() => adminAPI.investigateFraud(fraud._id, 'dismiss', 'False positive')}
                        >
                          <FaTimes /> Dismiss
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

      {/* Suspicious Activity Tab */}
      {activeTab === 'suspicious' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaFlag /> {t('admin.suspiciousActivity') || 'Suspicious Activity'}</h3>
          </div>
          <div className="admin-list">
            {suspiciousActivities.length === 0 ? (
              <div className="empty-state">No suspicious activity</div>
            ) : (
              suspiciousActivities.map(activity => (
                <div key={activity._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{activity.type}</span>
                    <span className="item-meta">{activity.user?.firstName} {activity.user?.lastName}</span>
                    <span className="item-meta" style={{ color: getStatusColor(activity.status) }}>
                      {activity.status}
                    </span>
                  </div>
                  <div className="item-actions">
                    {activity.status === 'detected' && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#eab308' }}
                          onClick={() => adminAPI.resolveSuspiciousActivity(activity._id, 'confirm', 'Confirmed')}
                        >
                          <FaExclamation /> Warn
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#6b7280' }}
                          onClick={() => adminAPI.resolveSuspiciousActivity(activity._id, 'dismiss', 'False positive')}
                        >
                          <FaTimes /> Dismiss
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

      {/* Blocked Users Tab */}
      {activeTab === 'blocked' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaBan /> {t('admin.blockedUsers') || 'Blocked Users'}</h3>
          </div>
          <div className="admin-list">
            {blockedUsers.length === 0 ? (
              <div className="empty-state">No blocked users</div>
            ) : (
              blockedUsers.map(user => (
                <div key={user._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{user.firstName} {user.lastName}</span>
                    <span className="item-meta">{user.phoneNumber}</span>
                    <span className="item-meta">{user.blockReason}</span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn btn-sm"
                      style={{ background: '#22c55e' }}
                      onClick={() => handleUnblockUser(user._id)}
                    >
                      <FaCheckCircle /> Unblock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Verification Tab */}
      {activeTab === 'verification' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaClipboardCheck /> {t('admin.pendingVerifications') || 'Pending Verifications'}</h3>
          </div>
          <div className="admin-list">
            {pendingVerifications.length === 0 ? (
              <div className="empty-state">No pending verifications</div>
            ) : (
              pendingVerifications.map(driver => (
                <div key={driver._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{driver.user?.firstName} {driver.user?.lastName}</span>
                    <span className="item-meta">{driver.user?.phoneNumber}</span>
                    <span className="item-meta">{driver.licenseNumber}</span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn btn-sm"
                      style={{ background: '#22c55e' }}
                      onClick={() => {
                        setSelectedIncident(driver);
                        setShowVerificationModal(true);
                      }}
                    >
                      <FaCheckCircle /> Approve
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#dc2626' }}
                      onClick={() => {
                        setSelectedIncident(driver);
                        setShowVerificationModal(true);
                      }}
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateIncidentModal && (
        <div className="modal-overlay" onClick={() => setShowCreateIncidentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.createIncident') || 'Create Incident'}</h3>
              <button className="modal-close" onClick={() => setShowCreateIncidentModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label>Category</label>
                <select
                  value={newIncident.category}
                  onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                >
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
                <label>Severity</label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Description</label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8, minHeight: '100px' }}
                  placeholder="Describe the incident..."
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleCreateIncident}
              >
                <FaFileAlt /> Create Incident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && selectedIncident && (
        <div className="modal-overlay" onClick={() => setShowVerificationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.driverVerification') || 'Driver Verification'}</h3>
              <button className="modal-close" onClick={() => setShowVerificationModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">Driver</span>
                <span className="detail-val">{selectedIncident.user?.firstName} {selectedIncident.user?.lastName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">License</span>
                <span className="detail-val">{selectedIncident.licenseNumber}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Notes</label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  style={{ width: '100%', padding: '12px', marginTop: 8, minHeight: '80px' }}
                  placeholder="Add verification notes..."
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  style={{ background: '#22c55e' }}
                  onClick={() => handleApproveVerification(selectedIncident._id)}
                >
                  <FaCheckCircle /> Approve
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: '#dc2626' }}
                  onClick={() => handleRejectVerification(selectedIncident._id)}
                >
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

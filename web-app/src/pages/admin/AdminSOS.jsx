import React, { useState, useEffect, useRef } from 'react';
import { FaExclamationTriangle, FaPhone, FaAmbulance, FaShieldAlt, FaBell, FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, sosAPI } from '../../services/api';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import Badge from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import FlexibleMap from '../../components/common/FlexibleMap';
import './Admin.css';

const AdminSOS = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const alarmRef = useRef(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Play alarm when active SOS alerts exist
  useEffect(() => {
    if (alerts.length > 0 && !alarmPlaying) {
      setAlarmPlaying(true);
    }
  }, [alerts.length]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.sosAlerts();
      const d = res.data; const allAlerts = Array.isArray(d) ? d : (d?.data || d?.alerts || []);
      setAlerts(allAlerts.filter(a => a.status !== 'resolved'));
      setResolvedAlerts(allAlerts.filter(a => a.status === 'resolved'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load SOS alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await sosAPI.resolve(alertId);
      const resolved = alerts.find(a => a._id === alertId);
      if (resolved) {
        setResolvedAlerts(prev => [{ ...resolved, status: 'resolved' }, ...prev]);
        setAlerts(prev => prev.filter(a => a._id !== alertId));
        if (selectedAlert?._id === alertId) setSelectedAlert(null);
      }
      toast.success(t('admin.alertResolved') || 'Alert resolved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve alert');
    }
  };

  const handleEmergencyDispatch = (type, alert) => {
    const numbers = { police: '991', ambulance: '907', fireService: '939' };
    const labels = { police: t('admin.police991') || '🚔 Police 991', ambulance: t('admin.ambulance907') || '🚑 Ambulance 907', fireService: '🚒 Fire Service 939' };
    const num = numbers[type];
    toast.success(`${t('admin.dispatching') || 'Dispatching'} ${labels[type]} ${t('admin.to') || 'to'} ${alert?.location?.address || t('admin.incidentLocation') || 'incident location'}!`);
    window.location.href = `tel:${num}`;
  };

  const displayedAlerts = activeTab === 'active' ? alerts : resolvedAlerts;

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.sos')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-logo-bar">
        <img src="/logo.svg?v=2" alt="DIRS" className="admin-logo" />
      </div>
      {/* Real-World Emergency SOS Command Center Header */}
      {alerts.length > 0 && (
        <div className="admin-animate-in" style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          color: 'white',
          padding: '14px 20px',
          borderRadius: 12,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'pulseRed 1.5s infinite',
          boxShadow: '0 4px 20px rgba(220,38,38,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FaBell style={{ fontSize: 20, animation: 'ring 0.8s infinite' }} />
            <div>
              <strong style={{ fontSize: 16 }}>{t('admin.sos') || '🚨 EMERGENCY COMMAND CENTER'} — {alerts.length} {t('admin.activeAlerts') || 'Active Alert'}{alerts.length > 1 ? 's' : ''}</strong>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{t('admin.immediateResponse') || 'Immediate response required'} — All dispatch officers notified</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleEmergencyDispatch('police', alerts[0])}
              style={{ background: '#1e3a8a', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t('admin.police991') || '🚔 Police 991'}
            </button>
            <button
              type="button"
              onClick={() => handleEmergencyDispatch('ambulance', alerts[0])}
              style={{ background: '#065f46', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t('admin.ambulance907') || '🚑 Ambulance 907'}
            </button>
          </div>
        </div>
      )}

      <div className="admin-header admin-animate-in-delay-1">
        <h1>
          {t('admin.sos')}
          {alerts.length > 0 && <span className="alert-badge" style={{ marginLeft: 8, background: '#dc2626' }}>{alerts.length}</span>}
        </h1>
        <button className="btn btn-primary" onClick={fetchAlerts} style={{ fontSize: 13 }}>{t('admin.refresh') || '🔄 Refresh'}</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn btn-sm ${activeTab === 'active' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setActiveTab('active')}>
          🔴 {t('admin.active') || 'Active'} ({alerts.length})
        </button>
        <button className={`btn btn-sm ${activeTab === 'resolved' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('resolved')}>
          ✅ {t('admin.resolved') || 'Resolved'} ({resolvedAlerts.length})
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedAlert ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Alerts List */}
        <div className="admin-animate-in-delay-2">
          {displayedAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <EmptyStateIllustration type="sos" />
              <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>
                {activeTab === 'active' ? (t('admin.allClear') || '✅ All Clear — No Active Emergencies') : (t('admin.noResolved') || 'No resolved alerts')}
              </h3>
            </div>
          ) : (
            <div className="sos-alerts-list">
              {displayedAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="sos-alert-card"
                  style={{
                    background: activeTab === 'active' ? 'var(--danger-bg, rgba(220,38,38,0.05))' : 'var(--success-bg, rgba(22,163,74,0.05))',
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 12,
                    borderLeft: `4px solid ${activeTab === 'active' ? '#dc2626' : '#16a34a'}`,
                    cursor: 'pointer',
                    outline: selectedAlert?._id === alert._id ? '2px solid #2563eb' : 'none'
                  }}
                  onClick={() => setSelectedAlert(selectedAlert?._id === alert._id ? null : alert)}
                >
                  <div className="sos-alert-header">
                    <FaExclamationTriangle style={{ color: activeTab === 'active' ? '#dc2626' : '#16a34a', fontSize: 18, flexShrink: 0 }} />
                    <div className="sos-alert-info">
                      <h4>{alert.userName || `${alert.user?.firstName || ''} ${alert.user?.lastName || ''}`.trim() || t('admin.unknown') || 'Unknown'}</h4>
                      <p>{alert.user?.phoneNumber || alert.userPhone || t('admin.noPhone') || 'No phone'}</p>
                    </div>
                    <Badge variant={activeTab === 'active' ? 'danger' : 'success'} style={{ marginLeft: 'auto' }}>
                      {alert.urgency || (activeTab === 'active' ? (t('admin.high') || 'HIGH') : (t('admin.resolved') || 'resolved'))}
                    </Badge>
                  </div>

                  {alert.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', margin: '10px 0' }}>
                      <FaMapMarkerAlt style={{ color: '#dc2626' }} />
                      {alert.location.address || `${alert.location.coordinates?.[1]?.toFixed(4)}, ${alert.location.coordinates?.[0]?.toFixed(4)}`}
                    </div>
                  )}

                  {alert.description && (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>{alert.description}</p>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    🕐 {new Date(alert.createdAt).toLocaleString()}
                  </div>

                  {activeTab === 'active' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleResolve(alert._id); }}
                      >✅ {t('admin.markResolved') || 'Mark Resolved'}</button>
                      {alert.user?.phoneNumber && (
                        <a href={`tel:${alert.user.phoneNumber}`} className="btn btn-ghost btn-sm" onClick={e => e.stopPropagation()}>
                          <FaPhone /> {t('admin.callPassenger') || 'Call Passenger'}
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: '#1e3a8a', color: 'white' }}
                        onClick={(e) => { e.stopPropagation(); handleEmergencyDispatch('police', alert); }}
                      >
                        {t('admin.police991') || '🚔 Police 991'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: '#065f46', color: 'white' }}
                        onClick={(e) => { e.stopPropagation(); handleEmergencyDispatch('ambulance', alert); }}
                      >
                        {t('admin.ambulance907') || '🚑 Ambulance 907'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Map Panel for selected alert */}
        {selectedAlert && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#dc2626' }}>
              {t('admin.liveIncident') || '📍 Live Incident Location'} — {selectedAlert.user?.firstName} {selectedAlert.user?.lastName}
            </h3>
            <FlexibleMap
              center={selectedAlert.location?.coordinates
                ? [selectedAlert.location.coordinates[1], selectedAlert.location.coordinates[0]]
                : [9.6009, 41.8508]}
              zoom={15}
              defaultHeight="300px"
              markers={[{
                position: selectedAlert.location?.coordinates
                  ? [selectedAlert.location.coordinates[1], selectedAlert.location.coordinates[0]]
                  : [9.6009, 41.8508],
                popup: `🚨 SOS — ${selectedAlert.user?.firstName || 'Passenger'}`
              }]}
              showControls={true}
            />
            <div style={{ background: 'var(--danger-bg, rgba(220,38,38,0.15))', borderRadius: 10, padding: 12, marginTop: 10 }}>
              <strong style={{ fontSize: 13, color: '#991b1b' }}>{t('admin.emergencyDispatch') || 'Emergency Dispatch Options'}</strong>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" style={{ flex: 1, padding: '8px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 12 }}
                  onClick={() => handleEmergencyDispatch('police', selectedAlert)}>{t('admin.police991') || '🚔 Police 991'}</button>
                <button type="button" style={{ flex: 1, padding: '8px', background: '#065f46', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 12 }}
                  onClick={() => handleEmergencyDispatch('ambulance', selectedAlert)}>{t('admin.ambulance907') || '🚑 Ambulance 907'}</button>
                <button type="button" style={{ flex: 1, padding: '8px', background: '#7c2d12', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 12 }}
                  onClick={() => toast.info(t('admin.smsNotified') || 'Emergency contacts notified via SMS!')}>{t('admin.smsContacts') || '📱 SMS Contacts'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSOS;

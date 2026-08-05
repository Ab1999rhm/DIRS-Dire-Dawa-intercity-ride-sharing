import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaPhone, FaEye } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import Badge from '../../components/common/Badge';
import './Admin.css';

const AdminSOS = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.sosAlerts();
      const allAlerts = res.data.alerts || res.data || [];
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
      await adminAPI.sosAlerts();
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'resolved' } : a));
      const resolved = alerts.find(a => a._id === alertId);
      if (resolved) {
        setResolvedAlerts(prev => [{ ...resolved, status: 'resolved' }, ...prev]);
        setAlerts(prev => prev.filter(a => a._id !== alertId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve alert');
    }
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

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.sos')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--danger)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>
          {t('admin.sos')}
          {alerts.length > 0 && <span className="alert-badge">{alerts.length}</span>}
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn btn-sm ${activeTab === 'active' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setActiveTab('active')}>
          Active ({alerts.length})
        </button>
        <button className={`btn btn-sm ${activeTab === 'resolved' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('resolved')}>
          Resolved ({resolvedAlerts.length})
        </button>
      </div>

      {displayedAlerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <EmptyStateIllustration type="sos" />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>
            {activeTab === 'active' ? 'No active alerts' : 'No resolved alerts'}
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'active' ? 'All clear — no emergencies right now' : 'No past alerts to show'}
          </p>
        </div>
      ) : (
        <div className="sos-alerts-list">
          {displayedAlerts.map((alert) => (
            <div key={alert._id} className="sos-alert-card" style={{ background: activeTab === 'active' ? '#fff5f5' : '#f0fdf4', borderRadius: 12, padding: 20, marginBottom: 12, borderLeft: `4px solid ${activeTab === 'active' ? 'var(--danger)' : 'var(--success)'}` }}>
              <div className="sos-alert-header">
                <FaExclamationTriangle className="sos-alert-icon" style={{ color: activeTab === 'active' ? 'var(--danger)' : 'var(--success)' }} />
                <div className="sos-alert-info">
                  <h4>{alert.user?.firstName || 'Unknown'} {alert.user?.lastName || ''}</h4>
                  <p>{alert.user?.phoneNumber || ''}</p>
                </div>
                <Badge variant={activeTab === 'active' ? 'danger' : 'success'} style={{ marginLeft: 'auto' }}>
                  {alert.urgency || (activeTab === 'active' ? 'high' : 'resolved')}
                </Badge>
              </div>

              {alert.location && (
                <div className="sos-alert-location">
                  📍 {alert.location.address || `${alert.location.coordinates?.[1]?.toFixed(4)}, ${alert.location.coordinates?.[0]?.toFixed(4)}`}
                </div>
              )}

              {alert.description && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>{alert.description}</p>
              )}

              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                {new Date(alert.createdAt).toLocaleString()}
              </div>

              <div className="sos-alert-actions">
                {activeTab === 'active' && (
                  <>
                    <button className="btn btn-danger btn-sm" onClick={() => handleResolve(alert._id)}>Resolve</button>
                    {alert.user?.phoneNumber && (
                      <a href={`tel:${alert.user.phoneNumber}`} className="btn btn-ghost btn-sm"><FaPhone /> Call</a>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSOS;

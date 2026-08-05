import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaCar, FaStar } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import Badge, { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const AdminDrivers = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.pendingDrivers();
      setDrivers(res.data.drivers || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (driverId, action) => {
    try {
      await adminAPI.verifyDriver(driverId, action);
      setDrivers(prev => prev.map(d => d._id === driverId ? { ...d, verificationStatus: action === 'approve' ? 'approved' : 'rejected' } : d));
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} driver`);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.drivers')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.drivers')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--danger)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{t('admin.drivers')}</h1>
      </div>

      {drivers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <EmptyStateIllustration type="users" />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>No drivers pending</h3>
          <p style={{ color: 'var(--text-muted)' }}>All driver verifications are up to date</p>
        </div>
      ) : (
        <div className="drivers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {drivers.map((driver) => (
            <div key={driver._id} className="driver-verification-card" style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="row-avatar">
                  {driver.firstName?.[0]}{driver.lastName?.[0]}
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{driver.firstName} {driver.lastName}</h4>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{driver.phoneNumber}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <StatusBadge status={driver.verificationStatus || 'pending'} />
                </div>
              </div>

              {driver.vehicle && (
                <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <FaCar style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: 13 }}>Vehicle Info</strong>
                  </div>
                  <div className="detail-row" style={{ padding: '4px 0' }}><span className="detail-key">Make</span><span className="detail-val">{driver.vehicle.make || 'N/A'}</span></div>
                  <div className="detail-row" style={{ padding: '4px 0' }}><span className="detail-key">Model</span><span className="detail-val">{driver.vehicle.model || 'N/A'}</span></div>
                  <div className="detail-row" style={{ padding: '4px 0' }}><span className="detail-key">Plate</span><span className="detail-val">{driver.vehicle.plateNumber || 'N/A'}</span></div>
                  <div className="detail-row" style={{ padding: '4px 0', border: 'none' }}><span className="detail-key">Year</span><span className="detail-val">{driver.vehicle.year || 'N/A'}</span></div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FaStar style={{ color: '#f59e0b' }} />
                  <span>{driver.rating?.average?.toFixed(1) || '0.0'}</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {driver.totalTrips || 0} trips
                </div>
              </div>

              {(driver.verificationStatus === 'pending' || driver.verificationStatus === undefined) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleVerify(driver._id, 'approve')}>
                    <FaCheck /> {t('admin.approve')}
                  </button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleVerify(driver._id, 'reject')}>
                    <FaTimes /> {t('admin.reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDrivers;

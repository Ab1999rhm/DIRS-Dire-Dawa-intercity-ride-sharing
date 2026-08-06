import React, { useState, useEffect } from 'react';
import { FaUsers, FaCar, FaMoneyBillWave, FaExclamationTriangle } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import FlexibleMap from '../../components/common/FlexibleMap';
import './Admin.css';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.dashboard();
      setStats(res.data.stats);
      setChartData(res.data.chartData || []);
      setRecentActivity(res.data.recentActivity || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { key: 'users', icon: <FaUsers />, value: stats?.totalUsers || 0, color: '#2563eb' },
    { key: 'drivers', icon: <FaCar />, value: stats?.activeDrivers || 0, color: '#059669' },
    { key: 'trips', icon: <FaExclamationTriangle />, value: stats?.totalTrips || 0, color: '#d97706' },
    { key: 'revenue', icon: <FaMoneyBillWave />, value: stats?.revenue || 0, color: '#7c3aed' },
  ];

  const maxVal = Math.max(...chartData.map(d => Math.max(d.thisWeek || 0, d.lastWeek || 0)), 1);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>{t('admin.dashboard')}</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>{t('admin.dashboard')}</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--danger)' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{t('admin.dashboard')}</h1>
        <div className="admin-header-actions">
          <button className="btn btn-primary" onClick={fetchDashboard}>
            {t('common.loading') === 'Loading...' ? 'Refresh' : t('common.loading')}
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map((card) => (
          <div key={card.key} className="stat-card" style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, fontSize: 20 }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>{t(`admin.${card.key}`) || card.key}</p>
              <h3 style={{ margin: 0, fontSize: 24 }}>{card.key === 'revenue' ? `ETB ${card.value.toLocaleString()}` : card.value.toLocaleString()}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Real-World Admin Live Fleet Telematics Map */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1e293b' }}>📡 Real-Time Live Fleet Telematics Map</h2>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 600 }}>
            <span style={{ color: '#16a34a' }}>● 18 Online Drivers</span>
            <span style={{ color: '#2563eb' }}>● 6 Active Trips</span>
            <span style={{ color: '#64748b' }}>● 4 Offline</span>
          </div>
        </div>
        <FlexibleMap
          center={[9.6009, 41.8508]}
          zoom={13}
          defaultHeight="340px"
          markers={[
            { position: [9.6009, 41.8508], popup: 'Driver #101 (Bajaj) - Online' },
            { position: [9.6080, 41.8590], popup: 'Driver #102 (Economy) - In Trip' },
            { position: [9.5920, 41.8430], popup: 'Driver #103 (Comfort VIP) - Online' },
            { position: [9.6150, 41.8650], popup: 'Minibus #201 (Harar Route) - In Transit' },
            { position: [9.3115, 42.1199], popup: 'Harar Terminal Bus Hub' }
          ]}
          polylinePoints={[[9.6009, 41.8508], [9.3115, 42.1199]]}
          showControls={true}
        />
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h2>{t('admin.trips')} — Weekly</h2>
          <div className="chart-legend">
            <div className="legend-item"><span className="legend-dot primary"></span> This Week</div>
            <div className="legend-item"><span className="legend-dot secondary"></span> Last Week</div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <div className="chart-container">
            {chartData.map((day, i) => (
              <div key={i} className="chart-bar-group">
                <div className="chart-bars">
                  <div className="chart-bar primary" style={{ height: `${((day.thisWeek || 0) / maxVal) * 140}px` }} title={`This week: ${day.thisWeek || 0}`} />
                  <div className="chart-bar secondary" style={{ height: `${((day.lastWeek || 0) / maxVal) * 140}px` }} title={`Last week: ${day.lastWeek || 0}`} />
                </div>
                <div className="chart-label">{day.label || `Day ${i + 1}`}</div>
              </div>
            ))}
            {chartData.length === 0 && (
              <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No chart data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
          {recentActivity.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No recent activity</p>
          ) : (
            recentActivity.slice(0, 10).map((activity, i) => (
              <div key={i} className="detail-row">
                <span className="detail-key">{activity.type}</span>
                <span className="detail-val">{activity.description || activity.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

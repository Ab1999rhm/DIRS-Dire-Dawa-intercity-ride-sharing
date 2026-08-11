import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers, FaCar, FaMoneyBillWave, FaExclamationTriangle, FaShieldAlt,
  FaCreditCard, FaTag, FaChartBar, FaBell, FaSync, FaSearch,
  FaUserShield, FaUserClock, FaUserCheck, FaUserSlash,
  FaArrowRight, FaMapMarkerAlt, FaClock, FaEllipsisH, FaMoon, FaSun, FaGlobe,
  FaCheck, FaRoute, FaHeadset, FaChartLine, FaCog, FaStar, FaMap,
  FaServer, FaDatabase, FaWifi, FaCheckCircle, FaTimesCircle, FaHourglassHalf
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AdminDashboard = () => {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [activeTrips, setActiveTrips] = useState([]);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [recentSOS, setRecentSOS] = useState([]);
  const [systemHealth, setSystemHealth] = useState({ api: 'operational', db: 'operational', socket: 'operational' });

  useEffect(() => {
    fetchDashboard();
    // Poll for live data every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.dashboard();
      setStats(res.data.stats);
      setRecentActivity(res.data.recentActivity || []);
      setActiveTrips(res.data.activeTrips || []);
      setOnlineDrivers(res.data.onlineDrivers || []);
      setRecentSOS(res.data.recentSOS || []);
      setSystemHealth(res.data.systemHealth || { api: 'operational', db: 'operational', socket: 'operational' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Today's Live Metrics
  const statCards = [
    { key: 'onlineDrivers', icon: <FaCar />, value: stats?.onlineDrivers || 0, color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Online Now' },
    { key: 'activeTrips', icon: <FaRoute />, value: stats?.activeTrips || 0, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'Active Trips' },
    { key: 'todayRevenue', icon: <FaMoneyBillWave />, value: stats?.todayRevenue || 0, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', isCurrency: true, label: "Today's Revenue" },
    { key: 'sosAlerts', icon: <FaShieldAlt />, value: stats?.sosAlerts || 0, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'SOS Alerts' },
    { key: 'completedToday', icon: <FaCheckCircle />, value: stats?.completedToday || 0, color: '#059669', bg: 'rgba(5,150,105,0.08)', label: 'Completed Today' },
    { key: 'pendingApprovals', icon: <FaHourglassHalf />, value: stats?.pendingApprovals || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Pending Approvals' },
  ];

  // Quick Actions - Most Used Admin Tasks
  const quickActions = [
    { icon: <FaMap />, label: 'Live Map', path: '/admin/monitoring', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', priority: 'high' },
    { icon: <FaRoute />, label: 'Active Trips', path: '/admin/trip-management', color: '#2563eb', bg: 'rgba(37,99,235,0.08)', priority: 'high' },
    { icon: <FaShieldAlt />, label: 'SOS Alerts', path: '/admin/safety', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', priority: 'critical' },
    { icon: <FaUserCheck />, label: 'Driver Approvals', path: '/admin/driver-management', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', priority: 'high' },
    { icon: <FaCreditCard />, label: 'Financial Summary', path: '/admin/financials', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', priority: 'medium' },
    { icon: <FaHeadset />, label: 'Support Tickets', path: '/admin/support', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', priority: 'medium' },
  ];

  // System Health Status
  const getHealthStatus = (status) => {
    switch (status) {
      case 'operational': return { color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: <FaCheckCircle /> };
      case 'degraded': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: <FaExclamationTriangle /> };
      case 'down': return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', icon: <FaTimesCircle /> };
      default: return { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', icon: <FaTimesCircle /> };
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-logo-bar">
          <div className="admin-skeleton" style={{ height: 60 }}></div>
        </div>
        <div className="admin-header">
          <div className="admin-header-left">
            <div className="admin-skeleton" style={{ width: 120, height: 24, marginBottom: 8 }}></div>
            <div className="admin-skeleton" style={{ width: 80, height: 16 }}></div>
          </div>
        </div>
        <div className="admin-stats-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="admin-skeleton" style={{ height: 72 }}></div>)}
        </div>
        <div className="admin-skeleton" style={{ height: 100 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-empty">
          <div className="admin-empty-icon">⚠️</div>
          <h3>{t('common.error') || 'Error'}</h3>
          <p>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchDashboard}>
            {t('common.retry') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Logo Bar */}
      <div className="admin-logo-bar">
        <img src="/logo.svg?v=2" alt="DIRS - Dire Dawa Ride Sharing" className="admin-logo" />
      </div>

      {/* Header */}
      <div className="admin-header admin-animate-in">
        <div className="admin-header-left">
          <div className="admin-greeting">
            {t('admin.dashboard') || 'Dashboard'}
          </div>
          <div className="admin-role-badge">
            <FaShieldAlt /> {t('admin.adminPanel') || 'Admin Panel'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          <div className="admin-lang-picker-wrapper">
            <button className="admin-icon-btn" onClick={() => setShowLangPicker(!showLangPicker)} aria-label="Change language">
              <FaGlobe />
            </button>
            {showLangPicker && (
              <div className="admin-lang-picker">
                {availableLanguages.map(lang => (
                  <button
                    key={lang.code}
                    className={`admin-lang-option ${language === lang.code ? 'active' : ''}`}
                    onClick={() => { setLanguage(lang.code); setShowLangPicker(false); }}
                  >
                    <FaGlobe />
                    <span>{lang.name}</span>
                    {language === lang.code && <FaCheck />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="admin-icon-btn" onClick={fetchDashboard}>
            <FaSync />
          </button>
          <button className="admin-icon-btn" title="Notifications">
            <FaBell />
            {(stats?.sosAlerts || 0) > 0 && (
              <span className="badge">{stats.sosAlerts}</span>
            )}
          </button>
        </div>
      </div>

      {/* Today's Live Metrics - 6 cards */}
      <div className="admin-stats-grid admin-animate-in-delay-1" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {statCards.map((card) => (
          <div key={card.key} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div>
              <div className="admin-stat-value">
                {card.isCurrency ? `ETB ${(card.value || 0).toLocaleString()}` : (card.value || 0).toLocaleString()}
              </div>
              <div className="admin-stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - Most Used Tasks */}
      <div className="admin-section-title admin-animate-in-delay-2" style={{ marginTop: 24 }}>
        <FaSearch /> Quick Actions
      </div>
      <div className="admin-actions-grid admin-animate-in-delay-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {quickActions.map((action, i) => (
          <button key={i} className="admin-action-card" onClick={() => navigate(action.path)}>
            <div className="admin-action-icon" style={{ background: action.bg, color: action.color }}>
              {action.icon}
            </div>
            <div className="admin-action-label">{action.label}</div>
            {action.priority === 'critical' && <span className="badge" style={{ position: 'absolute', top: 8, right: 8, background: '#dc2626' }}>!</span>}
          </button>
        ))}
      </div>

      {/* Live Status Panels */}
      <div className="admin-section-title admin-animate-in-delay-3" style={{ marginTop: 24 }}>
        <FaWifi /> Live Status
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Active Trips Panel */}
        <div style={{ padding: 16, background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <FaRoute style={{ color: '#3b82f6', marginRight: 8 }} />
            <span style={{ fontWeight: 600 }}>Active Trips Now</span>
          </div>
          {activeTrips.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
              No active trips
            </div>
          ) : (
            <div>
              {activeTrips.slice(0, 5).map((trip) => (
                <div key={trip._id} style={{ padding: 8, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{trip.driver?.firstName && trip.driver?.lastName ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'Unknown'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{trip.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Online Drivers Panel */}
        <div style={{ padding: 16, background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <FaCar style={{ color: '#10b981', marginRight: 8 }} />
            <span style={{ fontWeight: 600 }}>Online Drivers</span>
          </div>
          {onlineDrivers.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
              No drivers online
            </div>
          ) : (
            <div>
              {onlineDrivers.slice(0, 5).map((driver) => (
                <div key={driver._id} style={{ padding: 8, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{driver.user?.firstName && driver.user?.lastName ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{driver.vehicleType || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent SOS Panel */}
        <div style={{ padding: 16, background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <FaShieldAlt style={{ color: '#dc2626', marginRight: 8 }} />
            <span style={{ fontWeight: 600 }}>Recent SOS Alerts</span>
          </div>
          {recentSOS.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
              No recent alerts
            </div>
          ) : (
            <div>
              {recentSOS.slice(0, 5).map((sos) => (
                <div key={sos._id} style={{ padding: 8, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{sos.user?.firstName && sos.user?.lastName ? `${sos.user.firstName} ${sos.user.lastName}` : 'Unknown'}</span>
                  <span style={{ fontSize: 12, color: sos.status === 'active' ? '#dc2626' : '#10b981' }}>{sos.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health Panel */}
        <div style={{ padding: 16, background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <FaServer style={{ color: '#7c3aed', marginRight: 8 }} />
            <span style={{ fontWeight: 600 }}>System Health</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>API</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {getHealthStatus(systemHealth.api).icon}
                <span style={{ fontSize: 12, color: getHealthStatus(systemHealth.api).color }}>{systemHealth.api}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Database</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {getHealthStatus(systemHealth.db).icon}
                <span style={{ fontSize: 12, color: getHealthStatus(systemHealth.db).color }}>{systemHealth.db}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Socket</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {getHealthStatus(systemHealth.socket).icon}
                <span style={{ fontSize: 12, color: getHealthStatus(systemHealth.socket).color }}>{systemHealth.socket}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Summary */}
      <div className="admin-section-title admin-animate-in-delay-4" style={{ marginTop: 24 }}>
        <FaChartBar /> Operational Summary
      </div>
      <div style={{ padding: 16, background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Trips Today</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{stats?.completedToday || 0} completed</div>
            <div style={{ fontSize: 12, color: '#dc2626' }}>{stats?.cancelledToday || 0} cancelled</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Revenue Today</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>ETB {(stats?.todayRevenue || 0).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#10b981' }}>{stats?.commissionToday || 0} commission</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Driver Activity</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{stats?.onlineDrivers || 0} online</div>
            <div style={{ fontSize: 12, color: '#f59e0b' }}>{stats?.onTripDrivers || 0} on trip</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Passenger Activity</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{stats?.activePassengers || 0} active</div>
            <div style={{ fontSize: 12, color: '#3b82f6' }}>{stats?.newSignupsToday || 0} new today</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-activity-section admin-animate-in-delay-5">
        <div className="admin-section-title">
          <FaClock /> Recent Activity
        </div>
        <div className="admin-activity-list">
          {recentActivity.length === 0 ? (
            <div className="admin-empty" style={{ padding: '24px 16px' }}>
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivity.slice(0, 8).map((activity, i) => (
              <div key={i} className="admin-activity-item">
                <div className="admin-activity-icon" style={{
                  background: activity.type === 'trip' ? 'rgba(37,99,235,0.08)' :
                    activity.type === 'user' ? 'rgba(5,150,105,0.08)' :
                    activity.type === 'sos' ? 'rgba(220,38,38,0.08)' : 'rgba(124,58,237,0.08)',
                  color: activity.type === 'trip' ? '#2563eb' :
                    activity.type === 'user' ? '#059669' :
                    activity.type === 'sos' ? '#dc2626' : '#7c3aed'
                }}>
                  {activity.type === 'trip' ? <FaCar /> :
                   activity.type === 'user' ? <FaUsers /> :
                   activity.type === 'sos' ? <FaExclamationTriangle /> : <FaMoneyBillWave />}
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">
                    {typeof activity.description === 'string' ? activity.description : 
                     typeof activity.message === 'string' ? activity.message : 'Activity'}
                  </div>
                  <div className="admin-activity-time">{activity.time || ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

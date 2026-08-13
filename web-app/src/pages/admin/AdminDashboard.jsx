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
import { adminAPI, sosAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const AdminDashboard = () => {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, sosAlert, clearSosAlert } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
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
    fetchDashboard(true);
  }, []);

  // Refetch + notify when a new SOS alert arrives over the socket
  useEffect(() => {
    if (sosAlert) {
      toast.error(`🚨 NEW SOS ALERT — ${sosAlert.type ? sosAlert.type.replace('_', ' ') : 'Emergency'}`);
      fetchDashboard(false);
      clearSosAlert();
    }
  }, [sosAlert]);

  const fetchDashboard = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
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

  const handleResolveSOS = async (alertId) => {
    try {
      await sosAPI.resolve(alertId);
      setRecentSOS(prev => prev.map(a => a._id === alertId ? { ...a, status: 'resolved' } : a));
      toast.success('SOS alert resolved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve alert');
    }
  };

  const statCards = [
    { key: 'onlineDrivers', icon: <FaCar />, value: stats?.onlineDrivers || 0, color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Online Now' },
    { key: 'activeTrips', icon: <FaRoute />, value: stats?.activeTrips || 0, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'Active Trips' },
    { key: 'todayRevenue', icon: <FaMoneyBillWave />, value: stats?.todayRevenue || 0, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', isCurrency: true, label: "Today's Revenue" },
    { key: 'sosAlerts', icon: <FaShieldAlt />, value: stats?.sosAlerts || 0, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'SOS Alerts' },
    { key: 'completedToday', icon: <FaCheckCircle />, value: stats?.completedToday || 0, color: '#059669', bg: 'rgba(5,150,105,0.08)', label: 'Completed Today' },
    { key: 'pendingApprovals', icon: <FaHourglassHalf />, value: stats?.pendingApprovals || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Pending Approvals' },
  ];

  const quickActions = [
    { icon: <FaMap />, label: 'Live Map', path: '/admin/monitoring', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', priority: 'high' },
    { icon: <FaRoute />, label: 'Active Trips', path: '/admin/trip-management', color: '#2563eb', bg: 'rgba(37,99,235,0.08)', priority: 'high' },
    { icon: <FaShieldAlt />, label: 'SOS Alerts', path: '/admin/sos', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', priority: 'critical' },
    { icon: <FaUserCheck />, label: 'Driver Approvals', path: '/admin/driver-management', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', priority: 'high' },
    { icon: <FaCreditCard />, label: 'Financial Summary', path: '/admin/financials', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', priority: 'medium' },
    { icon: <FaHeadset />, label: 'Support Tickets', path: '/admin/support', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', priority: 'medium' },
  ];

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
          <button className="admin-icon-btn" onClick={() => fetchDashboard(false)}>
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

      {/* Today's Live Metrics */}
      <div
        className="admin-stats-grid admin-animate-in-delay-1"
      >
        {statCards.map((card, index) => (
          <div
            key={card.key}
            className={`admin-stat-card admin-animate-in${index > 0 ? ` admin-animate-in-delay-${Math.min(index, 5)}` : ''}`}
            style={{ borderLeft: `4px solid ${card.color}` }}
          >
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

      {/* Quick Actions */}
      <div className="admin-section-title admin-animate-in-delay-2" style={{ marginTop: 24 }}>
        <FaSearch /> Quick Actions
      </div>
      <div
        className="admin-actions-grid admin-animate-in-delay-2"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
      >
        {quickActions.map((action, i) => (
          <button
            key={i}
            className="admin-action-card"
            onClick={() => navigate(action.path)}
            style={{ position: 'relative' }}
          >
            <div className="admin-action-icon" style={{ background: action.bg, color: action.color }}>
              {action.icon}
            </div>
            <div className="admin-action-label">{action.label}</div>
            <FaArrowRight
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                fontSize: 10,
                color: action.color,
                opacity: 0,
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
              className="admin-action-arrow"
            />
            {action.priority === 'critical' && (
              <span
                className="badge"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: '#dc2626',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                !
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Live Status Panels */}
      <div className="admin-section-title admin-animate-in-delay-3" style={{ marginTop: 24 }}>
        <FaWifi /> Live Status
      </div>
      <div
        className="admin-live-panels-grid admin-animate-in-delay-3"
        style={{
          display: 'grid',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Active Trips Panel */}
        <div
          style={{
            padding: 16,
            background: 'var(--card)',
            borderRadius: 12,
            border: '1px solid var(--border-light)',
            borderTop: '4px solid #3b82f6',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaRoute style={{ color: '#3b82f6', fontSize: 16 }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Active Trips Now</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(59,130,246,0.1)',
                color: '#3b82f6',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              {activeTrips.length}
            </span>
          </div>
          {activeTrips.length === 0 ? (
            <div
              className="admin-empty"
              style={{ padding: '24px 16px' }}
            >
              <FaRoute style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }} />
              <p>No active trips right now</p>
            </div>
          ) : (
            <div>
              {activeTrips.slice(0, 5).map((trip, idx) => (
                <div
                  key={trip._id}
                  style={{
                    padding: '8px 10px',
                    borderBottom: idx < Math.min(activeTrips.length, 5) - 1 ? '1px solid var(--border-light)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))',
                    borderRadius: 4,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {trip.driver?.firstName && trip.driver?.lastName
                      ? `${trip.driver.firstName} ${trip.driver.lastName}`
                      : 'Unknown'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#3b82f6',
                      background: 'rgba(59,130,246,0.08)',
                      padding: '2px 8px',
                      borderRadius: 8,
                    }}
                  >
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Online Drivers Panel */}
        <div
          style={{
            padding: 16,
            background: 'var(--card)',
            borderRadius: 12,
            border: '1px solid var(--border-light)',
            borderTop: '4px solid #10b981',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaCar style={{ color: '#10b981', fontSize: 16 }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Online Drivers</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(16,185,129,0.1)',
                color: '#10b981',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              {onlineDrivers.length}
            </span>
          </div>
          {onlineDrivers.length === 0 ? (
            <div
              className="admin-empty"
              style={{ padding: '24px 16px' }}
            >
              <FaCar style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }} />
              <p>No drivers online</p>
            </div>
          ) : (
            <div>
              {onlineDrivers.slice(0, 5).map((driver, idx) => (
                <div
                  key={driver._id}
                  style={{
                    padding: '8px 10px',
                    borderBottom: idx < Math.min(onlineDrivers.length, 5) - 1 ? '1px solid var(--border-light)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))',
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      {driver.user?.firstName && driver.user?.lastName
                        ? `${driver.user.firstName} ${driver.user.lastName}`
                        : 'Unknown'}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {driver.vehicle?.make && driver.vehicle?.model
                        ? `${driver.vehicle.make} ${driver.vehicle.model}`
                        : driver.vehicle?.type || 'No vehicle'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FaStar style={{ fontSize: 10, color: '#f59e0b' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>
                      {driver.rating ? driver.rating.toFixed(1) : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent SOS Panel */}
        <div
          style={{
            padding: 16,
            background: 'var(--card)',
            borderRadius: 12,
            border: '1px solid var(--border-light)',
            borderTop: '4px solid #dc2626',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaShieldAlt style={{ color: '#dc2626', fontSize: 16 }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Recent SOS Alerts</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(220,38,38,0.1)',
                color: '#dc2626',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              {recentSOS.length}
            </span>
            <span
              onClick={() => navigate('/admin/sos')}
              style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
            >
              View All →
            </span>
          </div>
          {recentSOS.length === 0 ? (
            <div
              className="admin-empty"
              style={{ padding: '24px 16px' }}
            >
              <FaCheckCircle style={{ fontSize: 24, marginBottom: 8, opacity: 0.4, color: '#10b981' }} />
              <p>No recent alerts</p>
            </div>
          ) : (
            <div>
              {recentSOS.slice(0, 5).map((sos, idx) => (
                <div
                  key={sos._id}
                  onClick={() => navigate('/admin/sos')}
                  style={{
                    padding: '10px 10px',
                    borderBottom: idx < Math.min(recentSOS.length, 5) - 1 ? '1px solid var(--border-light)' : 'none',
                    cursor: 'pointer',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))',
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {sos.user?.firstName && sos.user?.lastName
                        ? `${sos.user.firstName} ${sos.user.lastName}`
                        : sos.userName || 'Unknown user'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {sos.type && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(220,38,38,0.1)', color: '#dc2626', padding: '2px 8px', borderRadius: 8, textTransform: 'uppercase' }}>
                          {sos.type.replace('_', ' ')}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: sos.status === 'active' ? '#dc2626' : '#10b981',
                          background: sos.status === 'active' ? 'rgba(220,38,38,0.1)' : 'rgba(16,185,129,0.1)',
                          padding: '2px 8px',
                          borderRadius: 8,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {sos.status}
                      </span>
                      {sos.status === 'active' && (
                        <button
                          className="btn btn-sm"
                          style={{
                            padding: '2px 8px',
                            fontSize: 10,
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                          onClick={(e) => { e.stopPropagation(); handleResolveSOS(sos._id); }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                  {(sos.message || sos.description) && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>
                      💬 {(sos.message || sos.description).length > 70 ? `${(sos.message || sos.description).slice(0, 70)}…` : (sos.message || sos.description)}
                    </div>
                  )}
                  {sos.location && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaMapMarkerAlt style={{ color: '#dc2626' }} />
                      {sos.location.address || `${sos.location.coordinates?.[1]?.toFixed(4)}, ${sos.location.coordinates?.[0]?.toFixed(4)}`}
                      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontStyle: 'italic' }}>view →</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health Panel */}
        <div
          style={{
            padding: 16,
            background: 'var(--card)',
            borderRadius: 12,
            border: '1px solid var(--border-light)',
            borderTop: '4px solid #7c3aed',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaServer style={{ color: '#7c3aed', fontSize: 16 }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>System Health</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'API', key: 'api', icon: <FaServer size={12} /> },
              { name: 'Database', key: 'db', icon: <FaDatabase size={12} /> },
              { name: 'Socket', key: 'socket', icon: <FaWifi size={12} /> },
            ].map((item) => {
              const health = getHealthStatus(systemHealth[item.key]);
              return (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: health.bg,
                    borderRadius: 8,
                    border: `1px solid ${health.color}20`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: health.color,
                        boxShadow: `0 0 6px ${health.color}80`,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {health.icon}
                    <span style={{ fontSize: 12, fontWeight: 600, color: health.color, textTransform: 'capitalize' }}>
                      {systemHealth[item.key]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operational Summary */}
      <div className="admin-section-title admin-animate-in-delay-4" style={{ marginTop: 24 }}>
        <FaChartBar /> Operational Summary
      </div>
      <div
        className="admin-animate-in-delay-4"
        style={{
          padding: 16,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(124,58,237,0.04) 100%)',
          borderRadius: 12,
          border: '1px solid var(--border-light)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Trips Today
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              {stats?.completedToday || 0} completed
            </div>
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
              {stats?.cancelledToday || 0} cancelled
            </div>
            {stats?.completedToday > 0 && (
              <div style={{ marginTop: 6 }}>
                <div
                  style={{
                    height: 4,
                    background: 'var(--border-light)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(((stats?.completedToday || 0) / ((stats?.completedToday || 0) + (stats?.cancelledToday || 0) || 1)) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Revenue Today
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              ETB {(stats?.todayRevenue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>
              {stats?.commissionToday || 0} commission
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Driver Activity
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              {stats?.onlineDrivers || 0} online
            </div>
            <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>
              {stats?.onTripDrivers || 0} on trip
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Passenger Activity
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
              {stats?.activePassengers || 0} active
            </div>
            <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>
              {stats?.newSignupsToday || 0} new today
            </div>
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
              <FaClock style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }} />
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivity.slice(0, 8).map((activity, i) => {
              const getActivityConfig = (type) => {
                switch (type) {
                  case 'trip':
                    return { icon: <FaCar />, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' };
                  case 'user':
                    return { icon: <FaUsers />, color: '#059669', bg: 'rgba(5,150,105,0.08)' };
                  case 'sos':
                    return { icon: <FaExclamationTriangle />, color: '#dc2626', bg: 'rgba(220,38,38,0.08)' };
                  case 'payment':
                    return { icon: <FaMoneyBillWave />, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' };
                  default:
                    return { icon: <FaBell />, color: '#6b7280', bg: 'rgba(107,114,128,0.08)' };
                }
              };

              const config = getActivityConfig(activity.type);

              return (
                <div
                  key={i}
                  className="admin-activity-item"
                  style={{
                    borderBottom: i < Math.min(recentActivity.length, 8) - 1 ? '1px solid var(--border-light)' : 'none',
                  }}
                >
                  <div
                    className="admin-activity-icon"
                    style={{
                      background: config.bg,
                      color: config.color,
                    }}
                  >
                    {config.icon}
                  </div>
                  <div className="admin-activity-info">
                    <div className="admin-activity-text">
                      {typeof activity.description === 'string'
                        ? activity.description
                        : typeof activity.message === 'string'
                        ? activity.message
                        : 'Activity'}
                    </div>
                    <div className="admin-activity-time">{activity.time || ''}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

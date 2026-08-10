import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers, FaCar, FaMoneyBillWave, FaExclamationTriangle, FaShieldAlt,
  FaCreditCard, FaTag, FaChartBar, FaBell, FaSync, FaSearch,
  FaUserShield, FaUserClock, FaUserCheck, FaUserSlash,
  FaArrowRight, FaMapMarkerAlt, FaClock, FaEllipsisH, FaMoon, FaSun, FaGlobe,
  FaCheck, FaRoute, FaHeadset, FaChartLine, FaCog, FaStar
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.dashboard();
      setStats(res.data.stats);
      setRecentActivity(res.data.recentActivity || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { key: 'users', icon: <FaUsers />, value: stats?.totalUsers || 0, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
    { key: 'drivers', icon: <FaCar />, value: stats?.activeDrivers || 0, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { key: 'trips', icon: <FaExclamationTriangle />, value: stats?.totalTrips || 0, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
    { key: 'revenue', label: t('admin.revenue'), icon: <FaMoneyBillWave />, value: stats?.revenue || 0, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', isCurrency: true },
  ];

  const quickActions = [
    { icon: <FaUsers />, label: t('admin.users') || 'Users', path: '/admin/users', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
    { icon: <FaCar />, label: t('admin.drivers') || 'Drivers', path: '/admin/driver-management', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { icon: <FaExclamationTriangle />, label: t('admin.sos') || 'SOS', path: '/admin/safety', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
    { icon: <FaCreditCard />, label: t('admin.payments') || 'Payments', path: '/admin/financials', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  ];

  const roles = [
    { icon: <FaUserCheck />, name: t('admin.admin') || 'Admin', count: (stats?.totalUsers || 0) + ' ' + (t('admin.total') || 'total'), path: '/admin/users', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
    { icon: <FaCar />, name: t('admin.drivers') || 'Drivers', count: (stats?.activeDrivers || 0) + ' ' + (t('admin.active') || 'active'), path: '/admin/driver-management', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { icon: <FaUsers />, name: t('admin.passengers') || 'Passengers', count: (stats?.totalUsers || 0) + ' ' + (t('admin.total') || 'total'), path: '/admin/passenger-management', color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
    { icon: <FaChartBar />, name: t('admin.reports') || 'Reports', count: t('admin.viewReports') || 'View all', path: '/admin/analytics', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
    { icon: <FaTag />, name: t('admin.promos') || 'Promos', count: t('admin.manage') || 'Manage', path: '/admin/content', color: '#0891b2', bg: 'rgba(8,145,178,0.08)' },
  ];

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
          {[1,2,3,4].map(i => <div key={i} className="admin-skeleton" style={{ height: 72 }}></div>)}
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
          <button className="admin-icon-btn">
            <FaBell />
            {(stats?.sosAlerts || 0) > 0 && (
              <span className="badge">{stats.sosAlerts}</span>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid admin-animate-in-delay-1">
        {statCards.map((card) => (
          <div key={card.key} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div>
              <div className="admin-stat-value">
                {card.isCurrency ? `ETB ${(card.value || 0).toLocaleString()}` : (card.value || 0).toLocaleString()}
              </div>
              <div className="admin-stat-label">{card.label || t(`admin.${card.key}`) || card.key}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="admin-section-title admin-animate-in-delay-2">
        <FaSearch /> {t('admin.quickActions') || 'Quick Actions'}
      </div>
      <div className="admin-actions-grid admin-animate-in-delay-2">
        {quickActions.map((action, i) => (
          <button key={i} className="admin-action-card" onClick={() => navigate(action.path)}>
            <div className="admin-action-icon" style={{ background: action.bg, color: action.color }}>
              {action.icon}
            </div>
            <div className="admin-action-label">{action.label}</div>
          </button>
        ))}
      </div>

      {/* All Admin Roles */}
      <div className="admin-roles-section admin-animate-in-delay-3">
        <div className="admin-section-title">
          <FaUserShield /> {t('admin.allRoles') || 'All Roles'}
        </div>
        <div className="admin-roles-grid">
          {roles.map((role, i) => (
            <button key={i} className="admin-role-card" onClick={() => navigate(role.path)}>
              <div className="admin-role-icon" style={{ background: role.bg, color: role.color }}>
                {role.icon}
              </div>
              <div className="admin-role-info">
                <div className="admin-role-name">{role.name}</div>
                <div className="admin-role-count">{role.count}</div>
              </div>
              <div className="admin-role-arrow"><FaArrowRight /></div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-activity-section admin-animate-in-delay-4">
        <div className="admin-section-title">
          <FaClock /> {t('admin.recentActivity') || 'Recent Activity'}
        </div>
        <div className="admin-activity-list">
          {recentActivity.length === 0 ? (
            <div className="admin-empty" style={{ padding: '24px 16px' }}>
              <p>{t('admin.noActivity') || 'No recent activity'}</p>
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
                  <div className="admin-activity-text">{activity.description || activity.message}</div>
                  <div className="admin-activity-time">{activity.time || ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* More Actions */}
      <div className="admin-section-title" style={{ marginTop: 8 }}>
        <FaEllipsisH /> {t('admin.moreActions') || 'More'}
      </div>
      <div className="admin-actions-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <button className="admin-action-card" onClick={() => navigate('/admin/trips')}>
          <div className="admin-action-icon" style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706' }}>
            <FaCar />
          </div>
          <div className="admin-action-label">{t('admin.trips') || 'Trips'}</div>
        </button>
        <button className="admin-action-card" onClick={() => navigate('/admin/tariffs')}>
          <div className="admin-action-icon" style={{ background: 'rgba(8,145,178,0.08)', color: '#0891b2' }}>
            <FaTag />
          </div>
          <div className="admin-action-label">{t('admin.tariffs') || 'Tariffs'}</div>
        </button>
        <button className="admin-action-card" onClick={() => navigate('/admin/promos')}>
          <div className="admin-action-icon" style={{ background: 'rgba(236,72,153,0.08)', color: '#ec4899' }}>
            <FaTag />
          </div>
          <div className="admin-action-label">{t('admin.promos') || 'Promos'}</div>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;

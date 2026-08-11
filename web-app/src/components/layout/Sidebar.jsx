import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaTachometerAlt, FaUsers, FaCar, FaMoneyBillWave,
  FaExclamationTriangle, FaFileAlt, FaCog, FaSignOutAlt, FaTimes,
  FaMapMarkerAlt, FaRoute, FaShieldAlt, FaHeadset, FaChartLine, FaBell,
  FaBolt, FaTag, FaHome, FaUser, FaChevronLeft, FaChevronRight,
  FaSiren, FaNewspaper, FaWrench, FaChartBar, FaChartPie,
  FaUserShield, FaUserTie, FaUserGraduate, FaCarSide, FaCarCrash,
  FaBullseye, FaFlag, FaGlobe, FaCheckCircle, FaDatabase,
  FaTools, FaServer, FaLock, FaPalette
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import './Sidebar.css';

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  const navGroups = [
    {
      id: 'overview',
      label: t('admin.overview') || 'Overview',
      color: '#2563eb',
      items: [
        { path: '/admin', icon: <FaTachometerAlt />, label: t('admin.dashboard'), end: true, badge: null },
        { path: '/admin/monitoring', icon: <FaMapMarkerAlt />, label: t('admin.realTimeMonitoring'), badge: null },
      ]
    },
    {
      id: 'operations',
      label: t('admin.operations') || 'Operations',
      color: '#059669',
      items: [
        { path: '/admin/driver-management', icon: <FaCarSide />, label: t('admin.driverManagement'), badge: null },
        { path: '/admin/passenger-management', icon: <FaUsers />, label: t('admin.passengerManagement'), badge: null },
        { path: '/admin/trip-management', icon: <FaRoute />, label: t('admin.tripManagement'), badge: null },
      ]
    },
    {
      id: 'finance',
      label: t('admin.finance') || 'Finance',
      color: '#d97706',
      items: [
        { path: '/admin/financials', icon: <FaMoneyBillWave />, label: t('admin.financialManagement'), badge: null },
      ]
    },
    {
      id: 'safety',
      label: t('admin.safetyLabel') || 'Safety & Response',
      color: '#dc2626',
      items: [
        { path: '/admin/safety', icon: <FaShieldAlt />, label: t('admin.safetySecurity'), badge: null },
        { path: '/admin/support', icon: <FaHeadset />, label: t('admin.supportSystem'), badge: null },
      ]
    },
    {
      id: 'insights',
      label: t('admin.insights') || 'Insights',
      color: '#7c3aed',
      items: [
        { path: '/admin/analytics', icon: <FaChartLine />, label: t('admin.analyticsReporting'), badge: null },
      ]
    },
    {
      id: 'system',
      label: t('admin.system') || 'System',
      color: '#6366f1',
      items: [
        { path: '/admin/content', icon: <FaNewspaper />, label: t('admin.contentNotifications'), badge: null },
        { path: '/admin/configuration', icon: <FaWrench />, label: t('admin.systemConfiguration'), badge: null },
      ]
    },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getTotalLinks = () => navGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo-wrapper">
              <img src="/logo.svg?v=2" alt="DIRS" className="sidebar-logo" />
              <span className="sidebar-logo-ring" />
            </div>
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">DIRS</span>
                <span className="sidebar-brand-sub">Dire Dawa Admin</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <FaTimes />
          </button>
        </div>

        {/* User */}
        <div className="sidebar-user-section">
          <div className="sidebar-avatar-wrapper">
            <div className="sidebar-avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="sidebar-status-dot" />
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="sidebar-user-role">{t('admin.admin') || 'Super Admin'}</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.id} className="sidebar-group">
              {!isCollapsed && (
                <div className="sidebar-group-label">
                  <span className="sidebar-group-dot" style={{ background: group.color }} />
                  {group.label}
                </div>
              )}
              {isCollapsed && <div className="sidebar-group-divider" />}
              {group.items.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  style={{ '--group-color': group.color }}
                  onClick={() => {
                    if (window.innerWidth < 768) onClose();
                  }}
                  title={isCollapsed ? link.label : undefined}
                >
                  <span className="sidebar-link-icon">{link.icon}</span>
                  {!isCollapsed && (
                    <span className="sidebar-link-text">{link.label}</span>
                  )}
                  {!isCollapsed && link.badge != null && (
                    <span className="sidebar-link-badge">{link.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="sidebar-stats">
            <div className="sidebar-stat">
              <span className="sidebar-stat-value">12</span>
              <span className="sidebar-stat-label">Active Drivers</span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-value">8</span>
              <span className="sidebar-stat-label">Live Trips</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={logout} title={isCollapsed ? "Logout" : undefined}>
            <FaSignOutAlt />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
          {!isCollapsed && (
            <div className="sidebar-version">DIRS v1.0</div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaTachometerAlt, FaUsers, FaCar, FaMoneyBillWave,
  FaExclamationTriangle, FaFileAlt, FaCog, FaSignOutAlt, FaTimes,
  FaMapMarkerAlt, FaRoute, FaShieldAlt, FaHeadset, FaChartLine, FaBell,
  FaBolt, FaTag, FaHome, FaUser
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import './Sidebar.css';

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const adminLinks = [
    { path: '/admin', icon: <FaHome />, label: t('admin.dashboard'), end: true },
    { path: '/admin/monitoring', icon: <FaMapMarkerAlt />, label: t('admin.realTimeMonitoring') },
    { path: '/admin/driver-management', icon: <FaCar />, label: t('admin.driverManagement') },
    { path: '/admin/passenger-management', icon: <FaUsers />, label: t('admin.passengerManagement') },
    { path: '/admin/trip-management', icon: <FaRoute />, label: t('admin.tripManagement') },
    { path: '/admin/financials', icon: <FaMoneyBillWave />, label: t('admin.financialManagement') },
    { path: '/admin/safety', icon: <FaShieldAlt />, label: t('admin.safetySecurity') },
    { path: '/admin/support', icon: <FaHeadset />, label: t('admin.supportSystem') },
    { path: '/admin/analytics', icon: <FaChartLine />, label: t('admin.analyticsReporting') },
    { path: '/admin/content', icon: <FaBell />, label: t('admin.contentNotifications') },
    { path: '/admin/configuration', icon: <FaCog />, label: t('admin.systemConfiguration') },
  ];

  const links = adminLinks;

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.svg?v=2" alt="DIRS" className="sidebar-logo" />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">DIRS Admin</span>
              <span className="sidebar-brand-role">{t('admin.adminPanel')}</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <FaTimes />
          </button>
        </div>

        <div className="sidebar-user-section">
          <div className="sidebar-avatar">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
            <div className="sidebar-user-role">{t('admin.superAdmin')}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Navigation</div>
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span className="sidebar-link-text">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={logout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

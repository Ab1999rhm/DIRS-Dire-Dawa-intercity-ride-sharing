import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaTachometerAlt, FaUsers, FaCar, FaMoneyBillWave, FaExclamationTriangle,
  FaFileAlt, FaCog, FaSignOutAlt, FaHistory, FaWallet, FaStar, FaUser,
  FaTag, FaBolt, FaMapMarkerAlt, FaRoute, FaShieldAlt, FaHeadset, FaChartLine, FaBell
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import './Sidebar.css';

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const passengerLinks = [
    { path: '/passenger', icon: <FaCar />, label: 'Book Ride', end: true },
    { path: '/passenger/trips', icon: <FaHistory />, label: 'My Trips' },
    { path: '/passenger/history', icon: <FaHistory />, label: 'History' },
    { path: '/passenger/favorites', icon: <FaStar />, label: 'Favorites' },
    { path: '/passenger/profile', icon: <FaUser />, label: 'Profile' },
  ];

  const driverLinks = [
    { path: '/driver', icon: <FaTachometerAlt />, label: 'Dashboard', end: true },
    { path: '/driver/trips', icon: <FaHistory />, label: 'My Trips' },
    { path: '/driver/earnings', icon: <FaWallet />, label: 'Earnings' },
    { path: '/driver/vehicle', icon: <FaCar />, label: 'Vehicle' },
    { path: '/driver/profile', icon: <FaUser />, label: 'Profile' },
  ];

  const adminLinks = [
    { path: '/admin', icon: <FaTachometerAlt />, label: t('admin.dashboard'), end: true },
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

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'driver' ? driverLinks : passengerLinks;

  return (
    <>
      <div className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`} onClick={onClose}></div>
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="sidebar-user-info">
            <h4>{user?.firstName} {user?.lastName}</h4>
            <span className="sidebar-role">{user?.role}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;

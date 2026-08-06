import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaTachometerAlt, FaUsers, FaCar, FaMoneyBillWave, FaExclamationTriangle,
  FaFileAlt, FaCog, FaSignOutAlt, FaHistory, FaWallet, FaStar, FaUser,
  FaTag, FaBolt
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuth();
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
    { path: '/admin', icon: <FaTachometerAlt />, label: 'Dashboard', end: true },
    { path: '/admin/users', icon: <FaUsers />, label: 'Users' },
    { path: '/admin/drivers', icon: <FaCar />, label: 'Drivers' },
    { path: '/admin/trips', icon: <FaHistory />, label: 'Trips' },
    { path: '/admin/payments', icon: <FaMoneyBillWave />, label: 'Payments' },
    { path: '/admin/sos', icon: <FaExclamationTriangle />, label: 'SOS Alerts' },
    { path: '/admin/tariffs', icon: <FaBolt />, label: 'Tariff Manager' },
    { path: '/admin/promos', icon: <FaTag />, label: 'Promo Codes' },
    { path: '/admin/reports', icon: <FaFileAlt />, label: 'Reports' },
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

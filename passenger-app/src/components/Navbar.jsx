import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaHistory, FaStar, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: <FaHome /> },
    { path: '/history', label: 'Trips', icon: <FaHistory /> },
    { path: '/sos', label: 'SOS', icon: <FaExclamationTriangle className="sos-nav-icon" /> },
    { path: '/favorites', label: 'Saved', icon: <FaStar /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> }
  ];

  return (
    <nav className="bottom-navbar">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navbar;

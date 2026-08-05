import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { FaBell, FaGlobe, FaBars, FaTimes, FaUser, FaCar, FaShieldAlt, FaSun, FaMoon } from 'react-icons/fa';
import './Navbar.css';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout, unreadCount } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
    onMenuToggle?.(!menuOpen);
  };

  const handleProfileClick = () => {
    const role = user?.role;
    if (role === 'driver') navigate('/driver/profile');
    else if (role === 'admin') navigate('/admin/users');
    else navigate('/passenger/profile');
  };

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  const getNavItems = () => {
    if (user?.role === 'driver') {
      return [
        { path: '/driver', label: 'Dashboard', icon: <FaCar /> },
        { path: '/driver/trips', label: 'My Trips', icon: <FaCar /> },
        { path: '/driver/earnings', label: 'Earnings', icon: <FaCar /> },
      ];
    }
    if (user?.role === 'admin') {
      return [
        { path: '/admin', label: 'Dashboard', icon: <FaShieldAlt /> },
        { path: '/admin/users', label: 'Users', icon: <FaUser /> },
        { path: '/admin/drivers', label: 'Drivers', icon: <FaCar /> },
      ];
    }
    return [
      { path: '/passenger', label: 'Home', icon: <FaCar /> },
      { path: '/passenger/trips', label: 'My Trips', icon: <FaCar /> },
      { path: '/passenger/history', label: 'History', icon: <FaCar /> },
    ];
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button className="nav-toggle" onClick={handleMenuToggle}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="logo-text">DIRS</span>
        </Link>

        <div className="navbar-menu hide-mobile">
          {getNavItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="nav-icon-btn" onClick={handleLanguageToggle} title={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}>
            <FaGlobe />
            <span className="lang-label">{language === 'en' ? 'EN' : 'አማ'}</span>
          </button>
          <button className="nav-icon-btn" onClick={toggleTheme} title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}>
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>
          <button className="nav-icon-btn">
            <FaBell />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <div className="nav-user" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            <div className="nav-avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="nav-user-name hide-mobile">{user?.firstName}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

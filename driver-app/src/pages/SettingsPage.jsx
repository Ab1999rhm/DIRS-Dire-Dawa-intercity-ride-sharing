import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaArrowLeft, FaGlobe, FaBell, FaBellSlash, FaMapMarkerAlt, FaMoon, FaSun, FaSignOutAlt } from 'react-icons/fa';
import './Pages.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('driverNotificationsEnabled') !== 'false'
  );
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('driverSoundEnabled') !== 'false'
  );
  const [locationSharing, setLocationSharing] = useState(
    localStorage.getItem('driverLocationSharing') !== 'false'
  );

  const handleNotificationToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('driverNotificationsEnabled', newValue);
  };

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('driverSoundEnabled', newValue);
  };

  const handleLocationToggle = () => {
    const newValue = !locationSharing;
    setLocationSharing(newValue);
    localStorage.setItem('driverLocationSharing', newValue);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <h2>Settings</h2>
        <span className="spacer" />
      </header>

      <div className="settings-content">
        {/* Language */}
        <div className="settings-section">
          <h3 className="settings-section-title"><FaGlobe /> Language</h3>
          <div className="settings-option">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="settings-select"
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <h3 className="settings-section-title"><FaBell /> Notifications</h3>
          <div className="settings-toggle-row" onClick={handleNotificationToggle}>
            <span className="settings-label">Push Notifications</span>
            <div className={`toggle-switch ${notificationsEnabled ? 'on' : 'off'}`}>
              <div className="toggle-thumb" />
            </div>
          </div>
          <div className="settings-toggle-row" onClick={handleSoundToggle}>
            <span className="settings-label">Ride Request Sound</span>
            <div className={`toggle-switch ${soundEnabled ? 'on' : 'off'}`}>
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="settings-section">
          <h3 className="settings-section-title"><FaMapMarkerAlt /> Privacy</h3>
          <div className="settings-toggle-row" onClick={handleLocationToggle}>
            <span className="settings-label">Location Sharing</span>
            <div className={`toggle-switch ${locationSharing ? 'on' : 'off'}`}>
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="settings-section">
          <h3 className="settings-section-title">Quick Links</h3>
          <button className="settings-link" onClick={() => navigate('/help')}>
            Help Center & FAQ
          </button>
          <button className="settings-link" onClick={() => navigate('/support')}>
            Contact Support
          </button>
          <button className="settings-link" onClick={() => navigate('/documents')}>
            Manage Documents
          </button>
        </div>

        {/* Account */}
        <div className="settings-section">
          <button className="btn-logout-settings" onClick={handleLogout}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

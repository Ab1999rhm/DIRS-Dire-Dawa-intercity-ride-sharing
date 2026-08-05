import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Card, Button, Input, Modal } from '../../components/common';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaCar, FaFileAlt, FaCog, FaGlobe, FaBell, FaClock, FaSignOutAlt, FaCheck, FaTimes, FaIdCard, FaShieldAlt } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import './Driver.css';

const DriverProfile = () => {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { user, setUser, logout, driverProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });

  const [documents, setDocuments] = useState({
    license: driverProfile?.documents?.license || null,
    insurance: driverProfile?.documents?.insurance || null,
    registration: driverProfile?.documents?.registration || null
  });

  const [settings, setSettings] = useState({
    notifications: driverProfile?.settings?.notifications ?? true,
    availabilityStart: driverProfile?.settings?.availabilityStart || '08:00',
    availabilityEnd: driverProfile?.settings?.availabilityEnd || '18:00'
  });

  const toast = useToast();

  const tabs = [
    { id: 'info', label: t('profile.personalInfo'), icon: <FaUser /> },
    { id: 'documents', label: t('profile.documents'), icon: <FaFileAlt /> },
    { id: 'settings', label: t('profile.settings'), icon: <FaCog /> }
  ];

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await authAPI.updateProfile(formData);
      setUser(res.data.user);
      setSuccess(t('profile.updateSuccess'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.updateProfile({ settings });
      setSuccess(t('profile.settingsUpdated'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
  };

  return (
    <div className="driver-page">
      <h1 className="page-title">{t('profile.title')}</h1>

      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <Card className="profile-header-card" padding="lg">
        <div className="profile-avatar">
          <FaUser size={32} />
        </div>
        <h2>{user?.firstName} {user?.lastName}</h2>
        <p>{user?.email || user?.phoneNumber}</p>
        <span className={`status-badge ${user?.status}`}>{user?.status}</span>
      </Card>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <Card padding="lg">
          <h2 className="section-title">{t('profile.personalInfo')}</h2>
          <form onSubmit={handleProfileUpdate}>
            <div className="form-grid">
              <Input
                label={t('auth.firstName')}
                name="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                icon={<FaUser />}
                required
              />
              <Input
                label={t('auth.lastName')}
                name="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                icon={<FaUser />}
                required
              />
              <Input
                label={t('auth.email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<FaEnvelope />}
              />
              <Input
                label={t('auth.phoneNumber')}
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                icon={<FaPhone />}
                disabled
              />
            </div>
            <div className="form-actions">
              <Button type="submit" loading={loading} icon={<FaCheck />}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card padding="lg">
          <h2 className="section-title">{t('profile.documents')}</h2>
          <div className="documents-list">
            <div className="document-item">
              <FaIdCard className="doc-icon" />
              <div className="doc-info">
                <h4>{t('profile.drivingLicense')}</h4>
                <p>{documents.license ? t('profile.uploaded') : t('profile.notUploaded')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toast.info('Document upload coming soon')}>
                {documents.license ? t('profile.view') : t('profile.upload')}
              </Button>
            </div>
            <div className="document-item">
              <FaShieldAlt className="doc-icon" />
              <div className="doc-info">
                <h4>{t('profile.insurance')}</h4>
                <p>{documents.insurance ? t('profile.uploaded') : t('profile.notUploaded')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toast.info('Document upload coming soon')}>
                {documents.insurance ? t('profile.view') : t('profile.upload')}
              </Button>
            </div>
            <div className="document-item">
              <FaCar className="doc-icon" />
              <div className="doc-info">
                <h4>{t('profile.vehicleRegistration')}</h4>
                <p>{documents.registration ? t('profile.uploaded') : t('profile.notUploaded')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toast.info('Document upload coming soon')}>
                {documents.registration ? t('profile.view') : t('profile.upload')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <div className="settings-section">
          <Card padding="lg">
            <h2 className="section-title">{t('profile.language')}</h2>
            <div className="language-options">
              {availableLanguages.map(lang => (
                <button
                  key={lang.code}
                  className={`language-option ${language === lang.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <FaGlobe />
                  <span>{lang.name}</span>
                  {language === lang.code && <FaCheck />}
                </button>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="section-title">{t('profile.notifications')}</h2>
            <div className="setting-item">
              <div className="setting-info">
                <FaBell />
                <span>{t('profile.pushNotifications')}</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="section-title">{t('profile.availability')}</h2>
            <div className="availability-times">
              <div className="time-input">
                <label>{t('profile.startTime')}</label>
                <input
                  type="time"
                  value={settings.availabilityStart}
                  onChange={(e) => setSettings({ ...settings, availabilityStart: e.target.value })}
                />
              </div>
              <div className="time-input">
                <label>{t('profile.endTime')}</label>
                <input
                  type="time"
                  value={settings.availabilityEnd}
                  onChange={(e) => setSettings({ ...settings, availabilityEnd: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleSettingsUpdate} loading={loading} icon={<FaCheck />}>
              {t('common.save')}
            </Button>
          </Card>

          <Card padding="lg" className="logout-card">
            <Button
              variant="danger"
              fullWidth
              onClick={() => setShowLogoutModal(true)}
              icon={<FaSignOutAlt />}
            >
              {t('auth.logout')}
            </Button>
          </Card>
        </div>
      )}

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title={t('auth.logoutConfirm')}
      >
        <p>{t('auth.logoutMessage')}</p>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            {t('auth.logout')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DriverProfile;

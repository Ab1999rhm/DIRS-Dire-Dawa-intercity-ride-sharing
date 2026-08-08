import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI, documentsAPI } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';
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
    licensePhoto: driverProfile?.licensePhoto || null,
    licenseNumber: driverProfile?.licenseNumber || '',
    licenseExpiry: driverProfile?.licenseExpiry || '',
    nationalIdPhoto: driverProfile?.nationalIdPhoto || null,
    nationalId: driverProfile?.nationalId || '',
    verificationStatus: driverProfile?.verificationStatus || 'pending',
    rejectionReason: driverProfile?.rejectionReason || null,
    vehiclePhoto: null,
    registrationPhoto: null,
    insurancePhoto: null,
    insuranceExpiry: '',
    registrationExpiry: ''
  });
  const fileInputRef = { licensePhoto: useRef(null), nationalIdPhoto: useRef(null), vehiclePhoto: useRef(null), registrationPhoto: useRef(null), insurancePhoto: useRef(null) };
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const [settings, setSettings] = useState({
    notifications: driverProfile?.settings?.notifications ?? true,
    availabilityStart: driverProfile?.settings?.availabilityStart || '08:00',
    availabilityEnd: driverProfile?.settings?.availabilityEnd || '18:00'
  });

  const toast = useToast();

  useEffect(() => {
    documentsAPI.get().then(res => {
      if (res.data) {
        setDocuments(prev => ({
          ...prev,
          licensePhoto: res.data.driver?.licensePhoto || null,
          licenseNumber: res.data.driver?.licenseNumber || '',
          licenseExpiry: res.data.driver?.licenseExpiry || '',
          nationalIdPhoto: res.data.driver?.nationalIdPhoto || null,
          nationalId: res.data.driver?.nationalId || '',
          verificationStatus: res.data.driver?.verificationStatus || 'pending',
          rejectionReason: res.data.driver?.rejectionReason || null,
          vehiclePhoto: res.data.vehicle?.vehiclePhoto || null,
          registrationPhoto: res.data.vehicle?.registrationPhoto || null,
          insurancePhoto: res.data.vehicle?.insurancePhoto || null,
          insuranceExpiry: res.data.vehicle?.insuranceExpiry || '',
          registrationExpiry: res.data.vehicle?.registrationExpiry || ''
        }));
      }
    }).catch(() => {});
  }, []);

  const handleDocUpload = async (docKey, isDriverDoc) => {
    const file = fileInputRef[docKey]?.current?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    try {
      setUploadingDoc(docKey);
      const url = await uploadToCloudinary(file, 'dirs-documents');
      const urlField = docKey + 'Url';
      if (isDriverDoc) {
        await documentsAPI.uploadDriver({ [urlField]: url });
      } else {
        await documentsAPI.uploadVehicle({ [urlField]: url });
      }
      setDocuments(prev => ({ ...prev, [docKey]: url }));
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDocTextUpdate = async (fields) => {
    try {
      setLoading(true);
      await documentsAPI.uploadDriver(fields);
      setDocuments(prev => ({ ...prev, ...fields }));
      setSuccess('Document info updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="documents-section">
          {documents.verificationStatus && (
            <Card padding="lg">
              <div className="verification-status">
                <h3>Verification Status</h3>
                <span className={`status-badge ${documents.verificationStatus}`}>
                  {documents.verificationStatus}
                </span>
                {documents.rejectionReason && (
                  <p className="rejection-reason">Reason: {documents.rejectionReason}</p>
                )}
              </div>
            </Card>
          )}

          <Card padding="lg">
            <h2 className="section-title"><FaIdCard /> Driving License</h2>
            <div className="document-upload-area">
              <input type="file" accept="image/*" ref={fileInputRef.licensePhoto} style={{ display: 'none' }}
                onChange={() => handleDocUpload('licensePhoto', true)} />
              {documents.licensePhoto ? (
                <div className="doc-preview">
                  <img src={documents.licensePhoto} alt="License" style={{ maxHeight: 120, borderRadius: 8 }} />
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.licensePhoto.current?.click()}>
                    Replace
                  </Button>
                </div>
              ) : (
                <button className="doc-upload-btn" onClick={() => fileInputRef.licensePhoto.current?.click()}>
                  <FaIdCard size={24} />
                  <span>{uploadingDoc === 'licensePhoto' ? 'Uploading...' : 'Upload License Photo'}</span>
                </button>
              )}
            </div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <Input label="License Number" value={documents.licenseNumber}
                onChange={(e) => setDocuments({ ...documents, licenseNumber: e.target.value })}
                onBlur={() => handleDocTextUpdate({ licenseNumber: documents.licenseNumber })} />
              <Input label="Expiry Date" type="date" value={documents.licenseExpiry ? documents.licenseExpiry.slice(0,10) : ''}
                onChange={(e) => setDocuments({ ...documents, licenseExpiry: e.target.value })}
                onBlur={() => handleDocTextUpdate({ licenseExpiry: documents.licenseExpiry })} />
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="section-title"><FaShieldAlt /> National ID</h2>
            <div className="document-upload-area">
              <input type="file" accept="image/*" ref={fileInputRef.nationalIdPhoto} style={{ display: 'none' }}
                onChange={() => handleDocUpload('nationalIdPhoto', true)} />
              {documents.nationalIdPhoto ? (
                <div className="doc-preview">
                  <img src={documents.nationalIdPhoto} alt="National ID" style={{ maxHeight: 120, borderRadius: 8 }} />
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.nationalIdPhoto.current?.click()}>
                    Replace
                  </Button>
                </div>
              ) : (
                <button className="doc-upload-btn" onClick={() => fileInputRef.nationalIdPhoto.current?.click()}>
                  <FaShieldAlt size={24} />
                  <span>{uploadingDoc === 'nationalIdPhoto' ? 'Uploading...' : 'Upload National ID'}</span>
                </button>
              )}
            </div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <Input label="National ID Number" value={documents.nationalId}
                onChange={(e) => setDocuments({ ...documents, nationalId: e.target.value })}
                onBlur={() => handleDocTextUpdate({ nationalId: documents.nationalId })} />
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="section-title"><FaCar /> Vehicle Documents</h2>
            <div className="document-upload-grid">
              {[
                { key: 'vehiclePhoto', label: 'Vehicle Photo', icon: <FaCar /> },
                { key: 'registrationPhoto', label: 'Registration', icon: <FaFileAlt /> },
                { key: 'insurancePhoto', label: 'Insurance', icon: <FaShieldAlt /> }
              ].map(doc => (
                <div key={doc.key} className="document-upload-item">
                  <input type="file" accept="image/*" ref={fileInputRef[doc.key]} style={{ display: 'none' }}
                    onChange={() => handleDocUpload(doc.key, false)} />
                  {documents[doc.key] ? (
                    <div className="doc-preview small">
                      <img src={documents[doc.key]} alt={doc.label} style={{ maxHeight: 80, borderRadius: 6 }} />
                    </div>
                  ) : (
                    <button className="doc-upload-btn small" onClick={() => fileInputRef[doc.key].current?.click()}>
                      {doc.icon}
                      <span>{uploadingDoc === doc.key ? '...' : doc.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
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

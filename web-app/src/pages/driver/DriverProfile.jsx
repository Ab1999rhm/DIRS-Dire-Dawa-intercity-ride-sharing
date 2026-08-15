import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI, documentsAPI, paymentsAPI } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';
import { Card, Button, Input, Modal } from '../../components/common';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaCar, FaFileAlt, FaCog, FaGlobe, FaBell, FaClock, FaSignOutAlt, FaCheck, FaTimes, FaIdCard, FaShieldAlt, FaWallet, FaMobileAlt, FaCreditCard, FaUpload, FaSpinner, FaTrashAlt } from 'react-icons/fa';
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

  const [withdrawAccounts, setWithdrawAccounts] = useState(user?.withdrawalAccounts || (user?.withdrawalAccount ? [{ ...user.withdrawalAccount, isDefault: true }] : []));
  const [newMethod, setNewMethod] = useState('telebirr');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBankCode, setNewBankCode] = useState('');
  const [banks, setBanks] = useState([]);
  const [savingPayment, setSavingPayment] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);

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
    paymentsAPI.getBanks().then(res => setBanks(res.data?.banks || [])).catch(() => {});
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
    { id: 'payment', label: t('profile.withdrawalAccount') || 'Payment', icon: <FaWallet /> },
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

  const handleAddAccount = async () => {
    if (!newAccountName || !newAccountNumber) {
      toast.error('Enter account name and number');
      return;
    }
    if (newMethod === 'bank' && !newBankCode) {
      toast.error('Select a bank');
      return;
    }
    if (withdrawAccounts.length >= 3) {
      toast.error(t('profile.maxAccounts') || 'Max 3 accounts');
      return;
    }
    const newAccount = { method: newMethod, accountName: newAccountName, accountNumber: newAccountNumber, bankCode: newBankCode, isDefault: withdrawAccounts.length === 0 };
    const updated = [...withdrawAccounts, newAccount];
    setSavingPayment(true);
    try {
      await authAPI.updateProfile({ withdrawalAccounts: updated });
      setWithdrawAccounts(updated);
      setNewAccountName('');
      setNewAccountNumber('');
      setNewBankCode('');
      setNewMethod('telebirr');
      setEditingIndex(-1);
      toast.success(t('profile.accountSaved') || 'Account saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleRemoveAccount = async (index) => {
    const updated = withdrawAccounts.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setSavingPayment(true);
    try {
      await authAPI.updateProfile({ withdrawalAccounts: updated });
      setWithdrawAccounts(updated);
      toast.success(t('profile.accountRemoved') || 'Account removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSetDefault = async (index) => {
    const updated = withdrawAccounts.map((a, i) => ({ ...a, isDefault: i === index }));
    setSavingPayment(true);
    try {
      await authAPI.updateProfile({ withdrawalAccounts: updated });
      setWithdrawAccounts(updated);
      toast.success(t('profile.accountUpdated') || 'Default updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSavingPayment(false);
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

      {activeTab === 'payment' && (
        <div className="settings-section">
          <Card padding="lg">
            <h2 className="section-title"><FaWallet /> {t('profile.withdrawalAccount')}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {t('profile.withdrawalAccountDesc')}
            </p>

            {withdrawAccounts.length === 0 ? (
              <div className="payment-empty">
                <FaWallet size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontWeight: 600 }}>{t('profile.noAccounts')}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('profile.noAccountsDesc')}</p>
              </div>
            ) : (
              <div className="payment-accounts-list">
                {withdrawAccounts.map((acc, idx) => (
                  <div key={idx} className={`payment-account-card ${acc.isDefault ? 'default' : ''}`}>
                    <div className="payment-account-info">
                      <div className="payment-account-method-icon">
                        {acc.method === 'telebirr' ? <FaMobileAlt /> : acc.method === 'cbe_birr' ? <FaMobileAlt /> : <FaCreditCard />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{acc.accountName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {acc.method === 'telebirr' ? 'Telebirr' : acc.method === 'cbe_birr' ? 'CBE Birr' : 'Bank'}: {acc.accountNumber}
                        </div>
                      </div>
                    </div>
                    <div className="payment-account-actions">
                      {acc.isDefault ? (
                        <span className="payment-default-badge">{t('profile.defaultAccount')}</span>
                      ) : (
                        <button className="payment-action-btn" onClick={() => handleSetDefault(idx)} disabled={savingPayment}>
                          {t('profile.setAsDefault')}
                        </button>
                      )}
                      <button className="payment-action-btn remove" onClick={() => handleRemoveAccount(idx)} disabled={savingPayment}>
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {withdrawAccounts.length < 3 && (
              <div className="payment-add-section">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 20 }}>{t('profile.addAccount')}</h3>

                <div className="driver-method-grid" style={{ marginBottom: 16 }}>
                  {[
                    { id: 'telebirr', icon: <FaMobileAlt />, label: 'Telebirr' },
                    { id: 'cbe_birr', icon: <FaMobileAlt />, label: 'CBE Birr' },
                    { id: 'bank', icon: <FaCreditCard />, label: 'Bank' },
                  ].map(m => (
                    <div
                      key={m.id}
                      className={`driver-method-option ${newMethod === m.id ? 'selected' : ''}`}
                      onClick={() => setNewMethod(m.id)}
                    >
                      <div className="driver-method-icon">{m.icon}</div>
                      <span className="driver-method-label">{m.label}</span>
                    </div>
                  ))}
                </div>

                <div className="form-grid">
                  <Input
                    label="Account Holder Name"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Full name'}
                    icon={<FaUser />}
                  />
                  <Input
                    label={newMethod === 'bank' ? 'Account Number' : 'Phone Number'}
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    placeholder={newMethod === 'bank' ? 'Account number' : '09...'}
                    icon={<FaPhone />}
                  />
                </div>

                {newMethod === 'bank' && (
                  <div className="form-grid" style={{ marginTop: 12 }}>
                    <div className="input-group">
                      <label>Bank</label>
                      <select
                        style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', borderRadius: 8, background: 'var(--card)' }}
                        value={newBankCode}
                        onChange={(e) => setNewBankCode(e.target.value)}
                      >
                        <option value="">Select bank</option>
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <Button onClick={handleAddAccount} loading={savingPayment} icon={<FaCheck />} style={{ marginTop: 16 }}>
                  {t('profile.saveWithdrawAccount')}
                </Button>
              </div>
            )}
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

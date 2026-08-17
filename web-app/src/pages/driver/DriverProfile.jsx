import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI, documentsAPI, paymentsAPI } from '../../services/api';
import { placesAPI } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';
import { Card, Button, Input, Modal } from '../../components/common';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaCar, FaFileAlt, FaCog, FaGlobe, FaBell, FaClock, FaSignOutAlt, FaCheck, FaTimes, FaIdCard, FaShieldAlt, FaWallet, FaMobileAlt, FaCreditCard, FaUpload, FaSpinner, FaTrashAlt, FaMapMarkerAlt, FaHome, FaBuilding, FaStar } from 'react-icons/fa';
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
    registrationExpiry: '',
    librePhoto: null,
    policeClearancePhoto: null
  });
  const fileInputRef = { licensePhoto: useRef(null), nationalIdPhoto: useRef(null), vehiclePhoto: useRef(null), registrationPhoto: useRef(null), insurancePhoto: useRef(null), librePhoto: useRef(null), policeClearancePhoto: useRef(null) };
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

  const [savedPlaces, setSavedPlaces] = useState(user?.favoriteLocations || []);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', address: '', type: 'other', searchQuery: '' });
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [savingPlace, setSavingPlace] = useState(false);
  const [intraCityPlaces, setIntraCityPlaces] = useState([]);

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
          registrationExpiry: res.data.vehicle?.registrationExpiry || '',
          librePhoto: res.data.driver?.librePhoto || null,
          policeClearancePhoto: res.data.driver?.policeClearancePhoto || null
        }));
      }
    }).catch(() => {});
    paymentsAPI.getBanks().then(res => setBanks(res.data?.banks || [])).catch(() => {});

    placesAPI.getAll({ type: 'intra_city' }).then(res => {
      const places = (res.data.places || []).map(p => ({
        key: p.key, label: p.label || p.name, lat: p.coordinates.lat, lon: p.coordinates.lon
      }));
      if (places.length > 0) setIntraCityPlaces(places);
    }).catch(() => {});
  }, []);

  const filterPlaceSuggestions = (query) => {
    if (query.length < 2) { setPlaceSuggestions([]); return; }
    const lower = query.toLowerCase();
    const matches = intraCityPlaces.filter(p => p.label.toLowerCase().includes(lower) || p.key.includes(lower));
    setPlaceSuggestions(matches.slice(0, 6));
    setShowPlaceSuggestions(matches.length > 0);
  };

  const handleAddSavedPlace = async () => {
    if (!newPlace.name) {
      toast.error('Enter a place name');
      return;
    }
    setSavingPlace(true);
    try {
      const place = {
        name: newPlace.name,
        address: newPlace.address || newPlace.name,
        type: newPlace.type,
        location: newPlace.lat ? { type: 'Point', coordinates: [newPlace.lon, newPlace.lat] } : undefined
      };
      const updated = [...savedPlaces, place];
      await authAPI.updateProfile({ favoriteLocations: updated });
      setSavedPlaces(updated);
      setNewPlace({ name: '', address: '', type: 'other', searchQuery: '' });
      setShowAddPlace(false);
      toast.success('Place saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save place');
    } finally {
      setSavingPlace(false);
    }
  };

  const handleRemoveSavedPlace = async (index) => {
    const updated = savedPlaces.filter((_, i) => i !== index);
    try {
      await authAPI.updateProfile({ favoriteLocations: updated });
      setSavedPlaces(updated);
      toast.success('Place removed');
    } catch (err) {
      toast.error('Failed to remove place');
    }
  };

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
    { id: 'places', label: 'Places', icon: <FaMapMarkerAlt /> },
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

      {activeTab === 'places' && (
        <div className="settings-section">
          <Card padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="section-title" style={{ margin: 0 }}><FaMapMarkerAlt /> Saved Places</h2>
              <button
                className="doc-upload-btn"
                style={{ padding: '6px 14px', fontSize: 12 }}
                onClick={() => setShowAddPlace(!showAddPlace)}
              >
                {showAddPlace ? <><FaTimes /> Cancel</> : <><FaCheck /> Add Place</>}
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Save your frequent locations for quick access
            </p>

            {showAddPlace && (
              <div style={{ padding: 14, background: 'var(--bg-secondary, #f9fafb)', borderRadius: 10, border: '1px solid var(--border-light)', marginBottom: 16, animation: 'fadeIn 0.2s ease' }}>
                <div className="form-grid" style={{ marginBottom: 10 }}>
                  <Input
                    label="Place Name"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                    placeholder="e.g. Home, Office"
                    icon={<FaMapMarkerAlt />}
                  />
                  <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Type</label>
                    <select
                      style={{ padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 8, background: 'var(--card)' }}
                      value={newPlace.type}
                      onChange={(e) => setNewPlace({ ...newPlace, type: e.target.value })}
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="school">School</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px 36px 10px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                    placeholder="Search location or enter address..."
                    value={newPlace.searchQuery}
                    onChange={(e) => {
                      setNewPlace({ ...newPlace, searchQuery: e.target.value });
                      filterPlaceSuggestions(e.target.value);
                    }}
                    onFocus={() => { if (newPlace.searchQuery.length >= 2) filterPlaceSuggestions(newPlace.searchQuery); }}
                    onBlur={() => setTimeout(() => setShowPlaceSuggestions(false), 200)}
                  />
                  {showPlaceSuggestions && placeSuggestions.length > 0 && (
                    <div className="driver-search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10 }}>
                      {placeSuggestions.map((s, i) => (
                        <div
                          key={i}
                          className="driver-search-item"
                          onMouseDown={() => {
                            setNewPlace({ ...newPlace, name: newPlace.name || s.label, searchQuery: s.label, address: s.label, lat: s.lat, lon: s.lon });
                            setShowPlaceSuggestions(false);
                          }}
                        >
                          <FaMapMarkerAlt className="driver-search-item-icon" />
                          <span>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={handleAddSavedPlace} loading={savingPlace} icon={<FaCheck />} style={{ width: '100%' }}>
                  Save Place
                </Button>
              </div>
            )}

            {savedPlaces.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                <FaMapMarkerAlt size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontWeight: 600 }}>No saved places</p>
                <p style={{ fontSize: 13 }}>Add your frequent locations above</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {savedPlaces.map((place, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 12, background: 'var(--card)', border: '1px solid var(--border-light)',
                    borderRadius: 10, transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: place.type === 'home' ? 'rgba(37, 99, 235, 0.1)' : place.type === 'work' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                        color: place.type === 'home' ? '#2563eb' : place.type === 'work' ? '#10b981' : '#8b5cf6'
                      }}>
                        {place.type === 'home' ? <FaHome /> : place.type === 'work' ? <FaBuilding /> : <FaStar />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{place.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{place.address}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSavedPlace(idx)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease', fontSize: 13
                      }}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
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
            <h2 className="section-title"><FaFileAlt /> Vehicle Libre (Bolo)</h2>
            <div className="document-upload-area">
              <input type="file" accept="image/*" ref={fileInputRef.librePhoto} style={{ display: 'none' }}
                onChange={() => handleDocUpload('librePhoto', true)} />
              {documents.librePhoto ? (
                <div className="doc-preview">
                  <img src={documents.librePhoto} alt="Vehicle Libre" style={{ maxHeight: 120, borderRadius: 8 }} />
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.librePhoto.current?.click()}>
                    Replace
                  </Button>
                </div>
              ) : (
                <button className="doc-upload-btn" onClick={() => fileInputRef.librePhoto.current?.click()}>
                  <FaFileAlt size={24} />
                  <span>{uploadingDoc === 'librePhoto' ? 'Uploading...' : 'Upload Vehicle Libre'}</span>
                </button>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="section-title"><FaShieldAlt /> Commercial Insurance</h2>
            <div className="document-upload-area">
              <input type="file" accept="image/*" ref={fileInputRef.insurancePhoto} style={{ display: 'none' }}
                onChange={() => handleDocUpload('insurancePhoto', true)} />
              {documents.insurancePhoto ? (
                <div className="doc-preview">
                  <img src={documents.insurancePhoto} alt="Insurance" style={{ maxHeight: 120, borderRadius: 8 }} />
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.insurancePhoto.current?.click()}>
                    Replace
                  </Button>
                </div>
              ) : (
                <button className="doc-upload-btn" onClick={() => fileInputRef.insurancePhoto.current?.click()}>
                  <FaShieldAlt size={24} />
                  <span>{uploadingDoc === 'insurancePhoto' ? 'Uploading...' : 'Upload Insurance Certificate'}</span>
                </button>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="section-title"><FaShieldAlt /> Police Clearance Record</h2>
            <div className="document-upload-area">
              <input type="file" accept="image/*" ref={fileInputRef.policeClearancePhoto} style={{ display: 'none' }}
                onChange={() => handleDocUpload('policeClearancePhoto', true)} />
              {documents.policeClearancePhoto ? (
                <div className="doc-preview">
                  <img src={documents.policeClearancePhoto} alt="Police Clearance" style={{ maxHeight: 120, borderRadius: 8 }} />
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.policeClearancePhoto.current?.click()}>
                    Replace
                  </Button>
                </div>
              ) : (
                <button className="doc-upload-btn" onClick={() => fileInputRef.policeClearancePhoto.current?.click()}>
                  <FaShieldAlt size={24} />
                  <span>{uploadingDoc === 'policeClearancePhoto' ? 'Uploading...' : 'Upload Police Clearance'}</span>
                </button>
              )}
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

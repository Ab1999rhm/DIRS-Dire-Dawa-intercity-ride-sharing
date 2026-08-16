import React, { useState, useEffect, useRef } from 'react';
import {
  FaUser, FaPhone, FaEnvelope, FaSignOutAlt, FaPlus, FaTrash, FaGlobe,
  FaBell, FaShieldAlt, FaCamera, FaHome, FaBuilding, FaSchool, FaMapMarkerAlt,
  FaCreditCard, FaMoneyBillWave, FaWallet, FaCheckCircle, FaExclamationTriangle,
  FaToggleOn, FaToggleOff, FaUserFriends, FaGift, FaCopy, FaMobileAlt, FaSearch, FaTimes
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI, referralAPI, documentsAPI, paymentsAPI, placesAPI } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';
import { Card, Button, Input, ToggleButton } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import './Passenger.css';

const PLACE_ICONS = {
  home: { icon: FaHome, className: 'home' },
  work: { icon: FaBuilding, className: 'work' },
  school: { icon: FaSchool, className: 'school' },
  other: { icon: FaMapMarkerAlt, className: 'other' },
};

const PassengerProfile = () => {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('personal');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Saved Places state
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [placeType, setPlaceType] = useState('home');
  const [placeLat, setPlaceLat] = useState(null);
  const [placeLon, setPlaceLon] = useState(null);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [intraCityPlaces, setIntraCityPlaces] = useState([]);

  // Withdrawal payout account (saved once, reused by wallet withdrawals)
  const [withdrawalAccount, setWithdrawalAccount] = useState(null);
  const [withdrawMethod, setWithdrawMethod] = useState('telebirr');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawBankCode, setWithdrawBankCode] = useState('');
  const [banks, setBanks] = useState([]);
  const [savingWithdrawAccount, setSavingWithdrawAccount] = useState(false);

  // Notification preferences
  const [prefRideUpdates, setPrefRideUpdates] = useState(true);
  const [prefPromotions, setPrefPromotions] = useState(true);
  const [prefSafetyAlerts, setPrefSafetyAlerts] = useState(true);
  const [prefSound, setPrefSound] = useState(true);

  // Privacy settings
  const [shareLocation, setShareLocation] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(false);

  // Email verification
  const [sendingVerifyOtp, setSendingVerifyOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');

  // Real-world Wallet & Referral state
  const [walletBalance, setWalletBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({ totalReferred: 0, completedReferrals: 0, credits: 0 });
  const [referralList, setReferralList] = useState([]);

  useEffect(() => {
    const loadReferralData = async () => {
      try {
        const [codeRes, listRes, walletRes] = await Promise.all([
          referralAPI.getMyCode(),
          referralAPI.getMyReferrals(),
          paymentsAPI.wallet({ limit: 5 }).catch(() => ({ data: {} }))
        ]);
        setReferralCode(codeRes.data.referralCode || '');
        setWalletBalance(walletRes.data.balance ?? codeRes.data.credits ?? 0);
        setReferralStats(listRes.data.stats || {});
        setReferralList(listRes.data.referrals || []);
      } catch (err) {
        // Fallback for offline or error
        setReferralCode(`DIRS-${(user?.firstName || 'REF').toUpperCase()}2026`);
      }
    };
    if (user) loadReferralData();
  }, [user]);

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success(`Referral code ${referralCode} copied to clipboard!`);
    } catch {
      toast.info(`Referral code: ${referralCode}`);
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phoneNumber || '');
      setEmail(user.email || '');
      setEmergencyContacts(user.emergencyContacts || []);
      setProfilePhoto(user.profilePhoto || '');
      setFavoriteLocations(user.favoriteLocations || []);
      const wa = user.withdrawalAccount || {};
      if (Object.keys(wa).length) {
        setWithdrawalAccount(wa);
        setWithdrawMethod(wa.method || 'telebirr');
        setWithdrawAccountName(wa.accountName || '');
        setWithdrawAccountNumber(wa.accountNumber || '');
        setWithdrawBankCode(wa.bankCode || '');
      }
      const prefs = user.preferences || {};
      setPrefRideUpdates(prefs.rideUpdates !== false);
      setPrefPromotions(prefs.promotions !== false);
      setPrefSafetyAlerts(prefs.safetyAlerts !== false);
      setPrefSound(prefs.sound !== false);
      setShareLocation(prefs.shareLocation !== false);
      setAllowAnalytics(prefs.allowAnalytics === true);
    }
  }, [user]);

  useEffect(() => {
    paymentsAPI.getBanks()
      .then(res => setBanks(res.data.banks || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
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

  const handleSaveWithdrawAccount = async () => {
    if (!withdrawAccountName.trim() || !withdrawAccountNumber.trim()) {
      toast.error('Please enter an account holder name and number');
      return;
    }
    if (withdrawMethod === 'bank' && !withdrawBankCode) {
      toast.error('Please select a bank for withdrawals');
      return;
    }
    const account = {
      method: withdrawMethod,
      accountName: withdrawAccountName,
      accountNumber: withdrawAccountNumber,
      bankCode: withdrawMethod === 'bank' ? withdrawBankCode : '',
    };
    setSavingWithdrawAccount(true);
    try {
      const res = await authAPI.updateProfile({ withdrawalAccount: account });
      const saved = res.data.user?.withdrawalAccount || account;
      setWithdrawalAccount(saved);
      if (!res.data.user) setUser({ ...user, withdrawalAccount: saved });
      toast.success('Withdrawal account saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save withdrawal account');
    } finally {
      setSavingWithdrawAccount(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setPhotoUploading(true);
    try {
      const photoUrl = await uploadToCloudinary(file, 'dirs-profile-photos');
      await documentsAPI.uploadProfilePhoto(photoUrl);
      setProfilePhoto(photoUrl);
      setUser({ ...user, profilePhoto: photoUrl });
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ firstName, lastName, email });
      setUser(res.data.user || { ...user, firstName, lastName, email });
      toast.success(t('common.save') + '!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    const newContact = { name: contactName, phoneNumber: contactPhone };
    const updated = [...emergencyContacts, newContact];
    setEmergencyContacts(updated);
    const res = await authAPI.updateProfile({ emergencyContacts: updated });
    if (res.data.user?.emergencyContacts) {
      setEmergencyContacts(res.data.user.emergencyContacts);
    }
    setContactName('');
    setContactPhone('');
    setShowContactForm(false);
    toast.success('Contact added');
  };

  const handleDeleteContact = async (id) => {
    const updated = emergencyContacts.filter(c => c._id !== id);
    setEmergencyContacts(updated);
    const res = await authAPI.updateProfile({ emergencyContacts: updated });
    if (res.data.user?.emergencyContacts) {
      setEmergencyContacts(res.data.user.emergencyContacts);
    }
    toast.success('Contact removed');
  };

  // Saved Places handlers
  const handleAddPlace = async () => {
    if (!placeName.trim() || !placeAddress.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    const newPlace = { name: placeName, address: placeAddress, type: placeType };
    if (placeLat && placeLon) {
      newPlace.location = { type: 'Point', coordinates: [placeLon, placeLat] };
    }
    const updated = [...favoriteLocations, newPlace];
    setFavoriteLocations(updated);
    const res = await authAPI.updateProfile({ favoriteLocations: updated });
    if (res.data.user?.favoriteLocations) {
      setFavoriteLocations(res.data.user.favoriteLocations);
    }
    setPlaceName('');
    setPlaceAddress('');
    setPlaceType('home');
    setPlaceLat(null);
    setPlaceLon(null);
    setPlaceSearchQuery('');
    setShowPlaceForm(false);
    toast.success('Place saved');
  };

  const handleDeletePlace = async (id) => {
    const updated = favoriteLocations.filter(p => p._id !== id);
    setFavoriteLocations(updated);
    const res = await authAPI.updateProfile({ favoriteLocations: updated });
    if (res.data.user?.favoriteLocations) {
      setFavoriteLocations(res.data.user.favoriteLocations);
    }
    toast.success('Place removed');
  };

  // Notification preference save
  const savePreference = async (key, value) => {
    try {
      const prefs = {
        rideUpdates: prefRideUpdates,
        promotions: prefPromotions,
        safetyAlerts: prefSafetyAlerts,
        sound: prefSound,
        shareLocation,
        allowAnalytics,
        [key]: value,
      };
      await authAPI.updateProfile({ preferences: prefs });
    } catch {
      toast.error('Failed to save preference');
    }
  };

  // Email verification
  const handleSendVerifyEmail = async () => {
    setSendingVerifyOtp(true);
    try {
      await authAPI.sendEmailOTP(email);
      setShowEmailOtp(true);
      toast.success('Verification code sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send verification email');
    } finally {
      setSendingVerifyOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      await authAPI.verifyEmailOTP(email, emailOtp);
      setUser({ ...user, isVerified: true });
      setShowEmailOtp(false);
      setEmailOtp('');
      toast.success('Email verified successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid verification code');
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate('/login');
  };

  const tabs = [
    { id: 'personal', label: t('passenger.personalInfo'), icon: <FaUser /> },
    { id: 'emergency', label: t('passenger.emergencyContacts'), icon: <FaShieldAlt /> },
    { id: 'places', label: t('passenger.savedPlaces'), icon: <FaMapMarkerAlt /> },
    { id: 'payment', label: t('passenger.paymentMethods'), icon: <FaCreditCard /> },
    { id: 'settings', label: t('passenger.settings'), icon: <FaGlobe /> },
  ];

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <div className="passenger-page">
      <div className="page-header">
        <h1 className="page-title"><FaUser /> {t('passenger.settings') || 'Profile'}</h1>
      </div>

      <div className="profile-avatar-section">
        <div
          className="profile-avatar large"
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => fileInputRef.current?.click()}
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            initials
          )}
          <div
            style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'var(--primary)', color: '#fff',
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid var(--bg)', fontSize: 14,
              opacity: photoUploading ? 0.5 : 1
            }}
          >
            <FaCamera />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
        </div>
        <h3 style={{ fontWeight: 700 }}>{firstName} {lastName}</h3>
        <p className="text-muted" style={{ fontSize: 14 }}>{phone}</p>

        {/* Real-World App Wallet Card */}
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', borderRadius: '12px', padding: '16px', margin: '16px 0 10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaWallet style={{ fontSize: '28px', color: '#93c5fd' }} />
            <div>
              <span style={{ fontSize: '11px', opacity: 0.9, display: 'block' }}>App Wallet Balance</span>
              <strong style={{ fontSize: '20px', fontWeight: 800 }}>{walletBalance} ETB</strong>
            </div>
          </div>
          <button onClick={() => navigate('/passenger/wallet')} style={{ background: 'white', color: '#2563eb', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
            Go to Wallet
          </button>
        </div>

        {/* Real-World Referral Card */}
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '12px', padding: '14px', margin: '0 0 16px 0', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FaGift style={{ color: '#ff8f00', fontSize: '20px' }} />
            <div>
              <strong style={{ fontSize: '13px', color: '#bf360c', display: 'block' }}>Refer & Earn 50 ETB</strong>
              <span style={{ fontSize: '11px', color: '#7f6000' }}>Give friends 30 ETB off & earn 50 ETB credit</span>
            </div>
          </div>
          <div onClick={handleCopyReferral} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px dashed #ffb300', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', color: '#d84315' }}>
            <span>{referralCode || 'Loading...'}</span>
            <FaCopy />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#7f6000' }}>
            <span>Referred: {referralStats.totalReferred || 0} friends</span>
            <span>Credits earned: {referralStats.totalCreditsEarned || 0} ETB</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs" role="tablist" aria-label="Profile sections">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={`Navigate to ${tab.label}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* PERSONAL TAB */}
      {activeTab === 'personal' && (
        <Card className="profile-card">
          <div className="profile-form">
            <div className="form-row">
              <Input
                label={t('passenger.firstName')}
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                icon={<FaUser />}
              />
              <Input
                label={t('passenger.lastName')}
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                icon={<FaUser />}
              />
            </div>
            <Input
              label={t('passenger.phone')}
              value={phone}
              disabled
              icon={<FaPhone />}
              helperText="Contact support to change phone number"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Input
                  label={t('passenger.email')}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  icon={<FaEnvelope />}
                />
              </div>
              {user?.isVerified ? (
                <span className="verification-badge verified">
                  <FaCheckCircle size={12} /> {t('passenger.verified')}
                </span>
              ) : (
                <span
                  className="verification-badge unverified"
                  onClick={handleSendVerifyEmail}
                  title="Click to verify"
                >
                  <FaExclamationTriangle size={12} />
                  {sendingVerifyOtp ? t('passenger.sending') : t('passenger.unverified')}
                </span>
              )}
            </div>
            {showEmailOtp && (
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                <p style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--text-secondary)' }}>
                  Enter the verification code sent to {email}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input
                    placeholder="Enter OTP"
                    value={emailOtp}
                    onChange={e => setEmailOtp(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button variant="primary" size="sm" onClick={handleVerifyEmailOtp}>
                    Verify
                  </Button>
                </div>
              </div>
            )}
            <div className="form-actions">
              <Button variant="primary" loading={saving} onClick={handleSaveProfile}>
                {t('passenger.save')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* EMERGENCY TAB */}
      {activeTab === 'emergency' && (
        <Card className="profile-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>{t('passenger.emergencyContacts')}</h3>
            <Button variant="outline" size="sm" icon={<FaPlus />} onClick={() => setShowContactForm(!showContactForm)}>
              {t('passenger.addContact')}
            </Button>
          </div>

          {showContactForm && (
            <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
              <div className="form-row" style={{ marginBottom: 12 }}>
                <Input
                  label={t('passenger.contactName')}
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="John Doe"
                />
                <Input
                  label={t('passenger.contactPhone')}
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+251 9XX XXX XXX"
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="sm" onClick={() => setShowContactForm(false)}>{t('common.cancel')}</Button>
                <Button variant="primary" size="sm" onClick={handleAddContact}>{t('passenger.save')}</Button>
              </div>
            </div>
          )}

          {emergencyContacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <FaShieldAlt size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p>{t('passenger.noEmergencyContacts')}</p>
            </div>
          ) : (
            emergencyContacts.map(contact => (
              <div key={contact._id} className="contact-item">
                <div className="contact-info">
                  <div className="contact-avatar">{contact.name?.[0] || '?'}</div>
                  <div>
                    <h4>{contact.name}</h4>
                    <p>{contact.phoneNumber}</p>
                  </div>
                </div>
                <button className="contact-delete" onClick={() => handleDeleteContact(contact._id)}>
                  <FaTrash size={14} />
                </button>
              </div>
            ))
          )}
        </Card>
      )}

      {/* SAVED PLACES TAB */}
      {activeTab === 'places' && (
        <Card className="profile-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>{t('passenger.savedPlaces')}</h3>
            <Button variant="outline" size="sm" icon={<FaPlus />} onClick={() => setShowPlaceForm(!showPlaceForm)}>
              {t('passenger.addPlace')}
            </Button>
          </div>

          {showPlaceForm && (
            <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg)', borderRadius: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['home', 'work', 'school', 'other'].map(type => {
                  const IconComp = PLACE_ICONS[type].icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setPlaceType(type)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid',
                        borderColor: placeType === type ? 'var(--primary)' : 'var(--border-light)',
                        background: placeType === type ? 'var(--primary-50)' : 'var(--card)',
                        color: placeType === type ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                      }}
                    >
                      <IconComp size={16} />
                      {type}
                    </button>
                  );
                })}
              </div>
              <Input
                label={t('passenger.placeName')}
                value={placeName}
                onChange={e => setPlaceName(e.target.value)}
                placeholder="e.g. Home, Office"
              />
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>{t('passenger.address')}</label>
                <div style={{ position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px 36px 10px 36px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                    placeholder="Search location or enter address..."
                    value={placeSearchQuery}
                    onChange={(e) => {
                      setPlaceSearchQuery(e.target.value);
                      setPlaceAddress(e.target.value);
                      setPlaceLat(null);
                      setPlaceLon(null);
                      filterPlaceSuggestions(e.target.value);
                    }}
                    onFocus={() => { if (placeSearchQuery.length >= 2) filterPlaceSuggestions(placeSearchQuery); }}
                    onBlur={() => setTimeout(() => setShowPlaceSuggestions(false), 200)}
                  />
                  {placeSearchQuery && (
                    <button
                      onClick={() => { setPlaceSearchQuery(''); setPlaceAddress(''); setPlaceLat(null); setPlaceLon(null); setPlaceSuggestions([]); setShowPlaceSuggestions(false); }}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                {showPlaceSuggestions && placeSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: 180, overflowY: 'auto', marginTop: 4 }}>
                    {placeSuggestions.map((s, i) => (
                      <div
                        key={i}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: 13, transition: 'background 0.15s' }}
                        onMouseDown={() => {
                          setPlaceName(placeName || s.label.split(',')[0]);
                          setPlaceAddress(s.label);
                          setPlaceSearchQuery(s.label);
                          setPlaceLat(s.lat);
                          setPlaceLon(s.lon);
                          setShowPlaceSuggestions(false);
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FaMapMarkerAlt style={{ color: 'var(--primary)', fontSize: 12, flexShrink: 0 }} />
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {placeLat && placeLon && (
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FaMapMarkerAlt /> Location captured ({placeLat.toFixed(4)}, {placeLon.toFixed(4)})
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <Button variant="ghost" size="sm" onClick={() => { setShowPlaceForm(false); setPlaceName(''); setPlaceAddress(''); setPlaceLat(null); setPlaceLon(null); setPlaceSearchQuery(''); }}>{t('common.cancel')}</Button>
                <Button variant="primary" size="sm" onClick={handleAddPlace}>{t('passenger.savePlace')}</Button>
              </div>
            </div>
          )}

          {favoriteLocations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <FaMapMarkerAlt size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p>{t('passenger.noSavedPlaces')}</p>
            </div>
          ) : (
            favoriteLocations.map(place => {
              const placeIcon = PLACE_ICONS[place.type] || PLACE_ICONS.other;
              const IconComp = placeIcon.icon;
              return (
                <div key={place._id} className="saved-place-item">
                  <div className={`saved-place-icon ${placeIcon.className}`}>
                    <IconComp />
                  </div>
                  <div className="saved-place-info">
                    <h4>{place.name}</h4>
                    <p>{place.address}</p>
                    {place.location?.coordinates && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                        <FaMapMarkerAlt size={10} /> Coords saved
                      </p>
                    )}
                  </div>
                  <button className="saved-place-delete" onClick={() => handleDeletePlace(place._id)}>
                    <FaTrash size={14} />
                  </button>
                </div>
              );
            })
          )}
        </Card>
      )}

      {/* PAYMENT TAB */}
      {activeTab === 'payment' && (
        <Card className="profile-card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{t('passenger.paymentMethods')}</h3>

          <div style={{ marginTop: 16 }}>
            <Button
              variant="outline"
              fullWidth
              icon={<FaWallet />}
              onClick={() => navigate('/passenger/wallet')}
            >
              {t('passenger.walletTopUp') || 'Manage Wallet'}
            </Button>
          </div>

          {/* Withdrawal Payout Account */}
          <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 24, paddingTop: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaMoneyBillWave /> {t('passenger.withdrawalAccount') || 'Withdrawal Account'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
              {t('passenger.withdrawalAccountDesc') || 'Set your preferred payout method and account once — wallet withdrawals will use it automatically, no need to re-enter details.'}
            </p>

            {withdrawalAccount && (
              <div className="payment-method-item selected" style={{ marginBottom: 14 }}>
                <div className={`payment-method-icon ${withdrawalAccount.method === 'bank' ? 'chapa' : 'telebirr'}`}>
                  {withdrawalAccount.method === 'bank' ? <FaCreditCard /> : <FaMobileAlt />}
                </div>
                <div className="payment-method-info">
                  <h4>
                    {withdrawalAccount.method === 'bank' ? 'Bank Transfer'
                      : withdrawalAccount.method === 'cbe_birr' ? 'CBE Birr' : 'Telebirr'}
                  </h4>
                  <p>{withdrawalAccount.accountName} · {withdrawalAccount.accountNumber}</p>
                </div>
                <span className="payment-default-badge">{t('passenger.default') || 'Default'}</span>
              </div>
            )}

            <div className="passenger-payment-grid" style={{ marginBottom: 12 }}>
              {[
                { id: 'telebirr', icon: <FaMobileAlt />, label: 'Telebirr' },
                { id: 'cbe_birr', icon: <FaMobileAlt />, label: 'CBE Birr' },
                { id: 'bank', icon: <FaCreditCard />, label: 'Bank Transfer' },
              ].map(m => (
                <div
                  key={m.id}
                  className={`passenger-payment-option ${withdrawMethod === m.id ? 'selected' : ''}`}
                  onClick={() => setWithdrawMethod(m.id)}
                >
                  <div className="payment-icon">{m.icon}</div>
                  <span className="payment-label">{m.label}</span>
                </div>
              ))}
            </div>

            <div className="input-group" style={{ marginBottom: 12 }}>
              <label>{t('passenger.accountHolderName') || 'Account Holder Name'}</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  placeholder={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Account holder name'}
                  value={withdrawAccountName}
                  onChange={e => setWithdrawAccountName(e.target.value)}
                />
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label>
                {withdrawMethod === 'bank' ? (t('passenger.accountNumber') || 'Account Number')
                  : withdrawMethod === 'cbe_birr' ? (t('passenger.cbeBirrNumber') || 'CBE Birr Number')
                  : (t('passenger.telebirrNumber') || 'Telebirr Number')}
              </label>
              <div className="input-wrapper">
                <FaMobileAlt className="input-icon" />
                <input
                  type="text"
                  placeholder={withdrawMethod === 'bank' ? 'Account number' : '09...'}
                  value={withdrawAccountNumber}
                  onChange={e => setWithdrawAccountNumber(e.target.value)}
                />
              </div>
            </div>
            {withdrawMethod === 'bank' && (
              <div className="input-group" style={{ marginBottom: 12 }}>
                <label>Bank</label>
                <div className="input-wrapper">
                  <FaCreditCard className="input-icon" />
                  <select
                    style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', outline: 'none' }}
                    value={withdrawBankCode}
                    onChange={e => setWithdrawBankCode(e.target.value)}
                  >
                    <option value="">Select bank</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <Button variant="primary" fullWidth loading={savingWithdrawAccount} onClick={handleSaveWithdrawAccount}>
              {withdrawalAccount ? (t('passenger.updateWithdrawAccount') || 'Update') : (t('passenger.saveWithdrawAccount') || 'Save')}
            </Button>
          </div>
        </Card>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <Card className="profile-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Language */}
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaGlobe /> {t('passenger.language')}
              </h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableLanguages.map(lang => (
                  <button
                    key={lang.code}
                    className={`vehicle-card ${language === lang.code ? 'selected' : ''}`}
                    style={{ padding: '10px 20px', width: 'auto' }}
                    onClick={() => setLanguage(lang.code)}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Preferences */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaBell /> {t('passenger.notificationPreferences')}
              </h3>
              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">{t('passenger.rideUpdatesLabel')}</div>
                  <div className="settings-toggle-desc">{t('passenger.rideUpdatesDesc')}</div>
                </div>
                <ToggleButton
                  active={prefRideUpdates}
                  onToggle={() => {
                    setPrefRideUpdates(!prefRideUpdates);
                    savePreference('rideUpdates', !prefRideUpdates);
                  }}
                  label={prefRideUpdates ? 'On' : 'Off'}
                />
              </div>
              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">{t('passenger.promotionsLabel')}</div>
                  <div className="settings-toggle-desc">{t('passenger.promotionsDesc')}</div>
                </div>
                <ToggleButton
                  active={prefPromotions}
                  onToggle={() => {
                    setPrefPromotions(!prefPromotions);
                    savePreference('promotions', !prefPromotions);
                  }}
                  label={prefPromotions ? 'On' : 'Off'}
                />
              </div>
              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">{t('passenger.safetyAlertsLabel')}</div>
                  <div className="settings-toggle-desc">{t('passenger.safetyAlertsDesc')}</div>
                </div>
                <ToggleButton
                  active={prefSafetyAlerts}
                  onToggle={() => {
                    setPrefSafetyAlerts(!prefSafetyAlerts);
                    savePreference('safetyAlerts', !prefSafetyAlerts);
                  }}
                  label={prefSafetyAlerts ? 'On' : 'Off'}
                />
              </div>
              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">{t('passenger.soundLabel')}</div>
                  <div className="settings-toggle-desc">{t('passenger.soundDesc')}</div>
                </div>
                <ToggleButton
                  active={prefSound}
                  onToggle={() => {
                    setPrefSound(!prefSound);
                    savePreference('sound', !prefSound);
                  }}
                  label={prefSound ? 'On' : 'Off'}
                />
              </div>
            </div>

            {/* Privacy Settings */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaShieldAlt /> {t('passenger.privacySettings')}
              </h3>
              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">{t('passenger.locationSharingLabel')}</div>
                  <div className="settings-toggle-desc">{t('passenger.locationSharingDesc')}</div>
                </div>
                <ToggleButton
                  active={shareLocation}
                  onToggle={() => {
                    setShareLocation(!shareLocation);
                    savePreference('shareLocation', !shareLocation);
                  }}
                  label={shareLocation ? 'On' : 'Off'}
                />
              </div>
              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">{t('passenger.dataUsageLabel')}</div>
                  <div className="settings-toggle-desc">{t('passenger.dataUsageDesc')}</div>
                </div>
                <ToggleButton
                  active={allowAnalytics}
                  onToggle={() => {
                    setAllowAnalytics(!allowAnalytics);
                    savePreference('allowAnalytics', !allowAnalytics);
                  }}
                  label={allowAnalytics ? 'On' : 'Off'}
                />
              </div>
            </div>

            {/* Invite Friends */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUserFriends /> {t('passenger.inviteFriends') || 'Invite Friends'}
              </h3>
              <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {t('passenger.shareWithFriends')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('passenger.referralCode') || 'Referral Code'}:</span>
                  <code style={{ padding: '6px 12px', background: 'var(--card)', borderRadius: 6, fontWeight: 700, fontSize: 14, border: '1px solid var(--border)', letterSpacing: 1 }}>
                    {referralCode || 'Loading...'}
                  </code>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  <FaUserFriends size={12} style={{ marginRight: 4 }} />
                  {t('passenger.friendsJoined', { count: referralStats.totalReferred || 0 })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FaUserFriends />}
                    onClick={async () => {
                      const code = referralCode || 'DIRS0000';
                      const shareData = {
                        title: 'Join DIRS',
                        text: `Join DIRS ride-sharing! Use my code: ${code}`,
                        url: window.location.origin,
                      };
                      try {
                        if (navigator.share) {
                          await navigator.share(shareData);
                        } else {
                          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                          toast.success('Referral link copied to clipboard!');
                        }
                      } catch {
                        try {
                          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                          toast.success('Referral link copied to clipboard!');
                        } catch {
                          toast.error('Failed to share');
                        }
                      }
                    }}
                  >
                    {t('passenger.shareReferral') || 'Share Referral'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
              <Button variant="danger" fullWidth icon={<FaSignOutAlt />} onClick={handleLogout}>
                {t('passenger.logout')}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PassengerProfile;

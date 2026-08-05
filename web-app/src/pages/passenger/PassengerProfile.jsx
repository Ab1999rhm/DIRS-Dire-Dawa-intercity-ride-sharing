import React, { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaEnvelope, FaSignOutAlt, FaPlus, FaTrash, FaGlobe, FaBell, FaShieldAlt } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Card, Button, Input, ToggleButton } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import './Passenger.css';

const PassengerProfile = () => {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { user, setUser, logout } = useAuth();
  const toast = useToast();

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

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phoneNumber || '');
      setEmail(user.email || '');
      setEmergencyContacts(user.emergencyContacts || []);
    }
  }, [user]);

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
    const newContact = { name: contactName, phone: contactPhone, _id: Date.now().toString() };
    const updated = [...emergencyContacts, newContact];
    setEmergencyContacts(updated);
    await authAPI.updateProfile({ emergencyContacts: updated });
    setContactName('');
    setContactPhone('');
    setShowContactForm(false);
    toast.success('Contact added');
  };

  const handleDeleteContact = async (id) => {
    const updated = emergencyContacts.filter(c => c._id !== id);
    setEmergencyContacts(updated);
    await authAPI.updateProfile({ emergencyContacts: updated });
    toast.success('Contact removed');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const tabs = [
    { id: 'personal', label: t('passenger.personalInfo'), icon: <FaUser /> },
    { id: 'emergency', label: t('passenger.emergencyContacts'), icon: <FaShieldAlt /> },
    { id: 'settings', label: t('passenger.settings'), icon: <FaGlobe /> },
  ];

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <div className="passenger-page">
      <div className="page-header">
        <h1 className="page-title"><FaUser /> {t('passenger.settings') || 'Profile'}</h1>
      </div>

      <div className="profile-avatar-section">
        <div className="profile-avatar large">{initials}</div>
        <h3 style={{ fontWeight: 700 }}>{firstName} {lastName}</h3>
        <p className="text-muted" style={{ fontSize: 14 }}>{phone}</p>
      </div>

      <div className="profile-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

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
            <Input
              label={t('passenger.email')}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<FaEnvelope />}
            />
            <div className="form-actions">
              <Button variant="primary" loading={saving} onClick={handleSaveProfile}>
                {t('passenger.save')}
              </Button>
            </div>
          </div>
        </Card>
      )}

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
              <p>No emergency contacts added yet</p>
            </div>
          ) : (
            emergencyContacts.map(contact => (
              <div key={contact._id} className="contact-item">
                <div className="contact-info">
                  <div className="contact-avatar">{contact.name?.[0] || '?'}</div>
                  <div>
                    <h4>{contact.name}</h4>
                    <p>{contact.phone}</p>
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

      {activeTab === 'settings' && (
        <Card className="profile-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaBell /> {t('passenger.notifications')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14 }}>{t('passenger.notifications')}</span>
                <ToggleButton
                  active={notifications}
                  onToggle={async () => {
                    const newValue = !notifications;
                    setNotifications(newValue);
                    try {
                      await authAPI.updateProfile({ notifications: newValue });
                    } catch (err) {
                      toast.error('Failed to update notification setting');
                    }
                  }}
                  label={notifications ? 'On' : 'Off'}
                />
              </div>
            </div>

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

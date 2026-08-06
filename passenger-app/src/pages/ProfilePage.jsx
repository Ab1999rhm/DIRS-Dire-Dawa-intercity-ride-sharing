import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { authAPI, usersAPI } from '../services/api';
import Navbar from '../components/Navbar';
import WalletTopupModal from '../components/WalletTopupModal';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaPlus, FaTrash, FaSignOutAlt, FaCamera, FaGlobe, FaWallet, FaGift, FaCopy } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Profile.css';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const { walletBalance, setWalletBalance } = useRide();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [loading, setLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Emergency contact modal state
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  // Favorite location modal state
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [showAddLoc, setShowAddLoc] = useState(false);

  const referralCode = `DIRS-${user?.firstName?.toUpperCase() || 'REF'}2026`;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({ firstName, lastName, email, preferredLanguage });
      updateUser(res.data.user || { firstName, lastName, email, preferredLanguage });
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success(`Referral code ${referralCode} copied! Share with friends for 50 ETB credit.`);
    } catch (err) {
      toast.info(`Referral code: ${referralCode}`);
    }
  };

  const handleAddEmergencyContact = async (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) {
      toast.warning('Please enter contact name and phone number');
      return;
    }
    try {
      const res = await usersAPI.addEmergencyContact({
        name: newContactName,
        phoneNumber: newContactPhone,
        relationship: newContactRel
      });
      updateUser({ emergencyContacts: res.data.emergencyContacts });
      setNewContactName('');
      setNewContactPhone('');
      setNewContactRel('');
      setShowAddContact(false);
      toast.success('Emergency contact added!');
    } catch (err) {
      console.error('Add contact error:', err);
      toast.error('Failed to add emergency contact');
    }
  };

  const handleRemoveContact = async (contactId) => {
    try {
      const res = await usersAPI.removeEmergencyContact(contactId);
      updateUser({ emergencyContacts: res.data.emergencyContacts });
      toast.info('Emergency contact removed');
    } catch (err) {
      console.error('Remove contact error:', err);
    }
  };

  const handleAddFavoriteLocation = async (e) => {
    e.preventDefault();
    if (!newLocName || !newLocAddress) {
      toast.warning('Please enter location name and address');
      return;
    }
    try {
      const res = await usersAPI.addFavoriteLocation({
        name: newLocName,
        address: newLocAddress,
        coordinates: [41.8661, 9.5931]
      });
      updateUser({ favoriteLocations: res.data.favoriteLocations });
      setNewLocName('');
      setNewLocAddress('');
      setShowAddLoc(false);
      toast.success('Favorite location saved!');
    } catch (err) {
      console.error('Add location error:', err);
      toast.error('Failed to add favorite location');
    }
  };

  const handleRemoveLocation = async (locationId) => {
    try {
      const res = await usersAPI.removeFavoriteLocation(locationId);
      updateUser({ favoriteLocations: res.data.favoriteLocations });
      toast.info('Location removed from favorites');
    } catch (err) {
      console.error('Remove location error:', err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    try {
      toast.info('Uploading photo...');
      const res = await authAPI.uploadProfilePhoto(formData);
      updateUser({ profilePhoto: res.data.profilePhoto });
      toast.success('Profile photo updated!');
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Failed to upload photo');
    }
  };

  return (
    <div className="profile-container">
      <header className="page-header">
        <h2><FaUser /> Profile & Account</h2>
      </header>

      <div className="profile-body">
        {/* Avatar Section */}
        <div className="avatar-section">
          <div className="avatar-preview">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" />
            ) : (
              <span>{user?.firstName?.charAt(0) || 'U'}</span>
            )}
            <label className="photo-upload-btn" title="Change Photo">
              <FaCamera />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
            </label>
          </div>
          <h3>{user?.firstName} {user?.lastName}</h3>
          <p className="phone-tag"><FaPhone /> {user?.phoneNumber}</p>
        </div>

        {/* Real World Production: App Wallet Balance Card */}
        <div className="wallet-card">
          <div className="wallet-info">
            <FaWallet className="wallet-icon-big" />
            <div>
              <span className="wallet-label">In-App Wallet Balance</span>
              <strong className="wallet-amount">{walletBalance} ETB</strong>
            </div>
          </div>
          <button className="topup-btn" onClick={() => setShowWalletModal(true)}>
            + Top Up
          </button>
        </div>

        {/* Real World Production: Referral Program Card */}
        <div className="referral-card">
          <div className="referral-header">
            <FaGift className="gift-icon" />
            <div>
              <h4>Refer & Earn 50 ETB</h4>
              <p>Share code with friends to give them 30 ETB & earn 50 ETB credit!</p>
            </div>
          </div>
          <div className="referral-code-box" onClick={handleCopyReferral}>
            <span>{referralCode}</span>
            <FaCopy />
          </div>
        </div>

        {/* Profile Info Form */}
        <form onSubmit={handleUpdateProfile} className="profile-card">
          <h4>Personal Information</h4>
          <div className="input-row">
            <div className="input-group">
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label><FaEnvelope /> Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label><FaGlobe /> Preferred Language</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="am">Amharic (አማርኛ)</option>
              <option value="om">Afaan Oromoo</option>
              <option value="so">Somali (Soomaali)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile Updates'}
          </button>
        </form>

        {/* Emergency Contacts Section */}
        <div className="profile-card">
          <div className="card-header-flex">
            <h4>Emergency Contacts</h4>
            <button className="icon-add-btn" onClick={() => setShowAddContact(!showAddContact)}>
              <FaPlus /> Add
            </button>
          </div>

          {showAddContact && (
            <form onSubmit={handleAddEmergencyContact} className="mini-form">
              <input
                type="text"
                placeholder="Contact Name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number (+251...)"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Relationship (e.g. Brother, Friend)"
                value={newContactRel}
                onChange={(e) => setNewContactRel(e.target.value)}
              />
              <button type="submit" className="btn-primary">Save Contact</button>
            </form>
          )}

          <div className="item-list">
            {!user?.emergencyContacts || user.emergencyContacts.length === 0 ? (
              <p className="hint-text">No emergency contacts added yet.</p>
            ) : (
              user.emergencyContacts.map((contact) => (
                <div key={contact._id || contact.phoneNumber} className="item-row">
                  <div>
                    <strong style={{ display: 'block' }}>{contact.name}</strong>
                    <span className="sub-text">{contact.phoneNumber} {contact.relationship ? `(${contact.relationship})` : ''}</span>
                  </div>
                  <button className="del-btn" onClick={() => handleRemoveContact(contact._id)}>
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Favorite Locations Section */}
        <div className="profile-card">
          <div className="card-header-flex">
            <h4>Saved / Favorite Locations</h4>
            <button className="icon-add-btn" onClick={() => setShowAddLoc(!showAddLoc)}>
              <FaPlus /> Add
            </button>
          </div>

          {showAddLoc && (
            <form onSubmit={handleAddFavoriteLocation} className="mini-form">
              <input
                type="text"
                placeholder="Name (e.g. Home, Work)"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Address string"
                value={newLocAddress}
                onChange={(e) => setNewLocAddress(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">Save Location</button>
            </form>
          )}

          <div className="item-list">
            {!user?.favoriteLocations || user.favoriteLocations.length === 0 ? (
              <p className="hint-text">No saved locations yet.</p>
            ) : (
              user.favoriteLocations.map((loc) => (
                <div key={loc._id || loc.name} className="item-row">
                  <div>
                    <strong style={{ display: 'block' }}><FaMapMarkerAlt style={{ color: '#1a73e8' }} /> {loc.name}</strong>
                    <span className="sub-text">{loc.address}</span>
                  </div>
                  <button className="del-btn" onClick={() => handleRemoveLocation(loc._id)}>
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logout */}
        <button className="btn-logout" onClick={logout}>
          <FaSignOutAlt /> Log Out
        </button>
      </div>

      <WalletTopupModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onTopupSuccess={(amt) => setWalletBalance((prev) => prev + amt)}
      />

      <Navbar />
    </div>
  );
};

export default ProfilePage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { DriverAvatarIcon } from '../components/VehicleIcons';
import { FaPhone, FaEnvelope, FaEdit, FaCheck, FaTimes, FaSignOutAlt, FaStar, FaHome, FaListUl, FaWallet, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Pages.css';

const ProfilePage = () => {
  const { user, driverProfile, updateDriverProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) {
      toast.warning('First and last name are required');
      return;
    }

    setSaving(true);
    try {
      const response = await authAPI.updateProfile(form);
      updateDriverProfile(response.data.user);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Profile</h2>
        {!editing && (
          <button className="btn-icon" onClick={() => setEditing(true)}>
            <FaEdit /> Edit
          </button>
        )}
      </header>

      <div className="profile-avatar-section">
        <div className="profile-avatar">
          <DriverAvatarIcon size={96} />
        </div>
        <h3>{user?.firstName} {user?.lastName}</h3>
        <div className="profile-rating">
          <FaStar className="star-icon" />
          <span>{driverProfile?.averageRating?.toFixed(1) || 'N/A'}</span>
          <span className="rating-count">({driverProfile?.totalTrips || 0} trips)</span>
        </div>
        <span className={`verification-badge ${driverProfile?.verificationStatus}`}>
          {driverProfile?.verificationStatus === 'approved' ? 'Verified Driver' : 'Pending Verification'}
        </span>
      </div>

      {editing ? (
        <div className="profile-form">
          <div className="form-group">
            <label>First Name *</label>
            <input type="text" name="firstName" value={form.firstName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input type="text" name="lastName" value={form.lastName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button className="btn-cancel" onClick={() => setEditing(false)}>
              <FaTimes /> Cancel
            </button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              <FaCheck /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-details">
          <div className="detail-row">
            <FaPhone className="detail-icon" />
            <div>
              <span className="detail-label">Phone Number</span>
              <span className="detail-value">{user?.phoneNumber}</span>
            </div>
          </div>
          <div className="detail-row">
            <FaEnvelope className="detail-icon" />
            <div>
              <span className="detail-label">Email</span>
              <span className="detail-value">{user?.email || 'Not set'}</span>
            </div>
          </div>
          <div className="detail-row">
            <FaStar className="detail-icon" />
            <div>
              <span className="detail-label">Rating</span>
              <span className="detail-value">{driverProfile?.averageRating?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      <button className="btn-logout" onClick={handleLogout}>
        <FaSignOutAlt /> Sign Out
      </button>

      <nav className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/')}>
          <FaHome /> <span>Home</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/trips')}>
          <FaListUl /> <span>Trips</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/earnings')}>
          <FaWallet /> <span>Earnings</span>
        </button>
        <button className="nav-btn active" onClick={() => navigate('/profile')}>
          <FaUser /> <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default ProfilePage;

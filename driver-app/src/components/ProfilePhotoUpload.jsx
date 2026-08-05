import React, { useRef } from 'react';
import { authAPI } from '../services/api';
import { FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ProfilePhotoUpload = ({ currentPhoto, onPhotoUpdate }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await authAPI.uploadProfilePhoto(formData);
      onPhotoUpdate(response.data.profilePhoto);
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error('Failed to upload photo');
    }
  };

  const photoUrl = currentPhoto ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${currentPhoto}` : null;

  return (
    <div className="profile-photo-upload" onClick={() => fileInputRef.current?.click()}>
      {photoUrl ? (
        <img src={photoUrl} alt="Profile" className="profile-photo-img" />
      ) : (
        <div className="profile-photo-placeholder">
          <FaCamera size={28} />
        </div>
      )}
      <div className="profile-photo-overlay">
        <FaCamera size={16} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        hidden
      />
    </div>
  );
};

export default ProfilePhotoUpload;

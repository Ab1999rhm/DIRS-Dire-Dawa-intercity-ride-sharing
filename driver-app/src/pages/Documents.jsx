import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
  FaArrowLeft, FaIdCard, FaCar, FaCamera, FaCheck, FaExclamationTriangle,
  FaHome, FaListUl, FaWallet, FaUser
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Pages.css';

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);

  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');

  const [licensePhotoFile, setLicensePhotoFile] = useState(null);
  const [nationalIdPhotoFile, setNationalIdPhotoFile] = useState(null);
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
  const [registrationPhotoFile, setRegistrationPhotoFile] = useState(null);
  const [insurancePhotoFile, setInsurancePhotoFile] = useState(null);

  const [licensePhotoPreview, setLicensePhotoPreview] = useState(null);
  const [nationalIdPhotoPreview, setNationalIdPhotoPreview] = useState(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState(null);
  const [registrationPhotoPreview, setRegistrationPhotoPreview] = useState(null);
  const [insurancePhotoPreview, setInsurancePhotoPreview] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await authAPI.getDocuments();
      const data = response.data;
      setDocs(data);
      if (data.driver) {
        setLicenseNumber(data.driver.licenseNumber || '');
        setLicenseExpiry(data.driver.licenseExpiry ? new Date(data.driver.licenseExpiry).toISOString().split('T')[0] : '');
        setNationalId(data.driver.nationalId || '');
        if (data.driver.licensePhoto && data.driver.licensePhoto !== 'pending') {
          setLicensePhotoPreview(`http://localhost:5000${data.driver.licensePhoto}`);
        }
        if (data.driver.nationalIdPhoto && data.driver.nationalIdPhoto !== 'pending') {
          setNationalIdPhotoPreview(`http://localhost:5000${data.driver.nationalIdPhoto}`);
        }
      }
      if (data.vehicle) {
        setInsuranceExpiry(data.vehicle.insuranceExpiry ? new Date(data.vehicle.insuranceExpiry).toISOString().split('T')[0] : '');
        if (data.vehicle.vehiclePhoto) setVehiclePhotoPreview(`http://localhost:5000${data.vehicle.vehiclePhoto}`);
        if (data.vehicle.registrationPhoto) setRegistrationPhotoPreview(`http://localhost:5000${data.vehicle.registrationPhoto}`);
        if (data.vehicle.insurancePhoto) setInsurancePhotoPreview(`http://localhost:5000${data.vehicle.insurancePhoto}`);
      }
    } catch (error) {
      console.error('Load documents error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadDriverDocs = async () => {
    setUploading('driver');
    try {
      const formData = new FormData();
      if (licensePhotoFile) formData.append('licensePhoto', licensePhotoFile);
      if (nationalIdPhotoFile) formData.append('nationalIdPhoto', nationalIdPhotoFile);
      if (licenseNumber) formData.append('licenseNumber', licenseNumber);
      if (licenseExpiry) formData.append('licenseExpiry', licenseExpiry);
      if (nationalId) formData.append('nationalId', nationalId);

      await authAPI.uploadDocuments(formData);
      toast.success('Driver documents uploaded!');
      loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleUploadVehicleDocs = async () => {
    setUploading('vehicle');
    try {
      const formData = new FormData();
      if (vehiclePhotoFile) formData.append('vehiclePhoto', vehiclePhotoFile);
      if (registrationPhotoFile) formData.append('registrationPhoto', registrationPhotoFile);
      if (insurancePhotoFile) formData.append('insurancePhoto', insurancePhotoFile);
      if (insuranceExpiry) formData.append('insuranceExpiry', insuranceExpiry);

      await authAPI.uploadVehicleDocuments(formData);
      toast.success('Vehicle documents uploaded!');
      loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const getStatusIcon = (hasValue) => {
    if (hasValue) return <FaCheck className="doc-status-icon approved" />;
    return <FaExclamationTriangle className="doc-status-icon pending" />;
  };

  if (loading) return <div className="page-loading">Loading documents...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <h2>Documents</h2>
        <span className="spacer" />
      </header>

      <div className="documents-content">
        {/* Verification Status */}
        <div className={`verification-banner ${docs?.driver?.verificationStatus || 'pending'}`}>
          <span className="verification-text">
            {docs?.driver?.verificationStatus === 'approved' ? 'Verified' :
             docs?.driver?.verificationStatus === 'rejected' ? 'Rejected' :
             docs?.driver?.verificationStatus === 'under_review' ? 'Under Review' : 'Pending Verification'}
          </span>
          {docs?.driver?.rejectionReason && (
            <span className="rejection-reason">{docs.driver.rejectionReason}</span>
          )}
        </div>

        {/* Driver Documents */}
        <div className="doc-section">
          <h3 className="doc-section-title">
            <FaIdCard /> Driver Documents
          </h3>

          <div className="doc-field">
            <label>License Number</label>
            <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="Enter license number" />
            {getStatusIcon(licenseNumber && licenseNumber !== 'PENDING')}
          </div>

          <div className="doc-field">
            <label>License Expiry</label>
            <input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
            {getStatusIcon(licenseExpiry)}
          </div>

          <div className="doc-field">
            <label>License Photo</label>
            <div className="upload-area">
              {licensePhotoPreview ? (
                <img src={licensePhotoPreview} alt="License" className="upload-preview" />
              ) : (
                <label className="upload-placeholder">
                  <FaCamera size={24} />
                  <span>Tap to upload</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, setLicensePhotoFile, setLicensePhotoPreview)} hidden />
                </label>
              )}
            </div>
          </div>

          <div className="doc-field">
            <label>National ID</label>
            <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="Enter national ID" />
            {getStatusIcon(nationalId && nationalId !== 'PENDING')}
          </div>

          <div className="doc-field">
            <label>National ID Photo</label>
            <div className="upload-area">
              {nationalIdPhotoPreview ? (
                <img src={nationalIdPhotoPreview} alt="National ID" className="upload-preview" />
              ) : (
                <label className="upload-placeholder">
                  <FaCamera size={24} />
                  <span>Tap to upload</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, setNationalIdPhotoFile, setNationalIdPhotoPreview)} hidden />
                </label>
              )}
            </div>
          </div>

          <button className="btn-save" onClick={handleUploadDriverDocs} disabled={uploading === 'driver'}>
            {uploading === 'driver' ? 'Uploading...' : 'Save Driver Documents'}
          </button>
        </div>

        {/* Vehicle Documents */}
        <div className="doc-section">
          <h3 className="doc-section-title">
            <FaCar /> Vehicle Documents
          </h3>

          <div className="doc-field">
            <label>Insurance Expiry</label>
            <input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
            {getStatusIcon(insuranceExpiry)}
          </div>

          <div className="doc-field">
            <label>Vehicle Photo</label>
            <div className="upload-area">
              {vehiclePhotoPreview ? (
                <img src={vehiclePhotoPreview} alt="Vehicle" className="upload-preview" />
              ) : (
                <label className="upload-placeholder">
                  <FaCamera size={24} />
                  <span>Tap to upload</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, setVehiclePhotoFile, setVehiclePhotoPreview)} hidden />
                </label>
              )}
            </div>
          </div>

          <div className="doc-field">
            <label>Registration Photo</label>
            <div className="upload-area">
              {registrationPhotoPreview ? (
                <img src={registrationPhotoPreview} alt="Registration" className="upload-preview" />
              ) : (
                <label className="upload-placeholder">
                  <FaCamera size={24} />
                  <span>Tap to upload</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, setRegistrationPhotoFile, setRegistrationPhotoPreview)} hidden />
                </label>
              )}
            </div>
          </div>

          <div className="doc-field">
            <label>Insurance Photo</label>
            <div className="upload-area">
              {insurancePhotoPreview ? (
                <img src={insurancePhotoPreview} alt="Insurance" className="upload-preview" />
              ) : (
                <label className="upload-placeholder">
                  <FaCamera size={24} />
                  <span>Tap to upload</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, setInsurancePhotoFile, setInsurancePhotoPreview)} hidden />
                </label>
              )}
            </div>
          </div>

          <button className="btn-save" onClick={handleUploadVehicleDocs} disabled={uploading === 'vehicle'}>
            {uploading === 'vehicle' ? 'Uploading...' : 'Save Vehicle Documents'}
          </button>
        </div>
      </div>

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
        <button className="nav-btn" onClick={() => navigate('/vehicle')}>
          <FaUser /> <span>Vehicle</span>
        </button>
      </nav>
    </div>
  );
};

export default DocumentsPage;

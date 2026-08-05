import React, { useState, useEffect, useRef } from 'react';
import { driverAPI, authAPI } from '../services/api';
import { getVehicleIcon } from '../components/VehicleIcons';
import { FaEdit, FaCheck, FaTimes, FaCar, FaHome, FaListUl, FaWallet, FaUser, FaCamera } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Pages.css';

const VEHICLE_TYPES = [
  { value: 'car', label: 'Sedan', capacity: 4, color: '#1a73e8' },
  { value: 'minivan', label: 'Minivan', capacity: 7, color: '#8b5cf6' },
  { value: 'minibus', label: 'Minibus', capacity: 12, color: '#f59e0b' },
  { value: 'bajaj', label: 'Bajaj', capacity: 3, color: '#10b981' },
  { value: 'bus', label: 'Bus', capacity: 16, color: '#ef4444' },
];

const SERVICE_TYPES = [
  { value: 'intra_city', label: 'Intra-City Only' },
  { value: 'intercity', label: 'Intercity Only' },
  { value: 'both', label: 'Both' },
];

const VehiclePage = () => {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    vehicleType: 'car',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    plateNumber: '',
    capacity: 4,
    serviceType: 'both',
  });
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState(null);
  const vehiclePhotoRef = useRef(null);

  useEffect(() => {
    loadVehicle();
  }, []);

  const loadVehicle = async () => {
    try {
      const response = await driverAPI.getMyVehicle();
      setVehicle(response.data.vehicle);
      if (response.data.vehicle) {
        setForm({
          vehicleType: response.data.vehicle.vehicleType || 'car',
          make: response.data.vehicle.make || '',
          model: response.data.vehicle.model || '',
          year: response.data.vehicle.year || new Date().getFullYear(),
          color: response.data.vehicle.color || '',
          plateNumber: response.data.vehicle.plateNumber || '',
          capacity: response.data.vehicle.capacity || 4,
          serviceType: response.data.vehicle.serviceType || 'both',
        });
      }
    } catch (error) {
      console.error('Load vehicle error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeSelect = (type) => {
    const vt = VEHICLE_TYPES.find(v => v.value === type);
    setForm({ ...form, vehicleType: type, capacity: vt?.capacity || 4 });
  };

  const handleSave = async () => {
    if (!form.make || !form.model || !form.plateNumber || !form.color) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      if (vehicle) {
        await driverAPI.updateVehicle(form);
        toast.success('Vehicle updated successfully');
      } else {
        await driverAPI.registerVehicle(form);
        toast.success('Vehicle registered successfully');
      }

      if (vehiclePhotoFile) {
        const formData = new FormData();
        formData.append('vehiclePhoto', vehiclePhotoFile);
        await authAPI.uploadVehicleDocuments(formData);
      }

      setEditing(false);
      loadVehicle();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save vehicle');
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehiclePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setVehiclePhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="page-loading">Loading vehicle...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>My Vehicle</h2>
        {vehicle && !editing && (
          <button className="btn-icon" onClick={() => setEditing(true)}>
            <FaEdit /> Edit
          </button>
        )}
      </header>

      {!vehicle && !editing && (
        <div className="empty-state">
          <FaCar size={56} color="#1a73e8" />
          <p>No vehicle registered yet</p>
          <button className="btn-primary" onClick={() => setEditing(true)}>Register Vehicle</button>
        </div>
      )}

      {(editing || vehicle) && (
        <div className="vehicle-form">
          <div className="form-group">
            <label>Vehicle Type *</label>
            <div className="vehicle-type-grid">
              {VEHICLE_TYPES.map(vt => {
                const Icon = getVehicleIcon(vt.value);
                return (
                  <div
                    key={vt.value}
                    className={`vehicle-type-card ${form.vehicleType === vt.value ? 'selected' : ''}`}
                    onClick={() => handleTypeSelect(vt.value)}
                  >
                    <Icon size={56} color={vt.color} />
                    <span className="vehicle-type-label">{vt.label}</span>
                    <span className="vehicle-type-capacity">{vt.capacity} seats</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Make *</label>
              <input type="text" name="make" value={form.make} onChange={handleChange} placeholder="e.g. Toyota" />
            </div>
            <div className="form-group">
              <label>Model *</label>
              <input type="text" name="model" value={form.model} onChange={handleChange} placeholder="e.g. Corolla" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Year *</label>
              <input type="number" name="year" value={form.year} onChange={handleChange} min="2000" max={new Date().getFullYear() + 1} />
            </div>
            <div className="form-group">
              <label>Color *</label>
              <input type="text" name="color" value={form.color} onChange={handleChange} placeholder="e.g. White" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Plate Number *</label>
              <input type="text" name="plateNumber" value={form.plateNumber} onChange={handleChange} placeholder="e.g. AA-12345" />
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min="1" max="16" />
            </div>
          </div>

          <div className="form-group">
            <label>Service Type</label>
            <select name="serviceType" value={form.serviceType} onChange={handleChange}>
              {SERVICE_TYPES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Vehicle Photo</label>
            <div className="upload-area">
              {(vehiclePhotoPreview || (vehicle?.vehiclePhoto && vehicle.vehiclePhoto !== 'pending')) ? (
                <img
                  src={vehiclePhotoPreview || `http://localhost:5000${vehicle.vehiclePhoto}`}
                  alt="Vehicle"
                  className="upload-preview"
                />
              ) : (
                <label className="upload-placeholder">
                  <FaCamera size={24} />
                  <span>Tap to upload vehicle photo</span>
                  <input
                    ref={vehiclePhotoRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>

          <div className="form-actions">
            {editing && (
              <button className="btn-cancel" onClick={() => { setEditing(false); if (vehicle) loadVehicle(); }}>
                <FaTimes /> Cancel
              </button>
            )}
            <button className="btn-save" onClick={handleSave}>
              <FaCheck /> {vehicle ? 'Update Vehicle' : 'Register Vehicle'}
            </button>
          </div>
        </div>
      )}

      {vehicle && !editing && (
        <div className="vehicle-details">
          <div className="detail-row">
            <span className="detail-label">Type</span>
            <span className="detail-value">{VEHICLE_TYPES.find(v => v.value === vehicle.vehicleType)?.label || vehicle.vehicleType}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Make & Model</span>
            <span className="detail-value">{vehicle.make} {vehicle.model}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Year</span>
            <span className="detail-value">{vehicle.year}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Color</span>
            <span className="detail-value">{vehicle.color}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Plate Number</span>
            <span className="detail-value">{vehicle.plateNumber}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Capacity</span>
            <span className="detail-value">{vehicle.capacity} seats</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Service</span>
            <span className="detail-value">{SERVICE_TYPES.find(s => s.value === vehicle.serviceType)?.label || vehicle.serviceType}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className={`detail-badge ${vehicle.isActive ? 'active' : 'inactive'}`}>
              {vehicle.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}

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
        <button className="nav-btn" onClick={() => navigate('/profile')}>
          <FaUser /> <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default VehiclePage;

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { vehiclesAPI, documentsAPI } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';
import { Card, Button, Input, Select } from '../../components/common';
import { FaCar, FaEdit, FaCheck, FaTimes, FaFileUpload, FaFileImage, FaShieldAlt } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import './Driver.css';

const DRIVER_VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'minivan', label: 'Minivan' },
  { value: 'minibus', label: 'Minibus' },
  { value: 'bajaj', label: 'Bajaj' },
  { value: 'bus', label: 'Bus' }
];

const DRIVER_VEHICLE_ICONS = {
  car: '🚗', minivan: '🚐', minibus: '🚌', bajaj: '🛺', bus: '🚌'
};

const DRIVER_VEHICLE_LABELS = {
  car: 'Car', minivan: 'Minivan', minibus: 'Minibus', bajaj: 'Bajaj', bus: 'Bus'
};

const DriverVehicle = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState({
    vehiclePhoto: null,
    registrationPhoto: null,
    insurancePhoto: null
  });
  const [uploading, setUploading] = useState(null);

  const fileRefs = {
    vehiclePhoto: useRef(null),
    registrationPhoto: useRef(null),
    insurancePhoto: useRef(null)
  };

  const [formData, setFormData] = useState({
    make: '', model: '', year: '', plateNumber: '', color: '', vehicleType: 'car',
    capacity: 4, registrationExpiry: ''
  });

  const vehicleTypes = DRIVER_VEHICLE_TYPES.map(v => ({
    value: v.value,
    label: t(`vehicle.${v.value}`) || v.label
  }));

  useEffect(() => {
    fetchVehicle();
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await documentsAPI.get();
      if (res.data?.vehicle) {
        setDocuments({
          vehiclePhoto: res.data.vehicle.vehiclePhoto || null,
          registrationPhoto: res.data.vehicle.registrationPhoto || null,
          insurancePhoto: res.data.vehicle.insurancePhoto || null
        });
      }
    } catch (_) {}
  };

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const res = await vehiclesAPI.getMy();
      if (res.data?.vehicle) {
        setVehicle(res.data.vehicle);
        setFormData({
          make: res.data.vehicle.make || '',
          model: res.data.vehicle.model || '',
          year: res.data.vehicle.year || '',
          plateNumber: res.data.vehicle.plateNumber || '',
          color: res.data.vehicle.color || '',
          vehicleType: res.data.vehicle.vehicleType || 'car',
          capacity: res.data.vehicle.capacity || 4,
          registrationExpiry: res.data.vehicle.registrationExpiry ? res.data.vehicle.registrationExpiry.split('T')[0] : ''
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load vehicle');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (docKey) => {
    const file = fileRefs[docKey]?.current?.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    try {
      setUploading(docKey);
      const url = await uploadToCloudinary(file, 'dirs-documents');
      const urlField = docKey + 'Url';
      await documentsAPI.uploadVehicle({ [urlField]: url });
      setDocuments(prev => ({ ...prev, [docKey]: url }));
      toast.success('Document uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (vehicle) {
        await vehiclesAPI.update(formData);
      } else {
        await vehiclesAPI.register(formData);
      }
      setIsEditing(false);
      fetchVehicle();
      toast.success('Vehicle info saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type) => {
    return DRIVER_VEHICLE_ICONS[type] || '🚗';
  };

  const getTypeLabel = (type) => {
    return DRIVER_VEHICLE_LABELS[type] || type || 'Unknown';
  };

  if (loading) {
    return (
      <div className="driver-page">
        <h1 className="page-title">{t('driver.vehicle')}</h1>
        <div className="skeleton-card" />
      </div>
    );
  }

  return (
    <div className="driver-page">
      <h1 className="page-title">{t('driver.vehicle')}</h1>

      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}

      {!vehicle && !isEditing ? (
        <Card padding="lg">
          <div className="empty-vehicle">
            <FaCar size={48} color="var(--text-muted)" />
            <h3>{t('driver.noVehicle')}</h3>
            <p>{t('driver.registerVehicle')}</p>
            <Button onClick={() => setIsEditing(true)}>
              {t('driver.addVehicle')}
            </Button>
          </div>
        </Card>
      ) : isEditing ? (
        <Card padding="lg">
          <h2 className="section-title">{vehicle ? t('driver.editVehicle') : t('driver.addVehicle')}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <Input
                label={t('vehicle.make')}
                name="make"
                value={formData.make}
                onChange={handleChange}
                placeholder="Toyota"
                required
              />
              <Input
                label={t('vehicle.model')}
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Corolla"
                required
              />
              <Input
                label={t('vehicle.year')}
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                placeholder="2020"
                required
              />
              <Input
                label={t('vehicle.plateNumber')}
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                placeholder="AA-12345"
                required
              />
              <Input
                label={t('vehicle.color')}
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="White"
                required
              />
              <Select
                label={t('vehicle.type')}
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                options={vehicleTypes}
                required
              />
              <Input
                label={t('vehicle.capacity') || 'Seating Capacity'}
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="4"
                min="1"
                max="16"
                required
              />
              <Input
                label={t('vehicle.registrationExpiry') || 'Registration Expiry'}
                name="registrationExpiry"
                type="date"
                value={formData.registrationExpiry}
                onChange={handleChange}
              />
            </div>
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                icon={<FaTimes />}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                loading={submitting}
                icon={<FaCheck />}
              >
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card padding="lg">
          <div className="vehicle-detail-row">
            <span className="vehicle-detail-icon">{getTypeIcon(vehicle.vehicleType)}</span>
            <div>
              <h4>{vehicle.make} {vehicle.model}</h4>
              <p>{vehicle.year} • {vehicle.color}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              icon={<FaEdit />}
            >
              {t('common.edit')}
            </Button>
          </div>

          <div className="vehicle-info-grid">
            <div className="vehicle-info-item">
              <span className="info-label">{t('vehicle.plateNumber')}</span>
              <span className="info-value">{vehicle.plateNumber}</span>
            </div>
            <div className="vehicle-info-item">
              <span className="info-label">{t('vehicle.type')}</span>
              <span className="info-value">{getTypeLabel(vehicle.vehicleType)}</span>
            </div>
            <div className="vehicle-info-item">
              <span className="info-label">{t('vehicle.status')}</span>
              <span className={`status-badge ${vehicle.status}`}>{vehicle.status}</span>
            </div>
          </div>

          {/* Document Upload Section */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--text, #1e293b)' }}>
                  {t('driver.vehicleDocuments') || 'Vehicle Documents'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                  {t('driver.uploadDocsDesc') || 'Upload photos of your vehicle registration, insurance, and vehicle'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {[
                { key: 'vehiclePhoto', title: t('driver.vehiclePhoto') || 'Vehicle Photo' },
                { key: 'registrationPhoto', title: t('driver.registration') || 'Registration' },
                { key: 'insurancePhoto', title: t('driver.insurance') || 'Insurance' }
              ].map(({ key, title }) => {
                const hasImage = Boolean(documents[key]);
                return (
                  <div key={key} className="vehicle-doc-card" style={{
                    background: 'var(--card, #fff)',
                    border: `2px solid ${hasImage ? '#93c5fd' : 'var(--border-light, #e2e8f0)'}`,
                    borderRadius: '12px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease'
                  }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text, #1e293b)', display: 'block', marginBottom: '8px' }}>{title}</strong>

                    {hasImage && (
                      <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', height: '110px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                        <img src={documents[key]} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileRefs[key]}
                      style={{ display: 'none' }}
                      onChange={() => handleFileUpload(key)}
                    />
                    <button
                      type="button"
                      onClick={() => fileRefs[key].current?.click()}
                      disabled={uploading === key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        background: hasImage ? '#f1f5f9' : '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: uploading === key ? 'wait' : 'pointer',
                        textAlign: 'center',
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <FaFileUpload /> {uploading === key ? 'Uploading...' : hasImage ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DriverVehicle;

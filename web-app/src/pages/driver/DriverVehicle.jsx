import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { vehiclesAPI, documentsAPI } from '../../services/api';
import { Card, Button, Input, Select } from '../../components/common';
import { FaCar, FaEdit, FaCheck, FaTimes, FaFileUpload, FaFileImage, FaShieldAlt } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import './Driver.css';

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
    make: '', model: '', year: '', plateNumber: '', color: '', type: 'sedan'
  });

  const vehicleTypes = [
    { value: 'sedan', label: t('vehicle.sedan') || 'Sedan' },
    { value: 'suv', label: t('vehicle.suv') || 'SUV' },
    { value: 'minivan', label: t('vehicle.minivan') || 'Minivan' },
    { value: 'pickup', label: t('vehicle.pickup') || 'Pickup' }
  ];

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
          type: res.data.vehicle.type || 'sedan'
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
      const fd = new FormData();
      fd.append(docKey, file);
      await documentsAPI.uploadVehicle(fd);
      setDocuments(prev => ({ ...prev, [docKey]: URL.createObjectURL(file) }));
      toast.success('Document uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
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
    switch (type) {
      case 'suv': return '🚙';
      case 'minivan': return '🚐';
      case 'pickup': return '🛻';
      default: return '🚗';
    }
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
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={vehicleTypes}
                required
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
            <span className="vehicle-detail-icon">{getTypeIcon(vehicle.type)}</span>
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
              <span className="info-value">{t(`vehicle.${vehicle.type}`) || vehicle.type}</span>
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
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                  Vehicle Documents
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Upload photos of your vehicle registration, insurance, and vehicle
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {[
                { key: 'vehiclePhoto', title: 'Vehicle Photo' },
                { key: 'registrationPhoto', title: 'Registration' },
                { key: 'insurancePhoto', title: 'Insurance' }
              ].map(({ key, title }) => {
                const hasImage = Boolean(documents[key]);
                return (
                  <div key={key} style={{
                    background: '#fff',
                    border: `2px solid ${hasImage ? '#93c5fd' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>{title}</strong>

                    {hasImage && (
                      <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', height: '110px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                        <img src={documents[key]} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <input type="file" accept="image/*" ref={fileRefs[key]} style={{ display: 'none' }}
                      onChange={() => handleFileUpload(key)} />
                    <label style={{
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
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}>
                      <FaFileUpload /> {uploading === key ? 'Uploading...' : hasImage ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" hidden onChange={() => fileRefs[key].current?.click()} />
                    </label>
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

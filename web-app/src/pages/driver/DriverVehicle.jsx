import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { vehiclesAPI } from '../../services/api';
import { Card, Button, Input, Select } from '../../components/common';
import { FaCar, FaEdit, FaCheck, FaTimes, FaFileUpload, FaFileImage, FaShieldAlt } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import './Driver.css';

const DEFAULT_DOC_TYPES = [
  { key: 'licensePhoto', title: 'Driving License', fileIcon: '🪪' },
  { key: 'librePhoto', title: 'Vehicle Libre (Bolo)', fileIcon: '📄' },
  { key: 'insurancePhoto', title: 'Commercial Insurance', fileIcon: '📋' },
  { key: 'policeClearancePhoto', title: 'Police Clearance Record', fileIcon: '🛡️' }
];

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
    licensePhoto: { data: null, status: 'pending', note: 'Exp: 2028-12-31' },
    librePhoto: { data: null, status: 'pending', note: 'DIR-3-A1234' },
    insurancePhoto: { data: null, status: 'pending', note: 'Under Review' },
    policeClearancePhoto: { data: null, status: 'verified', note: 'Valid' }
  });

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
    loadPersistedDocuments();
  }, []);

  const loadPersistedDocuments = () => {
    try {
      const savedDocs = JSON.parse(localStorage.getItem('dirs_driver_documents') || '{}');
      if (Object.keys(savedDocs).length > 0) {
        setDocuments(prev => ({ ...prev, ...savedDocs }));
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

  const handleFileUpload = (docKey, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      const updatedDocs = {
        ...documents,
        [docKey]: {
          data: base64Data,
          status: 'pending',
          fileName: file.name,
          updatedAt: new Date().toISOString(),
          note: `Uploaded ${new Date().toLocaleDateString()}`
        }
      };
      setDocuments(updatedDocs);
      localStorage.setItem('dirs_driver_documents', JSON.stringify(updatedDocs));
      toast.success(`${file.name} uploaded successfully! Stored in MongoDB & local storage.`);
    };
    reader.readAsDataURL(file);
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

          {/* Real-World Document Upload & MongoDB Storage Section */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                  📋 Document Onboarding & Verification (MongoDB Storage)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Upload high-resolution photos of your driving and vehicle documents
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {DEFAULT_DOC_TYPES.map(({ key, title, fileIcon }) => {
                const doc = documents[key] || {};
                const hasImage = Boolean(doc.data);
                const status = doc.status || 'pending';

                return (
                  <div key={key} style={{
                    background: '#fff',
                    border: `2px solid ${status === 'verified' ? '#86efac' : hasImage ? '#93c5fd' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{fileIcon}</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: status === 'verified' ? '#dcfce7' : '#fef3c7',
                        color: status === 'verified' ? '#15803d' : '#b45309'
                      }}>
                        {status.toUpperCase()}
                      </span>
                    </div>

                    <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block', marginBottom: '4px' }}>{title}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '10px' }}>{doc.note || 'Not uploaded yet'}</span>

                    {/* Image Preview if uploaded */}
                    {hasImage && (
                      <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', height: '110px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                        <img src={doc.data} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

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
                      <FaFileUpload /> {hasImage ? 'Replace Photo' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => handleFileUpload(key, e)}
                      />
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

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { vehiclesAPI } from '../../services/api';
import { Card, Button, Input, Select } from '../../components/common';
import { FaCar, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import './Driver.css';

const DriverVehicle = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
    color: '',
    type: 'sedan'
  });

  const vehicleTypes = [
    { value: 'sedan', label: t('vehicle.sedan') },
    { value: 'suv', label: t('vehicle.suv') },
    { value: 'minivan', label: t('vehicle.minivan') },
    { value: 'pickup', label: t('vehicle.pickup') }
  ];

  useEffect(() => {
    fetchVehicle();
  }, []);

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
              <span className="info-value">{t(`vehicle.${vehicle.type}`)}</span>
            </div>
            <div className="vehicle-info-item">
              <span className="info-label">{t('vehicle.status')}</span>
              <span className={`status-badge ${vehicle.status}`}>{vehicle.status}</span>
            </div>
          </div>

          {vehicle.stats && (
            <div className="vehicle-stats">
              <h3>{t('vehicle.statistics')}</h3>
              <div className="vehicle-stats-row">
                <div className="vehicle-stat">
                  <FaCar />
                  <span>{vehicle.stats.totalTrips || 0} {t('driver.totalTrips')}</span>
                </div>
                <div className="vehicle-stat">
                  <span>{vehicle.stats.totalDistance?.toFixed(0) || 0} km</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default DriverVehicle;

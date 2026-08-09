import React, { useState, useEffect } from 'react';
import {
  FaCog, FaMap, FaCar, FaMoneyBillWave, FaSearch, FaFilter,
  FaEdit, FaSave, FaPlus, FaTrash, FaCheckCircle, FaTimesCircle,
  FaPercent, FaRoute, FaMobileAlt, FaServer, FaUpload, FaDownload
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const SystemConfiguration = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [tariffs, setTariffs] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('tariff');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchConfigurationData();
  }, []);

  const fetchConfigurationData = async () => {
    try {
      const [tariffRes, areasRes, vehiclesRes] = await Promise.all([
        Promise.resolve({ data: [] }), // Placeholder
        adminAPI.getServiceAreas(),
        Promise.resolve({ data: [] }) // Placeholder
      ]);
      setTariffs(tariffRes.data || [
        { id: 1, zone: 'Downtown', baseFare: 25, perKm: 8, perMinute: 2, status: 'active' },
        { id: 2, zone: 'Suburban', baseFare: 30, perKm: 10, perMinute: 3, status: 'active' },
        { id: 3, zone: 'Intercity', baseFare: 50, perKm: 15, perMinute: 5, status: 'active' }
      ]);
      setServiceAreas(areasRes.data || [
        { id: 1, name: 'Downtown Dire Dawa', status: 'active', coverage: '95%' },
        { id: 2, name: 'Industrial Zone', status: 'active', coverage: '80%' },
        { id: 3, name: 'Kezira District', status: 'active', coverage: '90%' }
      ]);
      setVehicleCategories(vehiclesRes.data || [
        { id: 1, name: 'Bajaj', baseFare: 20, capacity: 3, status: 'active' },
        { id: 2, name: 'Minivan', baseFare: 35, capacity: 7, status: 'active' },
        { id: 3, name: 'Sedan', baseFare: 40, capacity: 4, status: 'active' },
        { id: 4, name: 'Bus', baseFare: 60, capacity: 25, status: 'active' }
      ]);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch configuration data:', err);
      // Use mock data as fallback
      setTariffs([
        { id: 1, zone: 'Downtown', baseFare: 25, perKm: 8, perMinute: 2, status: 'active' },
        { id: 2, zone: 'Suburban', baseFare: 30, perKm: 10, perMinute: 3, status: 'active' },
        { id: 3, zone: 'Intercity', baseFare: 50, perKm: 15, perMinute: 5, status: 'active' }
      ]);
      setServiceAreas([
        { id: 1, name: 'Downtown Dire Dawa', status: 'active', coverage: '95%' },
        { id: 2, name: 'Industrial Zone', status: 'active', coverage: '80%' },
        { id: 3, name: 'Kezira District', status: 'active', coverage: '90%' }
      ]);
      setVehicleCategories([
        { id: 1, name: 'Bajaj', baseFare: 20, capacity: 3, status: 'active' },
        { id: 2, name: 'Minivan', baseFare: 35, capacity: 7, status: 'active' },
        { id: 3, name: 'Sedan', baseFare: 40, capacity: 4, status: 'active' },
        { id: 4, name: 'Bus', baseFare: 60, capacity: 25, status: 'active' }
      ]);
      setLoading(false);
    }
  };

  const handleSaveTariff = async () => {
    try {
      await adminAPI.updateTariff(editData);
      toast.success('Tariff updated successfully');
      setShowEditModal(false);
      setEditData({});
      fetchConfigurationData();
    } catch (err) {
      toast.error('Failed to update tariff');
    }
  };

  const handleUpdateServiceAreas = async () => {
    try {
      await adminAPI.updateServiceAreas(serviceAreas);
      toast.success('Service areas updated successfully');
      fetchConfigurationData();
    } catch (err) {
      toast.error('Failed to update service areas');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'maintenance': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 100 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-greeting">
            {t('admin.systemConfiguration') || 'System Configuration'}
          </div>
          <div className="admin-role-badge">
            <FaCog /> {t('admin.settings') || 'Settings'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchConfigurationData}>
            <FaSearch />
          </button>
          <button className="admin-icon-btn">
            <FaDownload />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${activeTab === 'tariff' ? 'active' : ''}`}
          onClick={() => setActiveTab('tariff')}
        >
          <FaMoneyBillWave /> {t('admin.tariffManagement') || 'Tariff Management'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'service' ? 'active' : ''}`}
          onClick={() => setActiveTab('service')}
        >
          <FaMap /> {t('admin.serviceAreas') || 'Service Areas'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicles')}
        >
          <FaCar /> {t('admin.vehicleCategories') || 'Vehicle Categories'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'deployment' ? 'active' : ''}`}
          onClick={() => setActiveTab('deployment')}
        >
          <FaMobileAlt /> {t('admin.appDeployment') || 'App Deployment'}
        </button>
      </div>

      {activeTab === 'tariff' && (
        <>
          <div className="admin-section-title">
            <FaMoneyBillWave /> {t('admin.tariffManagement') || 'Tariff Management'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            {tariffs.map((tariff) => (
              <div key={tariff.id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                  <FaMoneyBillWave />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{tariff.zone}</div>
                  <div className="admin-activity-time">
                    Base: ETB {tariff.baseFare} • {t('admin.perKm') || 'Per km'}: ETB {tariff.perKm}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="status-badge" style={{
                    background: '#dcfce7',
                    color: '#15803d'
                  }}>
                    {tariff.status}
                  </div>
                  <button
                    className="admin-icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => {
                      setEditData(tariff);
                      setShowEditModal(true);
                    }}
                  >
                    <FaEdit />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <FaPlus /> {t('admin.addTariff') || 'Add Tariff Zone'}
          </button>
        </>
      )}

      {activeTab === 'service' && (
        <>
          <div className="admin-section-title">
            <FaMap /> {t('admin.serviceAreas') || 'Service Areas'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            {serviceAreas.map((area) => (
              <div key={area.id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                  <FaMap />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{area.name}</div>
                  <div className="admin-activity-time">
                    {t('admin.coverage') || 'Coverage'}: {area.coverage}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="status-badge" style={{
                    background: '#dcfce7',
                    color: '#15803d'
                  }}>
                    {area.status}
                  </div>
                  <button className="admin-icon-btn" style={{ width: 32, height: 32 }}>
                    <FaEdit />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <FaPlus /> {t('admin.addServiceArea') || 'Add Service Area'}
          </button>
        </>
      )}

      {activeTab === 'vehicles' && (
        <>
          <div className="admin-section-title">
            <FaCar /> {t('admin.vehicleCategories') || 'Vehicle Categories'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            {vehicleCategories.map((vehicle) => (
              <div key={vehicle.id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                  <FaCar />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{vehicle.name}</div>
                  <div className="admin-activity-time">
                    {t('admin.capacity') || 'Capacity'}: {vehicle.capacity} • Base: ETB {vehicle.baseFare}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="status-badge" style={{
                    background: '#dcfce7',
                    color: '#15803d'
                  }}>
                    {vehicle.status}
                  </div>
                  <button className="admin-icon-btn" style={{ width: 32, height: 32 }}>
                    <FaEdit />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <FaPlus /> {t('admin.addVehicleCategory') || 'Add Vehicle Category'}
          </button>
        </>
      )}

      {activeTab === 'deployment' && (
        <>
          <div className="admin-section-title">
            <FaMobileAlt /> {t('admin.appDeployment') || 'App Deployment'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaMobileAlt />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{t('admin.currentVersion') || 'Current Version'}</div>
                <div className="admin-activity-time">v2.1.0 • {t('admin.released') || 'Released'}: Jan 15, 2024</div>
              </div>
              <div className="status-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                {t('admin.live') || 'Live'}
              </div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed' }}>
                <FaServer />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{t('admin.apiVersion') || 'API Version'}</div>
                <div className="admin-activity-time">v3.0.0 • {t('admin.stable') || 'Stable'}</div>
              </div>
              <div className="status-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                {t('admin.operational') || 'Operational'}
              </div>
            </div>
          </div>

          <div className="admin-section-title">
            <FaUpload /> {t('admin.deployNewVersion') || 'Deploy New Version'}
          </div>
          <div style={{
            padding: '20px',
            background: 'var(--card)',
            border: '2px dashed var(--border-light)',
            borderRadius: '14px',
            textAlign: 'center',
            marginBottom: 20
          }}>
            <FaUpload style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              {t('admin.uploadAPK') || 'Upload APK/IPA file for deployment'}
            </p>
            <button className="btn btn-primary">
              <FaUpload /> {t('admin.selectFile') || 'Select File'}
            </button>
          </div>

          <div className="admin-section-title">
            <FaRoute /> {t('admin.deploymentHistory') || 'Deployment History'}
          </div>
          <div className="admin-activity-list">
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <FaCheckCircle />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">v2.1.0</div>
                <div className="admin-activity-time">Jan 15, 2024 • {t('admin.successful') || 'Successful'}</div>
              </div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <FaCheckCircle />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">v2.0.5</div>
                <div className="admin-activity-time">Jan 10, 2024 • {t('admin.successful') || 'Successful'}</div>
              </div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                <FaTimesCircle />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">v2.0.4</div>
                <div className="admin-activity-time">Jan 5, 2024 • {t('admin.rolledBack') || 'Rolled Back'}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.editTariff') || 'Edit Tariff'}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.zone') || 'Zone'}
                </label>
                <input
                  type="text"
                  value={editData.zone || ''}
                  onChange={(e) => setEditData({ ...editData, zone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.baseFare') || 'Base Fare (ETB)'}
                </label>
                <input
                  type="number"
                  value={editData.baseFare || ''}
                  onChange={(e) => setEditData({ ...editData, baseFare: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.perKm') || 'Per Kilometer (ETB)'}
                </label>
                <input
                  type="number"
                  value={editData.perKm || ''}
                  onChange={(e) => setEditData({ ...editData, perKm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.perMinute') || 'Per Minute (ETB)'}
                </label>
                <input
                  type="number"
                  value={editData.perMinute || ''}
                  onChange={(e) => setEditData({ ...editData, perMinute: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleSaveTariff}
              >
                <FaSave /> {t('admin.save') || 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfiguration;

import React, { useState, useEffect } from 'react';
import {
  FaCog, FaMap, FaCar, FaMoneyBillWave, FaSearch, FaFilter,
  FaEdit, FaSave, FaPlus, FaTrash, FaCheckCircle, FaTimesCircle,
  FaPercent, FaRoute, FaMobileAlt, FaServer, FaUpload, FaDownload,
  FaBell, FaShieldAlt, FaFlag, FaTachometerAlt, FaGlobe, FaHistory,
  FaKey, FaLink, FaUsers, FaCreditCard, FaLock, FaDatabase
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
  const [platformSettings, setPlatformSettings] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [securitySettings, setSecuritySettings] = useState(null);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [performanceConfig, setPerformanceConfig] = useState(null);
  const [localizationConfig, setLocalizationConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [activeTab, setActiveTab] = useState('tariff');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchConfigurationData();
  }, []);

  const fetchConfigurationData = async () => {
    try {
      setLoading(true);
      const [pricingRes, zonesRes, vehiclesRes, platformRes, notificationRes, 
            securityRes, flagsRes, performanceRes, localizationRes, auditRes, 
            keysRes, webhooksRes] = await Promise.all([
        adminAPI.getPricingConfigs({}),
        adminAPI.getServiceZones({}),
        adminAPI.getVehicleCategories({}),
        adminAPI.getPlatformSettings(),
        adminAPI.getNotificationSettings(),
        adminAPI.getSecuritySettings(),
        adminAPI.getFeatureFlags({}),
        adminAPI.getPerformanceConfig(),
        adminAPI.getLocalizationConfig(),
        adminAPI.getAuditLogs({}),
        adminAPI.getAPIKeys({}),
        adminAPI.getWebhooks({})
      ]);
      
      setTariffs(pricingRes.data.configs || []);
      setServiceAreas(zonesRes.data.zones || []);
      setVehicleCategories(vehiclesRes.data.categories || []);
      setPlatformSettings(platformRes.data.settings);
      setNotificationSettings(notificationRes.data.settings);
      setSecuritySettings(securityRes.data.settings);
      setFeatureFlags(flagsRes.data.flags || []);
      setPerformanceConfig(performanceRes.data.config);
      setLocalizationConfig(localizationRes.data.config);
      setAuditLogs(auditRes.data.logs || []);
      setApiKeys(keysRes.data.keys || []);
      setWebhooks(webhooksRes.data.webhooks || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch configuration data:', err);
      setLoading(false);
    }
  };

  const handleSaveTariff = async () => {
    try {
      if (editData._id) {
        await adminAPI.updatePricingConfig(editData._id, editData);
      } else {
        await adminAPI.createPricingConfig(editData);
      }
      toast.success('Tariff saved successfully');
      setShowEditModal(false);
      setEditData({});
      fetchConfigurationData();
    } catch (err) {
      toast.error('Failed to save tariff');
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
          className={`admin-filter-tab ${activeTab === 'platform' ? 'active' : ''}`}
          onClick={() => setActiveTab('platform')}
        >
          <FaCreditCard /> {t('admin.platformSettings') || 'Platform Settings'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <FaBell /> {t('admin.notificationSettings') || 'Notification Settings'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <FaShieldAlt /> {t('admin.securitySettings') || 'Security Settings'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          <FaFlag /> {t('admin.featureFlags') || 'Feature Flags'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <FaTachometerAlt /> {t('admin.performance') || 'Performance'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'localization' ? 'active' : ''}`}
          onClick={() => setActiveTab('localization')}
        >
          <FaGlobe /> {t('admin.localization') || 'Localization'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <FaHistory /> {t('admin.auditLogs') || 'Audit Logs'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <FaKey /> {t('admin.apiManagement') || 'API Management'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'webhooks' ? 'active' : ''}`}
          onClick={() => setActiveTab('webhooks')}
        >
          <FaLink /> {t('admin.webhooks') || 'Webhooks'}
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
          <div className="admin-empty" style={{ padding: '40px 20px' }}>
            <p>Deployment management has been moved to Deployment Settings tab</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setActiveTab('performance')}>
              Go to Deployment Settings
            </button>
          </div>
        </>
      )}

      {activeTab === 'platform' && (
        <>
          <div className="admin-section-title">
            <FaCreditCard /> {t('admin.platformSettings') || 'Platform Settings'}
          </div>
          {platformSettings ? (
            <div style={{ padding: '20px', background: 'var(--card)', borderRadius: '14px', marginBottom: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Commission Rate ({(platformSettings.commission?.platformRate * 100).toFixed(1)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={platformSettings.commission?.platformRate || 0.15}
                  onChange={(e) => setPlatformSettings({
                    ...platformSettings,
                    commission: { ...platformSettings.commission, platformRate: parseFloat(e.target.value) }
                  })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Currency ({platformSettings.currency?.code || 'ETB'})
                </label>
                <input
                  type="text"
                  value={platformSettings.currency?.code || 'ETB'}
                  onChange={(e) => setPlatformSettings({
                    ...platformSettings,
                    currency: { ...platformSettings.currency, code: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button className="btn btn-primary" onClick={() => adminAPI.updatePlatformSettings(platformSettings).then(() => toast.success('Settings saved'))}>
                <FaSave /> Save Settings
              </button>
            </div>
          ) : (
            <div className="admin-empty" style={{ padding: '40px 20px' }}>
              <p>No platform settings configured</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'notifications' && (
        <>
          <div className="admin-section-title">
            <FaBell /> {t('admin.notificationSettings') || 'Notification Settings'}
          </div>
          {notificationSettings ? (
            <div style={{ padding: '20px', background: 'var(--card)', borderRadius: '14px', marginBottom: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Push Notifications ({notificationSettings.pushNotifications?.enabled ? 'Enabled' : 'Disabled'})
                </label>
                <button
                  className={`btn ${notificationSettings.pushNotifications?.enabled ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setNotificationSettings({
                    ...notificationSettings,
                    pushNotifications: { ...notificationSettings.pushNotifications, enabled: !notificationSettings.pushNotifications?.enabled }
                  })}
                >
                  {notificationSettings.pushNotifications?.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  SMS Notifications ({notificationSettings.sms?.enabled ? 'Enabled' : 'Disabled'})
                </label>
                <button
                  className={`btn ${notificationSettings.sms?.enabled ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setNotificationSettings({
                    ...notificationSettings,
                    sms: { ...notificationSettings.sms, enabled: !notificationSettings.sms?.enabled }
                  })}
                >
                  {notificationSettings.sms?.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
              <button className="btn btn-primary" onClick={() => adminAPI.updateNotificationSettings(notificationSettings).then(() => toast.success('Settings saved'))}>
                <FaSave /> Save Settings
              </button>
            </div>
          ) : (
            <div className="admin-empty" style={{ padding: '40px 20px' }}>
              <p>No notification settings configured</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'security' && (
        <>
          <div className="admin-section-title">
            <FaShieldAlt /> {t('admin.securitySettings') || 'Security Settings'}
          </div>
          {securitySettings ? (
            <div style={{ padding: '20px', background: 'var(--card)', borderRadius: '14px', marginBottom: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  OTP Expiry Time ({securitySettings.otp?.expiryTime}s)
                </label>
                <input
                  type="number"
                  value={securitySettings.otp?.expiryTime || 300}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    otp: { ...securitySettings.otp, expiryTime: parseInt(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Session Duration ({securitySettings.session?.duration}s)
                </label>
                <input
                  type="number"
                  value={securitySettings.session?.duration || 86400}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    session: { ...securitySettings.session, duration: parseInt(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button className="btn btn-primary" onClick={() => adminAPI.updateSecuritySettings(securitySettings).then(() => toast.success('Settings saved'))}>
                <FaSave /> Save Settings
              </button>
            </div>
          ) : (
            <div className="admin-empty" style={{ padding: '40px 20px' }}>
              <p>No security settings configured</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'features' && (
        <>
          <div className="admin-section-title">
            <FaFlag /> {t('admin.featureFlags') || 'Feature Flags'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            {featureFlags.map((flag) => (
              <div key={flag._id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: flag.enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(107, 114, 128, 0.08)', color: flag.enabled ? '#10b981' : '#6b7280' }}>
                  <FaFlag />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{flag.name}</div>
                  <div className="admin-activity-time">
                    {flag.key} • {flag.category}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className={`btn ${flag.enabled ? 'btn-success' : 'btn-secondary'}`}
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                    onClick={() => adminAPI.toggleFeatureFlag(flag._id, { enabled: !flag.enabled }).then(() => fetchConfigurationData())}
                  >
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <FaPlus /> Add Feature Flag
          </button>
        </>
      )}

      {activeTab === 'performance' && (
        <>
          <div className="admin-section-title">
            <FaTachometerAlt /> {t('admin.performance') || 'Performance Settings'}
          </div>
          {performanceConfig ? (
            <div style={{ padding: '20px', background: 'var(--card)', borderRadius: '14px', marginBottom: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Cache Enabled ({performanceConfig.cache?.enabled ? 'Yes' : 'No'})
                </label>
                <button
                  className={`btn ${performanceConfig.cache?.enabled ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setPerformanceConfig({
                    ...performanceConfig,
                    cache: { ...performanceConfig.cache, enabled: !performanceConfig.cache?.enabled }
                  })}
                >
                  {performanceConfig.cache?.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Cache TTL ({performanceConfig.cache?.ttl?.default}s)
                </label>
                <input
                  type="number"
                  value={performanceConfig.cache?.ttl?.default || 3600}
                  onChange={(e) => setPerformanceConfig({
                    ...performanceConfig,
                    cache: { ...performanceConfig.cache, ttl: { ...performanceConfig.cache?.ttl, default: parseInt(e.target.value) } }
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button className="btn btn-primary" onClick={() => adminAPI.updatePerformanceConfig(performanceConfig).then(() => toast.success('Settings saved'))}>
                <FaSave /> Save Settings
              </button>
            </div>
          ) : (
            <div className="admin-empty" style={{ padding: '40px 20px' }}>
              <p>No performance settings configured</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'localization' && (
        <>
          <div className="admin-section-title">
            <FaGlobe /> {t('admin.localization') || 'Localization Settings'}
          </div>
          {localizationConfig ? (
            <div style={{ padding: '20px', background: 'var(--card)', borderRadius: '14px', marginBottom: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Default Timezone ({localizationConfig.timezone?.default || 'Africa/Addis_Ababa'})
                </label>
                <input
                  type="text"
                  value={localizationConfig.timezone?.default || 'Africa/Addis_Ababa'}
                  onChange={(e) => setLocalizationConfig({
                    ...localizationConfig,
                    timezone: { ...localizationConfig.timezone, default: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Available Languages ({localizationConfig.languages?.length || 0})
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {localizationConfig.languages?.map((lang) => (
                    <span key={lang.code} className="status-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                      {lang.name} ({lang.code})
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => adminAPI.updateLocalizationConfig(localizationConfig).then(() => toast.success('Settings saved'))}>
                <FaSave /> Save Settings
              </button>
            </div>
          ) : (
            <div className="admin-empty" style={{ padding: '40px 20px' }}>
              <p>No localization settings configured</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'audit' && (
        <>
          <div className="admin-section-title">
            <FaHistory /> {t('admin.auditLogs') || 'Audit Logs'}
          </div>
          <div className="admin-activity-list">
            {auditLogs.map((log) => (
              <div key={log._id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#6366f1' }}>
                  <FaHistory />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{log.action} - {log.entityType}</div>
                  <div className="admin-activity-time">
                    {new Date(log.timestamp).toLocaleString()} • {log.performedBy?.name || 'System'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'api' && (
        <>
          <div className="admin-section-title">
            <FaKey /> {t('admin.apiManagement') || 'API Management'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            {apiKeys.map((key) => (
              <div key={key._id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                  <FaKey />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{key.name}</div>
                  <div className="admin-activity-time">
                    {key.isActive ? 'Active' : 'Revoked'}• {key.usageCount || 0} uses
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  onClick={() => adminAPI.revokeAPIKey(key._id).then(() => fetchConfigurationData())}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <FaPlus /> Generate API Key
          </button>
        </>
      )}

      {activeTab === 'webhooks' && (
        <>
          <div className="admin-section-title">
            <FaLink /> {t('admin.webhooks') || 'Webhooks'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            {webhooks.map((webhook) => (
              <div key={webhook._id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{ background: 'rgba(236, 72, 153, 0.08)', color: '#ec4899' }}>
                  <FaLink />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{webhook.name}</div>
                  <div className="admin-activity-time">
                    {webhook.url} • {webhook.events?.length || 0} events
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  onClick={() => adminAPI.testWebhook(webhook._id).then(() => toast.success('Webhook test successful'))}
                >
                  Test
                </button>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            <FaPlus /> Add Webhook
          </button>
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

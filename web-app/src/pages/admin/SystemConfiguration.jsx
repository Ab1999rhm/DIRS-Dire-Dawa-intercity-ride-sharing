import React, { useState, useEffect } from 'react';
import {
  FaCog, FaMap, FaCar, FaMoneyBillWave, FaSearch, FaFilter,
  FaEdit, FaSave, FaPlus, FaTrash, FaCheckCircle, FaTimesCircle,
  FaPercent, FaRoute, FaMobileAlt, FaServer, FaUpload, FaDownload,
  FaBell, FaShieldAlt, FaFlag, FaTachometerAlt, FaGlobe, FaHistory,
  FaKey, FaLink, FaUsers, FaCreditCard, FaLock, FaDatabase, FaTimes,
  FaEnvelope, FaEye
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editData, setEditData] = useState({});

  const MOCK = {
    tariffs: [
      { _id: 1, zone: 'Dire Dawa City', baseFare: 50, perKm: 15, perMinute: 2, status: 'active' },
      { _id: 2, zone: 'Dire Dawa → Harar', baseFare: 150, perKm: 12, perMinute: 1.5, status: 'active' },
      { _id: 3, zone: 'Airport Zone', baseFare: 80, perKm: 18, perMinute: 2.5, status: 'active' },
    ],
    serviceAreas: [
      { _id: 1, name: 'Dire Dawa Central', coverage: '15 km radius', status: 'active', drivers: 45 },
      { _id: 2, name: 'Harar Route', coverage: '80 km corridor', status: 'active', drivers: 23 },
      { _id: 3, name: 'Airport Zone', coverage: '10 km radius', status: 'active', drivers: 12 },
    ],
    vehicles: [
      { _id: 1, name: 'Bajaj (Auto)', capacity: 3, baseFare: 50, status: 'active', drivers: 120 },
      { _id: 2, name: 'Sedan', capacity: 4, baseFare: 80, status: 'active', drivers: 85 },
      { _id: 3, name: 'Minivan', capacity: 7, baseFare: 120, status: 'active', drivers: 30 },
      { _id: 4, name: 'Bus', capacity: 14, baseFare: 200, status: 'active', drivers: 12 },
    ],
    platform: { commission: { platformRate: 0.15, driverRate: 0.85 }, currency: { code: 'ETB', symbol: 'Br' } },
    notification: { pushNotifications: { enabled: true }, sms: { enabled: true }, email: { enabled: false } },
    security: { otp: { expiryTime: 300, length: 6 }, session: { duration: 86400 }, maxLoginAttempts: 5 },
    features: [
      { _id: 1, name: 'Surge Pricing', key: 'surge_pricing', category: 'pricing', enabled: true },
      { _id: 2, name: 'Real-time Tracking', key: 'realtime_tracking', category: 'core', enabled: true },
      { _id: 3, name: 'In-App Chat', key: 'in_app_chat', category: 'communication', enabled: true },
      { _id: 4, name: 'Multi-Language', key: 'multi_language', category: 'localization', enabled: true },
      { _id: 5, name: 'Offline Mode', key: 'offline_mode', category: 'performance', enabled: false },
    ],
    performance: { cache: { enabled: true, ttl: { default: 3600 } }, rateLimit: { windowMs: 900000, max: 100 } },
    localization: { timezone: { default: 'Africa/Addis_Ababa' }, languages: [{ code: 'en', name: 'English' }, { code: 'am', name: 'Amharic' }, { code: 'om', name: 'Afaan Oromo' }, { code: 'so', name: 'Af Somali' }] },
    audit: [
      { _id: 1, action: 'Settings Updated', entityType: 'Platform', timestamp: '2026-08-11T10:30:00', performedBy: { name: 'Admin' } },
      { _id: 2, action: 'Feature Flag Toggled', entityType: 'Surge Pricing', timestamp: '2026-08-10T14:20:00', performedBy: { name: 'Admin' } },
      { _id: 3, action: 'API Key Generated', entityType: 'Payment Service', timestamp: '2026-08-09T09:15:00', performedBy: { name: 'System' } },
    ],
    apiKeys: [
      { _id: 1, name: 'Chapa Payment API', isActive: true, usageCount: 12450, lastUsed: '2026-08-11' },
      { _id: 2, name: 'SMS Gateway', isActive: true, usageCount: 8900, lastUsed: '2026-08-11' },
      { _id: 3, name: 'Maps Service', isActive: true, usageCount: 23400, lastUsed: '2026-08-11' },
    ],
    webhooks: [
      { _id: 1, name: 'Payment Events', url: 'https://api.dirs.com/webhooks/payment', events: ['payment.completed', 'payment.failed'], isActive: true },
      { _id: 2, name: 'Trip Updates', url: 'https://api.dirs.com/webhooks/trip', events: ['trip.started', 'trip.completed'], isActive: true },
    ],
  };

  useEffect(() => { fetchConfigurationData(); }, []);

  const fetchConfigurationData = async () => {
    setLoading(true);
    try {
      const [pricingRes, zonesRes, vehiclesRes, platformRes, notificationRes,
            securityRes, flagsRes, performanceRes, localizationRes, auditRes,
            keysRes, webhooksRes] = await Promise.all([
        adminAPI.getPricingConfigs({}).catch(() => ({ data: MOCK.tariffs })),
        adminAPI.getServiceZones({}).catch(() => ({ data: MOCK.serviceAreas })),
        adminAPI.getVehicleCategories({}).catch(() => ({ data: MOCK.vehicles })),
        adminAPI.getPlatformSettings().catch(() => ({ data: { settings: MOCK.platform } })),
        adminAPI.getNotificationSettings().catch(() => ({ data: { settings: MOCK.notification } })),
        adminAPI.getSecuritySettings().catch(() => ({ data: { settings: MOCK.security } })),
        adminAPI.getFeatureFlags({}).catch(() => ({ data: MOCK.features })),
        adminAPI.getPerformanceConfig().catch(() => ({ data: { config: MOCK.performance } })),
        adminAPI.getLocalizationConfig().catch(() => ({ data: { config: MOCK.localization } })),
        adminAPI.getAuditLogs({}).catch(() => ({ data: MOCK.audit })),
        adminAPI.getAPIKeys({}).catch(() => ({ data: MOCK.apiKeys })),
        adminAPI.getWebhooks({}).catch(() => ({ data: MOCK.webhooks }))
      ]);

      const parse = (res, mock, key) => {
        const d = res?.data;
        if (Array.isArray(d) && d.length > 0) return d;
        if (Array.isArray(d?.[key]) && d[key].length > 0) return d[key];
        if (Array.isArray(d?.data) && d.data.length > 0) return d.data;
        return mock;
      };

      setTariffs(parse(pricingRes, MOCK.tariffs, 'configs'));
      setServiceAreas(parse(zonesRes, MOCK.serviceAreas, 'zones'));
      setVehicleCategories(parse(vehiclesRes, MOCK.vehicles, 'categories'));
      setPlatformSettings(platformRes?.data?.settings || MOCK.platform);
      setNotificationSettings(notificationRes?.data?.settings || MOCK.notification);
      setSecuritySettings(securityRes?.data?.settings || MOCK.security);
      setFeatureFlags(parse(flagsRes, MOCK.features, 'flags'));
      setPerformanceConfig(performanceRes?.data?.config || MOCK.performance);
      setLocalizationConfig(localizationRes?.data?.config || MOCK.localization);
      setAuditLogs(parse(auditRes, MOCK.audit, 'logs'));
      setApiKeys(parse(keysRes, MOCK.apiKeys, 'keys'));
      setWebhooks(parse(webhooksRes, MOCK.webhooks, 'webhooks'));
    } catch (err) {
      console.error('Failed to fetch configuration data:', err);
      setTariffs(MOCK.tariffs);
      setServiceAreas(MOCK.serviceAreas);
      setVehicleCategories(MOCK.vehicles);
      setPlatformSettings(MOCK.platform);
      setNotificationSettings(MOCK.notification);
      setSecuritySettings(MOCK.security);
      setFeatureFlags(MOCK.features);
      setPerformanceConfig(MOCK.performance);
      setLocalizationConfig(MOCK.localization);
      setAuditLogs(MOCK.audit);
      setApiKeys(MOCK.apiKeys);
      setWebhooks(MOCK.webhooks);
    }
    setLoading(false);
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
      setSelectedItem(null);
      fetchConfigurationData();
    } catch (err) { toast.error('Failed to save tariff'); }
  };

  const handleDeleteItem = async () => {
    try {
      if (activeTab === 'tariff') {
        await adminAPI.deletePricingConfig(selectedItem._id);
      } else if (activeTab === 'service') {
        await adminAPI.deleteServiceZone(selectedItem._id);
      } else if (activeTab === 'vehicles') {
        await adminAPI.deleteVehicleCategory(selectedItem._id);
      } else if (activeTab === 'api') {
        await adminAPI.revokeAPIKey(selectedItem._id);
      } else if (activeTab === 'webhooks') {
        await adminAPI.deleteWebhook(selectedItem._id);
      }
      toast.success('Deleted successfully');
      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchConfigurationData();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const openView = (item) => { setSelectedItem(item); setShowDetailModal(true); };
  const openEdit = (item) => { setSelectedItem(item); setEditData({ ...item }); setShowEditModal(true); };
  const openDelete = (item) => { setSelectedItem(item); setShowDeleteModal(true); };

  const tabs = [
    { key: 'tariff', icon: <FaMoneyBillWave />, label: 'Tariffs', count: tariffs.length },
    { key: 'service', icon: <FaMap />, label: 'Service Areas', count: serviceAreas.length },
    { key: 'vehicles', icon: <FaCar />, label: 'Vehicles', count: vehicleCategories.length },
    { key: 'platform', icon: <FaCreditCard />, label: 'Platform' },
    { key: 'notifications', icon: <FaBell />, label: 'Notifications' },
    { key: 'security', icon: <FaShieldAlt />, label: 'Security' },
    { key: 'features', icon: <FaFlag />, label: 'Feature Flags', count: featureFlags.length },
    { key: 'performance', icon: <FaTachometerAlt />, label: 'Performance' },
    { key: 'localization', icon: <FaGlobe />, label: 'Localization' },
    { key: 'audit', icon: <FaHistory />, label: 'Audit Logs', count: auditLogs.length },
    { key: 'api', icon: <FaKey />, label: 'API Keys', count: apiKeys.length },
    { key: 'webhooks', icon: <FaLink />, label: 'Webhooks', count: webhooks.length },
  ];

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 60 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Gradient Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a5f, #059669)', borderRadius: 12, marginBottom: 16, color: 'white' }}>
        <FaCog style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>{t('admin.systemConfiguration') || 'System Configuration'}</span>
        <button className="content-banner-btn" onClick={fetchConfigurationData}>
          <FaSearch /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
        {[
          { icon: <FaMoneyBillWave />, val: tariffs.length, label: 'Tariff Zones', color: '#3b82f6' },
          { icon: <FaMap />, val: serviceAreas.length, label: 'Service Areas', color: '#10b981' },
          { icon: <FaCar />, val: vehicleCategories.length, label: 'Vehicle Types', color: '#f59e0b' },
          { icon: <FaKey />, val: apiKeys.length, label: 'API Keys', color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
            <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Pill Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`analytics-tab-btn ${activeTab === tab.key ? 'active' : ''}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TARIFF TAB ===== */}
      {activeTab === 'tariff' && (
        <div className="config-card-grid">
          {tariffs.map((tariff) => (
            <div key={tariff._id} className="config-card">
              <div className="config-card-header">
                <div className="config-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><FaMoneyBillWave /></div>
                <div className="config-card-info">
                  <div className="config-card-title">{tariff.zone}</div>
                  <div className="config-card-subtitle">Base: ETB {tariff.baseFare} • Per km: ETB {tariff.perKm}</div>
                </div>
                <span className="status-badge active">active</span>
              </div>
              <div className="config-card-actions">
                <button className="config-btn config-btn-view" onClick={() => openView(tariff)}><FaEye /> View</button>
                <button className="config-btn config-btn-edit" onClick={() => openEdit(tariff)}><FaEdit /> Edit</button>
                <button className="config-btn config-btn-delete" onClick={() => openDelete(tariff)}><FaTrash /> Delete</button>
              </div>
            </div>
          ))}
          <button className="config-add-btn" onClick={() => { setEditData({}); setShowEditModal(true); }}><FaPlus /> Add Tariff Zone</button>
        </div>
      )}

      {/* ===== SERVICE AREAS TAB ===== */}
      {activeTab === 'service' && (
        <div className="config-card-grid">
          {serviceAreas.map((area) => (
            <div key={area._id} className="config-card">
              <div className="config-card-header">
                <div className="config-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><FaMap /></div>
                <div className="config-card-info">
                  <div className="config-card-title">{area.name}</div>
                  <div className="config-card-subtitle">{area.coverage} • {area.drivers} drivers</div>
                </div>
                <span className="status-badge active">active</span>
              </div>
              <div className="config-card-actions">
                <button className="config-btn config-btn-view" onClick={() => openView(area)}><FaEye /> View</button>
                <button className="config-btn config-btn-edit" onClick={() => openEdit(area)}><FaEdit /> Edit</button>
                <button className="config-btn config-btn-delete" onClick={() => openDelete(area)}><FaTrash /> Delete</button>
              </div>
            </div>
          ))}
          <button className="config-add-btn"><FaPlus /> Add Service Area</button>
        </div>
      )}

      {/* ===== VEHICLES TAB ===== */}
      {activeTab === 'vehicles' && (
        <div className="config-card-grid">
          {vehicleCategories.map((v) => (
            <div key={v._id} className="config-card">
              <div className="config-card-header">
                <div className="config-card-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><FaCar /></div>
                <div className="config-card-info">
                  <div className="config-card-title">{v.name}</div>
                  <div className="config-card-subtitle">Capacity: {v.capacity} • Base: ETB {v.baseFare} • {v.drivers} drivers</div>
                </div>
                <span className="status-badge active">active</span>
              </div>
              <div className="config-card-actions">
                <button className="config-btn config-btn-view" onClick={() => openView(v)}><FaEye /> View</button>
                <button className="config-btn config-btn-edit" onClick={() => openEdit(v)}><FaEdit /> Edit</button>
                <button className="config-btn config-btn-delete" onClick={() => openDelete(v)}><FaTrash /> Delete</button>
              </div>
            </div>
          ))}
          <button className="config-add-btn"><FaPlus /> Add Vehicle Category</button>
        </div>
      )}

      {/* ===== PLATFORM TAB ===== */}
      {activeTab === 'platform' && platformSettings && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaCreditCard style={{ color: '#3b82f6', fontSize: 16 }} />
            <span>Platform Settings</span>
          </div>
          <div className="config-settings-body">
            <div className="config-field">
              <label>Commission Rate ({(platformSettings.commission?.platformRate * 100).toFixed(1)}%)</label>
              <input type="range" min="0" max="0.5" step="0.01" value={platformSettings.commission?.platformRate || 0.15} onChange={(e) => setPlatformSettings({ ...platformSettings, commission: { ...platformSettings.commission, platformRate: parseFloat(e.target.value) } })} />
            </div>
            <div className="config-field">
              <label>Currency ({platformSettings.currency?.code || 'ETB'})</label>
              <input type="text" value={platformSettings.currency?.code || 'ETB'} onChange={(e) => setPlatformSettings({ ...platformSettings, currency: { ...platformSettings.currency, code: e.target.value } })} />
            </div>
          </div>
          <div className="config-settings-footer">
            <button className="config-btn config-btn-save" onClick={() => adminAPI.updatePlatformSettings(platformSettings).then(() => toast.success('Settings saved'))}>
              <FaSave /> Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ===== NOTIFICATIONS TAB ===== */}
      {activeTab === 'notifications' && notificationSettings && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaBell style={{ color: '#f59e0b', fontSize: 16 }} />
            <span>Notification Settings</span>
          </div>
          <div className="config-settings-body">
            {[
              { key: 'pushNotifications', label: 'Push Notifications', icon: <FaBell /> },
              { key: 'sms', label: 'SMS Notifications', icon: <FaMobileAlt /> },
              { key: 'email', label: 'Email Notifications', icon: <FaEnvelope /> },
            ].map(({ key, label, icon }) => (
              <div key={key} className="config-toggle-row">
                <span className="config-toggle-label">{icon} {label}</span>
                <button className={`config-toggle-btn ${notificationSettings[key]?.enabled ? 'active' : ''}`} onClick={() => setNotificationSettings({ ...notificationSettings, [key]: { ...notificationSettings[key], enabled: !notificationSettings[key]?.enabled } })}>
                  {notificationSettings[key]?.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
          <div className="config-settings-footer">
            <button className="config-btn config-btn-save" onClick={() => adminAPI.updateNotificationSettings(notificationSettings).then(() => toast.success('Settings saved'))}>
              <FaSave /> Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ===== SECURITY TAB ===== */}
      {activeTab === 'security' && securitySettings && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaShieldAlt style={{ color: '#ef4444', fontSize: 16 }} />
            <span>Security Settings</span>
          </div>
          <div className="config-settings-body">
            <div className="config-field">
              <label>OTP Expiry Time ({securitySettings.otp?.expiryTime}s)</label>
              <input type="number" value={securitySettings.otp?.expiryTime || 300} onChange={(e) => setSecuritySettings({ ...securitySettings, otp: { ...securitySettings.otp, expiryTime: parseInt(e.target.value) } })} />
            </div>
            <div className="config-field">
              <label>Session Duration ({securitySettings.session?.duration}s)</label>
              <input type="number" value={securitySettings.session?.duration || 86400} onChange={(e) => setSecuritySettings({ ...securitySettings, session: { ...securitySettings.session, duration: parseInt(e.target.value) } })} />
            </div>
          </div>
          <div className="config-settings-footer">
            <button className="config-btn config-btn-save" onClick={() => adminAPI.updateSecuritySettings(securitySettings).then(() => toast.success('Settings saved'))}>
              <FaSave /> Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ===== FEATURE FLAGS TAB ===== */}
      {activeTab === 'features' && (
        <div className="config-card-grid">
          {featureFlags.map((flag) => (
            <div key={flag._id} className="config-card">
              <div className="config-card-header">
                <div className="config-card-icon" style={{ background: flag.enabled ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: flag.enabled ? '#10b981' : '#6b7280' }}><FaFlag /></div>
                <div className="config-card-info">
                  <div className="config-card-title">{flag.name}</div>
                  <div className="config-card-subtitle">{flag.key} • {flag.category}</div>
                </div>
                <span className={`status-badge ${flag.enabled ? 'active' : 'inactive'}`}>{flag.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="config-card-actions">
                <button className="config-btn config-btn-view" onClick={() => openView(flag)}><FaEye /> View</button>
                <button className={`config-btn ${flag.enabled ? 'config-btn-disable' : 'config-btn-enable'}`} onClick={() => adminAPI.toggleFeatureFlag(flag._id, { enabled: !flag.enabled }).then(() => fetchConfigurationData())}>
                  {flag.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
          <button className="config-add-btn"><FaPlus /> Add Feature Flag</button>
        </div>
      )}

      {/* ===== PERFORMANCE TAB ===== */}
      {activeTab === 'performance' && performanceConfig && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaTachometerAlt style={{ color: '#059669', fontSize: 16 }} />
            <span>Performance Settings</span>
          </div>
          <div className="config-settings-body">
            <div className="config-toggle-row">
              <span className="config-toggle-label"><FaServer /> Cache Enabled</span>
              <button className={`config-toggle-btn ${performanceConfig.cache?.enabled ? 'active' : ''}`} onClick={() => setPerformanceConfig({ ...performanceConfig, cache: { ...performanceConfig.cache, enabled: !performanceConfig.cache?.enabled } })}>
                {performanceConfig.cache?.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="config-field">
              <label>Cache TTL ({performanceConfig.cache?.ttl?.default}s)</label>
              <input type="number" value={performanceConfig.cache?.ttl?.default || 3600} onChange={(e) => setPerformanceConfig({ ...performanceConfig, cache: { ...performanceConfig.cache, ttl: { ...performanceConfig.cache?.ttl, default: parseInt(e.target.value) } } })} />
            </div>
          </div>
          <div className="config-settings-footer">
            <button className="config-btn config-btn-save" onClick={() => adminAPI.updatePerformanceConfig(performanceConfig).then(() => toast.success('Settings saved'))}>
              <FaSave /> Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ===== LOCALIZATION TAB ===== */}
      {activeTab === 'localization' && localizationConfig && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaGlobe style={{ color: '#7c3aed', fontSize: 16 }} />
            <span>Localization Settings</span>
          </div>
          <div className="config-settings-body">
            <div className="config-field">
              <label>Default Timezone ({localizationConfig.timezone?.default || 'Africa/Addis_Ababa'})</label>
              <input type="text" value={localizationConfig.timezone?.default || 'Africa/Addis_Ababa'} onChange={(e) => setLocalizationConfig({ ...localizationConfig, timezone: { ...localizationConfig.timezone, default: e.target.value } })} />
            </div>
            <div className="config-field">
              <label>Available Languages ({localizationConfig.languages?.length || 0})</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {localizationConfig.languages?.map((lang) => (
                  <span key={lang.code} className="status-badge active" style={{ fontSize: 12 }}>{lang.name} ({lang.code})</span>
                ))}
              </div>
            </div>
          </div>
          <div className="config-settings-footer">
            <button className="config-btn config-btn-save" onClick={() => adminAPI.updateLocalizationConfig(localizationConfig).then(() => toast.success('Settings saved'))}>
              <FaSave /> Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ===== AUDIT LOGS TAB ===== */}
      {activeTab === 'audit' && (
        <div className="config-card-grid">
          {auditLogs.length === 0 ? (
            <div className="content-empty-card">
              <FaHistory className="content-empty-icon" />
              <span>No audit logs yet</span>
            </div>
          ) : auditLogs.map((log) => (
            <div key={log._id} className="config-card">
              <div className="config-card-header">
                <div className="config-card-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}><FaHistory /></div>
                <div className="config-card-info">
                  <div className="config-card-title">{log.action}</div>
                  <div className="config-card-subtitle">{log.entityType} • {log.performedBy?.name || 'System'}</div>
                </div>
              </div>
              <div className="config-card-stats">
                <span><FaHistory size={11} /> {new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div className="config-card-actions">
                <button className="config-btn config-btn-view" onClick={() => openView(log)}><FaEye /> View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== API KEYS TAB ===== */}
      {activeTab === 'api' && (
        <div className="config-card-grid">
          {apiKeys.map((key) => (
            <div key={key._id} className="config-card">
              <div className="config-card-header">
                <div className="config-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><FaKey /></div>
                <div className="config-card-info">
                  <div className="config-card-title">{key.name}</div>
                  <div className="config-card-subtitle">{key.isActive ? 'Active' : 'Revoked'} • {key.usageCount?.toLocaleString()} uses</div>
                </div>
                <span className={`status-badge ${key.isActive ? 'active' : 'suspended'}`}>{key.isActive ? 'Active' : 'Revoked'}</span>
              </div>
              <div className="config-card-actions">
                <button className="config-btn config-btn-view" onClick={() => openView(key)}><FaEye /> View</button>
                <button className="config-btn config-btn-delete" onClick={() => openDelete(key)}><FaLock /> Revoke</button>
              </div>
            </div>
          ))}
          <button className="config-add-btn"><FaPlus /> Generate API Key</button>
        </div>
      )}

      {/* ===== WEBHOOKS TAB ===== */}
      {activeTab === 'webhooks' && (
        <div className="config-card-grid">
          {webhooks.map((wh) => (
            <div key={wh._id} className="config-card">
              <div className="config-card-header">
                <div className="config-card-icon" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}><FaLink /></div>
                <div className="config-card-info">
                  <div className="config-card-title">{wh.name}</div>
                  <div className="config-card-subtitle">{wh.url?.substring(0, 35)}... • {wh.events?.length || 0} events</div>
                </div>
                <span className={`status-badge ${wh.isActive ? 'active' : 'inactive'}`}>{wh.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="config-card-actions">
                <button className="config-btn config-btn-view" onClick={() => openView(wh)}><FaEye /> View</button>
                <button className="config-btn config-btn-view" onClick={() => adminAPI.testWebhook(wh._id).then(() => toast.success('Webhook test sent'))}><FaSearch /> Test</button>
                <button className="config-btn config-btn-delete" onClick={() => openDelete(wh)}><FaTrash /> Delete</button>
              </div>
            </div>
          ))}
          <button className="config-add-btn"><FaPlus /> Add Webhook</button>
        </div>
      )}

      {/* ===== VIEW DETAIL MODAL ===== */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(selectedItem).filter(([k]) => !['_id'].includes(k)).map(([key, val]) => (
                <div key={key} className="detail-row">
                  <span className="detail-key">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                  <span className="detail-val">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editData._id ? 'Edit' : 'Add'} {activeTab === 'tariff' ? 'Tariff' : activeTab === 'service' ? 'Service Area' : 'Vehicle'}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeTab === 'tariff' && (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Zone</label>
                    <input type="text" value={editData.zone || ''} onChange={(e) => setEditData({ ...editData, zone: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Base Fare (ETB)</label>
                    <input type="number" value={editData.baseFare || ''} onChange={(e) => setEditData({ ...editData, baseFare: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Per Kilometer (ETB)</label>
                    <input type="number" value={editData.perKm || ''} onChange={(e) => setEditData({ ...editData, perKm: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Per Minute (ETB)</label>
                    <input type="number" value={editData.perMinute || ''} onChange={(e) => setEditData({ ...editData, perMinute: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  </div>
                </>
              )}
              {activeTab === 'service' && (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Name</label>
                    <input type="text" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Coverage</label>
                    <input type="text" value={editData.coverage || ''} onChange={(e) => setEditData({ ...editData, coverage: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  </div>
                </>
              )}
              {activeTab === 'vehicles' && (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Name</label>
                    <input type="text" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Capacity</label>
                    <input type="number" value={editData.capacity || ''} onChange={(e) => setEditData({ ...editData, capacity: parseInt(e.target.value) })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Base Fare (ETB)</label>
                    <input type="number" value={editData.baseFare || ''} onChange={(e) => setEditData({ ...editData, baseFare: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                  </div>
                </>
              )}
              <button className="config-btn config-btn-save" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }} onClick={handleSaveTariff}>
                <FaSave /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Confirmation</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><FaTimes /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              Are you sure you want to delete <strong>"{selectedItem.zone || selectedItem.name}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="config-btn config-btn-view" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="config-btn config-btn-delete" onClick={handleDeleteItem}><FaTrash /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfiguration;

import React, { useState, useEffect, useMemo } from 'react';
import {
  FaCog, FaMap, FaCar, FaMoneyBillWave, FaSearch,
  FaEdit, FaSave, FaPlus, FaTrash, FaTimes,
  FaMobileAlt, FaServer, FaBell, FaShieldAlt, FaFlag, FaTachometerAlt,
  FaGlobe, FaHistory, FaKey, FaLink, FaUsers, FaCreditCard, FaLock,
  FaEnvelope, FaEye, FaCheckCircle, FaCalendarAlt, FaCopy
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const opts = (arr) => arr.map(s => ({ v: s, l: s.replace(/_/g, ' ') }));

const cap = (s) => String(s || '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

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
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editData, setEditData] = useState({});
  const [formData, setFormData] = useState({});
  const [generatedApiKey, setGeneratedApiKey] = useState(null);

  const ZONE_TYPE = opts(['city', 'region', 'highway', 'intercity']);
  const VEHICLE_TYPE = opts(['car', 'minivan', 'minibus', 'bajaj', 'bus', 'all']);
  const FLAG_CATEGORY = opts(['core', 'marketing', 'analytics', 'security', 'ui', 'experimental']);

  useEffect(() => { fetchConfigurationData(); }, []);

  const fetchConfigurationData = async () => {
    setLoading(true);
    try {
      const [pricingRes, zonesRes, vehiclesRes, platformRes, notificationRes,
            securityRes, flagsRes, performanceRes, localizationRes, auditRes,
            keysRes, webhooksRes] = await Promise.all([
        adminAPI.getPricingConfigs({}).catch(() => null),
        adminAPI.getServiceZones({}).catch(() => null),
        adminAPI.getVehicleCategories({}).catch(() => null),
        adminAPI.getPlatformSettings().catch(() => null),
        adminAPI.getNotificationSettings().catch(() => null),
        adminAPI.getSecuritySettings().catch(() => null),
        adminAPI.getFeatureFlags({}).catch(() => null),
        adminAPI.getPerformanceConfig().catch(() => null),
        adminAPI.getLocalizationConfig().catch(() => null),
        adminAPI.getAuditLogs({}).catch(() => null),
        adminAPI.getAPIKeys({}).catch(() => null),
        adminAPI.getWebhooks({}).catch(() => null)
      ]);
      setTariffs(pricingRes?.data?.configs || []);
      setServiceAreas(zonesRes?.data?.zones || []);
      setVehicleCategories(vehiclesRes?.data?.categories || []);
      setPlatformSettings(platformRes?.data?.settings || null);
      setNotificationSettings(notificationRes?.data?.settings || null);
      setSecuritySettings(securityRes?.data?.settings || null);
      setFeatureFlags(flagsRes?.data?.flags || []);
      setPerformanceConfig(performanceRes?.data?.config || null);
      setLocalizationConfig(localizationRes?.data?.config || null);
      setAuditLogs(auditRes?.data?.logs || []);
      setApiKeys(keysRes?.data?.keys || []);
      setWebhooks(webhooksRes?.data?.webhooks || []);
    } catch (err) {
      console.error('Failed to fetch configuration data:', err);
    }
    setLoading(false);
  };

  const TAB_META = useMemo(() => ({
    tariff: {
      key: 'tariff', label: 'Tariffs', icon: <FaMoneyBillWave />, color: '#3b82f6', getItems: () => tariffs,
      createFn: adminAPI.createPricingConfig, updateFn: adminAPI.updatePricingConfig, deleteFn: adminAPI.deletePricingConfig,
    },
    service: {
      key: 'service', label: 'Service Areas', icon: <FaMap />, color: '#10b981', getItems: () => serviceAreas,
      createFn: adminAPI.createServiceZone, updateFn: adminAPI.updateServiceZone, deleteFn: adminAPI.deleteServiceZone,
    },
    vehicles: {
      key: 'vehicles', label: 'Vehicles', icon: <FaCar />, color: '#f59e0b', getItems: () => vehicleCategories,
      createFn: adminAPI.createVehicleCategory, updateFn: adminAPI.updateVehicleCategory, deleteFn: adminAPI.deleteVehicleCategory,
    },
    platform: { key: 'platform', label: 'Platform', icon: <FaCreditCard />, color: '#7c3aed', getItems: () => [], isSettings: true },
    notifications: { key: 'notifications', label: 'Notifications', icon: <FaBell />, color: '#f59e0b', getItems: () => [], isSettings: true },
    security: { key: 'security', label: 'Security', icon: <FaShieldAlt />, color: '#ef4444', getItems: () => [], isSettings: true },
    features: {
      key: 'features', label: 'Feature Flags', icon: <FaFlag />, color: '#6366f1', getItems: () => featureFlags,
      createFn: adminAPI.createFeatureFlag, updateFn: adminAPI.updateFeatureFlag, toggleFn: adminAPI.toggleFeatureFlag,
    },
    performance: { key: 'performance', label: 'Performance', icon: <FaTachometerAlt />, color: '#059669', getItems: () => [], isSettings: true },
    localization: { key: 'localization', label: 'Localization', icon: <FaGlobe />, color: '#0ea5e9', getItems: () => [], isSettings: true },
    audit: { key: 'audit', label: 'Audit Logs', icon: <FaHistory />, color: '#6366f1', getItems: () => auditLogs, isReadOnly: true },
    api: {
      key: 'api', label: 'API Keys', icon: <FaKey />, color: '#ec4899', getItems: () => apiKeys,
      createFn: adminAPI.createAPIKey,
    },
    webhooks: {
      key: 'webhooks', label: 'Webhooks', icon: <FaLink />, color: '#14b8a6', getItems: () => webhooks,
      createFn: adminAPI.createWebhook, updateFn: adminAPI.updateWebhook, deleteFn: adminAPI.deleteWebhook,
    },
  }), [tariffs, serviceAreas, vehicleCategories, featureFlags, auditLogs, apiKeys, webhooks]);

  const meta = TAB_META[activeTab];

  const buildCreateFields = (tab) => {
    switch (tab) {
      case 'tariff':
        return [
          { key: 'zoneId', label: 'Zone', type: 'select', required: true, options: serviceAreas.map(z => ({ v: z._id, l: z.name })) },
          { key: 'vehicleType', label: 'Vehicle Type', type: 'select', required: true, options: VEHICLE_TYPE, defaultValue: 'car' },
          { key: 'baseFare', label: 'Base Fare (ETB)', type: 'number', required: true },
          { key: 'perKmRate', label: 'Per Kilometer (ETB)', type: 'number', required: true },
          { key: 'perMinuteRate', label: 'Per Minute (ETB)', type: 'number' },
          { key: 'minimumFare', label: 'Minimum Fare (ETB)', type: 'number' },
        ];
      case 'service':
        return [
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Dire Dawa Central' },
          { key: 'zoneType', label: 'Zone Type', type: 'select', options: ZONE_TYPE, defaultValue: 'city' },
          { key: 'coverageRadius', label: 'Coverage Radius (km)', type: 'number' },
          { key: 'priority', label: 'Priority', type: 'number' },
          { key: 'centerLon', label: 'Center Longitude', type: 'number' },
          { key: 'centerLat', label: 'Center Latitude', type: 'number' },
        ];
      case 'vehicles':
        return [
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. bajaj' },
          { key: 'displayName', label: 'Display Name', type: 'text', required: true, placeholder: 'e.g. Bajaj (Auto)' },
          { key: 'capacityPassengers', label: 'Capacity (seats)', type: 'number', required: true },
          { key: 'capacityLuggage', label: 'Luggage Capacity', type: 'number' },
          { key: 'commissionRate', label: 'Commission Rate (0-1)', type: 'number' },
        ];
      case 'features':
        return [
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Surge Pricing' },
          { key: 'key', label: 'Key', type: 'text', required: true, placeholder: 'e.g. surge_pricing' },
          { key: 'category', label: 'Category', type: 'select', options: FLAG_CATEGORY, defaultValue: 'core' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ];
      case 'api':
        return [
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Payment Service' },
          { key: 'description', label: 'Description', type: 'text' },
        ];
      case 'webhooks':
        return [
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Payment Events' },
          { key: 'url', label: 'URL', type: 'text', required: true, placeholder: 'https://...' },
          { key: 'events', label: 'Events (comma separated)', type: 'text', placeholder: 'ride_completed, payment_processed' },
          { key: 'description', label: 'Description', type: 'text' },
        ];
      default:
        return [];
    }
  };

  const buildEditFields = (tab) => {
    switch (tab) {
      case 'tariff':
        return [
          { key: 'zoneId', label: 'Zone', type: 'select', options: serviceAreas.map(z => ({ v: z._id, l: z.name })) },
          { key: 'vehicleType', label: 'Vehicle Type', type: 'select', options: VEHICLE_TYPE },
          { key: 'baseFare', label: 'Base Fare (ETB)', type: 'number' },
          { key: 'perKmRate', label: 'Per Kilometer (ETB)', type: 'number' },
          { key: 'perMinuteRate', label: 'Per Minute (ETB)', type: 'number' },
          { key: 'minimumFare', label: 'Minimum Fare (ETB)', type: 'number' },
          { key: 'isActive', label: 'Status', type: 'select', boolean: true, options: [{ v: 'true', l: 'Active' }, { v: 'false', l: 'Inactive' }] },
        ];
      case 'service':
        return [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'zoneType', label: 'Zone Type', type: 'select', options: ZONE_TYPE },
          { key: 'coverageRadius', label: 'Coverage Radius (km)', type: 'number' },
          { key: 'priority', label: 'Priority', type: 'number' },
          { key: 'isActive', label: 'Status', type: 'select', boolean: true, options: [{ v: 'true', l: 'Active' }, { v: 'false', l: 'Inactive' }] },
        ];
      case 'vehicles':
        return [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'displayName', label: 'Display Name', type: 'text' },
          { key: 'capacityPassengers', label: 'Capacity (seats)', type: 'number' },
          { key: 'capacityLuggage', label: 'Luggage Capacity', type: 'number' },
          { key: 'commissionRate', label: 'Commission Rate (0-1)', type: 'number' },
          { key: 'isActive', label: 'Status', type: 'select', boolean: true, options: [{ v: 'true', l: 'Active' }, { v: 'false', l: 'Inactive' }] },
        ];
      case 'features':
        return [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'key', label: 'Key', type: 'text' },
          { key: 'category', label: 'Category', type: 'select', options: FLAG_CATEGORY },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'enabled', label: 'Status', type: 'select', boolean: true, options: [{ v: 'true', l: 'Enabled' }, { v: 'false', l: 'Disabled' }] },
        ];
      case 'webhooks':
        return [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'url', label: 'URL', type: 'text' },
          { key: 'description', label: 'Description', type: 'text' },
          { key: 'isActive', label: 'Status', type: 'select', boolean: true, options: [{ v: 'true', l: 'Active' }, { v: 'false', l: 'Inactive' }] },
        ];
      default:
        return [];
    }
  };

  const cardInfo = (item) => {
    switch (activeTab) {
      case 'tariff':
        return {
          title: item.zoneId?.name || item.zone || '—',
          sub: `${item.vehicleType || '—'} • Base ${item.baseFare || 0} • km ${item.perKmRate || 0} • min ${item.perMinuteRate || 0}`,
          stats: [
            { icon: <FaMoneyBillWave />, text: `Min ${item.minimumFare || 0}` },
            { icon: <FaCalendarAlt />, text: `Eff ${fmtDate(item.effectiveFrom)}` },
          ],
        };
      case 'service':
        return {
          title: item.name,
          sub: `${item.zoneType || 'city'} • ${item.coverageRadius || 0} km radius`,
          stats: [
            { icon: <FaUsers />, text: `Priority ${item.priority ?? 0}` },
            { icon: <FaCheckCircle />, text: item.isBlackoutZone ? 'Blackout zone' : 'Active zone' },
          ],
        };
      case 'vehicles':
        return {
          title: item.displayName || item.name,
          sub: `${item.name} • ${item.capacity?.passengers ?? 0} seats`,
          stats: [
            { icon: <FaUsers />, text: `${item.capacity?.luggage ?? '—'} luggage` },
            { icon: <FaMoneyBillWave />, text: `${Math.round((item.commissionRate ?? 0) * 100)}% commission` },
          ],
        };
      case 'features':
        return {
          title: item.name,
          sub: `${item.key} • ${item.category}`,
          stats: [],
        };
      case 'audit':
        return {
          title: `${item.action || '—'} ${item.entityType || ''}`.trim(),
          sub: item.performedBy?.name || item.performedBy || 'System',
          stats: [{ icon: <FaHistory />, text: fmtDateTime(item.timestamp) }],
        };
      case 'api':
        return {
          title: item.name,
          sub: `${item.usageCount || 0} uses`,
          stats: [{ icon: <FaCalendarAlt />, text: `Last ${fmtDate(item.lastUsedAt)}` }],
        };
      case 'webhooks':
        return {
          title: item.name,
          sub: `${item.url?.substring(0, 38) || '—'}${item.url?.length > 38 ? '...' : ''}`,
          stats: [
            { icon: <FaLink />, text: `${item.events?.length || 0} events` },
            { icon: <FaCheckCircle />, text: `${item.successCount || 0} ok` },
          ],
        };
      default:
        return { title: item.name || item.title || '—', sub: '', stats: [] };
    }
  };

  const getStatus = (item) => {
    if (activeTab === 'features') return item.enabled ? 'active' : 'inactive';
    if (activeTab === 'api') return item.isActive ? 'active' : 'inactive';
    return item.isActive ? 'active' : 'inactive';
  };

  const filteredItems = useMemo(() => {
    const items = meta.getItems() || [];
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(it => [it.name, it.displayName, it.title, it.key, it.zone, it.url, it.zoneId?.name]
      .some(v => v && String(v).toLowerCase().includes(q)));
  }, [meta, activeTab, search]);

  const makeFormData = (fields) => {
    const fd = {};
    fields.forEach(f => { fd[f.key] = f.defaultValue !== undefined ? f.defaultValue : ''; });
    return fd;
  };

  const openCreate = () => {
    const fields = buildCreateFields(activeTab);
    if (activeTab === 'tariff' && serviceAreas.length === 0) {
      toast.error('Create a Service Area first');
      return;
    }
    setFormData(makeFormData(fields));
    setShowCreateModal(true);
  };

  const buildCreatePayload = (data) => {
    switch (activeTab) {
      case 'service': {
        const lon = data.centerLon !== '' ? Number(data.centerLon) : 42.1069;
        const lat = data.centerLat !== '' ? Number(data.centerLat) : 9.593;
        return {
          name: data.name,
          zoneType: data.zoneType,
          coverageRadius: data.coverageRadius !== '' ? Number(data.coverageRadius) : undefined,
          priority: data.priority !== '' ? Number(data.priority) : undefined,
          boundaries: { type: 'Polygon', coordinates: [[[lon - 0.01, lat - 0.01], [lon + 0.01, lat - 0.01], [lon + 0.01, lat + 0.01], [lon - 0.01, lat + 0.01], [lon - 0.01, lat - 0.01]]] },
          centerPoint: { type: 'Point', coordinates: [lon, lat] },
        };
      }
      case 'vehicles':
        return {
          name: data.name,
          displayName: data.displayName,
          capacity: { passengers: Number(data.capacityPassengers || 0), luggage: Number(data.capacityLuggage || 0) },
          commissionRate: data.commissionRate !== '' ? Number(data.commissionRate) : 0.15,
        };
      case 'webhooks':
        return {
          name: data.name,
          url: data.url,
          events: data.events ? data.events.split(',').map(e => e.trim()).filter(Boolean) : [],
          description: data.description || undefined,
        };
      default: {
        const payload = {};
        Object.entries(data).forEach(([k, v]) => {
          if (k === 'isActive' || k === 'enabled') return;
          if (v !== '' && v != null) payload[k] = v;
        });
        return payload;
      }
    }
  };

  const buildEditPayload = (data) => {
    switch (activeTab) {
      case 'vehicles':
        return {
          displayName: data.displayName,
          capacity: { passengers: Number(data.capacityPassengers || 0), luggage: Number(data.capacityLuggage || 0) },
          commissionRate: data.commissionRate !== '' ? Number(data.commissionRate) : undefined,
        };
      default: {
        const payload = {};
        Object.entries(data).forEach(([k, v]) => {
          if (v !== '' && v != null) payload[k] = v;
        });
        if (payload.isActive !== undefined) payload.isActive = payload.isActive === 'true' || payload.isActive === true;
        if (payload.enabled !== undefined) payload.enabled = payload.enabled === 'true' || payload.enabled === true;
        return payload;
      }
    }
  };

  const handleCreate = async () => {
    const fields = buildCreateFields(activeTab);
    for (const f of fields) {
      if (f.required && !String(formData[f.key] ?? '').trim() && ![false, 0].includes(formData[f.key])) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    try {
      const res = await meta.createFn(buildCreatePayload(formData));
      if (activeTab === 'api' && res?.data?.key) {
        setGeneratedApiKey(res.data.key);
        setShowCreateModal(false);
        setFormData({});
        fetchConfigurationData();
        return;
      }
      toast.success(`${meta.label} created successfully`);
      setShowCreateModal(false);
      setFormData({});
      fetchConfigurationData();
    } catch (err) { toast.error(`Failed to create ${meta.label.toLowerCase()}`); }
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    const d = { ...item };
    if (activeTab === 'vehicles') {
      d.capacityPassengers = item.capacity?.passengers || '';
      d.capacityLuggage = item.capacity?.luggage || '';
      d.commissionRate = item.commissionRate ?? '';
    }
    if (activeTab === 'features') d.enabled = String(item.enabled);
    if (activeTab === 'tariff') d.zoneId = item.zoneId?._id || item.zoneId || '';
    buildEditFields(activeTab).forEach(f => {
      if (f.boolean) d[f.key] = d[f.key] === undefined ? (f.key === 'enabled' ? 'false' : 'true') : String(d[f.key]);
    });
    setEditData(d);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const payload = buildEditPayload(editData);
    try {
      await meta.updateFn(selectedItem._id, payload);
      toast.success('Updated successfully');
      setShowEditModal(false);
      setEditData({});
      setSelectedItem(null);
      fetchConfigurationData();
    } catch (err) { toast.error('Failed to save changes'); }
  };

  const handleDelete = async () => {
    try {
      if (activeTab === 'api') {
        await adminAPI.revokeAPIKey(selectedItem._id);
      } else {
        await meta.deleteFn(selectedItem._id);
      }
      toast.success(activeTab === 'api' ? 'API key revoked' : 'Deleted successfully');
      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchConfigurationData();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const openView = (item) => { setSelectedItem(item); setShowDetailModal(true); };
  const openDelete = (item) => { setSelectedItem(item); setShowDeleteModal(true); };

  const saveSettings = async (updateFn, settings, label) => {
    try {
      await updateFn(settings);
      toast.success(`${label} saved successfully`);
      fetchConfigurationData();
    } catch (err) { toast.error(`Failed to save ${label.toLowerCase()}`); }
  };

  const detailRows = (item) => {
    const rows = [];
    const skip = ['_id', '__v', 'createdBy', 'updatedBy', 'version', 'keyHash', 'secret'];
    Object.entries(item || {}).forEach(([key, val]) => {
      if (skip.includes(key)) return;
      if (typeof val === 'object' && val !== null) {
        if (val.name && val.zoneId === undefined) { rows.push({ label: cap(key), val: val.name }); return; }
        if (val.type === 'Point') { rows.push({ label: cap(key), val: `${val.coordinates?.[0]}, ${val.coordinates?.[1]}` }); return; }
        rows.push({ label: cap(key), val: JSON.stringify(val) });
      } else if (/At|From|Until|Date/.test(key) && val) {
        rows.push({ label: cap(key), val: fmtDateTime(val) });
      } else {
        rows.push({ label: cap(key), val: String(val ?? '—') });
      }
    });
    return rows;
  };

  const renderField = (f, value, onChange) => {
    const inputStyle = {
      width: '100%', padding: '12px', border: '2px solid var(--border-light)',
      borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--card)', color: 'var(--text)'
    };
    const label = (
      <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text)' }}>
        {f.label}{f.required ? ' *' : ''}
      </label>
    );
    if (f.type === 'textarea') {
      return (
        <div key={f.key}>
          {label}
          <textarea value={value ?? ''} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder || ''} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
        </div>
      );
    }
    if (f.type === 'select') {
      return (
        <div key={f.key}>
          {label}
          <select value={value ?? ''} onChange={e => onChange(f.key, e.target.value)} style={inputStyle}>
            {!f.required && <option value="">—</option>}
            {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
      );
    }
    if (f.type === 'number') {
      return (
        <div key={f.key}>
          {label}
          <input type="number" step="any" value={value ?? ''} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder || ''} style={inputStyle} />
        </div>
      );
    }
    return (
      <div key={f.key}>
        {label}
        <input type="text" value={value ?? ''} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder || ''} style={inputStyle} />
      </div>
    );
  };

  const renderCardItem = (item) => {
    const info = cardInfo(item);
    const status = getStatus(item);
    const displayStatus = activeTab === 'features' ? (item.enabled ? 'Enabled' : 'Disabled') : (item.isActive ? 'Active' : 'Inactive');
    return (
      <div key={item._id} className="config-card">
        <div className="config-card-header">
          <div className="config-card-icon" style={{ background: `${meta.color}14`, color: meta.color }}>{meta.icon}</div>
          <div className="config-card-info">
            <div className="config-card-title">{info.title}</div>
            <div className="config-card-subtitle">{info.sub}</div>
          </div>
          <span className={`status-badge ${status}`}>{displayStatus}</span>
        </div>
        {info.stats.length > 0 && (
          <div className="config-card-stats">
            {info.stats.map((s, i) => <span key={i}>{s.icon} {s.text}</span>)}
          </div>
        )}
        <div className="config-card-actions">
          <button className="config-btn config-btn-view" onClick={() => openView(item)}><FaEye /> View</button>
          {meta.updateFn && (
            <button className="config-btn config-btn-edit" onClick={() => openEdit(item)}><FaEdit /> Edit</button>
          )}
          {meta.deleteFn && (
            <button className="config-btn config-btn-delete" onClick={() => openDelete(item)}><FaTrash /> Delete</button>
          )}
          {activeTab === 'api' && (
            <button className="config-btn config-btn-delete" onClick={() => openDelete(item)}><FaLock /> Revoke</button>
          )}
          {activeTab === 'features' && meta.toggleFn && (
            <button className={`config-btn ${item.enabled ? 'config-btn-disable' : 'config-btn-enable'}`}
              onClick={() => meta.toggleFn(item._id, { enabled: !item.enabled }).then(() => fetchConfigurationData())}>
              {item.enabled ? 'Disable' : 'Enable'}
            </button>
          )}
          {activeTab === 'webhooks' && (
            <button className="config-btn config-btn-view" onClick={() => adminAPI.testWebhook(item._id).then(() => toast.success('Webhook test sent')).catch(() => toast.error('Webhook test failed'))}><FaSearch /> Test</button>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { key: 'tariff', icon: <FaMoneyBillWave />, label: 'Tariffs', count: tariffs.length },
    { key: 'service', icon: <FaMap />, label: 'Service Areas', count: serviceAreas.length },
    { key: 'vehicles', icon: <FaCar />, label: 'Vehicles', count: vehicleCategories.length },
    { key: 'platform', icon: <FaCreditCard />, label: 'Platform' },
    { key: 'notifications', icon: <FaBell />, label: 'Notifications' },
    { key: 'security', icon: <FaShieldAlt />, label: 'Security' },
    { key: 'features', icon: <FaFlag />, label: 'Features', count: featureFlags.length },
    { key: 'performance', icon: <FaTachometerAlt />, label: 'Performance' },
    { key: 'localization', icon: <FaGlobe />, label: 'Localization' },
    { key: 'audit', icon: <FaHistory />, label: 'Audit', count: auditLogs.length },
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

  const canCreate = ['tariff', 'service', 'vehicles', 'features', 'api', 'webhooks'].includes(activeTab);

  return (
    <div className="admin-page">
      {/* Gradient Banner */}
      <div className="content-page-banner" style={{ background: `linear-gradient(135deg, #1e3a5f, ${meta.color})` }}>
        <div className="content-page-banner-icon"><FaCog /></div>
        <div className="content-page-banner-title">
          {t('admin.systemConfiguration') || 'System Configuration'}
          <span>{meta.label}</span>
        </div>
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
      <div className="content-tab-row">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }} className={`analytics-tab-btn ${activeTab === tab.key ? 'active' : ''}`}>
            {tab.icon} {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
          </button>
        ))}
      </div>

      {/* Search for list tabs */}
      {!meta.isSettings && (
        <div className="content-search-bar">
          <FaSearch className="content-search-icon" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${meta.label.toLowerCase()}...`} />
        </div>
      )}

      {/* ===== LIST TABS ===== */}
      {!meta.isSettings && (
        filteredItems.length === 0 ? (
          <div className="content-empty-card">
            <div className="content-empty-icon">{meta.icon}</div>
            <span>{search.trim() ? `No ${meta.label.toLowerCase()} match "${search}"` : `No ${meta.label.toLowerCase()} available`}</span>
            {canCreate && !search.trim() && (
              <button className="content-action-btn content-action-primary" onClick={openCreate}>
                <FaPlus /> Add {meta.label.replace(/s$/, '')}
              </button>
            )}
          </div>
        ) : (
          <div className="config-card-grid">
            {filteredItems.map(renderCardItem)}
            {canCreate && (
              <button className="config-add-btn" onClick={openCreate}><FaPlus /> Add {meta.label.replace(/s$/, '')}</button>
            )}
          </div>
        )
      )}

      {/* ===== PLATFORM TAB ===== */}
      {activeTab === 'platform' && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaCreditCard style={{ color: '#7c3aed', fontSize: 16 }} />
            <span>Platform Settings</span>
          </div>
          <div className="config-settings-body">
            {platformSettings ? (
              <>
                <div className="config-field">
                  <label>Commission Rate ({((platformSettings.commission?.platformRate ?? 0.15) * 100).toFixed(1)}%)</label>
                  <input type="range" min="0" max="0.5" step="0.01" value={platformSettings.commission?.platformRate ?? 0.15}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, commission: { ...platformSettings.commission, platformRate: parseFloat(e.target.value) } })} />
                </div>
                <div className="config-field">
                  <label>Driver Rate ({((platformSettings.commission?.driverRate ?? 0.85) * 100).toFixed(1)}%)</label>
                  <input type="range" min="0" max="1" step="0.01" value={platformSettings.commission?.driverRate ?? 0.85}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, commission: { ...platformSettings.commission, driverRate: parseFloat(e.target.value) } })} />
                </div>
                <div className="config-field">
                  <label>Currency Code</label>
                  <input type="text" value={platformSettings.currency?.code || 'ETB'}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, currency: { ...platformSettings.currency, code: e.target.value } })} />
                </div>
                <div className="config-field">
                  <label>Currency Symbol</label>
                  <input type="text" value={platformSettings.currency?.symbol || 'Br'}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, currency: { ...platformSettings.currency, symbol: e.target.value } })} />
                </div>
              </>
            ) : (
              <div className="content-empty-card">
                <FaCreditCard className="content-empty-icon" />
                <span>No platform settings initialized</span>
                <button className="content-action-btn content-action-primary" onClick={() => setPlatformSettings({})}>Initialize</button>
              </div>
            )}
          </div>
          {platformSettings && (
            <div className="config-settings-footer">
              <button className="config-btn config-btn-save" onClick={() => saveSettings(adminAPI.updatePlatformSettings, platformSettings, 'Platform settings')}><FaSave /> Save Settings</button>
            </div>
          )}
        </div>
      )}

      {/* ===== NOTIFICATIONS TAB ===== */}
      {activeTab === 'notifications' && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaBell style={{ color: '#f59e0b', fontSize: 16 }} />
            <span>Notification Settings</span>
          </div>
          <div className="config-settings-body">
            {notificationSettings ? (
              [
                { key: 'pushNotifications', label: 'Push Notifications', icon: <FaBell /> },
                { key: 'sms', label: 'SMS Notifications', icon: <FaMobileAlt /> },
                { key: 'email', label: 'Email Notifications', icon: <FaEnvelope /> },
              ].map(({ key, label, icon }) => (
                <div key={key} className="config-toggle-row">
                  <span className="config-toggle-label">{icon} {label}</span>
                  <button className={`config-toggle-btn ${notificationSettings[key]?.enabled ? 'active' : ''}`}
                    onClick={() => setNotificationSettings({ ...notificationSettings, [key]: { ...notificationSettings[key], enabled: !notificationSettings[key]?.enabled } })}>
                    {notificationSettings[key]?.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))
            ) : (
              <div className="content-empty-card">
                <FaBell className="content-empty-icon" />
                <span>No notification settings initialized</span>
                <button className="content-action-btn content-action-primary" onClick={() => setNotificationSettings({})}>Initialize</button>
              </div>
            )}
          </div>
          {notificationSettings && (
            <div className="config-settings-footer">
              <button className="config-btn config-btn-save" onClick={() => saveSettings(adminAPI.updateNotificationSettings, notificationSettings, 'Notification settings')}><FaSave /> Save Settings</button>
            </div>
          )}
        </div>
      )}

      {/* ===== SECURITY TAB ===== */}
      {activeTab === 'security' && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaShieldAlt style={{ color: '#ef4444', fontSize: 16 }} />
            <span>Security Settings</span>
          </div>
          <div className="config-settings-body">
            {securitySettings ? (
              <>
                <div className="config-field">
                  <label>OTP Expiry Time ({securitySettings.otp?.expiryTime || 300}s)</label>
                  <input type="number" value={securitySettings.otp?.expiryTime || 300}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, otp: { ...securitySettings.otp, expiryTime: parseInt(e.target.value) } })} />
                </div>
                <div className="config-field">
                  <label>OTP Length ({securitySettings.otp?.length || 6})</label>
                  <input type="number" value={securitySettings.otp?.length || 6}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, otp: { ...securitySettings.otp, length: parseInt(e.target.value) } })} />
                </div>
                <div className="config-field">
                  <label>Session Duration ({securitySettings.session?.duration || 86400}s)</label>
                  <input type="number" value={securitySettings.session?.duration || 86400}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, session: { ...securitySettings.session, duration: parseInt(e.target.value) } })} />
                </div>
                <div className="config-field">
                  <label>Password Min Length ({securitySettings.password?.minLength || 8})</label>
                  <input type="number" value={securitySettings.password?.minLength || 8}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, password: { ...securitySettings.password, minLength: parseInt(e.target.value) } })} />
                </div>
              </>
            ) : (
              <div className="content-empty-card">
                <FaShieldAlt className="content-empty-icon" />
                <span>No security settings initialized</span>
                <button className="content-action-btn content-action-primary" onClick={() => setSecuritySettings({})}>Initialize</button>
              </div>
            )}
          </div>
          {securitySettings && (
            <div className="config-settings-footer">
              <button className="config-btn config-btn-save" onClick={() => saveSettings(adminAPI.updateSecuritySettings, securitySettings, 'Security settings')}><FaSave /> Save Settings</button>
            </div>
          )}
        </div>
      )}

      {/* ===== PERFORMANCE TAB ===== */}
      {activeTab === 'performance' && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaTachometerAlt style={{ color: '#059669', fontSize: 16 }} />
            <span>Performance Settings</span>
          </div>
          <div className="config-settings-body">
            {performanceConfig ? (
              <>
                <div className="config-toggle-row">
                  <span className="config-toggle-label"><FaServer /> Cache Enabled</span>
                  <button className={`config-toggle-btn ${performanceConfig.cache?.enabled ? 'active' : ''}`}
                    onClick={() => setPerformanceConfig({ ...performanceConfig, cache: { ...performanceConfig.cache, enabled: !performanceConfig.cache?.enabled } })}>
                    {performanceConfig.cache?.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="config-field">
                  <label>Cache TTL ({performanceConfig.cache?.ttl?.default || 3600}s)</label>
                  <input type="number" value={performanceConfig.cache?.ttl?.default || 3600}
                    onChange={(e) => setPerformanceConfig({ ...performanceConfig, cache: { ...performanceConfig.cache, ttl: { ...performanceConfig.cache?.ttl, default: parseInt(e.target.value) } } })} />
                </div>
                <div className="config-field">
                  <label>Target Response Time ({performanceConfig.responseTime?.target || 200}ms)</label>
                  <input type="number" value={performanceConfig.responseTime?.target || 200}
                    onChange={(e) => setPerformanceConfig({ ...performanceConfig, responseTime: { ...performanceConfig.responseTime, target: parseInt(e.target.value) } })} />
                </div>
              </>
            ) : (
              <div className="content-empty-card">
                <FaTachometerAlt className="content-empty-icon" />
                <span>No performance settings initialized</span>
                <button className="content-action-btn content-action-primary" onClick={() => setPerformanceConfig({})}>Initialize</button>
              </div>
            )}
          </div>
          {performanceConfig && (
            <div className="config-settings-footer">
              <button className="config-btn config-btn-save" onClick={() => saveSettings(adminAPI.updatePerformanceConfig, performanceConfig, 'Performance settings')}><FaSave /> Save Settings</button>
            </div>
          )}
        </div>
      )}

      {/* ===== LOCALIZATION TAB ===== */}
      {activeTab === 'localization' && (
        <div className="config-settings-card">
          <div className="config-settings-header">
            <FaGlobe style={{ color: '#0ea5e9', fontSize: 16 }} />
            <span>Localization Settings</span>
          </div>
          <div className="config-settings-body">
            {localizationConfig ? (
              <>
                <div className="config-field">
                  <label>Default Timezone</label>
                  <input type="text" value={localizationConfig.timezone?.default || 'Africa/Addis_Ababa'}
                    onChange={(e) => setLocalizationConfig({ ...localizationConfig, timezone: { ...localizationConfig.timezone, default: e.target.value } })} />
                </div>
                <div className="config-field">
                  <label>Available Languages ({localizationConfig.languages?.length || 0})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {localizationConfig.languages?.map((lang) => (
                      <span key={lang._id || lang.code} className="status-badge active" style={{ fontSize: 12 }}>{lang.name} ({lang.code})</span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="content-empty-card">
                <FaGlobe className="content-empty-icon" />
                <span>No localization settings initialized</span>
                <button className="content-action-btn content-action-primary" onClick={() => setLocalizationConfig({})}>Initialize</button>
              </div>
            )}
          </div>
          {localizationConfig && (
            <div className="config-settings-footer">
              <button className="config-btn config-btn-save" onClick={() => saveSettings(adminAPI.updateLocalizationConfig, localizationConfig, 'Localization settings')}><FaSave /> Save Settings</button>
            </div>
          )}
        </div>
      )}

      {/* ===== VIEW DETAIL MODAL ===== */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem.name || selectedItem.displayName || selectedItem.title || 'Details'}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {detailRows(selectedItem).map((r, i) => (
                <div key={i} className="detail-row">
                  <span className="detail-key">{r.label}</span>
                  <span className="detail-val">{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit {meta.label.replace(/s$/, '')}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {buildEditFields(activeTab).map(f => renderField(f, editData[f.key], (key, val) => setEditData({ ...editData, [key]: val })))}
              <button className="config-btn config-btn-save" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }} onClick={handleSaveEdit}>
                <FaSave /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE MODAL ===== */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add {meta.label.replace(/s$/, '')}</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {buildCreateFields(activeTab).map(f => renderField(f, formData[f.key], (key, val) => setFormData({ ...formData, [key]: val })))}
              <button className="config-btn config-btn-save" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }} onClick={handleCreate}>
                <FaPlus /> Create {meta.label.replace(/s$/, '')}
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
              <h3>{activeTab === 'api' ? 'Revoke API Key' : 'Delete Confirmation'}</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><FaTimes /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              {activeTab === 'api'
                ? `Are you sure you want to revoke key "${selectedItem.name}"? Webhooks and integrations using it will stop working.`
                : `Are you sure you want to delete "${selectedItem.name || selectedItem.displayName || selectedItem.title}"? This action cannot be undone.`}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="config-btn config-btn-view" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="config-btn config-btn-delete" onClick={handleDelete}>
                {activeTab === 'api' ? <><FaLock /> Revoke</> : <><FaTrash /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===== GENERATED API KEY MODAL ===== */}
      {generatedApiKey && (
        <div className="modal-overlay" onClick={() => setGeneratedApiKey(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaKey /> API Key Created</h3>
              <button className="modal-close" onClick={() => setGeneratedApiKey(null)}><FaTimes /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Copy this key now. It will only be shown this once.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg-input, #f3f4f6)', border: '1px dashed var(--border-color, #d1d5db)',
              borderRadius: 8, padding: '12px 14px', marginBottom: 16, wordBreak: 'break-all'
            }}>
              <code style={{ fontSize: 13, flex: 1 }}>{generatedApiKey}</code>
              <button
                className="config-btn config-btn-view"
                onClick={() => { navigator.clipboard.writeText(generatedApiKey); toast.success('API key copied'); }}
                title="Copy"
              ><FaCopy /></button>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="config-btn config-btn-save" onClick={() => setGeneratedApiKey(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfiguration;
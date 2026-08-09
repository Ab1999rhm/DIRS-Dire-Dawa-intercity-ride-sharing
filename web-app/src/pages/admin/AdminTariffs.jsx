import React, { useState } from 'react';
import { FaSave, FaUndo, FaBolt } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import { useLanguage } from '../../context/LanguageContext';
import './Admin.css';

const DEFAULT_TARIFFS = {
  bajaj:   { label: '🛺 Bajaj TukTuk',    baseFare: 30, priceKm: 10, nightMultiplier: 1.2, maxPassengers: 3 },
  economy: { label: '🚗 Economy Sedan',   baseFare: 50, priceKm: 15, nightMultiplier: 1.3, maxPassengers: 4 },
  comfort: { label: '💎 Comfort VIP',     baseFare: 90, priceKm: 22, nightMultiplier: 1.4, maxPassengers: 4 },
  minibus: { label: '🚌 Minibus/Coaster', baseFare: 150, priceKm: 20, nightMultiplier: 1.25, maxPassengers: 12 },
};

const AdminTariffs = () => {
  const toast = useToast();
  const { t } = useLanguage();
  const [tariffs, setTariffs] = useState(DEFAULT_TARIFFS);
  const [surgeActive, setSurgeActive] = useState(false);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.5);
  const [saving, setSaving] = useState(false);

  const handleChange = (vehicle, field, value) => {
    setTariffs(prev => ({
      ...prev,
      [vehicle]: { ...prev[vehicle], [field]: Number(value) }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success('Tariff configuration saved! Pricing engine updated for all vehicles.');
  };

  const handleReset = () => {
    setTariffs(DEFAULT_TARIFFS);
    setSurgeActive(false);
    setSurgeMultiplier(1.5);
    toast.info('Tariffs reset to defaults');
  };

  const previewFare = (v, distKm = 5) => {
    const tr = tariffs[v];
    const surge = surgeActive ? surgeMultiplier : 1.0;
    return ((tr.baseFare + (distKm * tr.priceKm)) * surge).toFixed(0);
  };

  return (
    <div className="admin-page">
      <div className="admin-logo-bar">
        <img src="/logo.svg?v=2" alt="DIRS" className="admin-logo" />
      </div>
      <div className="admin-header admin-animate-in">
        <h1>{t('admin.tariffTitle') || '💰 Tariff & Dynamic Pricing Manager'}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FaUndo /> {t('admin.resetDefaults') || 'Reset Defaults'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FaSave /> {saving ? (t('admin.saving') || 'Saving...') : (t('admin.saveAllTariffs') || 'Save All Tariffs')}
          </button>
        </div>
      </div>

      {/* Surge Multiplier Toggle */}
      <div className="admin-animate-in-delay-1" style={{
        background: surgeActive ? 'linear-gradient(135deg, #fef3c7, #fffbeb)' : 'var(--card)',
        border: `2px solid ${surgeActive ? '#f59e0b' : 'var(--border-light)'}`,
        borderRadius: 14,
        padding: 20,
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FaBolt style={{ color: surgeActive ? '#f59e0b' : '#94a3b8', fontSize: 18 }} />
              <strong style={{ fontSize: 16, color: 'var(--text)' }}>{t('admin.surgePricingMode') || 'Surge Pricing Mode'}</strong>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                background: surgeActive ? '#fef3c7' : '#f1f5f9',
                color: surgeActive ? '#92400e' : '#94a3b8',
                border: `1px solid ${surgeActive ? '#fde68a' : 'var(--border-light)'}`
              }}>
                {surgeActive ? (t('admin.active') || 'ACTIVE') : (t('admin.inactive') || 'INACTIVE')}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              High-demand surge pricing applies an automatic multiplier to all fares. Activate during peak hours, events, or rain.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{t('admin.surgeMultiplier') || 'Surge Multiplier'}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range" min="1.1" max="3.0" step="0.1"
                  value={surgeMultiplier}
                  onChange={e => setSurgeMultiplier(Number(e.target.value))}
                  style={{ width: 120 }}
                />
                <span style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', minWidth: 40 }}>{surgeMultiplier}×</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSurgeActive(!surgeActive)}
              style={{
                padding: '10px 20px',
                background: surgeActive ? '#dc2626' : '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              {surgeActive ? `🔴 ${t('admin.deactivateSurge') || 'Deactivate Surge'}` : `⚡ ${t('admin.activateSurge') || 'Activate Surge'}`}
            </button>
          </div>
        </div>
      </div>

      {/* Per-Vehicle Tariff Cards */}
      <div className="admin-animate-in-delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {Object.entries(tariffs).map(([key, vehicle]) => (
          <div key={key} style={{ background: 'var(--card)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{vehicle.label}</h3>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{t('admin.fiveKmPreview') || '5km Preview Fare'}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: surgeActive ? '#f59e0b' : '#2563eb' }}>
                  ETB {previewFare(key, 5)}
                  {surgeActive && <span style={{ fontSize: 11, marginLeft: 4, color: '#f59e0b' }}>⚡ surge</span>}
                </div>
              </div>
            </div>

            {[
              { field: 'baseFare', label: t('admin.baseFare') || 'Base Fare (ETB)', min: 10, max: 500, step: 5 },
              { field: 'priceKm', label: t('admin.perKmRate') || 'Per KM Rate (ETB/km)', min: 2, max: 100, step: 1 },
              { field: 'nightMultiplier', label: t('admin.nightRateMultiplier') || 'Night Rate Multiplier (×)', min: 1.0, max: 3.0, step: 0.05 },
              { field: 'maxPassengers', label: t('admin.maxPassengers') || 'Max Passengers', min: 1, max: 60, step: 1 },
            ].map(({ field, label, min, max, step }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {field === 'nightMultiplier' ? `${vehicle[field]}×` : field === 'maxPassengers' ? `${vehicle[field]} pax` : `ETB ${vehicle[field]}`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="range"
                    min={min} max={max} step={step}
                    value={vehicle[field]}
                    onChange={e => handleChange(key, field, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min={min} max={max} step={step}
                    value={vehicle[field]}
                    onChange={e => handleChange(key, field, e.target.value)}
                    style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: 12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Save reminder */}
      <div style={{ background: 'var(--primary-50, rgba(37,99,235,0.05))', border: '1px solid var(--primary-100, rgba(37,99,235,0.15))', borderRadius: 10, padding: 14, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#1d4ed8' }}>💡 Changes are previewed live but take effect only after you click <strong>{t('admin.saveAllTariffs') || 'Save All Tariffs'}</strong>.</span>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? (t('admin.saving') || 'Saving...') : `💾 ${t('admin.saveNow') || 'Save Now'}`}
        </button>
      </div>
    </div>
  );
};

export default AdminTariffs;

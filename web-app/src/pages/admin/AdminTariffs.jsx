import React, { useState } from 'react';
import { FaSave, FaUndo, FaBolt } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const DEFAULT_TARIFFS = {
  bajaj:   { label: '🛺 Bajaj TukTuk',    baseFare: 30, priceKm: 10, nightMultiplier: 1.2, maxPassengers: 3 },
  economy: { label: '🚗 Economy Sedan',   baseFare: 50, priceKm: 15, nightMultiplier: 1.3, maxPassengers: 4 },
  comfort: { label: '💎 Comfort VIP',     baseFare: 90, priceKm: 22, nightMultiplier: 1.4, maxPassengers: 4 },
  minibus: { label: '🚌 Minibus/Coaster', baseFare: 150, priceKm: 20, nightMultiplier: 1.25, maxPassengers: 12 },
};

const AdminTariffs = () => {
  const toast = useToast();
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
    const t = tariffs[v];
    const surge = surgeActive ? surgeMultiplier : 1.0;
    return ((t.baseFare + (distKm * t.priceKm)) * surge).toFixed(0);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>💰 Tariff & Dynamic Pricing Manager</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FaUndo /> Reset Defaults
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save All Tariffs'}
          </button>
        </div>
      </div>

      {/* Surge Multiplier Toggle */}
      <div style={{
        background: surgeActive ? 'linear-gradient(135deg, #fef3c7, #fffbeb)' : '#fff',
        border: `2px solid ${surgeActive ? '#f59e0b' : '#e2e8f0'}`,
        borderRadius: 14,
        padding: 20,
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FaBolt style={{ color: surgeActive ? '#f59e0b' : '#94a3b8', fontSize: 18 }} />
              <strong style={{ fontSize: 16, color: '#1e293b' }}>Surge Pricing Mode</strong>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                background: surgeActive ? '#fef3c7' : '#f1f5f9',
                color: surgeActive ? '#92400e' : '#94a3b8',
                border: `1px solid ${surgeActive ? '#fde68a' : '#e2e8f0'}`
              }}>
                {surgeActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              High-demand surge pricing applies an automatic multiplier to all fares. Activate during peak hours, events, or rain.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Surge Multiplier</label>
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
              {surgeActive ? '🔴 Deactivate Surge' : '⚡ Activate Surge'}
            </button>
          </div>
        </div>
      </div>

      {/* Per-Vehicle Tariff Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {Object.entries(tariffs).map(([key, vehicle]) => (
          <div key={key} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{vehicle.label}</h3>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>5km Preview Fare</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: surgeActive ? '#f59e0b' : '#2563eb' }}>
                  ETB {previewFare(key, 5)}
                  {surgeActive && <span style={{ fontSize: 11, marginLeft: 4, color: '#f59e0b' }}>⚡ surge</span>}
                </div>
              </div>
            </div>

            {[
              { field: 'baseFare', label: 'Base Fare (ETB)', min: 10, max: 500, step: 5 },
              { field: 'priceKm', label: 'Per KM Rate (ETB/km)', min: 2, max: 100, step: 1 },
              { field: 'nightMultiplier', label: 'Night Rate Multiplier (×)', min: 1.0, max: 3.0, step: 0.05 },
              { field: 'maxPassengers', label: 'Max Passengers', min: 1, max: 60, step: 1 },
            ].map(({ field, label, min, max, step }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{label}</label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
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
                    style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Save reminder */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 14, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#1d4ed8' }}>💡 Changes are previewed live but take effect only after you click <strong>Save All Tariffs</strong>.</span>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Now'}
        </button>
      </div>
    </div>
  );
};

export default AdminTariffs;

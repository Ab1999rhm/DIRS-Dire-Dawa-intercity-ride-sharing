import React, { useState } from 'react';
import { FaTag, FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaCopy } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const INITIAL_PROMOS = [
  { id: 1, code: 'DIRE2026', discount: 30, type: 'flat', maxUses: 500, usedCount: 127, expiry: '2026-12-31', active: true, description: 'Dire Dawa Launch Campaign' },
  { id: 2, code: 'HARAR50', discount: 50, type: 'flat', maxUses: 200, usedCount: 43, expiry: '2026-09-30', active: true, description: 'Harar Intercity Route Promo' },
  { id: 3, code: 'NEWUSER20', discount: 20, type: 'percent', maxUses: 1000, usedCount: 312, expiry: '2026-10-15', active: false, description: 'New User Signup Discount' },
];

const AdminPromos = () => {
  const toast = useToast();
  const [promos, setPromos] = useState(INITIAL_PROMOS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount: '', type: 'flat', maxUses: '', expiry: '', description: '' });

  const handleToggle = (id) => {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    const promo = promos.find(p => p.id === id);
    toast.success(`Promo "${promo.code}" ${promo.active ? 'deactivated' : 'activated'}`);
  };

  const handleDelete = (id) => {
    const promo = promos.find(p => p.id === id);
    setPromos(prev => prev.filter(p => p.id !== id));
    toast.success(`Promo "${promo.code}" deleted`);
  };

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    toast.success(`Copied "${code}" to clipboard!`);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) return;
    const newPromo = {
      id: Date.now(),
      code: form.code.toUpperCase().trim(),
      discount: Number(form.discount),
      type: form.type,
      maxUses: Number(form.maxUses) || 999,
      usedCount: 0,
      expiry: form.expiry || '2026-12-31',
      active: true,
      description: form.description || 'New promotion'
    };
    setPromos(prev => [newPromo, ...prev]);
    setForm({ code: '', discount: '', type: 'flat', maxUses: '', expiry: '', description: '' });
    setShowForm(false);
    toast.success(`Promo code "${newPromo.code}" created!`);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🏷️ Promo Code & Campaign Manager</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FaPlus /> {showForm ? 'Cancel' : 'Create Promo'}
        </button>
      </div>

      {/* Create Promo Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{ background: '#fff', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #e0f2fe' }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Create New Promo Code</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Promo Code *</label>
              <input
                type="text"
                placeholder="e.g. HARAR50"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Discount *</label>
              <input
                type="number"
                placeholder={form.type === 'flat' ? 'ETB amount' : '% off'}
                value={form.discount}
                onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
              >
                <option value="flat">Flat (ETB)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Max Uses</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Expiry Date</label>
              <input
                type="date"
                value={form.expiry}
                onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Description</label>
              <input
                type="text"
                placeholder="Campaign description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{ marginTop: 16, padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
          >
            ✅ Create Promo Code
          </button>
        </form>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Codes', value: promos.length, color: '#2563eb' },
          { label: 'Active', value: promos.filter(p => p.active).length, color: '#16a34a' },
          { label: 'Total Redemptions', value: promos.reduce((s, p) => s + p.usedCount, 0), color: '#7c3aed' }
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: 12, padding: 16, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Promo Table */}
      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Code', 'Discount', 'Usage', 'Expiry', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.map(promo => (
              <tr key={promo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 14, color: '#1e293b', background: '#f0f9ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bae6fd' }}>{promo.code}</span>
                    <button type="button" onClick={() => handleCopy(promo.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 2 }} title="Copy code">
                      <FaCopy />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{promo.description}</div>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#16a34a' }}>
                  {promo.type === 'flat' ? `ETB ${promo.discount} off` : `${promo.discount}% off`}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{promo.usedCount}</span>
                    <span style={{ color: '#64748b' }}> / {promo.maxUses}</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 4, height: 4, marginTop: 4, width: '80px' }}>
                    <div style={{ background: '#2563eb', height: 4, borderRadius: 4, width: `${Math.min((promo.usedCount / promo.maxUses) * 100, 100)}%` }} />
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: new Date(promo.expiry) < new Date() ? '#dc2626' : '#64748b' }}>
                  {promo.expiry}
                  {new Date(promo.expiry) < new Date() && <span style={{ display: 'block', fontSize: 10, color: '#dc2626', fontWeight: 700 }}>EXPIRED</span>}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: promo.active ? '#dcfce7' : '#f1f5f9',
                    color: promo.active ? '#15803d' : '#64748b'
                  }}>
                    {promo.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleToggle(promo.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: promo.active ? '#16a34a' : '#94a3b8', fontSize: 18 }}
                      title={promo.active ? 'Deactivate' : 'Activate'}
                    >
                      {promo.active ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(promo.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}
                      title="Delete promo"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPromos;

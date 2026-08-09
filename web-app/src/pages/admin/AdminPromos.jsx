import React, { useState } from 'react';
import { FaTag, FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaCopy } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import { useLanguage } from '../../context/LanguageContext';
import './Admin.css';

const INITIAL_PROMOS = [
  { id: 1, code: 'DIRE2026', discount: 30, type: 'flat', maxUses: 500, usedCount: 127, expiry: '2026-12-31', active: true, description: 'Dire Dawa Launch Campaign' },
  { id: 2, code: 'HARAR50', discount: 50, type: 'flat', maxUses: 200, usedCount: 43, expiry: '2026-09-30', active: true, description: 'Harar Intercity Route Promo' },
  { id: 3, code: 'NEWUSER20', discount: 20, type: 'percent', maxUses: 1000, usedCount: 312, expiry: '2026-10-15', active: false, description: 'New User Signup Discount' },
];

const AdminPromos = () => {
  const toast = useToast();
  const { t } = useLanguage();
  const [promos, setPromos] = useState(INITIAL_PROMOS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount: '', type: 'flat', maxUses: '', expiry: '', description: '' });

  const handleToggle = (id) => {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    const promo = promos.find(p => p.id === id);
    toast.success(`${t('admin.promoActivated') || 'Promo activated'} "${promo.code}" ${promo.active ? (t('admin.deactivated') || 'deactivated') : (t('admin.activated') || 'activated')}`);
  };

  const handleDelete = (id) => {
    const promo = promos.find(p => p.id === id);
    setPromos(prev => prev.filter(p => p.id !== id));
    toast.success(`${t('admin.promoDeleted') || 'Promo deleted'} "${promo.code}"`);
  };

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    toast.success(`${t('admin.copiedToClipboard') || 'Copied'} "${code}"`);
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
    toast.success(`${t('admin.promoCreated') || 'Promo created'} "${newPromo.code}"`);
  };

  return (
    <div className="admin-page">
      <div className="admin-logo-bar">
        <img src="/logo.svg?v=2" alt="DIRS" className="admin-logo" />
      </div>
      <div className="admin-header admin-animate-in">
        <h1>{t('admin.promoTitle') || '🏷️ Promo Code & Campaign Manager'}</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FaPlus /> {showForm ? (t('admin.cancel') || 'Cancel') : (t('admin.createPromo') || 'Create Promo')}
        </button>
      </div>

      {/* Create Promo Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{ background: 'var(--card)', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid var(--primary-50, rgba(37,99,235,0.1))' }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('admin.createNewPromoCode') || 'Create New Promo Code'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{t('admin.promoCode') || 'Promo Code'} *</label>
              <input
                type="text"
                placeholder="e.g. HARAR50"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{t('admin.discount') || 'Discount'} *</label>
              <input
                type="number"
                placeholder={form.type === 'flat' ? 'ETB amount' : '% off'}
                value={form.discount}
                onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{t('admin.type') || 'Type'}</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14 }}
              >
                <option value="flat">{t('admin.flatETB') || 'Flat (ETB)'}</option>
                <option value="percent">{t('admin.percentOff') || 'Percent (%)'}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{t('admin.maxUses') || 'Max Uses'}</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{t('admin.expiryDate') || 'Expiry Date'}</label>
              <input
                type="date"
                value={form.expiry}
                onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{t('admin.description') || 'Description'}</label>
              <input
                type="text"
                placeholder="Campaign description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 14 }}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{ marginTop: 16, padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
          >
            ✅ {t('admin.createNewPromoCode') || 'Create Promo Code'}
          </button>
        </form>
      )}

      {/* Stats Row */}
      <div className="admin-animate-in-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: t('admin.totalCodes') || 'Total Codes', value: promos.length, color: '#2563eb' },
          { label: t('admin.active') || 'Active', value: promos.filter(p => p.active).length, color: '#16a34a' },
          { label: t('admin.totalRedemptions') || 'Total Redemptions', value: promos.reduce((s, p) => s + p.usedCount, 0), color: '#7c3aed' }
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--card)', borderRadius: 12, padding: 16, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Promo Table */}
      <div className="admin-animate-in-delay-2" style={{ background: 'var(--card)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
              {[t('admin.code') || 'Code', t('admin.discount') || 'Discount', t('admin.usage') || 'Usage', t('admin.expiry') || 'Expiry', t('admin.status') || 'Status', t('admin.actions') || 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.map(promo => (
              <tr key={promo.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 14, color: 'var(--text)', background: 'var(--primary-50, rgba(37,99,235,0.05))', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--primary-100, rgba(37,99,235,0.15))' }}>{promo.code}</span>
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
                    <span style={{ color: 'var(--text-muted)' }}> / {promo.maxUses}</span>
                  </div>
                  <div style={{ background: 'var(--border-light)', borderRadius: 4, height: 4, marginTop: 4, width: '80px' }}>
                    <div style={{ background: '#2563eb', height: 4, borderRadius: 4, width: `${Math.min((promo.usedCount / promo.maxUses) * 100, 100)}%` }} />
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: new Date(promo.expiry) < new Date() ? '#dc2626' : 'var(--text-muted)' }}>
                  {promo.expiry}
                  {new Date(promo.expiry) < new Date() && <span style={{ display: 'block', fontSize: 10, color: '#dc2626', fontWeight: 700 }}>{t('admin.expired') || 'EXPIRED'}</span>}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: promo.active ? '#dcfce7' : '#f1f5f9',
                    color: promo.active ? '#15803d' : 'var(--text-muted)'
                  }}>
                    {promo.active ? (t('admin.activeStatus') || 'ACTIVE') : (t('admin.inactive') || 'INACTIVE')}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleToggle(promo.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: promo.active ? '#16a34a' : '#94a3b8', fontSize: 18 }}
                      title={promo.active ? (t('admin.deactivate') || 'Deactivate') : (t('admin.activate') || 'Activate')}
                    >
                      {promo.active ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(promo.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}
                      title={t('admin.deletePromo') || 'Delete promo'}
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

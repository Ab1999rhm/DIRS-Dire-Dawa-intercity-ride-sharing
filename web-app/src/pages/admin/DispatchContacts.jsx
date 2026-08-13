import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaPhone, FaEnvelope, FaBuilding,
  FaUserShield, FaHospitalAlt, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const DispatchContacts = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    type: 'police',
    name: '',
    phoneNumber: '',
    email: '',
    city: 'Dire Dawa',
    active: true
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDispatchContacts({});
      const d = res.data;
      setContacts(Array.isArray(d) ? d : (d?.contacts || []));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dispatch contacts');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = (type) => {
    setEditingId(null);
    setForm({ type, name: '', phoneNumber: '', email: '', city: 'Dire Dawa', active: true });
    setShowModal(true);
  };

  const openEdit = (contact) => {
    setEditingId(contact._id);
    setForm({
      type: contact.type,
      name: contact.name,
      phoneNumber: contact.phoneNumber || '',
      email: contact.email || '',
      city: contact.city || 'Dire Dawa',
      active: contact.active !== false
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.email.trim() && !form.phoneNumber.trim()) {
      toast.error('Provide at least an email or phone number');
      return;
    }
    try {
      if (editingId) {
        await adminAPI.updateDispatchContact(editingId, form);
        toast.success('Contact updated');
      } else {
        await adminAPI.createDispatchContact(form);
        toast.success('Contact added');
      }
      setShowModal(false);
      fetchContacts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save contact');
    }
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(`Delete ${contact.name}?`)) return;
    try {
      await adminAPI.deleteDispatchContact(contact._id);
      toast.success('Contact deleted');
      fetchContacts();
    } catch (err) {
      toast.error('Failed to delete contact');
    }
  };

  const toggleActive = async (contact) => {
    try {
      await adminAPI.updateDispatchContact(contact._id, { active: contact.active === false });
      fetchContacts();
    } catch (err) {
      toast.error('Failed to update contact');
    }
  };

  const filtered = contacts.filter(c => typeFilter === 'all' || c.type === typeFilter);
  const policeCount = contacts.filter(c => c.type === 'police').length;
  const hospitalCount = contacts.filter(c => c.type === 'hospital').length;

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>Dispatch Contacts</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>{t('common.loading') || 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Dispatch Contacts</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Registered police stations & hospitals that receive emergency dispatch notifications. Add as many as needed.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={() => setTypeFilter('all')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: typeFilter === 'all' ? 'var(--primary)' : 'var(--card)', color: typeFilter === 'all' ? '#fff' : 'var(--text)' }}>
          All ({contacts.length})
        </button>
        <button onClick={() => setTypeFilter('police')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: typeFilter === 'police' ? '#2563eb' : 'var(--card)', color: typeFilter === 'police' ? '#fff' : 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FaUserShield /> Police ({policeCount})
        </button>
        <button onClick={() => setTypeFilter('hospital')} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: typeFilter === 'hospital' ? '#dc2626' : 'var(--card)', color: typeFilter === 'hospital' ? '#fff' : 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FaHospitalAlt /> Hospitals ({hospitalCount})
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => openAdd('police')} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#2563eb', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FaPlus /> Add Police
        </button>
        <button onClick={() => openAdd('hospital')} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#dc2626', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FaPlus /> Add Hospital
        </button>
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <FaBuilding style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
            <p style={{ color: 'var(--text-muted)' }}>No dispatch contacts yet — add a police station or hospital above.</p>
          </div>
        ) : filtered.map((contact, idx) => (
          <div key={contact._id} style={{ padding: '14px 16px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: contact.type === 'police' ? 'rgba(37,99,235,0.1)' : 'rgba(220,38,38,0.1)', color: contact.type === 'police' ? '#2563eb' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {contact.type === 'police' ? <FaUserShield /> : <FaHospitalAlt />}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                  {contact.name}
                  {contact.active === false && <span style={{ marginLeft: 8, fontSize: 10, background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Inactive</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaBuilding style={{ fontSize: 10 }} /> {contact.city || 'Dire Dawa'}</span>
                  {contact.phoneNumber && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaPhone style={{ fontSize: 10 }} /> {contact.phoneNumber}</span>}
                  {contact.email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaEnvelope style={{ fontSize: 10 }} /> {contact.email}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => toggleActive(contact)} title={contact.active === false ? 'Activate' : 'Deactivate'} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-light)', cursor: 'pointer', background: 'var(--card)', color: contact.active === false ? '#94a3b8' : '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                {contact.active === false ? <FaToggleOff /> : <FaToggleOn />}
              </button>
              <button onClick={() => openEdit(contact)} title="Edit" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-light)', cursor: 'pointer', background: 'var(--card)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                <FaEdit />
              </button>
              <button onClick={() => handleDelete(contact)} title="Delete" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-light)', cursor: 'pointer', background: 'var(--card)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Contact' : 'Add Dispatch Contact'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)' }}>
                  <option value="police">Police</option>
                  <option value="hospital">Hospital</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dire Dawa Central Police / Dil Chora Hospital" style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Phone Number</label>
                <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="e.g. +251 25 111 2345" style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Email (receives dispatch notifications)</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. command@police.gov.et" style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dire Dawa" style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                <label style={{ fontSize: 13, fontWeight: 600 }}>Active (receives dispatches)</label>
              </div>
              <button onClick={handleSave} style={{ marginTop: 16, width: '100%', padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', background: form.type === 'police' ? '#2563eb' : '#dc2626', color: 'white', fontWeight: 600 }}>
                {editingId ? 'Save Changes' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchContacts;
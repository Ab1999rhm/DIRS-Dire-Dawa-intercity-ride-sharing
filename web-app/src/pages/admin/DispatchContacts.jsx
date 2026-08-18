import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaPhone, FaEnvelope, FaBuilding,
  FaUserShield, FaHospitalAlt, FaToggleOn, FaToggleOff, FaShieldAlt,
  FaMapMarkerAlt, FaCheckCircle, FaUsers
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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
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
    } finally {
      setSaving(false);
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
  const activeCount = contacts.filter(c => c.active !== false).length;

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 80 }}></div>
        <div className="admin-skeleton" style={{ height: 120 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Gradient banner */}
      <div className="dispatch-banner">
        <FaShieldAlt className="dispatch-banner-icon" />
        <div className="dispatch-banner-title">
          <span>Dispatch Contacts</span>
          <small>Registered police stations &amp; hospitals that receive emergency dispatch notifications. Add as many as needed.</small>
        </div>
        <div className="dispatch-banner-actions">
          <button className="dispatch-banner-btn" onClick={() => openAdd('police')}><FaUserShield style={{ fontSize: 11 }} /> Add Police</button>
          <button className="dispatch-banner-btn" onClick={() => openAdd('hospital')}><FaHospitalAlt style={{ fontSize: 11 }} /> Add Hospital</button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="dispatch-stats">
        {[
          { key: 'all', icon: <FaUsers />, val: contacts.length, label: 'Total Contacts', color: 'linear-gradient(135deg, #3b82f6, #7c3aed)' },
          { key: 'police', icon: <FaUserShield />, val: policeCount, label: 'Police Stations', color: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
          { key: 'hospital', icon: <FaHospitalAlt />, val: hospitalCount, label: 'Hospitals', color: 'linear-gradient(135deg, #dc2626, #b91c1c)' },
          { key: null, icon: <FaCheckCircle />, val: activeCount, label: 'Active', color: 'linear-gradient(135deg, #10b981, #059669)' },
        ].map((s, i) => (
          <div key={i} className="dispatch-stat-card" style={{ animationDelay: `${i * 0.08}s` }} onClick={() => s.key && setTypeFilter(s.key)}>
            <div className="dispatch-stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div>
              <div className="dispatch-stat-value">{s.val}</div>
              <div className="dispatch-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar: filters + add */}
      <div className="dispatch-toolbar">
        <button className={`dispatch-filter-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
          <FaUsers /> All ({contacts.length})
        </button>
        <button className={`dispatch-filter-btn police ${typeFilter === 'police' ? 'active police' : ''}`} onClick={() => setTypeFilter('police')}>
          <FaUserShield /> Police ({policeCount})
        </button>
        <button className={`dispatch-filter-btn hospital ${typeFilter === 'hospital' ? 'active hospital' : ''}`} onClick={() => setTypeFilter('hospital')}>
          <FaHospitalAlt /> Hospitals ({hospitalCount})
        </button>
        <div className="dispatch-add-group">
          <button className="dispatch-add-btn police" onClick={() => openAdd('police')}><FaPlus /> Add Police</button>
          <button className="dispatch-add-btn hospital" onClick={() => openAdd('hospital')}><FaPlus /> Add Hospital</button>
        </div>
      </div>

      {/* Contact cards */}
      <div className="dispatch-card-grid">
        {filtered.length === 0 ? (
          <div className="dispatch-empty">
            <FaBuilding />
            <p>No dispatch contacts yet — add a police station or hospital above.</p>
          </div>
        ) : filtered.map((contact, idx) => (
          <div key={contact._id} className="dispatch-contact-card" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="dispatch-contact-main">
              <div className={`dispatch-avatar ${contact.type}`}>
                {contact.type === 'police' ? <FaUserShield /> : <FaHospitalAlt />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="dispatch-contact-name">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</span>
                  <span className={`dispatch-type-badge ${contact.type}`}>{contact.type}</span>
                  {contact.active === false && <span className="dispatch-inactive-badge">Inactive</span>}
                </div>
                <div className="dispatch-contact-meta">
                  <span title={contact.city || 'Dire Dawa'}><FaMapMarkerAlt /> {contact.city || 'Dire Dawa'}</span>
                  {contact.phoneNumber && <span title={contact.phoneNumber}><FaPhone /> {contact.phoneNumber}</span>}
                  {contact.email && <span title={contact.email}><FaEnvelope /> {contact.email}</span>}
                </div>
              </div>
            </div>
            <div className="dispatch-contact-actions">
              <button className="dispatch-action-btn toggle" onClick={() => toggleActive(contact)} title={contact.active === false ? 'Activate' : 'Deactivate'}>
                {contact.active === false ? <FaToggleOff style={{ fontSize: 15 }} /> : <FaToggleOn style={{ fontSize: 15 }} />}
              </button>
              <button className="dispatch-action-btn edit" onClick={() => openEdit(contact)} title="Edit"><FaEdit /></button>
              <button className="dispatch-action-btn delete" onClick={() => handleDelete(contact)} title="Delete"><FaTrash /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Contact' : 'Add Dispatch Contact'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="driver-detail">
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Type</label>
                <div className="dispatch-modal-type">
                  <button className={`dispatch-modal-type-pill police ${form.type === 'police' ? 'active' : ''}`} onClick={() => setForm({ ...form, type: 'police' })}>
                    <FaUserShield /> Police
                  </button>
                  <button className={`dispatch-modal-type-pill hospital ${form.type === 'hospital' ? 'active' : ''}`} onClick={() => setForm({ ...form, type: 'hospital' })}>
                    <FaHospitalAlt /> Hospital
                  </button>
                </div>
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
              <button onClick={handleSave} disabled={saving} className={`dispatch-add-btn ${form.type}`} style={{ marginTop: 16, width: '100%', padding: 10, fontSize: 13, borderRadius: 8, justifyContent: 'center', opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                <FaCheckCircle /> {saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Contact')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchContacts;
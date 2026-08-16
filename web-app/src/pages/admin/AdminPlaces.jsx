import React, { useState, useEffect } from 'react';
import {
  FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter,
  FaCheckCircle, FaTimesCircle, FaGlobe, FaCity, FaBuilding, FaTimes, FaSave
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const CATEGORIES = [
  { value: 'neighborhood', label: 'Neighborhood' },
  { value: 'market', label: 'Market' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'school', label: 'School' },
  { value: 'transport', label: 'Transport' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'government', label: 'Government' },
  { value: 'landmark', label: 'Landmark' },
  { value: 'city', label: 'City' },
  { value: 'other', label: 'Other' },
];

const AdminPlaces = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [form, setForm] = useState({
    name: '', type: 'intra_city', label: '', emoji: '',
    coordinates: { lat: '', lon: '' }, city: 'Dire Dawa',
    category: 'other', sortOrder: 0, isActive: true
  });

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.type = filter;
      if (search) params.search = search;
      const res = await adminAPI.getPlaces(params);
      setPlaces(res.data.places || []);
    } catch (err) {
      toast.error('Failed to load places');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlaces(); }, [filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPlaces();
  };

  const openAdd = () => {
    setEditingPlace(null);
    setForm({
      name: '', type: 'intra_city', label: '', emoji: '',
      coordinates: { lat: '', lon: '' }, city: 'Dire Dawa',
      category: 'other', sortOrder: 0, isActive: true
    });
    setShowModal(true);
  };

  const openEdit = (place) => {
    setEditingPlace(place);
    setForm({
      name: place.name || '',
      type: place.type || 'intra_city',
      label: place.label || '',
      emoji: place.emoji || '',
      coordinates: place.coordinates || { lat: '', lon: '' },
      city: place.city || 'Dire Dawa',
      category: place.category || 'other',
      sortOrder: place.sortOrder || 0,
      isActive: place.isActive !== false
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.coordinates.lat || !form.coordinates.lon) {
      toast.error('Name, latitude, and longitude are required');
      return;
    }
    try {
      const data = {
        ...form,
        coordinates: {
          lat: parseFloat(form.coordinates.lat),
          lon: parseFloat(form.coordinates.lon)
        }
      };
      if (editingPlace) {
        await adminAPI.updatePlace(editingPlace._id, data);
        toast.success('Place updated');
      } else {
        await adminAPI.createPlace(data);
        toast.success('Place created');
      }
      setShowModal(false);
      fetchPlaces();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (place) => {
    if (!window.confirm(`Delete "${place.name}"?`)) return;
    try {
      await adminAPI.deletePlace(place._id);
      toast.success('Place deleted');
      fetchPlaces();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (place) => {
    try {
      await adminAPI.updatePlace(place._id, { isActive: !place.isActive });
      fetchPlaces();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const intraCityCount = places.filter(p => p.type === 'intra_city').length;
  const intercityCount = places.filter(p => p.type === 'intercity').length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><FaMapMarkerAlt /> Places Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Manage pickup locations and intercity destinations
        </p>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <FaBuilding />
          </div>
          <div>
            <div className="admin-stat-value">{intraCityCount}</div>
            <div className="admin-stat-label">Intra-City Places</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <FaGlobe />
          </div>
          <div>
            <div className="admin-stat-value">{intercityCount}</div>
            <div className="admin-stat-label">Intercity Destinations</div>
          </div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-filter-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'intra_city', label: 'Intra-City' },
            { key: 'intercity', label: 'Intercity' },
          ].map(f => (
            <button
              key={f.key}
              className={`admin-filter-tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              placeholder="Search places..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13 }}
            />
            <button type="submit" className="admin-btn admin-btn-sm"><FaSearch /></button>
          </form>
          <button className="admin-btn admin-btn-primary" onClick={openAdd}>
            <FaPlus /> Add Place
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : places.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <FaMapMarkerAlt size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No places found</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Coordinates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {places.map(place => (
                <tr key={place._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {place.emoji} {place.label || place.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{place.city}</div>
                  </td>
                  <td>
                    <span className={`admin-badge ${place.type === 'intercity' ? 'admin-badge-green' : 'admin-badge-blue'}`}>
                      {place.type === 'intercity' ? 'Intercity' : 'Intra-City'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, textTransform: 'capitalize' }}>{place.category}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {place.coordinates?.lat?.toFixed(4)}, {place.coordinates?.lon?.toFixed(4)}
                  </td>
                  <td>
                    <button
                      className={`admin-toggle ${place.isActive ? 'active' : ''}`}
                      onClick={() => toggleActive(place)}
                    >
                      {place.isActive ? <><FaCheckCircle /> Active</> : <><FaTimesCircle /> Inactive</>}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-btn admin-btn-sm" onClick={() => openEdit(place)}>
                        <FaEdit />
                      </button>
                      <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(place)}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingPlace ? 'Edit Place' : 'Add Place'}</h3>
              <button onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dire Dawa Market"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Display Label</label>
                  <input
                    value={form.label}
                    onChange={e => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. Dire Dawa Market, Ethiopia"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="intra_city">Intra-City (Pickup/Dropoff)</option>
                    <option value="intercity">Intercity (Destination)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Emoji</label>
                  <input
                    value={form.emoji}
                    onChange={e => setForm({ ...form, emoji: e.target.value })}
                    placeholder="e.g. 🕌"
                  />
                </div>
                <div className="admin-form-group">
                  <label>City</label>
                  <input
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Dire Dawa"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={form.coordinates.lat}
                    onChange={e => setForm({ ...form, coordinates: { ...form.coordinates, lat: e.target.value } })}
                    placeholder="e.g. 9.6009"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={form.coordinates.lon}
                    onChange={e => setForm({ ...form, coordinates: { ...form.coordinates, lon: e.target.value } })}
                    placeholder="e.g. 41.8508"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="admin-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave}>
                <FaSave /> {editingPlace ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlaces;

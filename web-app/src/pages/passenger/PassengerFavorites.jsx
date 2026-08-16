import React, { useState, useEffect } from 'react';
import { FaStar, FaMapMarkerAlt, FaPlus, FaTrash, FaHome, FaBuilding, FaSchool, FaEdit, FaSave, FaTimes, FaSearch } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI, placesAPI } from '../../services/api';
import { Card, Button, Input } from '../../components/common';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import { useToast } from '../../components/common/Toast';
import { ConfirmModal } from '../../components/common/Modal';
import './Passenger.css';

const FAVORITE_ICONS = [
  { id: 'home', icon: <FaHome />, label: 'Home' },
  { id: 'work', icon: <FaBuilding />, label: 'Work' },
  { id: 'school', icon: <FaSchool />, label: 'School' },
  { id: 'other', icon: <FaMapMarkerAlt />, label: 'Other' },
];

const PassengerFavorites = () => {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [favorites, setFavorites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newIcon, setNewIcon] = useState('other');
  const [newLat, setNewLat] = useState(null);
  const [newLon, setNewLon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [intraCityPlaces, setIntraCityPlaces] = useState([]);

  useEffect(() => {
    loadFavorites();
    placesAPI.getAll({ type: 'intra_city' }).then(res => {
      const places = (res.data.places || []).map(p => ({
        key: p.key, label: p.label || p.name, lat: p.coordinates.lat, lon: p.coordinates.lon
      }));
      if (places.length > 0) setIntraCityPlaces(places);
    }).catch(() => {});
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getMe();
      const locs = res.data.user?.favoriteLocations || [];
      if (locs.length > 0) {
        setFavorites(locs);
      } else {
        const oldFavs = res.data.user?.favorites || [];
        const migrated = oldFavs.map(f => ({
          name: f.name, address: f.address, type: f.iconType || 'other',
          location: null, _id: f._id
        }));
        setFavorites(migrated);
        if (migrated.length > 0) {
          await authAPI.updateProfile({ favoriteLocations: migrated });
        }
      }
    } catch (err) {
      setFavorites(user?.favoriteLocations || []);
    } finally {
      setLoading(false);
    }
  };

  const filterPlaceSuggestions = (query) => {
    if (query.length < 2) { setPlaceSuggestions([]); return; }
    const lower = query.toLowerCase();
    const matches = intraCityPlaces.filter(p => p.label.toLowerCase().includes(lower) || p.key.includes(lower));
    setPlaceSuggestions(matches.slice(0, 6));
    setShowPlaceSuggestions(matches.length > 0);
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a place name');
      return;
    }
    setSaving(true);
    try {
      const place = {
        name: newName,
        address: newAddress || newName,
        type: newIcon,
        location: newLat && newLon ? { type: 'Point', coordinates: [newLon, newLat] } : undefined,
        _id: Date.now().toString()
      };
      const updated = [...favorites, place];
      setFavorites(updated);
      await authAPI.updateProfile({ favoriteLocations: updated });
      setNewName('');
      setNewAddress('');
      setNewIcon('other');
      setNewLat(null);
      setNewLon(null);
      setPlaceSearchQuery('');
      setShowForm(false);
      toast.success('Favorite added');
    } catch (err) {
      toast.error('Failed to add favorite');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const updated = favorites.filter(f => f._id !== id);
      setFavorites(updated);
      await authAPI.updateProfile({ favoriteLocations: updated });
      toast.success('Favorite removed');
    } catch (err) {
      toast.error('Failed to remove favorite');
    }
  };

  const handleEdit = (fav) => {
    setEditingId(fav._id);
    setEditName(fav.name);
    setEditAddress(fav.address);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error('Please enter a place name');
      return;
    }
    setSaving(true);
    try {
      const updated = favorites.map(f => f._id === editingId ? { ...f, name: editName, address: editAddress || editName } : f);
      setFavorites(updated);
      await authAPI.updateProfile({ favoriteLocations: updated });
      setEditingId(null);
      toast.success('Favorite updated');
    } catch (err) {
      toast.error('Failed to update favorite');
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (type) => {
    const found = FAVORITE_ICONS.find(f => f.id === type);
    return found ? found.icon : <FaMapMarkerAlt />;
  };

  return (
    <div className="passenger-page">
      <div className="page-header">
        <h1 className="page-title"><FaStar /> {t('passenger.favoritesTitle') || 'Favorite Locations'}</h1>
        <Button variant="primary" size="sm" icon={<FaPlus />} onClick={() => setShowForm(!showForm)}>
          {t('passenger.addFavorite')}
        </Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <h3 className="subsection-title" style={{ marginTop: 0 }}>{t('passenger.addFavorite')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FAVORITE_ICONS.map(f => (
                <button
                  key={f.id}
                  className={`vehicle-card ${newIcon === f.id ? 'selected' : ''}`}
                  style={{ padding: '10px 14px', width: 'auto', fontSize: 13 }}
                  onClick={() => setNewIcon(f.id)}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
            <Input
              label={t('passenger.locationName')}
              placeholder="e.g. Home, Office"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none' }} />
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 36px 10px 36px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                  placeholder="Search location or enter address..."
                  value={placeSearchQuery}
                  onChange={(e) => {
                    setPlaceSearchQuery(e.target.value);
                    setNewAddress(e.target.value);
                    setNewLat(null);
                    setNewLon(null);
                    filterPlaceSuggestions(e.target.value);
                  }}
                  onFocus={() => { if (placeSearchQuery.length >= 2) filterPlaceSuggestions(placeSearchQuery); }}
                  onBlur={() => setTimeout(() => setShowPlaceSuggestions(false), 200)}
                />
                {placeSearchQuery && (
                  <button
                    onClick={() => { setPlaceSearchQuery(''); setNewAddress(''); setNewLat(null); setNewLon(null); setPlaceSuggestions([]); setShowPlaceSuggestions(false); }}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              {showPlaceSuggestions && placeSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: 180, overflowY: 'auto', marginTop: 4 }}>
                  {placeSuggestions.map((s, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: 13, transition: 'background 0.15s' }}
                      onMouseDown={() => {
                        setNewName(newName || s.label.split(',')[0]);
                        setNewAddress(s.label);
                        setPlaceSearchQuery(s.label);
                        setNewLat(s.lat);
                        setNewLon(s.lon);
                        setShowPlaceSuggestions(false);
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <FaMapMarkerAlt style={{ color: 'var(--primary)', fontSize: 12, flexShrink: 0 }} />
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {newLat && newLon && (
              <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaMapMarkerAlt /> Location captured ({newLat.toFixed(4)}, {newLon.toFixed(4)})
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => { setShowForm(false); setNewName(''); setNewAddress(''); setNewLat(null); setNewLon(null); setPlaceSearchQuery(''); }}>{t('common.cancel')}</Button>
              <Button variant="primary" loading={saving} onClick={handleAdd}>{t('passenger.save')}</Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <EmptyStateIllustration type="rides" />
            <h3 style={{ marginTop: 16, fontWeight: 700 }}>{t('passenger.noFavorites')}</h3>
            <p className="text-muted" style={{ marginTop: 8 }}>{t('passenger.noFavoritesDesc')}</p>
            <Button variant="primary" style={{ marginTop: 16 }} icon={<FaPlus />} onClick={() => setShowForm(true)}>
              {t('passenger.addFavorite')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="favorites-grid">
          {favorites.map(fav => (
            <Card key={fav._id} className="favorite-card" hover>
              <div className="favorite-icon">
                {getIcon(fav.type || fav.iconType)}
              </div>
              {editingId === fav._id ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleSaveEdit} disabled={saving} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <FaSave size={12} /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <FaTimes size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="favorite-info">
                    <h4>{fav.name}</h4>
                    <p>{fav.address}</p>
                    {fav.location?.coordinates && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                        <FaMapMarkerAlt size={10} /> Coords saved
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="favorite-delete" onClick={() => handleEdit(fav)} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 6 }}>
                      <FaEdit size={14} style={{ color: 'var(--primary)' }} />
                    </button>
                    <button className="favorite-delete" onClick={() => setDeleteConfirmId(fav._id)}>
                      <FaTrash size={14} />
                    </button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { handleDelete(deleteConfirmId); setDeleteConfirmId(null); }}
        title="Delete Favorite"
        message="Are you sure you want to remove this favorite location?"
        confirmText="Delete"
        danger
      />
    </div>
  );
};

export default PassengerFavorites;

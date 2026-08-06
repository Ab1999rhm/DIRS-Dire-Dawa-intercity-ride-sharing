import React, { useState, useEffect } from 'react';
import { FaStar, FaMapMarkerAlt, FaPlus, FaTrash, FaHome, FaBriefcase, FaUniversity, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Card, Button, Input } from '../../components/common';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import { useToast } from '../../components/common/Toast';
import { ConfirmModal } from '../../components/common/Modal';
import './Passenger.css';

const FAVORITE_ICONS = [
  { id: 'home', icon: <FaHome />, label: 'Home' },
  { id: 'work', icon: <FaBriefcase />, label: 'Work' },
  { id: 'school', icon: <FaUniversity />, label: 'School' },
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getMe();
      setFavorites(res.data.user?.favorites || []);
    } catch (err) {
      setFavorites(user?.favorites || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newAddress.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSaving(true);
    try {
      const updated = [...favorites, { name: newName, address: newAddress, iconType: newIcon, _id: Date.now().toString() }];
      setFavorites(updated);
      await authAPI.updateProfile({ favorites: updated });
      setNewName('');
      setNewAddress('');
      setNewIcon('other');
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
      await authAPI.updateProfile({ favorites: updated });
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
    if (!editName.trim() || !editAddress.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSaving(true);
    try {
      const updated = favorites.map(f => f._id === editingId ? { ...f, name: editName, address: editAddress } : f);
      setFavorites(updated);
      await authAPI.updateProfile({ favorites: updated });
      setEditingId(null);
      toast.success('Favorite updated');
    } catch (err) {
      toast.error('Failed to update favorite');
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (iconType) => {
    const found = FAVORITE_ICONS.find(f => f.id === iconType);
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
            <Input
              label={t('passenger.locationName')}
              placeholder="e.g. Home, Office"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <Input
              label={t('passenger.address')}
              placeholder="e.g. Bole Road, Addis Ababa"
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
            />
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
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
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
                {getIcon(fav.iconType)}
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

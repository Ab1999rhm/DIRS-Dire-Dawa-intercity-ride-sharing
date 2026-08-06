import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { usersAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { FaStar, FaMapMarkerAlt, FaPlus, FaTrash, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Favorites.css';

const FavoritesPage = () => {
  const { user, updateUser } = useAuth();
  const { selectPickup, selectDropoff } = useRide();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !address) {
      toast.warning('Please provide place name and address');
      return;
    }
    setLoading(true);
    try {
      const res = await usersAPI.addFavoriteLocation({
        name,
        address,
        coordinates: [41.8661, 9.5931] // Dire Dawa default
      });
      updateUser({ favoriteLocations: res.data.favoriteLocations });
      setName('');
      setAddress('');
      setShowAdd(false);
      toast.success('Favorite location saved!');
    } catch (err) {
      console.error('Save favorite location error:', err);
      toast.error('Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      const res = await usersAPI.removeFavoriteLocation(id);
      updateUser({ favoriteLocations: res.data.favoriteLocations });
      toast.info('Location removed');
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  const handleUseLocation = (loc, type) => {
    const locationObj = {
      address: loc.address || loc.name,
      coordinates: loc.coordinates || [41.8661, 9.5931]
    };
    if (type === 'pickup') {
      selectPickup(locationObj);
      toast.info(`Set "${loc.name}" as pickup`);
    } else {
      selectDropoff(locationObj);
      toast.info(`Set "${loc.name}" as destination`);
    }
    navigate('/');
  };

  return (
    <div className="favorites-container">
      <header className="page-header">
        <h2><FaStar className="star-header-icon" /> Saved Places</h2>
        <button className="icon-add-btn" onClick={() => setShowAdd(!showAdd)}>
          <FaPlus /> Add New
        </button>
      </header>

      <div className="favorites-body">
        {showAdd && (
          <form onSubmit={handleAdd} className="add-fav-form">
            <h4>Add Favorite Location</h4>
            <div className="input-group">
              <label>Location Label</label>
              <input
                type="text"
                placeholder="e.g. Home, Office, Airport, University"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Address / Description</label>
              <input
                type="text"
                placeholder="Address or city area..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Location'}
            </button>
          </form>
        )}

        {!user?.favoriteLocations || user.favoriteLocations.length === 0 ? (
          <div className="empty-favs">
            <FaStar className="empty-star" />
            <p>No saved places yet.</p>
            <span className="sub-text">Save your frequent destinations like Home, Work, or Taiwan Market for quick 1-tap booking.</span>
          </div>
        ) : (
          <div className="favs-list">
            {user.favoriteLocations.map((loc) => (
              <div key={loc._id || loc.name} className="fav-card">
                <div className="fav-info">
                  <FaMapMarkerAlt className="marker-icon" />
                  <div>
                    <strong>{loc.name}</strong>
                    <p className="sub-text">{loc.address}</p>
                  </div>
                </div>

                <div className="fav-actions">
                  <button
                    className="use-btn pickup"
                    onClick={() => handleUseLocation(loc, 'pickup')}
                    title="Set as Pickup"
                  >
                    As Pickup <FaArrowRight />
                  </button>
                  <button
                    className="use-btn dropoff"
                    onClick={() => handleUseLocation(loc, 'dropoff')}
                    title="Set as Dropoff"
                  >
                    As Destination <FaArrowRight />
                  </button>
                  <button className="del-btn" onClick={() => handleRemove(loc._id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
};

export default FavoritesPage;

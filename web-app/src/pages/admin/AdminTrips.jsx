import React, { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import Modal from '../../components/common/Modal';
import Badge, { StatusBadge } from '../../components/common/Badge';
import './Admin.css';

const AdminTrips = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      let backendTrips = [];
      try {
        const res = await adminAPI.trips(params);
        backendTrips = res.data.trips || res.data || [];
      } catch (_) {}

      const localRides = JSON.parse(localStorage.getItem('dirs_passenger_rides') || '[]');
      const combined = [...backendTrips, ...localRides];

      const seen = new Set();
      const unique = combined.filter(r => {
        if (!r._id || seen.has(r._id)) return false;
        seen.add(r._id);
        return true;
      });

      const filtered = unique.filter(r => {
        const s = (r.status || 'pending').toLowerCase();
        if (statusFilter === 'active') return ['accepted', 'searching', 'pending', 'in_progress', 'driver_found', 'driver_arriving', 'ongoing'].includes(s);
        if (statusFilter === 'completed') return s === 'completed' || s === 'finished';
        if (statusFilter === 'cancelled') return s === 'cancelled' || s === 'rejected';
        return true;
      });

      setTrips(filtered);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.trips')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.trips')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--danger)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{t('admin.trips')}</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <EmptyStateIllustration type="rides" />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>No trips found</h3>
          <p style={{ color: 'var(--text-muted)' }}>No trips match the current filter</p>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-table-header">
            <div>Route</div>
            <div>Passenger</div>
            <div>Driver</div>
            <div>Fare</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>
          {trips.map((trip) => (
            <div key={trip._id} className="admin-table-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{trip.pickupLocation?.address?.split(',')[0] || 'N/A'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>→ {trip.dropoffLocation?.address?.split(',')[0] || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: 13 }}>{trip.passenger?.firstName} {trip.passenger?.lastName}</div>
              </div>
              <div>
                <div style={{ fontSize: 13 }}>{trip.driver?.firstName ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'Unassigned'}</div>
              </div>
              <div>
                <Badge variant="success">ETB {(trip.fare?.total || trip.fare || trip.estimatedFare || 0).toLocaleString()}</Badge>
              </div>
              <div><StatusBadge status={trip.status} /></div>
              <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedTrip(trip); setShowModal(true); }}>
                  <FaEye /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Trip Details">
        {selectedTrip && (
          <div className="detail-modal-content">
            <div className="detail-row"><span className="detail-key">Status</span><span className="detail-val"><StatusBadge status={selectedTrip.status} /></span></div>
            <div className="detail-row"><span className="detail-key">Pickup</span><span className="detail-val">{selectedTrip.pickupLocation?.address || 'N/A'}</span></div>
            <div className="detail-row"><span className="detail-key">Dropoff</span><span className="detail-val">{selectedTrip.dropoffLocation?.address || 'N/A'}</span></div>
            <div className="detail-row"><span className="detail-key">Passenger</span><span className="detail-val">{selectedTrip.passenger?.firstName} {selectedTrip.passenger?.lastName}</span></div>
            <div className="detail-row"><span className="detail-key">Driver</span><span className="detail-val">{selectedTrip.driver?.firstName ? `${selectedTrip.driver.firstName} ${selectedTrip.driver.lastName}` : 'Unassigned'}</span></div>
            <div className="detail-row"><span className="detail-key">Fare</span><span className="detail-val">ETB {(selectedTrip.fare?.total || selectedTrip.fare || selectedTrip.estimatedFare || 0).toLocaleString()}</span></div>
            <div className="detail-row"><span className="detail-key">Distance</span><span className="detail-val">{selectedTrip.distance ? `${selectedTrip.distance.toFixed(1)} km` : 'N/A'}</span></div>
            <div className="detail-row"><span className="detail-key">Duration</span><span className="detail-val">{selectedTrip.duration ? `${selectedTrip.duration} min` : 'N/A'}</span></div>
            <div className="detail-row"><span className="detail-key">Payment</span><span className="detail-val">{selectedTrip.paymentMethod || 'Cash'}</span></div>
            <div className="detail-row"><span className="detail-key">Created</span><span className="detail-val">{new Date(selectedTrip.createdAt).toLocaleString()}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTrips;

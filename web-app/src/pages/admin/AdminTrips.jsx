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
      let vehicleTrips = [];
      try {
        const res = await adminAPI.trips(params);
        backendTrips = res.data.trips || res.data || [];
        vehicleTrips = res.data.vehicleTrips || [];
      } catch (_) {}

      // Normalize VehicleTrips to look like regular trips for display
      const normalizedVehicleTrips = vehicleTrips.map(vt => ({
        _id: vt._id,
        isVehicleTrip: true,
        status: vt.status,
        passenger: vt.passengers?.[0] ? { firstName: `${vt.passengers.length} passengers`, lastName: '' } : { firstName: 'Empty', lastName: '' },
        driver: vt.driver,
        vehicle: vt.vehicle,
        pickupLocation: { address: vt.destinationCity || 'Shared Trip' },
        dropoffLocation: { address: vt.destinationCity || '' },
        fare: { totalFare: vt.totalCollected || 0 },
        createdAt: vt.createdAt,
        vehicleTrip: vt
      }));

      const localRides = JSON.parse(localStorage.getItem('dirs_passenger_rides') || '[]');
      const combined = [...backendTrips, ...normalizedVehicleTrips, ...localRides];

      const seen = new Set();
      const unique = combined.filter(r => {
        if (!r._id || seen.has(r._id)) return false;
        seen.add(r._id);
        return true;
      });

      const filtered = unique.filter(r => {
        const s = (r.status || 'pending').toLowerCase();
        if (statusFilter === 'active') return ['accepted', 'searching', 'pending', 'in_progress', 'driver_found', 'driver_arriving', 'ongoing', 'scheduled', 'boarding'].includes(s);
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
    { key: 'all', label: t('common.all') || 'All' },
    { key: 'active', label: t('admin.active') || 'Active' },
    { key: 'completed', label: t('admin.completed') || 'Completed' },
    { key: 'cancelled', label: t('admin.cancelled') || 'Cancelled' },
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
      <div className="admin-logo-bar">
        <img src="/logo.svg?v=2" alt="DIRS" className="admin-logo" />
      </div>

      <div className="admin-header admin-animate-in">
        <h1>{t('admin.trips')}</h1>
      </div>

      <div className="admin-animate-in-delay-1" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
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
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>{t('admin.noTrips') || 'No trips found'}</h3>
          <p style={{ color: 'var(--text-muted)' }}>{t('admin.noTripsFilter') || 'No trips match the current filter'}</p>
        </div>
      ) : (
        <div className="admin-table admin-animate-in-delay-2">
          <div className="admin-table-header">
            <div>{t('admin.route') || 'Route'}</div>
            <div>{t('admin.passenger') || 'Passenger'}</div>
            <div>{t('admin.driver') || 'Driver'}</div>
            <div>{t('admin.fare') || 'Fare'}</div>
            <div>{t('admin.status') || 'Status'}</div>
            <div style={{ textAlign: 'right' }}>{t('common.actions') || 'Actions'}</div>
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
                <div style={{ fontSize: 13 }}>{trip.driver?.firstName ? `${trip.driver.firstName} ${trip.driver.lastName}` : (t('admin.unassigned') || 'Unassigned')}</div>
              </div>
              <div>
                <Badge variant="success">ETB {(trip.fare?.totalFare || trip.fare?.total || trip.estimatedFare || 0).toLocaleString()}</Badge>
              </div>
              <div><StatusBadge status={trip.status} /></div>
              <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedTrip(trip); setShowModal(true); }}>
                  <FaEye /> {t('common.view') || 'View'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('admin.tripDetails') || 'Trip Details'}>
        {selectedTrip && (
          <div className="detail-modal-content">
            <div className="detail-row"><span className="detail-key">{t('admin.status') || 'Status'}</span><span className="detail-val"><StatusBadge status={selectedTrip.status} /></span></div>
            {selectedTrip.isVehicleTrip && (
              <div className="detail-row"><span className="detail-key">Ride Type</span><span className="detail-val" style={{ fontWeight: 600, color: 'var(--primary)' }}>Shared Ride</span></div>
            )}
            <div className="detail-row"><span className="detail-key">{t('admin.pickup') || 'Pickup'}</span><span className="detail-val">{selectedTrip.pickupLocation?.address || 'N/A'}</span></div>
            <div className="detail-row"><span className="detail-key">{t('admin.dropoff') || 'Dropoff'}</span><span className="detail-val">{selectedTrip.dropoffLocation?.address || 'N/A'}</span></div>
            <div className="detail-row"><span className="detail-key">{t('admin.passenger') || 'Passenger'}</span><span className="detail-val">{selectedTrip.passenger?.firstName} {selectedTrip.passenger?.lastName}</span></div>
            <div className="detail-row"><span className="detail-key">{t('admin.driver') || 'Driver'}</span><span className="detail-val">{selectedTrip.driver?.firstName ? `${selectedTrip.driver.firstName} ${selectedTrip.driver.lastName}` : (t('admin.unassigned') || 'Unassigned')}</span></div>
            {selectedTrip.isVehicleTrip && selectedTrip.vehicleTrip && (
              <>
                <div className="detail-row"><span className="detail-key">Vehicle</span><span className="detail-val">{selectedTrip.vehicleTrip.vehicle?.plateNumber || 'N/A'} ({selectedTrip.vehicleTrip.vehicle?.vehicleType || 'N/A'})</span></div>
                <div className="detail-row"><span className="detail-key">Capacity</span><span className="detail-val">{selectedTrip.vehicleTrip.seats?.length || 0} seats</span></div>
                <div className="detail-row"><span className="detail-key">Occupied</span><span className="detail-val">{selectedTrip.vehicleTrip.seats?.filter(s => s.status === 'occupied' || s.status === 'reserved').length || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Fare per Seat</span><span className="detail-val">ETB {selectedTrip.vehicleTrip.farePerSeat || 0}</span></div>
                <div className="detail-row"><span className="detail-key">Total Collected</span><span className="detail-val">ETB {selectedTrip.vehicleTrip.totalCollected || 0}</span></div>
                {selectedTrip.vehicleTrip.seats && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Seat Map</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {selectedTrip.vehicleTrip.seats.map(s => (
                        <span key={s.seatId} style={{
                          padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: s.status === 'occupied' ? 'var(--success)' : s.status === 'reserved' ? 'var(--warning)' : 'var(--bg-secondary)',
                          color: s.status === 'available' ? 'var(--text-muted)' : 'white'
                        }}>{s.seatId}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="detail-row"><span className="detail-key">{t('admin.fare') || 'Fare'}</span><span className="detail-val">ETB {(selectedTrip.fare?.totalFare || selectedTrip.fare?.total || selectedTrip.estimatedFare || 0).toLocaleString()}</span></div>
            <div className="detail-row"><span className="detail-key">{t('admin.distance') || 'Distance'}</span><span className="detail-val">{selectedTrip.actualDistance || selectedTrip.distance ? `${(selectedTrip.actualDistance || selectedTrip.distance).toFixed(1)} km` : 'N/A'}</span></div>
            <div className="detail-row"><span className="detail-key">{t('admin.duration') || 'Duration'}</span><span className="detail-val">{selectedTrip.actualDuration ? `${selectedTrip.actualDuration} min` : 'N/A'}</span></div>
            <div className="detail-row"><span className="detail-key">{t('admin.payment') || 'Payment'}</span><span className="detail-val">{selectedTrip.paymentMethod || 'Cash'}</span></div>
            <div className="detail-row"><span className="detail-key">{t('admin.created') || 'Created'}</span><span className="detail-val">{new Date(selectedTrip.createdAt).toLocaleString()}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTrips;

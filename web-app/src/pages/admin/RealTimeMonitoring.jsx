import React, { useState, useEffect, useRef } from 'react';
import {
  FaMapMarkerAlt, FaCar, FaExclamationTriangle, FaServer,
  FaClock, FaRoute, FaUser, FaSignal, FaCheckCircle, FaTimesCircle,
  FaSync, FaExpand, FaCompress, FaFilter, FaBell, FaEye
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import './Admin.css';

const RealTimeMonitoring = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchRealTimeData();
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchRealTimeData, 5000);
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, filterStatus]);

  const fetchRealTimeData = async () => {
    try {
      const [driversRes, tripsRes, sosRes, healthRes] = await Promise.all([
        adminAPI.getActiveDrivers().catch(() => ({ data: null })),
        adminAPI.getActiveTrips().catch(() => ({ data: null })),
        adminAPI.getSOSAlerts().catch(() => ({ data: null })),
        adminAPI.getSystemHealth().catch(() => ({ data: null }))
      ]);

      let filteredDrivers = driversRes.data || [];
      if (filterStatus !== 'all') {
        filteredDrivers = filteredDrivers.filter(d => d.status === filterStatus);
      }

      setActiveDrivers(filteredDrivers);
      setActiveTrips(tripsRes.data || []);
      setSosAlerts(sosRes.data || []);
      setSystemHealth(healthRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch real-time data:', err);
      // Use mock data as fallback
      setActiveDrivers([
        { id: 1, name: 'Ahmed Ali', status: 'available', vehicle: 'Toyota Corolla', location: { x: 30, y: 40, address: 'Megenagna' }, rating: 4.8, tripsToday: 5 },
        { id: 2, name: 'Mohammed Hussein', status: 'busy', vehicle: 'Hyundai Accent', location: { x: 50, y: 60, address: 'Bole' }, rating: 4.5, tripsToday: 3 },
        { id: 3, name: 'Kedir Jemal', status: 'available', vehicle: 'Nissan Sunny', location: { x: 70, y: 30, address: 'Kazanchis' }, rating: 4.9, tripsToday: 7 },
        { id: 4, name: 'Dawit Abate', status: 'offline', vehicle: 'Toyota Vitz', location: { x: 20, y: 80, address: 'Piassa' }, rating: 4.6, tripsToday: 0 },
      ]);
      setActiveTrips([
        { id: 1, driverName: 'Mohammed Hussein', passengerName: 'Sara Tesfaye', from: 'Bole', to: 'Megenagna', duration: '15 min', status: 'in_progress', startLocation: { x: 50, y: 60 }, endLocation: { x: 30, y: 40 }, fare: 150 },
        { id: 2, driverName: 'Kedir Jemal', passengerName: 'Bekele Alemu', from: 'Kazanchis', to: 'Piassa', duration: '20 min', status: 'in_progress', startLocation: { x: 70, y: 30 }, endLocation: { x: 20, y: 80 }, fare: 200 },
      ]);
      setSosAlerts([]);
      setSystemHealth({ serverStatus: 'Operational', apiLatency: 45 });
      setLoading(false);
    }
  };

  const handleSOSResponse = async (sosId) => {
    try {
      await adminAPI.respondToSOS(sosId);
      setSosAlerts(sosAlerts.filter(s => s.id !== sosId));
    } catch (err) {
      console.error('Failed to respond to SOS:', err);
    }
  };

  const getDriverStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const getTripStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 400 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-greeting">
            {t('admin.realTimeMonitoring') || 'Real-Time Monitoring'}
          </div>
          <div className="admin-role-badge">
            <FaSignal /> {t('admin.live') || 'Live'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button
            className={`admin-icon-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <FaSync className={autoRefresh ? 'spinning' : ''} />
          </button>
          <button className="admin-icon-btn" onClick={fetchRealTimeData}>
            <FaSync />
          </button>
          <button className="admin-icon-btn" onClick={() => setMapFullscreen(!mapFullscreen)}>
            {mapFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* System Health */}
      {systemHealth && (
        <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
              <FaServer />
            </div>
            <div>
              <div className="admin-stat-value">{systemHealth.serverStatus}</div>
              <div className="admin-stat-label">{t('admin.serverStatus') || 'Server Status'}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
              <FaClock />
            </div>
            <div>
              <div className="admin-stat-value">{systemHealth.apiLatency}ms</div>
              <div className="admin-stat-label">{t('admin.apiLatency') || 'API Latency'}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
              <FaCar />
            </div>
            <div>
              <div className="admin-stat-value">{activeDrivers.length}</div>
              <div className="admin-stat-label">{t('admin.activeDrivers') || 'Active Drivers'}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
              <FaExclamationTriangle />
            </div>
            <div>
              <div className="admin-stat-value">{sosAlerts.length}</div>
              <div className="admin-stat-label">{t('admin.sosAlerts') || 'SOS Alerts'}</div>
            </div>
          </div>
        </div>
      )}

      {/* SOS Alerts Priority */}
      {sosAlerts.length > 0 && (
        <div className="admin-section-title" style={{ color: '#ef4444' }}>
          <FaExclamationTriangle /> {t('admin.criticalAlerts') || 'Critical Alerts'}
        </div>
      )}
      {sosAlerts.length > 0 && (
        <div className="admin-activity-list" style={{ marginBottom: 20, borderColor: '#ef4444' }}>
          {sosAlerts.map((sos) => (
            <div key={sos.id} className="admin-activity-item" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
              <div className="admin-activity-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                <FaExclamationTriangle />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text" style={{ color: '#ef4444', fontWeight: 700 }}>
                  {t('admin.sosFrom') || 'SOS from'} {sos.driverName}
                </div>
                <div className="admin-activity-time">
                  {sos.location} • {sos.time}
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSOSResponse(sos.id)}
              >
                <FaEye /> {t('admin.respond') || 'Respond'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Live Map Section */}
      <div className="admin-section-title">
        <FaMapMarkerAlt /> {t('admin.liveMap') || 'Live Map'}
      </div>
      <div className={`admin-live-map ${mapFullscreen ? 'fullscreen' : ''}`}>
        <div className="map-placeholder">
          <div className="map-grid">
            {activeDrivers.map((driver) => (
              <div
                key={driver.id}
                className="map-marker"
                style={{
                  left: `${driver.location.x}%`,
                  top: `${driver.location.y}%`,
                  backgroundColor: getDriverStatusColor(driver.status)
                }}
                onClick={() => setSelectedDriver(driver)}
              >
                <FaCar />
                <span className="marker-label">{driver.name}</span>
              </div>
            ))}
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="trip-route"
                style={{
                  left: `${trip.startLocation.x}%`,
                  top: `${trip.startLocation.y}%`,
                  width: `${Math.abs(trip.endLocation.x - trip.startLocation.x)}%`,
                  height: `${Math.abs(trip.endLocation.y - trip.startLocation.y)}%`,
                  borderColor: getTripStatusColor(trip.status)
                }}
              >
                <FaRoute />
              </div>
            ))}
          </div>
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#10b981' }}></span>
              <span>{t('admin.available') || 'Available'}</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
              <span>{t('admin.busy') || 'Busy'}</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#6b7280' }}></span>
              <span>{t('admin.offline') || 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Filter */}
      <div className="admin-section-title" style={{ marginTop: 20 }}>
        <FaFilter /> {t('admin.filterDrivers') || 'Filter Drivers'}
      </div>
      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          {t('admin.all') || 'All'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'available' ? 'active' : ''}`}
          onClick={() => setFilterStatus('available')}
        >
          {t('admin.available') || 'Available'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'busy' ? 'active' : ''}`}
          onClick={() => setFilterStatus('busy')}
        >
          {t('admin.busy') || 'Busy'}
        </button>
        <button
          className={`admin-filter-tab ${filterStatus === 'offline' ? 'active' : ''}`}
          onClick={() => setFilterStatus('offline')}
        >
          {t('admin.offline') || 'Offline'}
        </button>
      </div>

      {/* Active Drivers List */}
      <div className="admin-activity-list" style={{ marginBottom: 20 }}>
        {activeDrivers.map((driver) => (
          <div
            key={driver.id}
            className="admin-activity-item"
            onClick={() => setSelectedDriver(driver)}
            style={{ cursor: 'pointer' }}
          >
            <div className="admin-activity-icon" style={{
              background: 'rgba(59, 130, 246, 0.08)',
              color: getDriverStatusColor(driver.status)
            }}>
              <FaCar />
            </div>
            <div className="admin-activity-info">
              <div className="admin-activity-text">{driver.name}</div>
              <div className="admin-activity-time">
                {driver.vehicle} • {driver.location.address}
              </div>
            </div>
            <div className="status-badge" style={{
              background: driver.status === 'available' ? '#dcfce7' :
                       driver.status === 'busy' ? '#fef3c7' : '#f3f4f6',
              color: driver.status === 'available' ? '#15803d' :
                     driver.status === 'busy' ? '#92400e' : '#6b7280'
            }}>
              {driver.status}
            </div>
          </div>
        ))}
      </div>

      {/* Active Trips */}
      <div className="admin-section-title">
        <FaRoute /> {t('admin.activeTrips') || 'Active Trips'}
      </div>
      <div className="admin-activity-list">
        {activeTrips.map((trip) => (
          <div
            key={trip.id}
            className="admin-activity-item"
            onClick={() => setSelectedTrip(trip)}
            style={{ cursor: 'pointer' }}
          >
            <div className="admin-activity-icon" style={{
              background: 'rgba(59, 130, 246, 0.08)',
              color: getTripStatusColor(trip.status)
            }}>
              <FaRoute />
            </div>
            <div className="admin-activity-info">
              <div className="admin-activity-text">
                {trip.driverName} → {trip.passengerName}
              </div>
              <div className="admin-activity-time">
                {trip.from} → {trip.to} • {trip.duration}
              </div>
            </div>
            <div className="status-badge" style={{
              background: trip.status === 'in_progress' ? '#dbeafe' : '#dcfce7',
              color: trip.status === 'in_progress' ? '#1d4ed8' : '#15803d'
            }}>
              {trip.status}
            </div>
          </div>
        ))}
      </div>

      {/* Driver Detail Modal */}
      {selectedDriver && (
        <div className="modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDriver.name}</h3>
              <button className="modal-close" onClick={() => setSelectedDriver(null)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.status')}</span>
                <span className="detail-val">{selectedDriver.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.vehicle')}</span>
                <span className="detail-val">{selectedDriver.vehicle}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.location')}</span>
                <span className="detail-val">{selectedDriver.location.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.rating')}</span>
                <span className="detail-val">{selectedDriver.rating} ⭐</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.tripsToday')}</span>
                <span className="detail-val">{selectedDriver.tripsToday}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="modal-overlay" onClick={() => setSelectedTrip(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.tripDetails') || 'Trip Details'}</h3>
              <button className="modal-close" onClick={() => setSelectedTrip(null)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="trip-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.driver')}</span>
                <span className="detail-val">{selectedTrip.driverName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.passenger')}</span>
                <span className="detail-val">{selectedTrip.passengerName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.from')}</span>
                <span className="detail-val">{selectedTrip.from}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.to')}</span>
                <span className="detail-val">{selectedTrip.to}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.fare')}</span>
                <span className="detail-val">ETB {selectedTrip.fare}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.status')}</span>
                <span className="detail-val">{selectedTrip.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeMonitoring;

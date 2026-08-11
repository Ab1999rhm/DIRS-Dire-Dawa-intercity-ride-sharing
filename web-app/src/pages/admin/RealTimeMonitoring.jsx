import React, { useState, useEffect, useRef } from 'react';
import {
  FaMapMarkerAlt, FaCar, FaExclamationTriangle, FaServer,
  FaClock, FaRoute, FaUser, FaSignal, FaCheckCircle, FaTimesCircle,
  FaSync, FaExpand, FaCompress, FaFilter, FaBell, FaEye,
  FaMemory, FaDatabase, FaUsers, FaTachometerAlt, FaChartBar,
  FaMoneyBillWave
} from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import './Admin.css';

// Custom icons for map markers
const driverIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#2563eb;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🚗</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const passengerIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#10b981;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">👤</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const sosIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#dc2626;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;border:3px solid #fff;box-shadow:0 2px 10px rgba(220,38,38,0.5);animation:pulse 1s infinite;">🆘</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const RealTimeMonitoring = () => {
  const { t } = useLanguage();
  const { socket } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [bookingQueue, setBookingQueue] = useState(null);
  const [speedAlerts, setSpeedAlerts] = useState([]);
  const [geofenceAlerts, setGeofenceAlerts] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [incidentChatOpen, setIncidentChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatTarget, setChatTarget] = useState(null);
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

  // Socket.io event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleDriverLocation = (data) => {
      setActiveDrivers(prev => {
        const updated = prev.map(d => 
          d.id === data.driverId 
            ? { ...d, coordinates: data.coordinates, speed: data.speed, heading: data.heading, updatedAt: data.timestamp }
            : d
        );
        return updated;
      });
    };

    const handleSpeedAlert = (data) => {
      setSpeedAlerts(prev => [{ ...data, id: Date.now() }, ...prev].slice(0, 10));
    };

    const handleGeofenceAlert = (data) => {
      setGeofenceAlerts(prev => [{ ...data, id: Date.now() }, ...prev].slice(0, 10));
    };

    const handleSosAlert = (data) => {
      setSosAlerts(prev => [{ ...data, id: Date.now() }, ...prev]);
    };

    socket.on('driver_location_update', handleDriverLocation);
    socket.on('speed_alert', handleSpeedAlert);
    socket.on('geofence_alert', handleGeofenceAlert);
    socket.on('sos_alert', handleSosAlert);

    return () => {
      socket.off('driver_location_update', handleDriverLocation);
      socket.off('speed_alert', handleSpeedAlert);
      socket.off('geofence_alert', handleGeofenceAlert);
      socket.off('sos_alert', handleSosAlert);
    };
  }, [socket]);

  const fetchRealTimeData = async () => {
    try {
      const [driversRes, tripsRes, sosRes, healthRes, queueRes] = await Promise.all([
        adminAPI.getActiveDriversLocations().catch(() => ({ data: { drivers: [] } })),
        adminAPI.getActiveTripsRoutes().catch(() => ({ data: { trips: [] } })),
        adminAPI.getSOSAlerts().catch(() => ({ data: [] })),
        adminAPI.getSystemHealth().catch(() => ({ data: null })),
        adminAPI.getBookingQueue().catch(() => ({ data: null }))
      ]);

      let filteredDrivers = driversRes.data?.drivers || [];
      if (filterStatus !== 'all') {
        filteredDrivers = filteredDrivers.filter(d => d.isAvailable === (filterStatus === 'available'));
      }

      setActiveDrivers(filteredDrivers);
      setActiveTrips(tripsRes.data?.trips || []);
      const sosData = sosRes.data;
      setSosAlerts(Array.isArray(sosData) ? sosData : (sosData?.alerts || sosData?.data || []));
      setSystemHealth(healthRes.data);
      setBookingQueue(queueRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch real-time data:', err);
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

  const handleIncidentChat = (targetId, type) => {
    setChatTarget({ id: targetId, type });
    setChatMessages([]);
    setIncidentChatOpen(true);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessage = {
      sender: 'admin',
      text: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    // Send via Socket.io if available
    if (socket && chatTarget) {
      socket.emit('admin_message', {
        targetId: chatTarget.id,
        targetType: chatTarget.type,
        message: chatInput
      });
    }
    
    setChatInput('');
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', borderRadius: 12, marginBottom: 16, color: 'white' }}>
        <FaSignal style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>Real-Time Monitoring</span>
      </div>

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
        <div className="admin-stats-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
              <FaServer />
            </div>
            <div>
              <div className="admin-stat-value">{systemHealth.cpuUsage}</div>
              <div className="admin-stat-label">{t('admin.cpuUsage') || 'CPU Usage'}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6' }}>
              <FaMemory />
            </div>
            <div>
              <div className="admin-stat-value">{systemHealth.memoryUsage}</div>
              <div className="admin-stat-label">{t('admin.memoryUsage') || 'Memory Usage'}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(236, 72, 153, 0.08)', color: '#ec4899' }}>
              <FaDatabase />
            </div>
            <div>
              <div className="admin-stat-value">{systemHealth.dbSize}</div>
              <div className="admin-stat-label">{t('admin.dbSize') || 'DB Size'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Extended System Health */}
      {systemHealth && (
        <div className="admin-stats-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
              <FaClock />
            </div>
            <div>
              <div className="admin-stat-value">{systemHealth.uptime}</div>
              <div className="admin-stat-label">{t('admin.uptime') || 'Uptime'}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
              <FaUsers />
            </div>
            <div>
              <div className="admin-stat-value">{systemHealth.activeConnections}</div>
              <div className="admin-stat-label">{t('admin.activeConnections') || 'Active Connections'}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
              <FaTachometerAlt />
            </div>
            <div>
              <div className="admin-stat-value">{systemHealth.apiLatency}ms</div>
              <div className="admin-stat-label">{t('admin.apiLatency') || 'API Latency'}</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
              <FaExclamationTriangle />
            </div>
            <div>
              <div className="admin-stat-value">{systemHealth.errorRate}</div>
              <div className="admin-stat-label">{t('admin.errorRate') || 'Error Rate'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Live Analytics Dashboard */}
      <div className="admin-section-title">
        <FaChartBar /> {t('admin.liveAnalytics') || 'Live Analytics'}
      </div>
      <div className="admin-stats-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaCar />
          </div>
          <div>
            <div className="admin-stat-value">{activeTrips.length}</div>
            <div className="admin-stat-label">{t('admin.activeTrips') || 'Active Trips'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaMoneyBillWave />
          </div>
          <div>
            <div className="admin-stat-value">
              ETB {activeTrips.reduce((sum, trip) => sum + (trip.estimatedFare || 0), 0).toLocaleString()}
            </div>
            <div className="admin-stat-label">{t('admin.estimatedRevenue') || 'Estimated Revenue'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaRoute />
          </div>
          <div>
            <div className="admin-stat-value">{activeDrivers.filter(d => d.isAvailable).length}</div>
            <div className="admin-stat-label">{t('admin.availableDrivers') || 'Available Drivers'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6' }}>
            <FaUsers />
          </div>
          <div>
            <div className="admin-stat-value">{bookingQueue?.queueLength || 0}</div>
            <div className="admin-stat-label">{t('admin.pendingRequests') || 'Pending Requests'}</div>
          </div>
        </div>
      </div>

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
                  {sos.location?.address || (sos.location?.coordinates ? `${sos.location.coordinates[1]?.toFixed(4)}, ${sos.location.coordinates[0]?.toFixed(4)}` : sos.location || 'N/A')} • {sos.time}
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
        <MapContainer
          center={[9.6009, 41.8508]} // Dire Dawa coordinates
          zoom={13}
          style={{ height: mapFullscreen ? '80vh' : '400px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Driver Markers */}
          {activeDrivers.map((driver) => (
            driver.coordinates && (
              <Marker
                key={driver.id}
                position={[driver.coordinates[1], driver.coordinates[0]]}
                icon={driverIcon}
                eventHandlers={{
                  click: () => setSelectedDriver(driver)
                }}
              >
                <Popup>
                  <div style={{ padding: 8 }}>
                    <strong>{driver.firstName} {driver.lastName}</strong><br />
                    <span style={{ color: driver.isAvailable ? '#10b981' : '#f59e0b' }}>
                      {driver.isAvailable ? 'Available' : 'Busy'}
                    </span><br />
                    Rating: {driver.rating?.toFixed(1) || 'N/A'} ⭐<br />
                    Vehicle: {driver.vehicleType || 'N/A'}
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Passenger Markers from active trips */}
          {activeTrips.map((trip) => (
            trip.passenger?.coordinates && (
              <Marker
                key={`passenger-${trip.id}`}
                position={[trip.passenger.coordinates[1], trip.passenger.coordinates[0]]}
                icon={passengerIcon}
              >
                <Popup>
                  <div style={{ padding: 8 }}>
                    <strong>{trip.passenger.name}</strong><br />
                    Passenger<br />
                    Trip: {trip.id}
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Trip Routes */}
          {activeTrips.map((trip) => {
            const pickupCoords = trip.pickupLocation?.coordinates;
            const dropoffCoords = trip.dropoffLocation?.coordinates;
            const driverCoords = trip.driver?.coordinates;
            
            if (pickupCoords && dropoffCoords) {
              return (
                <Polyline
                  key={`route-${trip.id}`}
                  positions={[
                    [pickupCoords[1], pickupCoords[0]],
                    [dropoffCoords[1], dropoffCoords[0]]
                  ]}
                  color={trip.status === 'in_progress' ? '#3b82f6' : '#10b981'}
                  weight={3}
                  opacity={0.7}
                />
              );
            }
            return null;
          })}

          {/* SOS Alert Markers */}
          {sosAlerts.map((sos) => (
            sos.location?.coordinates && (
              <Marker
                key={`sos-${sos._id}`}
                position={[sos.location.coordinates[1], sos.location.coordinates[0]]}
                icon={sosIcon}
              >
                <Popup>
                  <div style={{ padding: 8, color: '#dc2626' }}>
                    <strong>🆘 SOS ALERT</strong><br />
                    {sos.user?.firstName} {sos.user?.lastName}<br />
                    {sos.description || 'Emergency'}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
        <div className="map-legend" style={{ marginTop: 10, display: 'flex', gap: 16, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: '#2563eb', borderRadius: '50%' }}></span>
            <span>{t('admin.drivers') || 'Drivers'}</span>
          </div>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: '#10b981', borderRadius: '50%' }}></span>
            <span>{t('admin.passengers') || 'Passengers'}</span>
          </div>
          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: '#dc2626', borderRadius: '50%' }}></span>
            <span>{t('admin.sos') || 'SOS'}</span>
          </div>
        </div>
      </div>

      {/* Driver Filter + Booking Queue */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginTop: 20,
          marginBottom: 16,
        }}
        className="admin-animate-in-delay-2"
      >
        {/* Filter Tabs Card */}
        <div
          style={{
            padding: 16,
            background: 'var(--card)',
            borderRadius: 12,
            border: '1px solid var(--border-light)',
            borderTop: '4px solid #3b82f6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FaFilter style={{ color: '#3b82f6', fontSize: 16 }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{t('admin.filterDrivers') || 'Filter Drivers'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: filterStatus === 'all' ? '#3b82f6' : 'rgba(59,130,246,0.08)',
                color: filterStatus === 'all' ? '#fff' : '#3b82f6',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{t('admin.all') || 'All'}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                background: filterStatus === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(59,130,246,0.15)',
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {activeDrivers.length}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: filterStatus === 'available' ? '#10b981' : 'rgba(16,185,129,0.08)',
                color: filterStatus === 'available' ? '#fff' : '#10b981',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{t('admin.available') || 'Available'}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                background: filterStatus === 'available' ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.15)',
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {activeDrivers.filter(d => d.isAvailable).length}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('busy')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: filterStatus === 'busy' ? '#f59e0b' : 'rgba(245,158,11,0.08)',
                color: filterStatus === 'busy' ? '#fff' : '#f59e0b',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{t('admin.busy') || 'Busy'}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                background: filterStatus === 'busy' ? 'rgba(255,255,255,0.2)' : 'rgba(245,158,11,0.15)',
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                {activeDrivers.filter(d => !d.isAvailable).length}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('offline')}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: filterStatus === 'offline' ? '#6b7280' : 'rgba(107,114,128,0.08)',
                color: filterStatus === 'offline' ? '#fff' : '#6b7280',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{t('admin.offline') || 'Offline'}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                background: filterStatus === 'offline' ? 'rgba(255,255,255,0.2)' : 'rgba(107,114,128,0.15)',
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                0
              </span>
            </button>
          </div>
        </div>

        {/* Booking Queue Stats Card */}
        <div
          style={{
            padding: 16,
            background: 'var(--card)',
            borderRadius: 12,
            border: '1px solid var(--border-light)',
            borderTop: '4px solid #7c3aed',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FaUsers style={{ color: '#7c3aed', fontSize: 16 }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{t('admin.bookingQueue') || 'Booking Queue'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{
              padding: '10px 12px',
              background: 'rgba(245,158,11,0.08)',
              borderRadius: 8,
              border: '1px solid rgba(245,158,11,0.15)',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>
                {bookingQueue?.queueLength || 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                {t('admin.pendingRequests') || 'Pending Requests'}
              </div>
            </div>
            <div style={{
              padding: '10px 12px',
              background: 'rgba(16,185,129,0.08)',
              borderRadius: 8,
              border: '1px solid rgba(16,185,129,0.15)',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>
                {bookingQueue?.availableDrivers || 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                {t('admin.availableDrivers') || 'Available Drivers'}
              </div>
            </div>
            <div style={{
              gridColumn: '1 / -1',
              padding: '10px 12px',
              background: 'rgba(59,130,246,0.08)',
              borderRadius: 8,
              border: '1px solid rgba(59,130,246,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>
                  {bookingQueue?.avgWaitTime || 0}m
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {t('admin.avgWaitTime') || 'Avg Wait Time'}
                </div>
              </div>
              <FaTachometerAlt style={{ fontSize: 24, color: '#3b82f6', opacity: 0.3 }} />
            </div>
          </div>
        </div>
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
              color: driver.isAvailable ? '#10b981' : '#f59e0b'
            }}>
              <FaCar />
            </div>
            <div className="admin-activity-info">
              <div className="admin-activity-text">{`${driver.firstName || ''} ${driver.lastName || ''}`}</div>
              <div className="admin-activity-time">
                {driver.vehicleType || 'N/A'} • Rating: {(driver.rating || 0).toFixed(1)}
              </div>
            </div>
            <div className="status-badge" style={{
              background: driver.isAvailable ? '#dcfce7' : '#fef3c7',
              color: driver.isAvailable ? '#15803d' : '#92400e'
            }}>
              {driver.isAvailable ? 'Available' : 'Busy'}
            </div>
          </div>
        ))}
      </div>

      {/* Speed Alerts */}
      {speedAlerts.length > 0 && (
        <>
          <div className="admin-section-title" style={{ color: '#f59e0b' }}>
            <FaTachometerAlt /> {t('admin.speedAlerts') || 'Speed Alerts'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20, borderColor: '#f59e0b' }}>
            {speedAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="admin-activity-item" style={{ background: 'rgba(245, 158, 11, 0.05)' }}>
                <div className="admin-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <FaTachometerAlt />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text" style={{ color: '#f59e0b', fontWeight: 700 }}>
                    Driver {alert.driverId} - {alert.speed} km/h
                  </div>
                  <div className="admin-activity-time">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Geofencing Alerts */}
      {geofenceAlerts.length > 0 && (
        <>
          <div className="admin-section-title" style={{ color: '#8b5cf6' }}>
            <FaMapMarkerAlt /> {t('admin.geofenceAlerts') || 'Geofence Alerts'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20, borderColor: '#8b5cf6' }}>
            {geofenceAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="admin-activity-item" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                <div className="admin-activity-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                  <FaMapMarkerAlt />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text" style={{ color: '#8b5cf6', fontWeight: 700 }}>
                    Driver {alert.driverId} - {alert.message}
                  </div>
                  <div className="admin-activity-time">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
              color: trip.status === 'in_progress' ? '#3b82f6' : '#10b981'
            }}>
              <FaRoute />
            </div>
            <div className="admin-activity-info">
              <div className="admin-activity-text">
                {trip.driver?.name} → {trip.passenger?.name}
              </div>
              <div className="admin-activity-time">
                {trip.status} • ETB {trip.estimatedFare || 'N/A'}
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
              <h3>{selectedDriver.firstName} {selectedDriver.lastName}</h3>
              <button className="modal-close" onClick={() => setSelectedDriver(null)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.status')}</span>
                <span className="detail-val">{selectedDriver.isAvailable ? 'Available' : 'Busy'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.vehicle')}</span>
                <span className="detail-val">{selectedDriver.vehicleType || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.rating')}</span>
                <span className="detail-val">{selectedDriver.rating?.toFixed(1) || 'N/A'} ⭐</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.location')}</span>
                <span className="detail-val">
                  {selectedDriver.coordinates ? 
                    `${selectedDriver.coordinates[1].toFixed(4)}, ${selectedDriver.coordinates[0].toFixed(4)}` : 
                    'N/A'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.lastUpdate')}</span>
                <span className="detail-val">
                  {selectedDriver.updatedAt ? new Date(selectedDriver.updatedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleIncidentChat(selectedDriver.id, 'driver')}>
                  <FaBell /> {t('admin.contact') || 'Contact'}
                </button>
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
                <span className="detail-val">{selectedTrip.driver?.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.passenger')}</span>
                <span className="detail-val">{selectedTrip.passenger?.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.status')}</span>
                <span className="detail-val">{selectedTrip.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.fare')}</span>
                <span className="detail-val">ETB {selectedTrip.estimatedFare || 'N/A'}</span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleIncidentChat(selectedTrip.id, 'trip')}>
                  <FaBell /> {t('admin.contact') || 'Contact'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Chat Modal */}
      {incidentChatOpen && (
        <div className="modal-overlay" onClick={() => setIncidentChatOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{t('admin.incidentChat') || 'Incident Response Chat'}</h3>
              <button className="modal-close" onClick={() => setIncidentChatOpen(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div style={{ height: 300, overflowY: 'auto', marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
                  {t('admin.noMessages') || 'No messages yet'}
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: 8,
                    padding: 8,
                    borderRadius: 8,
                    background: msg.sender === 'admin' ? '#3b82f6' : '#e5e7eb',
                    color: msg.sender === 'admin' ? 'white' : 'black',
                    alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{msg.sender === 'admin' ? 'You' : msg.sender}</div>
                    <div>{msg.text}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t('admin.typeMessage') || 'Type a message...'}
                style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              />
              <button className="btn btn-primary btn-sm" onClick={sendChatMessage}>
                {t('admin.send') || 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeMonitoring;

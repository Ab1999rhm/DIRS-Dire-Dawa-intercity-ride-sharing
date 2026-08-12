import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaSatellite, FaMap } from 'react-icons/fa';

const DRIVER_COLORS = {
  online: '#10b981',
  on_trip: '#3b82f6',
  idle: '#f59e0b',
  offline: '#6b7280',
};

const createDriverIcon = (color, size = 28) => L.divIcon({
  className: 'custom-driver-marker',
  html: `<div style="
    width: ${size}px; height: ${size}px;
    background: ${color};
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px ${color}80, 0 0 0 2px ${color}40;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.3s ease;
  "><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg></div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
});

const createSOSIcon = () => L.divIcon({
  className: 'custom-sos-marker',
  html: `<div style="
    width: 36px; height: 36px;
    background: #dc2626;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 12px rgba(220,38,38,0.6), 0 0 0 3px rgba(220,38,38,0.3);
    display: flex; align-items: center; justify-content: center;
    animation: sosPulse 1.5s ease-in-out infinite;
  "><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg></div>
  <style>@keyframes sosPulse { 0%,100% { box-shadow: 0 2px 12px rgba(220,38,38,0.6), 0 0 0 3px rgba(220,38,38,0.3); } 50% { box-shadow: 0 2px 20px rgba(220,38,38,0.8), 0 0 0 8px rgba(220,38,38,0); } }</style>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const createPassengerIcon = () => L.divIcon({
  className: 'custom-passenger-marker',
  html: `<div style="
    width: 24px; height: 24px;
    background: #7c3aed;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(124,58,237,0.5);
    display: flex; align-items: center; justify-content: center;
  "><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function FlyToDriver({ selectedDriver }) {
  const map = useMap();
  useEffect(() => {
    if (selectedDriver?.currentLocation?.coordinates) {
      const [lng, lat] = selectedDriver.currentLocation.coordinates;
      map.flyTo([lat, lng], 15, { duration: 1.5 });
    }
  }, [selectedDriver, map]);
  return null;
}

const AdminLiveMap = ({ drivers = [], trips = [], sosAlerts = [] }) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [mapType, setMapType] = useState('street');
  const [showDrivers, setShowDrivers] = useState(true);
  const [showTrips, setShowTrips] = useState(true);
  const [showSOS, setShowSOS] = useState(true);
  const [driverCount, setDriverCount] = useState(0);
  const [sosCount, setSosCount] = useState(0);

  useEffect(() => {
    setDriverCount(drivers.length);
    setSosCount(sosAlerts.length);
  }, [drivers, sosAlerts]);

  const direDawa = [9.6009, 41.8508];

  const getDriverStatusColor = (driver) => {
    if (driver.isOnline && driver.isOnTrip) return DRIVER_COLORS.on_trip;
    if (driver.isOnline) return DRIVER_COLORS.online;
    return DRIVER_COLORS.offline;
  };

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
      {/* Map Controls Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--card)',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaMap style={{ color: '#3b82f6', fontSize: 16 }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Live Map</span>
          <span style={{
            fontSize: 10, fontWeight: 700, background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
            padding: '2px 8px', borderRadius: 10,
          }}>{driverCount} drivers</span>
          {sosCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, background: 'rgba(220,38,38,0.1)', color: '#dc2626',
              padding: '2px 8px', borderRadius: 10,
            }}>{sosCount} SOS</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              border: '1px solid var(--border-light)', borderRadius: 8,
              background: mapType === 'satellite' ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)',
              color: mapType === 'satellite' ? '#3b82f6' : 'var(--text-muted)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            {mapType === 'satellite' ? <FaSatellite size={12} /> : <FaMap size={12} />}
            {mapType === 'satellite' ? 'Satellite' : 'Street'}
          </button>
          <button
            onClick={() => setShowDrivers(!showDrivers)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              border: `1px solid ${showDrivers ? '#10b981' : 'var(--border-light)'}`,
              borderRadius: 8,
              background: showDrivers ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)',
              color: showDrivers ? '#10b981' : 'var(--text-muted)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            Drivers
          </button>
          <button
            onClick={() => setShowTrips(!showTrips)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              border: `1px solid ${showTrips ? '#3b82f6' : 'var(--border-light)'}`,
              borderRadius: 8,
              background: showTrips ? 'rgba(59,130,246,0.1)' : 'var(--bg-secondary)',
              color: showTrips ? '#3b82f6' : 'var(--text-muted)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            Trips
          </button>
          <button
            onClick={() => setShowSOS(!showSOS)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
              border: `1px solid ${showSOS ? '#dc2626' : 'var(--border-light)'}`,
              borderRadius: 8,
              background: showSOS ? 'rgba(220,38,38,0.1)' : 'var(--bg-secondary)',
              color: showSOS ? '#dc2626' : 'var(--text-muted)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            SOS
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: 350, width: '100%' }}>
        <MapContainer
          center={direDawa}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          whenReady={() => setMapReady(true)}
        >
          <ZoomControl position="bottomright" />
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked={mapType === 'street'} name="Street">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked={mapType === 'satellite'} name="Satellite">
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <FlyToDriver selectedDriver={selectedDriver} />

          {/* Driver Markers */}
          {showDrivers && drivers.map((driver, idx) => {
            const coords = driver.currentLocation?.coordinates;
            if (!coords) return null;
            const [lng, lat] = Array.isArray(coords) ? coords : coords.coordinates || [];
            if (!lat || !lng) return null;
            const color = getDriverStatusColor(driver);
            return (
              <Marker
                key={driver._id || idx}
                position={[lat, lng]}
                icon={createDriverIcon(color)}
                eventHandlers={{
                  click: () => setSelectedDriver(driver),
                }}
              >
                <Popup>
                  <div style={{ fontSize: 13, minWidth: 150 }}>
                    <strong>{driver.user?.firstName} {driver.user?.lastName}</strong><br />
                    <span style={{ color: color, fontWeight: 600 }}>
                      {driver.isOnline ? (driver.isOnTrip ? 'On Trip' : 'Online') : 'Offline'}
                    </span><br />
                    {driver.vehicleType && <span>Vehicle: {driver.vehicleType}</span>}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Trip Markers (pickup points) */}
          {showTrips && trips.map((trip, idx) => {
            const coords = trip.pickupLocation?.coordinates;
            if (!coords) return null;
            const [lng, lat] = Array.isArray(coords) ? coords : coords.coordinates || [];
            if (!lat || !lng) return null;
            return (
              <Marker
                key={trip._id || idx}
                position={[lat, lng]}
                icon={createPassengerIcon()}
              >
                <Popup>
                  <div style={{ fontSize: 13 }}>
                    <strong>Trip</strong><br />
                    Status: {trip.status}<br />
                    {trip.passenger?.firstName && `Passenger: ${trip.passenger.firstName}`}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* SOS Markers */}
          {showSOS && sosAlerts.map((sos, idx) => {
            const coords = sos.location?.coordinates;
            if (!coords) return null;
            const [lng, lat] = Array.isArray(coords) ? coords : coords.coordinates || [];
            if (!lat || !lng) return null;
            return (
              <Marker
                key={sos._id || idx}
                position={[lat, lng]}
                icon={createSOSIcon()}
              >
                <Popup>
                  <div style={{ fontSize: 13, color: '#dc2626' }}>
                    <strong>SOS ALERT</strong><br />
                    User: {sos.user?.firstName} {sos.user?.lastName}<br />
                    Status: {sos.status}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 12, padding: '8px 14px',
        background: 'var(--card)', borderTop: '1px solid var(--border-light)',
        flexWrap: 'wrap',
      }}>
        {[
          { color: DRIVER_COLORS.online, label: 'Online' },
          { color: DRIVER_COLORS.on_trip, label: 'On Trip' },
          { color: '#7c3aed', label: 'Passenger' },
          { color: '#dc2626', label: 'SOS Alert' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, border: '1px solid white', boxShadow: `0 0 4px ${item.color}40` }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLiveMap;

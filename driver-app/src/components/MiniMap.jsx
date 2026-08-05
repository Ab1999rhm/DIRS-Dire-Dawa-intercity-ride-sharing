import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

const miniPickupIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#00c853;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const miniDropoffIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#ff1744;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const MiniMap = ({ pickup, dropoff, className = '' }) => {
  const pickupCoords = pickup?.coordinates;
  const dropoffCoords = dropoff?.coordinates;

  const hasCoords = pickupCoords && dropoffCoords;
  const center = hasCoords
    ? [(pickupCoords[1] + dropoffCoords[1]) / 2, (pickupCoords[0] + dropoffCoords[0]) / 2]
    : [9.6009, 41.8508];

  const pickupAddr = pickup?.address || 'Pickup';
  const dropoffAddr = dropoff?.address || 'Dropoff';

  if (!hasCoords) {
    return (
      <div className={`mini-map-preview ${className}`}>
        <div className="mini-map-placeholder">
          <div className="route-dots">
            <div className="route-dot" style={{ borderColor: '#00c853', background: '#d4f5d0' }}></div>
            <div className="route-line"></div>
            <div className="route-dot" style={{ borderColor: '#ff1744', background: '#ffd4d4' }}></div>
          </div>
          <span style={{ fontSize: '10px', color: '#6c757d', maxWidth: '90%', textAlign: 'center', lineHeight: 1.3 }}>
            {pickupAddr.split(',')[0]} → {dropoffAddr.split(',')[0]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`mini-map-preview ${className}`} style={{ padding: 0 }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <Marker position={[pickupCoords[1], pickupCoords[0]]} icon={miniPickupIcon} />
        <Marker position={[dropoffCoords[1], dropoffCoords[0]]} icon={miniDropoffIcon} />
      </MapContainer>
    </div>
  );
};

export default MiniMap;

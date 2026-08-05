import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

const defaultCenter = [9.6009, 41.8508];

const demandZones = [
  { id: 'market', name: 'Dire Dawa Market', lat: 9.5985, lng: 41.8520, intensity: 0.9, color: '#ef4444' },
  { id: 'bus_station', name: 'Bus Station', lat: 9.6055, lng: 41.8490, intensity: 0.85, color: '#f97316' },
  { id: 'airport', name: 'Dire Dawa Airport', lat: 9.6275, lng: 41.8530, intensity: 0.6, color: '#eab308' },
  { id: 'university', name: 'Dire Dawa University', lat: 9.6080, lng: 41.8610, intensity: 0.7, color: '#f97316' },
  { id: 'kezira', name: 'Kezira Area', lat: 9.5940, lng: 41.8450, intensity: 0.75, color: '#f97316' },
  { id: 'sefer', name: 'Sefer Area', lat: 9.5910, lng: 41.8560, intensity: 0.5, color: '#eab308' },
  { id: 'sabian', name: 'Sabian Area', lat: 9.6120, lng: 41.8380, intensity: 0.4, color: '#22c55e' },
];

const driverIcon = L.divIcon({
  className: 'custom-marker driver-marker',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#1a73e8;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><div style="width:10px;height:10px;border-radius:50%;background:white"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const pickupIcon = L.divIcon({
  className: 'custom-marker pickup-marker',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#00c853;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px">P</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const dropoffIcon = L.divIcon({
  className: 'custom-marker dropoff-marker',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#ff1744;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px">D</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const requestIcon = L.divIcon({
  className: 'custom-marker request-marker',
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#ff9100;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:10px">R</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const FlyToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), { duration: 0.8 });
    }
  }, [position, map]);
  return null;
};

const DashboardMap = ({ driverLocation, currentTrip, rideRequests, showDemandZones = false }) => {
  const center = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : defaultCenter;

  return (
    <div className="map-container" style={{ borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ width: '100%', height: '300px', borderRadius: '16px' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <FlyToLocation position={center} />

        {/* Demand zones */}
        {showDemandZones && demandZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={400 + zone.intensity * 200}
            pathOptions={{
              fillColor: zone.color,
              fillOpacity: 0.12 + zone.intensity * 0.13,
              color: zone.color,
              opacity: 0.3,
              weight: 1,
            }}
          >
            <Popup><strong>{zone.name}</strong></Popup>
          </Circle>
        ))}

        {/* Driver marker */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup><strong>Your Location</strong></Popup>
          </Marker>
        )}

        {/* Pickup marker */}
        {currentTrip?.pickupLocation?.coordinates && (
          <Marker
            position={[currentTrip.pickupLocation.coordinates[1], currentTrip.pickupLocation.coordinates[0]]}
            icon={pickupIcon}
          >
            <Popup><strong>Pickup</strong><br />{currentTrip.pickupLocation?.address}</Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {currentTrip?.dropoffLocation?.coordinates && (
          <Marker
            position={[currentTrip.dropoffLocation.coordinates[1], currentTrip.dropoffLocation.coordinates[0]]}
            icon={dropoffIcon}
          >
            <Popup><strong>Dropoff</strong><br />{currentTrip.dropoffLocation?.address}</Popup>
          </Marker>
        )}

        {/* Ride request markers */}
        {rideRequests?.map((req) =>
          req.pickupLocation?.coordinates ? (
            <Marker
              key={req._id}
              position={[req.pickupLocation.coordinates[1], req.pickupLocation.coordinates[0]]}
              icon={requestIcon}
            >
              <Popup>
                <strong>Ride Request</strong><br />
                {req.passenger?.firstName} {req.passenger?.lastName}<br />
                Fare: {req.estimatedFare} ETB
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>

      {/* Demand zone legend */}
      {showDemandZones && (
        <div className="map-legend-overlay">
          <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }}></span> High</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#f97316' }}></span> Medium</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#22c55e' }}></span> Low</span>
        </div>
      )}
    </div>
  );
};

export default DashboardMap;

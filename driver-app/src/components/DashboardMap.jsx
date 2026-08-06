import React from 'react';
import FlexibleMap from './common/FlexibleMap';
import L from 'leaflet';

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
  html: `<div style="width:36px;height:36px;border-radius:50%;background:#1a73e8;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><div style="width:12px;height:12px;border-radius:50%;background:white"></div></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const pickupIcon = L.divIcon({
  className: 'custom-marker pickup-marker',
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#00c853;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:13px">P</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const dropoffIcon = L.divIcon({
  className: 'custom-marker dropoff-marker',
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#ff1744;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:13px">D</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const requestIcon = L.divIcon({
  className: 'custom-marker request-marker',
  html: `<div style="width:26px;height:26px;border-radius:50%;background:#ff9100;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px">R</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const DashboardMap = ({ driverLocation, currentTrip, rideRequests, showDemandZones = false }) => {
  const center = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : [9.6009, 41.8508];

  const markers = [];

  if (driverLocation) {
    markers.push({
      id: 'driver',
      position: [driverLocation.lat, driverLocation.lng],
      icon: driverIcon,
      popup: 'Your Location',
    });
  }

  if (currentTrip?.pickupLocation?.coordinates) {
    markers.push({
      id: 'pickup',
      position: [currentTrip.pickupLocation.coordinates[1], currentTrip.pickupLocation.coordinates[0]],
      icon: pickupIcon,
      popup: `Pickup: ${currentTrip.pickupLocation?.address || ''}`,
    });
  }

  if (currentTrip?.dropoffLocation?.coordinates) {
    markers.push({
      id: 'dropoff',
      position: [currentTrip.dropoffLocation.coordinates[1], currentTrip.dropoffLocation.coordinates[0]],
      icon: dropoffIcon,
      popup: `Dropoff: ${currentTrip.dropoffLocation?.address || ''}`,
    });
  }

  if (rideRequests) {
    rideRequests.forEach((req) => {
      if (req.pickupLocation?.coordinates) {
        markers.push({
          id: req._id,
          position: [req.pickupLocation.coordinates[1], req.pickupLocation.coordinates[0]],
          icon: requestIcon,
          popup: `Request: ${req.passenger?.firstName || ''} ${req.passenger?.lastName || ''} - ${req.estimatedFare || 0} ETB`,
        });
      }
    });
  }

  const circles = showDemandZones
    ? demandZones.map((zone) => ({
        id: zone.id,
        center: [zone.lat, zone.lng],
        radius: 400 + zone.intensity * 200,
        color: zone.color,
        fillOpacity: 0.12 + zone.intensity * 0.13,
        opacity: 0.3,
        popup: zone.name,
      }))
    : [];

  const polyline =
    currentTrip?.pickupLocation?.coordinates && currentTrip?.dropoffLocation?.coordinates
      ? {
          positions: [
            [currentTrip.pickupLocation.coordinates[1], currentTrip.pickupLocation.coordinates[0]],
            [currentTrip.dropoffLocation.coordinates[1], currentTrip.dropoffLocation.coordinates[0]],
          ],
          color: '#2563eb',
          weight: 4,
          dashArray: '8 8',
        }
      : null;

  return (
    <div className="map-container" style={{ borderRadius: '16px', overflow: 'hidden' }}>
      <FlexibleMap
        center={center}
        zoom={14}
        defaultHeight="350px"
        markers={markers}
        circles={circles}
        polyline={polyline}
        showRecenter={true}
        showFullscreen={true}
        showZoomButtons={true}
      />

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

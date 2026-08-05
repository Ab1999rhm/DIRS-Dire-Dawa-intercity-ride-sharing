import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '16px',
  overflow: 'hidden'
};

const defaultCenter = {
  lat: 9.6009,
  lng: 41.8508
};

const libraries = ['places'];

const demandZones = [
  { id: 'market', name: 'Dire Dawa Market', lat: 9.5985, lng: 41.8520, intensity: 0.9, color: '#ef4444' },
  { id: 'bus_station', name: 'Bus Station', lat: 9.6055, lng: 41.8490, intensity: 0.85, color: '#f97316' },
  { id: 'airport', name: 'Dire Dawa Airport', lat: 9.6275, lng: 41.8530, intensity: 0.6, color: '#eab308' },
  { id: 'university', name: 'Dire Dawa University', lat: 9.6080, lng: 41.8610, intensity: 0.7, color: '#f97316' },
  { id: 'kezira', name: 'Kezira Area', lat: 9.5940, lng: 41.8450, intensity: 0.75, color: '#f97316' },
  { id: 'sefer', name: 'Sefer Area', lat: 9.5910, lng: 41.8560, intensity: 0.5, color: '#eab308' },
  { id: 'sabian', name: 'Sabian Area', lat: 9.6120, lng: 41.8380, intensity: 0.4, color: '#22c55e' },
];

const DashboardMap = ({ driverLocation, currentTrip, rideRequests, showDemandZones = false }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && driverLocation) {
      map.panTo(driverLocation);
    }
  }, [map, driverLocation]);

  if (loadError) {
    return (
      <div className="map-container map-error">
        <p>Map unavailable</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-container map-loading">
        <p>Loading map...</p>
      </div>
    );
  }

  const hasApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!hasApiKey) {
    return (
      <div className="map-container map-placeholder">
        <div className="map-placeholder-content">
          <div className="map-pin pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1a73e8"/>
              <circle cx="12" cy="9" r="3" fill="white"/>
            </svg>
          </div>
          <p className="map-placeholder-text">
            {driverLocation ? 'Location active' : 'Enable location for map'}
          </p>
          {currentTrip && (
            <div className="map-trip-info">
              <span className="map-trip-route">
                {currentTrip.pickupLocation?.address?.split(',')[0]} → {currentTrip.dropoffLocation?.address?.split(',')[0]}
              </span>
            </div>
          )}
          {showDemandZones && (
            <div className="map-demand-legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }}></span> High demand</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#f97316' }}></span> Medium</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#22c55e' }}></span> Low</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={driverLocation || defaultCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: 'poi',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
      >
        {/* Demand zones */}
        {showDemandZones && demandZones.map((zone) => (
          <Circle
            key={zone.id}
            center={{ lat: zone.lat, lng: zone.lng }}
            radius={400 + zone.intensity * 200}
            options={{
              fillColor: zone.color,
              fillOpacity: 0.12 + zone.intensity * 0.13,
              strokeColor: zone.color,
              strokeOpacity: 0.3,
              strokeWeight: 1,
              clickable: false
            }}
          />
        ))}

        {driverLocation && (
          <Marker
            position={driverLocation}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#1a73e8" stroke="white" stroke-width="3"/>
                  <circle cx="16" cy="16" r="5" fill="white"/>
                </svg>
              `),
              scaledSize: { width: 32, height: 32 },
              anchor: { x: 16, y: 16 }
            }}
            onClick={() => setSelectedMarker('driver')}
          />
        )}

        {currentTrip?.pickupLocation?.coordinates && (
          <Marker
            position={{
              lat: currentTrip.pickupLocation.coordinates[1],
              lng: currentTrip.pickupLocation.coordinates[0]
            }}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="14" r="12" fill="#00c853" stroke="white" stroke-width="2"/>
                  <text x="14" y="18" text-anchor="middle" fill="white" font-size="12" font-weight="bold">P</text>
                </svg>
              `),
              scaledSize: { width: 28, height: 28 },
              anchor: { x: 14, y: 14 }
            }}
            onClick={() => setSelectedMarker('pickup')}
          />
        )}

        {currentTrip?.dropoffLocation?.coordinates && (
          <Marker
            position={{
              lat: currentTrip.dropoffLocation.coordinates[1],
              lng: currentTrip.dropoffLocation.coordinates[0]
            }}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="14" r="12" fill="#ff1744" stroke="white" stroke-width="2"/>
                  <text x="14" y="18" text-anchor="middle" fill="white" font-size="12" font-weight="bold">D</text>
                </svg>
              `),
              scaledSize: { width: 28, height: 28 },
              anchor: { x: 14, y: 14 }
            }}
            onClick={() => setSelectedMarker('dropoff')}
          />
        )}

        {rideRequests?.map((req) => (
          req.pickupLocation?.coordinates && (
            <Marker
              key={req._id}
              position={{
                lat: req.pickupLocation.coordinates[1],
                lng: req.pickupLocation.coordinates[0]
              }}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#ff9100" stroke="white" stroke-width="2"/>
                    <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">R</text>
                  </svg>
                `),
                scaledSize: { width: 24, height: 24 },
                anchor: { x: 12, y: 12 }
              }}
              onClick={() => setSelectedMarker(`ride_${req._id}`)}
            />
          )
        ))}

        {selectedMarker === 'driver' && (
          <InfoWindow position={driverLocation} onCloseClick={() => setSelectedMarker(null)}>
            <div><strong>Your Location</strong></div>
          </InfoWindow>
        )}
        {selectedMarker === 'pickup' && currentTrip?.pickupLocation?.coordinates && (
          <InfoWindow position={{ lat: currentTrip.pickupLocation.coordinates[1], lng: currentTrip.pickupLocation.coordinates[0] }} onCloseClick={() => setSelectedMarker(null)}>
            <div><strong>Pickup</strong><br/>{currentTrip.pickupLocation?.address}</div>
          </InfoWindow>
        )}
        {selectedMarker === 'dropoff' && currentTrip?.dropoffLocation?.coordinates && (
          <InfoWindow position={{ lat: currentTrip.dropoffLocation.coordinates[1], lng: currentTrip.dropoffLocation.coordinates[0] }} onCloseClick={() => setSelectedMarker(null)}>
            <div><strong>Dropoff</strong><br/>{currentTrip.dropoffLocation?.address}</div>
          </InfoWindow>
        )}
      </GoogleMap>

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

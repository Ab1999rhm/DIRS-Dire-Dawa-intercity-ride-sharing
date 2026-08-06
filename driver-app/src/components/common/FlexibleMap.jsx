import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaExpand, FaCompress, FaCrosshairs, FaPlus, FaMinus } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';

const RecenterButton = ({ position }) => {
  const map = useMap();
  return (
    <button
      className="map-ctrl-btn map-recenter-btn"
      onClick={() => position && map.flyTo(position, 16, { duration: 0.8 })}
      title="Center on location"
    >
      <FaCrosshairs />
    </button>
  );
};

const ZoomButtons = () => {
  const map = useMap();
  return (
    <div className="map-zoom-controls">
      <button className="map-ctrl-btn" onClick={() => map.zoomIn()} title="Zoom in">
        <FaPlus />
      </button>
      <button className="map-ctrl-btn" onClick={() => map.zoomOut()} title="Zoom out">
        <FaMinus />
      </button>
    </div>
  );
};

const FlyTo = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || map.getZoom(), { duration: 0.8 });
    }
  }, [position, zoom, map]);
  return null;
};

const FlexibleMap = ({
  center,
  zoom = 14,
  markers = [],
  polyline = null,
  circles = [],
  className = '',
  style = {},
  onMapClick = null,
  showRecenter = true,
  showFullscreen = true,
  showZoomButtons = true,
  defaultHeight = '350px',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { timeout: 5000 }
    );
  }, []);

  const mapCenter = center || userLocation || [9.6009, 41.8508];
  const height = expanded ? '85vh' : (style.height || defaultHeight);

  const handleRecenter = useCallback(() => {
    if (userLocation) {
      const mapEl = document.querySelector('.flexible-map .leaflet-container');
      if (mapEl && mapEl._leaflet_map) {
        mapEl._leaflet_map.flyTo(userLocation, 16, { duration: 0.8 });
      }
    }
  }, [userLocation]);

  return (
    <div
      className={`flexible-map ${expanded ? 'expanded' : ''} ${className}`}
      style={{ position: 'relative', borderRadius: expanded ? 0 : '14px', overflow: 'hidden', ...style }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ width: '100%', height, borderRadius: expanded ? 0 : '14px' }}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={true}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
        whenCreated={(map) => {
          const container = map.getContainer();
          container._leaflet_map = map;
        }}
        onClick={onMapClick}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <FlyTo position={mapCenter} zoom={expanded ? 15 : undefined} />

        {showRecenter && <RecenterButton position={userLocation || mapCenter} />}
        {showZoomButtons && <ZoomButtons />}

        {circles.map((c, i) => (
          <Circle
            key={c.id || i}
            center={c.center}
            radius={c.radius || 400}
            pathOptions={{
              fillColor: c.color || '#2563eb',
              fillOpacity: c.fillOpacity || 0.15,
              color: c.color || '#2563eb',
              opacity: c.opacity || 0.4,
              weight: c.weight || 1,
            }}
          >
            {c.popup && <Popup>{c.popup}</Popup>}
          </Circle>
        ))}

        {markers.map((m, i) => (
          <Marker
            key={m.id || i}
            position={m.position}
            icon={m.icon}
          >
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}

        {polyline && (
          <Polyline
            positions={polyline.positions}
            color={polyline.color || '#2563eb'}
            weight={polyline.weight || 4}
            dashArray={polyline.dashArray || '8 8'}
          />
        )}
      </MapContainer>

      {showFullscreen && (
        <button
          className="map-ctrl-btn map-fullscreen-btn"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Minimize' : 'Fullscreen'}
        >
          {expanded ? <FaCompress /> : <FaExpand />}
        </button>
      )}
    </div>
  );
};

export default FlexibleMap;

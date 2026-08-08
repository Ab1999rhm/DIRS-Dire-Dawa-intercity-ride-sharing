import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaCrosshairs, FaExpand, FaCompress, FaLayerGroup, FaPlus, FaMinus } from 'react-icons/fa';
import './FlexibleMap.css';

// Leaflet Helper to automatically adjust bounds when markers change
const AutoFitBounds = ({ markers, polylinePoints, center }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    const validCoords = [];
    if (markers && markers.length > 0) {
      markers.forEach(m => {
        if (m && m.position && Array.isArray(m.position) && m.position.length === 2 && !isNaN(m.position[0])) {
          validCoords.push(m.position);
        }
      });
    }

    if (polylinePoints && polylinePoints.length >= 2) {
      polylinePoints.forEach(p => {
        if (p && Array.isArray(p) && p.length === 2 && !isNaN(p[0])) {
          validCoords.push(p);
        }
      });
    }

    if (validCoords.length >= 2) {
      try {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true });
      } catch (err) {
        console.warn('Map fitBounds warning:', err);
      }
    } else if (validCoords.length === 1) {
      map.setView(validCoords[0], 15, { animate: true });
    } else if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, map.getZoom() || 13, { animate: true });
    }
  }, [map, markers, polylinePoints, center]);

  return null;
};

// Map controller for zoom in / zoom out / recenter
const MapControls = ({ onRecenter, onZoomIn, onZoomOut }) => {
  return null; // Implemented via Leaflet instance or overlay buttons
};

export const TILE_STYLES = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO'
  }
};

const FlexibleMap = ({
  center = [9.6009, 41.8508],
  zoom = 13,
  defaultHeight = '280px',
  markers = [],
  polylinePoints = null,
  showControls = true,
  onRecenter = null
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileStyle, setTileStyle] = useState('streets');
  const [mapInstance, setMapInstance] = useState(null);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
    }, 200);
  };

  const handleRecenter = () => {
    if (onRecenter) {
      onRecenter();
    } else if (mapInstance) {
      if (markers && markers.length > 0 && markers[0].position) {
        mapInstance.setView(markers[0].position, 15, { animate: true });
      } else {
        mapInstance.setView(center, 14, { animate: true });
      }
    }
  };

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };

  const toggleTileStyle = () => {
    setTileStyle(prev => (prev === 'streets' ? 'satellite' : prev === 'satellite' ? 'dark' : 'streets'));
  };

  const activeTile = TILE_STYLES[tileStyle] || TILE_STYLES.streets;

  return (
    <div className={`flexible-map-wrapper ${isFullscreen ? 'fullscreen' : ''}`} style={{ height: isFullscreen ? '100vh' : defaultHeight }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: isFullscreen ? '0px' : '14px' }}
        scrollWheelZoom={true}
        zoomControl={false}
        whenCreated={setMapInstance}
        ref={setMapInstance}
      >
        <TileLayer
          attribution={activeTile.attribution}
          url={activeTile.url}
        />

        <AutoFitBounds markers={markers} polylinePoints={polylinePoints} center={center} />

        {markers.map((m, idx) => {
          if (!m || !m.position) return null;
          const defaultIcon = L.divIcon({
            className: 'default-marker',
            html: '<div style="background:#2563eb;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">M</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          return (
            <Marker key={idx} position={m.position} icon={m.icon || defaultIcon}>
              {m.popup && <Popup>{m.popup}</Popup>}
            </Marker>
          );
        })}

        {polylinePoints && polylinePoints.length >= 2 && (
          <Polyline
            positions={polylinePoints}
            color="#2563eb"
            weight={5}
            opacity={0.8}
            dashArray="8 8"
          />
        )}
      </MapContainer>

      {/* Floating Controls - Top Right: Recenter, Zoom */}
      {showControls && (
        <div className="flexible-map-controls" style={{ top: 10, right: 10 }}>
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={handleRecenter}
            title="Recenter Map"
            aria-label="Recenter Map"
          >
            <FaCrosshairs />
          </button>

          <button
            type="button"
            className="map-ctrl-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <FaPlus />
          </button>

          <button
            type="button"
            className="map-ctrl-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <FaMinus />
          </button>
        </div>
      )}

      {/* Top Center: Style Selector + Fullscreen Button side by side */}
      {showControls && (
        <div className="flexible-map-top-center" style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
          <button
            type="button"
            className="map-ctrl-btn map-style-btn"
            onClick={toggleTileStyle}
            title={`Map Style: ${tileStyle}`}
            aria-label="Switch Map Style"
            style={{ width: 'auto', padding: '6px 12px', borderRadius: 20, gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}
          >
            <FaLayerGroup />
            <span style={{ textTransform: 'capitalize' }}>{tileStyle}</span>
          </button>
          <button
            type="button"
            className="map-ctrl-btn expand"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
            aria-label="Toggle Fullscreen Map"
            style={{ width: 'auto', padding: '6px 14px', borderRadius: 20, gap: 6 }}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
            <span style={{ fontSize: 12, fontWeight: 600 }}>{isFullscreen ? 'Exit' : 'Expand'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FlexibleMap;

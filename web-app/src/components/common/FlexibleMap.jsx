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
          return (
            <Marker key={idx} position={m.position} icon={m.icon}>
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

      {/* Floating Interactive Controls Bar */}
      {showControls && (
        <div className="flexible-map-controls">
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={handleRecenter}
            title="Recenter Map to Location"
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

          <button
            type="button"
            className="map-ctrl-btn"
            onClick={toggleTileStyle}
            title={`Switch Map Style (Current: ${tileStyle})`}
            aria-label="Switch Map Style"
          >
            <FaLayerGroup />
          </button>

          <button
            type="button"
            className="map-ctrl-btn expand"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Expand Map Fullscreen"}
            aria-label="Toggle Fullscreen Map"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      )}
    </div>
  );
};

export default FlexibleMap;

import React from 'react';

const MiniMap = ({ pickup, dropoff, className = '' }) => {
  const pickupAddr = pickup?.address || 'Pickup location';
  const dropoffAddr = dropoff?.address || 'Dropoff location';

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
};

export default MiniMap;

import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', hover = false, padding = 'md', ...props }) => (
  <div className={`card card-${padding} ${hover ? 'card-hover' : ''} ${className}`} {...props}>
    {children}
  </div>
);

export const StatCard = ({ icon, iconColor = 'primary', value, label, trend, trendUp, className = '' }) => (
  <div className={`stat-card ${className}`}>
    <div className={`stat-icon stat-icon-${iconColor}`}>{icon}</div>
    <div className="stat-content">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
    {trend && (
      <span className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
        {trendUp ? '↑' : '↓'} {trend}
      </span>
    )}
  </div>
);

export const InfoCard = ({ label, value, sub, color = 'primary' }) => (
  <div className={`info-card info-card-${color}`}>
    <span className="info-label">{label}</span>
    <span className="info-value">{value}</span>
    {sub && <span className="info-sub">{sub}</span>}
  </div>
);

export default Card;

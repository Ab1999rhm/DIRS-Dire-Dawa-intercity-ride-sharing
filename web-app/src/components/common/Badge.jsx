import React from 'react';
import './Badge.css';

const Badge = ({ children, variant = 'primary', size = 'sm', dot = false, className = '' }) => (
  <span className={`badge badge-${variant} badge-${size} ${dot ? 'badge-dot' : ''} ${className}`}>
    {dot && <span className="badge-dot-indicator"></span>}
    {children}
  </span>
);

export const StatusBadge = ({ status }) => {
  const variants = {
    pending: 'warning', accepted: 'primary', ongoing: 'info',
    completed: 'success', cancelled: 'danger', active: 'success',
    inactive: 'muted', online: 'success', offline: 'muted'
  };
  return (
    <Badge variant={variants[status] || 'muted'} dot>
      {status}
    </Badge>
  );
};

export default Badge;

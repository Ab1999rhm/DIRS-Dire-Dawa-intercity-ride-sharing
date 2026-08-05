import React from 'react';
import './Button.css';

const Button = ({
  children, variant = 'primary', size = 'md', fullWidth = false,
  loading = false, disabled = false, icon, iconPosition = 'left',
  className = '', ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      {!loading && icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>}
      <span className="btn-text">{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
    </button>
  );
};

export const IconButton = ({ icon, variant = 'ghost', size = 'md', className = '', ...props }) => (
  <button className={`icon-btn icon-btn-${variant} icon-btn-${size} ${className}`} {...props}>
    {icon}
  </button>
);

export const ToggleButton = ({ active, onToggle, label, ...props }) => (
  <button
    className={`toggle-btn ${active ? 'active' : ''}`}
    onClick={onToggle}
    {...props}
  >
    <span className="toggle-slider"></span>
    <span className="toggle-label">{label}</span>
  </button>
);

export default Button;

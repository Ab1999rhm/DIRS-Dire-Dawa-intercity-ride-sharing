import React from 'react';
import './Avatar.css';

const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizes = { sm: 32, md: 40, lg: 56, xl: 72 };
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`avatar avatar-${size} ${className}`}
        style={{ width: sizes[size], height: sizes[size] }}
      />
    );
  }

  return (
    <div
      className={`avatar avatar-${size} avatar-text ${className}`}
      style={{ width: sizes[size], height: sizes[size] }}
    >
      {initials}
    </div>
  );
};

export default Avatar;

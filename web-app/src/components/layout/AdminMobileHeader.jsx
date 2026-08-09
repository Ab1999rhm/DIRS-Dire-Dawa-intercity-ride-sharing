import React from 'react';
import { FaBars } from 'react-icons/fa';

const AdminMobileHeader = ({ onMenuClick }) => {
  return (
    <header className="admin-mobile-header">
      <button 
        className="admin-mobile-menu-btn" 
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <FaBars />
      </button>
      <div className="admin-mobile-logo">
        <img src="/logo.svg?v=2" alt="DIRS" />
      </div>
    </header>
  );
};

export default AdminMobileHeader;

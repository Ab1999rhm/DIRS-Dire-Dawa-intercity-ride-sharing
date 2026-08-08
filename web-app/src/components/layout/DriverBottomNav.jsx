import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaListUl, FaWallet, FaUser } from 'react-icons/fa';

const tabs = [
  { label: 'Home', path: '/driver', icon: FaHome, matchExact: true },
  { label: 'Trips', path: '/driver/trips', icon: FaListUl, matchExact: false },
  { label: 'Earnings', path: '/driver/earnings', icon: FaWallet, matchExact: false },
  { label: 'Profile', path: '/driver/profile', icon: FaUser, matchExact: false },
];

const DriverBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (tab) => {
    if (tab.matchExact) {
      return location.pathname === '/driver' || location.pathname === '/driver/';
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav className="passenger-bottom-nav" role="navigation" aria-label="Driver navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab);
        return (
          <button
            key={tab.path}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={`Navigate to ${tab.label}`}
          >
            <Icon />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default DriverBottomNav;

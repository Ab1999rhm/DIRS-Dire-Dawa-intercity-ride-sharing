import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaListUl, FaWallet, FaCog } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const tabs = [
  { labelKey: 'passenger.home', label: 'Home', path: '/passenger', icon: FaHome, matchExact: true },
  { labelKey: 'passenger.trips', label: 'Trips', path: '/passenger/trips', icon: FaListUl, matchExact: false },
  { labelKey: 'passenger.wallet', label: 'Wallet', path: '/passenger/wallet', icon: FaWallet, matchExact: false },
  { labelKey: 'passenger.profile', label: 'Settings', path: '/passenger/profile', icon: FaCog, matchExact: false },
];

const PassengerBottomNav = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (tab) => {
    if (tab.matchExact) {
      return location.pathname === '/passenger' || location.pathname === '/passenger/';
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav className="passenger-bottom-nav" role="navigation" aria-label="Main navigation">
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

export default PassengerBottomNav;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, FaUsers, FaCar, FaEllipsisH, FaMapMarkerAlt, FaBars
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const tabs = [
  { labelKey: 'admin.dashboard', path: '/admin', icon: FaTachometerAlt, matchExact: true },
  { labelKey: 'admin.monitoring', path: '/admin/monitoring', icon: FaMapMarkerAlt, matchExact: false },
  { labelKey: 'admin.drivers', path: '/admin/driver-management', icon: FaCar, matchExact: false },
  { labelKey: 'admin.users', path: '/admin/passenger-management', icon: FaUsers, matchExact: false },
];

const AdminBottomNav = ({ onMenuClick }) => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (tab) => {
    if (tab.matchExact) {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav className="admin-bottom-nav" role="navigation" aria-label="Admin navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab);
        return (
          <button
            key={tab.path}
            className={`admin-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={t(tab.labelKey)}
          >
            <Icon />
            <span>{t(tab.labelKey)}</span>
          </button>
        );
      })}
      <button
        className="admin-nav-item"
        onClick={onMenuClick}
        aria-label="Menu"
      >
        <FaBars />
        <span>{t('admin.moreActions')}</span>
      </button>
    </nav>
  );
};

export default AdminBottomNav;

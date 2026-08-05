import React, { useState, useEffect } from 'react';
import { networkStatus } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    networkStatus.onOffline(handleOffline);
    networkStatus.onOnline(handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!showBanner && isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      padding: '12px 24px',
      borderRadius: '8px',
      backgroundColor: isOnline ? '#10b981' : '#ef4444',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: 'slideDown 0.3s ease'
    }}>
      <span style={{ fontSize: '18px' }}>
        {isOnline ? '✓' : '⚠'}
      </span>
      {isOnline ? t('common.backOnline') : t('common.offlineMode')}
    </div>
  );
};

export default NetworkStatus;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import './passenger/Passenger.css';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="passenger-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '80vh' }}>
      <div style={{
        width: 120, height: 120, borderRadius: '50%',
        background: 'var(--primary-50, #fff7ed)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      }}>
        <FaExclamationTriangle size={48} style={{ color: 'var(--primary, #f6ad55)' }} />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text, #1a1a2e)', marginBottom: 8 }}>
        404
      </h1>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #1a1a2e)', marginBottom: 8 }}>
        {t('passenger.pageNotFound')}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted, #6b7280)', marginBottom: 32, maxWidth: 320 }}>
        {t('passenger.pageNotFoundDesc')}
      </p>
      <button
        className="passenger-primary-btn"
        onClick={() => navigate('/')}
        style={{ maxWidth: 200 }}
        aria-label="Go Home"
      >
        <FaHome /> {t('passenger.goHome')}
      </button>
    </div>
  );
};

export default NotFound;

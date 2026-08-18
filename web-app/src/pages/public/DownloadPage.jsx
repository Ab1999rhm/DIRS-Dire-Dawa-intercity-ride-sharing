import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import {
  FaHome, FaDownload, FaMobileAlt, FaUserCog, FaShieldAlt, FaCheckCircle
} from 'react-icons/fa';
import './PublicLanding.css';

const DownloadPage = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDownload = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        toast.success(t('download.installed') || 'App installed successfully!');
        return;
      }
      setDeferredPrompt(null);
    }
    toast.success(t('download.installHint') || 'Open your browser menu and tap "Add to Home Screen".');
  };

  const developers = ['Abraham Fikadu', 'Obsa Kumera', 'Eldana Ashenafi'];

  return (
    <div className="public-download-page">
      <nav className="public-nav">
        <div className="public-section-container public-nav-inner">
          <Link to="/" className="public-nav-logo">
            <div className="public-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>DIRS</span>
          </Link>
          <Link to="/" className="public-faq-back-link">
            <FaHome /> {t('download.backHome') || 'Back to Home'}
          </Link>
        </div>
      </nav>

      <div className="public-download-hero">
        <div className="public-download-card">
          <div className="public-download-icon"><FaMobileAlt /></div>
          <h1>{t('download.title') || 'Dire Dawa Intercity & Ride Sharing'}</h1>
          <p className="public-download-credit">
            {t('download.creditLine') || 'This application is developed and designed by'}
          </p>
          <ul className="public-download-team">
            {developers.map((dev, i) => (
              <li key={dev}>
                <FaCheckCircle /> <span>{dev}</span>
                <small>{i === 0 ? (t('download.lead') || 'Lead Developer') : (t('download.developer') || 'Developer')}</small>
              </li>
            ))}
          </ul>
          <div className="public-download-main-btn">
            <button className="public-btn-hero" onClick={handleDownload}>
              <FaDownload /> {t('download.downloadApp') || 'Download App'}
            </button>
          </div>
          <div className="public-download-note">
            <FaShieldAlt />
            <span>{t('download.note') || 'Install brings SOS, tracking, wallet and bookings right to your home screen.'}</span>
          </div>
          <div className="public-download-tech">
            <span><FaUserCog /> {t('download.techBuilt') || 'Built mobile-first with real-time ride tracking'}</span>
          </div>
        </div>
      </div>

      <footer className="public-footer">
        <div className="public-section-container">
          <div className="public-footer-bottom">
            <p>&copy; 2026 DIRS — {t('landing.footer.project')}</p>
            <p>{t('landing.footer.team')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DownloadPage;
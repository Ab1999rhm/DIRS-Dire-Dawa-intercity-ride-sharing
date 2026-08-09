import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FaCar, FaMapMarkerAlt, FaShieldAlt, FaMobileAlt, FaStar, FaClock,
  FaMoneyBillWave, FaUsers, FaArrowRight, FaCheckCircle, FaGlobe, FaMoon, FaSun,
  FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaInstagram, FaDownload, FaChevronRight
} from 'react-icons/fa';
import './PublicLanding.css';

const PublicLanding = () => {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: <FaCar />,
      title: t('landing.features.multipleVehicles'),
      desc: t('landing.features.multipleVehiclesDesc'),
    },
    {
      icon: <FaMapMarkerAlt />,
      title: t('landing.features.intraIntercity'),
      desc: t('landing.features.intraIntercityDesc'),
    },
    {
      icon: <FaShieldAlt />,
      title: t('landing.features.safeSecure'),
      desc: t('landing.features.safeSecureDesc'),
    },
    {
      icon: <FaMoneyBillWave />,
      title: t('landing.features.affordable'),
      desc: t('landing.features.affordableDesc'),
    },
    {
      icon: <FaMobileAlt />,
      title: t('landing.features.mobileFirst'),
      desc: t('landing.features.mobileFirstDesc'),
    },
    {
      icon: <FaClock />,
      title: t('landing.features.fastService'),
      desc: t('landing.features.fastServiceDesc'),
    },
  ];

  const steps = [
    {
      num: '01',
      icon: <FaMapMarkerAlt />,
      title: t('landing.steps.setLocation'),
      desc: t('landing.steps.setLocationDesc'),
    },
    {
      num: '02',
      icon: <FaCar />,
      title: t('landing.steps.chooseRide'),
      desc: t('landing.steps.chooseRideDesc'),
    },
    {
      num: '03',
      icon: <FaCheckCircle />,
      title: t('landing.steps.startRiding'),
      desc: t('landing.steps.startRidingDesc'),
    },
  ];

  const vehicles = [
    { icon: '🛺', name: 'Bajaj', capacity: 3, price: '25 ETB', color: '#059669' },
    { icon: '🚗', name: 'Sedan', capacity: 4, price: '60 ETB', color: '#2563eb' },
    { icon: '🚐', name: 'Minivan', capacity: 7, price: '50 ETB', color: '#7c3aed' },
    { icon: '🚌', name: 'Bus', capacity: 14, price: '40 ETB', color: '#d97706' },
  ];

  return (
    <div className="public-page">
      {/* Navbar */}
      <nav className="public-nav">
        <div className="public-nav-container">
          <Link to="/" className="public-nav-logo">
            <div className="public-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>DIRS</span>
          </Link>
          <div className="public-nav-actions">
            <div className="lang-dropdown-wrapper" ref={langDropdownRef}>
              <button className="public-nav-icon lang-dropdown-trigger" onClick={() => setShowLangDropdown(!showLangDropdown)}>
                <FaGlobe /> <span>{availableLanguages.find(l => l.code === language)?.name || language}</span>
              </button>
              {showLangDropdown && (
                <div className="lang-dropdown">
                  {availableLanguages.map(lang => (
                    <button
                      key={lang.code}
                      className={`lang-dropdown-item ${language === lang.code ? 'active' : ''}`}
                      onClick={() => { setLanguage(lang.code); setShowLangDropdown(false); }}
                    >
                      <span className="lang-flag">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="public-nav-icon" onClick={toggleTheme}>
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
            {showInstall && (
              <button className="public-btn-install" onClick={handleInstall}>
                <FaDownload /> {t('landing.installApp')}
              </button>
            )}
            <Link to="/login" className="public-btn-outline">{t('landing.login')}</Link>
            <Link to="/register" className="public-btn-primary">{t('landing.signUp')}</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="public-hero">
        <img src="/images/hero-bg.jpg" alt="Dire Dawa Transport" className="public-hero-bg" />
        <div className="public-hero-overlay"></div>
        <div className="public-hero-content">
          <div className="public-hero-badge">
            <FaStar /> {t('landing.hero.badge')}
          </div>
          <h1>
            {t('landing.hero.title')}{' '}
            <span className="public-gradient-text">
              {t('landing.hero.titleHighlight')}
            </span>
          </h1>
          <p className="public-hero-desc">
            {t('landing.hero.desc')}
          </p>
          <div className="public-hero-btns">
            <Link to="/register" className="public-btn-hero">
              {t('landing.hero.bookRide')} <FaArrowRight />
            </Link>
            <Link to="/login" className="public-btn-hero-outline">
              {t('landing.hero.learnMore')}
            </Link>
          </div>
          <div className="public-hero-stats">
            <div className="public-stat">
              <strong>500+</strong>
              <span>{t('landing.hero.dailyRides')}</span>
            </div>
            <div className="public-stat-divider"></div>
            <div className="public-stat">
              <strong>200+</strong>
              <span>{t('landing.hero.verifiedDrivers')}</span>
            </div>
            <div className="public-stat-divider"></div>
            <div className="public-stat">
              <strong>4.8</strong>
              <span>{t('landing.hero.appRating')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="public-quick-actions">
        <div className="public-quick-actions-scroll">
          <Link to="/register" className="public-quick-action">
            <div className="public-quick-action-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <FaCar />
            </div>
            <div>
              <div className="public-quick-action-text">{t('landing.hero.bookRide')}</div>
              <div className="public-quick-action-sub">{t('landing.features.fastService')}</div>
            </div>
          </Link>
          <Link to="/register" className="public-quick-action">
            <div className="public-quick-action-icon" style={{ background: '#f0fdf4', color: '#059669' }}>
              <FaUsers />
            </div>
            <div>
              <div className="public-quick-action-text">{t('landing.footer.becomeDriver')}</div>
              <div className="public-quick-action-sub">{t('landing.features.affordable')}</div>
            </div>
          </Link>
          <Link to="/login" className="public-quick-action">
            <div className="public-quick-action-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <FaMobileAlt />
            </div>
            <div>
              <div className="public-quick-action-text">{t('landing.login')}</div>
              <div className="public-quick-action-sub">{t('landing.features.mobileFirst')}</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="public-features">
        <div className="public-section-container">
          <div className="public-section-header">
            <span className="public-section-tag">{t('landing.whyDirs.tag')}</span>
            <h2>{t('landing.whyDirs.title')}</h2>
            <p>{t('landing.whyDirs.desc')}</p>
          </div>
        </div>
        <div className="public-features-scroll">
          {features.map((f, i) => (
            <div className="public-feature-card" key={i}>
              <div className="public-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="public-how">
        <div className="public-section-container">
          <div className="public-section-header">
            <span className="public-section-tag">{t('landing.howItWorks.tag')}</span>
            <h2>{t('landing.howItWorks.title')}</h2>
          </div>
          <div className="public-steps-list">
            {steps.map((s, i) => (
              <div className="public-step-card" key={i}>
                <div className="public-step-num">{s.num}</div>
                <div className="public-step-body">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicles */}
      <section className="public-vehicles">
        <div className="public-section-container">
          <div className="public-section-header">
            <span className="public-section-tag">{t('landing.vehicles.tag')}</span>
            <h2>{t('landing.vehicles.title')}</h2>
          </div>
        </div>
        <div className="public-vehicles-scroll">
          {vehicles.map((v, i) => (
            <div className="public-vehicle-card" key={i} style={{ '--v-color': v.color }}>
              <div className="public-vehicle-icon">{v.icon}</div>
              <h3>{v.name}</h3>
              <div className="public-vehicle-capacity">
                <FaUsers /> {v.capacity} {t('landing.vehicles.seats')}
              </div>
              <div className="public-vehicle-price">from {v.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="public-cta">
        <div className="public-section-container">
          <div className="public-cta-card">
            <img src="/images/phone-car.jpg" alt="" className="public-cta-bg" />
            <div className="public-cta-content">
              <h2>{t('landing.cta.title')}</h2>
              <p>{t('landing.cta.desc')}</p>
              <div className="public-cta-btns">
                <Link to="/register" className="public-btn-hero">
                  {t('landing.cta.getStarted')} <FaArrowRight />
                </Link>
                {showInstall && (
                  <button className="public-btn-hero-outline" onClick={handleInstall}>
                    <FaDownload /> {t('landing.cta.installApp')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Install Banner */}
      <section className="public-install">
        <div className="public-section-container">
          <div className="public-install-card">
            <div className="public-install-icon"><FaDownload /></div>
            <div className="public-install-text">
              <h3>{t('landing.install.title')}</h3>
              <p>{t('landing.install.desc')}</p>
            </div>
            {showInstall ? (
              <button className="public-btn-primary public-install-btn" onClick={handleInstall}>
                <FaDownload /> {t('landing.install.installNow')}
              </button>
            ) : (
              <div className="public-install-hint">
                <p>📱 {t('landing.install.chromeHint')}</p>
                <p>🍎 {t('landing.install.safariHint')}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <div className="public-section-container">
          <div className="public-footer-grid">
            <div className="public-footer-brand">
              <div className="public-nav-logo" style={{ marginBottom: 12 }}>
                <div className="public-logo-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>DIRS</span>
              </div>
              <p>{t('landing.footer.tagline')}</p>
              <div className="public-footer-social">
                <a href="#fb"><FaFacebook /></a>
                <a href="#tw"><FaTwitter /></a>
                <a href="#ig"><FaInstagram /></a>
              </div>
            </div>
            <div className="public-footer-links">
              <h4>{t('landing.footer.service')}</h4>
              <Link to="/register">{t('landing.footer.bookRide')}</Link>
              <Link to="/register">{t('landing.footer.becomeDriver')}</Link>
              <Link to="/login">{t('landing.footer.login')}</Link>
            </div>
            <div className="public-footer-links">
              <h4>{t('landing.footer.company')}</h4>
              <a href="#about">{t('landing.footer.aboutUs')}</a>
              <a href="#contact">{t('landing.footer.contact')}</a>
              <a href="#terms">{t('landing.footer.terms')}</a>
            </div>
            <div className="public-footer-links">
              <h4>{t('landing.footer.contact')}</h4>
              <a href="tel:+251911111111"><FaPhone /> +251 91 111 1111</a>
              <a href="mailto:info@dirs.et"><FaEnvelope /> info@dirs.et</a>
            </div>
          </div>
          <div className="public-footer-bottom">
            <p>&copy; 2026 DIRS — {t('landing.footer.project')}</p>
            <p>{t('landing.footer.team')}</p>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom CTA (Mobile) */}
      <div className="public-sticky-cta">
        <Link to="/register" className="public-btn-hero">
          {t('landing.hero.bookRide')} <FaArrowRight />
        </Link>
      </div>
    </div>
  );
};

export default PublicLanding;

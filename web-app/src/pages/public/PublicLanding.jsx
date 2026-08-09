import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FaCar, FaMapMarkerAlt, FaShieldAlt, FaMobileAlt, FaStar, FaClock,
  FaMoneyBillWave, FaUsers, FaArrowRight, FaCheckCircle, FaGlobe, FaMoon, FaSun,
  FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaInstagram, FaDownload, FaChevronUp
} from 'react-icons/fa';
import './PublicLanding.css';

const PublicLanding = () => {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const heroRef = useRef(null);
  const statsRef = useRef(null);

  // Typing effect for hero
  const fullText = t('landing.hero.titleHighlight');
  useEffect(() => {
    setTypedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, [language, fullText]);

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Stats counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.5 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    { icon: <FaCar />, title: t('landing.features.multipleVehicles'), desc: t('landing.features.multipleVehiclesDesc') },
    { icon: <FaMapMarkerAlt />, title: t('landing.features.intraIntercity'), desc: t('landing.features.intraIntercityDesc') },
    { icon: <FaShieldAlt />, title: t('landing.features.safeSecure'), desc: t('landing.features.safeSecureDesc') },
    { icon: <FaMoneyBillWave />, title: t('landing.features.affordable'), desc: t('landing.features.affordableDesc') },
    { icon: <FaMobileAlt />, title: t('landing.features.mobileFirst'), desc: t('landing.features.mobileFirstDesc') },
    { icon: <FaClock />, title: t('landing.features.fastService'), desc: t('landing.features.fastServiceDesc') },
  ];

  const steps = [
    { num: '01', icon: <FaMapMarkerAlt />, title: t('landing.steps.setLocation'), desc: t('landing.steps.setLocationDesc') },
    { num: '02', icon: <FaCar />, title: t('landing.steps.chooseRide'), desc: t('landing.steps.chooseRideDesc') },
    { num: '03', icon: <FaCheckCircle />, title: t('landing.steps.startRiding'), desc: t('landing.steps.startRidingDesc') },
  ];

  const vehicles = [
    { icon: '🛺', name: 'Bajaj', capacity: 3, price: '25', color: '#059669' },
    { icon: '🚗', name: 'Sedan', capacity: 4, price: '60', color: '#2563eb' },
    { icon: '🚐', name: 'Minivan', capacity: 7, price: '50', color: '#7c3aed' },
    { icon: '🚌', name: 'Bus', capacity: 14, price: '40', color: '#d97706' },
  ];

  const stats = [
    { value: 500, suffix: '+', label: t('landing.hero.dailyRides') },
    { value: 200, suffix: '+', label: t('landing.hero.verifiedDrivers') },
    { value: 4.8, suffix: '', label: t('landing.hero.appRating'), isDecimal: true },
  ];

  return (
    <div className="public-page">
      {/* Cultural Border Decoration */}
      <div className="cultural-border"></div>
      
      {/* Blinking Lights Border */}
      <div className="border-lights">
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
        <div className="border-light"></div>
      </div>

      {/* Navbar */}
      <nav className={`public-nav ${scrolled ? 'scrolled' : ''}`}>
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
      <section className="public-hero" ref={heroRef}>
        <img src="/images/phone-car.jpg" alt="Dire Dawa Mobile App" className="public-hero-bg" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="public-hero-overlay"></div>

        {/* Animated cultural gradient blobs */}
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>
        <div className="hero-blob hero-blob-3"></div>
        <div className="hero-blob hero-blob-4"></div>

        {/* Cultural pattern overlay */}
        <div className="hero-cultural-pattern"></div>

        <div className="public-hero-content">
          <div className="public-hero-badge">
            <FaStar /> {t('landing.hero.badge')}
          </div>
          <h1>
            {t('landing.hero.title')}{' '}
            <span className="public-gradient-text">{typedText}<span style={{ borderRight: '2px solid var(--secondary)', animation: 'blink 0.8s infinite', marginLeft: '2px' }}></span></span>
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
          <div className="public-hero-stats" ref={statsRef}>
            {stats.map((s, i) => (
              <div className="public-stat" key={i}>
                <strong>
                  {statsVisible ? (
                    <CountUp target={s.value} decimals={s.isDecimal ? 1 : 0} />
                  ) : '0'}
                  {s.suffix}
                </strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real vehicle images */}
        <div className="hero-vehicles">
          <div className="hero-vehicle">
            <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="20" width="80" height="30" rx="5" fill="#8B7355" stroke="#2D5A3D" strokeWidth="2"/>
              <rect x="15" y="25" width="25" height="15" rx="3" fill="rgba(45, 90, 61, 0.3)"/>
              <circle cx="25" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="75" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="25" cy="55" r="4" fill="#FAF8F5"/>
              <circle cx="75" cy="55" r="4" fill="#FAF8F5"/>
              <text x="50" y="38" textAnchor="middle" fill="#2D5A3D" fontSize="10" fontWeight="bold">BAJAJ</text>
            </svg>
          </div>
          <div className="hero-vehicle">
            <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="15" width="90" height="35" rx="8" fill="#8B7355" stroke="#2D5A3D" strokeWidth="2"/>
              <rect x="10" y="20" width="35" height="20" rx="4" fill="rgba(45, 90, 61, 0.3)"/>
              <rect x="50" y="20" width="40" height="20" rx="4" fill="rgba(45, 90, 61, 0.3)"/>
              <circle cx="20" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="80" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="20" cy="55" r="4" fill="#FAF8F5"/>
              <circle cx="80" cy="55" r="4" fill="#FAF8F5"/>
              <text x="50" y="33" textAnchor="middle" fill="#2D5A3D" fontSize="9" fontWeight="bold">SEDAN</text>
            </svg>
          </div>
          <div className="hero-vehicle">
            <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="10" width="90" height="40" rx="6" fill="#8B7355" stroke="#2D5A3D" strokeWidth="2"/>
              <rect x="8" y="15" width="25" height="18" rx="3" fill="rgba(45, 90, 61, 0.3)"/>
              <rect x="35" y="15" width="25" height="18" rx="3" fill="rgba(45, 90, 61, 0.3)"/>
              <rect x="62" y="15" width="28" height="18" rx="3" fill="rgba(45, 90, 61, 0.3)"/>
              <circle cx="20" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="50" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="80" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="20" cy="55" r="4" fill="#FAF8F5"/>
              <circle cx="50" cy="55" r="4" fill="#FAF8F5"/>
              <circle cx="80" cy="55" r="4" fill="#FAF8F5"/>
              <text x="50" y="28" textAnchor="middle" fill="#2D5A3D" fontSize="8" fontWeight="bold">MINIVAN</text>
            </svg>
          </div>
          <div className="hero-vehicle">
            <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="8" width="94" height="42" rx="5" fill="#8B7355" stroke="#2D5A3D" strokeWidth="2"/>
              <rect x="6" y="12" width="20" height="16" rx="2" fill="rgba(45, 90, 61, 0.3)"/>
              <rect x="28" y="12" width="20" height="16" rx="2" fill="rgba(45, 90, 61, 0.3)"/>
              <rect x="50" y="12" width="20" height="16" rx="2" fill="rgba(45, 90, 61, 0.3)"/>
              <rect x="72" y="12" width="20" height="16" rx="2" fill="rgba(45, 90, 61, 0.3)"/>
              <circle cx="15" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="35" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="65" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="85" cy="55" r="8" fill="#1A1A1A"/>
              <circle cx="15" cy="55" r="4" fill="#FAF8F5"/>
              <circle cx="35" cy="55" r="4" fill="#FAF8F5"/>
              <circle cx="65" cy="55" r="4" fill="#FAF8F5"/>
              <circle cx="85" cy="55" r="4" fill="#FAF8F5"/>
              <text x="50" y="24" textAnchor="middle" fill="#2D5A3D" fontSize="8" fontWeight="bold">BUS</text>
            </svg>
          </div>
        </div>
      </section>

      {/* Gradient Divider */}
      <div className="public-divider"></div>

      {/* Features */}
      <section className="public-features">
        <div className="public-section-container">
          <div className="public-section-header reveal">
            <span className="public-section-tag">{t('landing.whyDirs.tag')}</span>
            <h2>{t('landing.whyDirs.title')}</h2>
            <p>{t('landing.whyDirs.desc')}</p>
          </div>
        </div>
        <div className="public-features-scroll">
          {features.map((f, i) => (
            <div className={`public-feature-card reveal reveal-delay-${i % 3 + 1}`} key={i}>
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
          <div className="public-section-header reveal">
            <span className="public-section-tag">{t('landing.howItWorks.tag')}</span>
            <h2>{t('landing.howItWorks.title')}</h2>
          </div>
          <div className="public-steps-list">
            {steps.map((s, i) => (
              <div className={`public-step-card reveal reveal-delay-${i + 1}`} key={i}>
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
          <div className="public-section-header reveal">
            <span className="public-section-tag">{t('landing.vehicles.tag')}</span>
            <h2>{t('landing.vehicles.title')}</h2>
          </div>
        </div>
        <div className="public-vehicles-scroll">
          {vehicles.map((v, i) => (
            <div className={`public-vehicle-card reveal reveal-delay-${i + 1}`} key={i} style={{ '--v-color': v.color }}>
              <div className="public-vehicle-icon">{v.icon}</div>
              <h3>{v.name}</h3>
              <div className="public-vehicle-capacity">
                <FaUsers /> {v.capacity} {t('landing.vehicles.seats')}
              </div>
              <div className="public-vehicle-price">{v.price} ETB</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <div className="public-section-container">
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

      {/* Scroll to Top */}
      {showScrollTop && (
        <button className="public-scroll-top" onClick={scrollToTop}>
          <FaChevronUp />
        </button>
      )}
    </div>
  );
};

// Animated counter component
const CountUp = ({ target, decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, decimals]);

  return <span ref={ref}>{decimals > 0 ? count.toFixed(decimals) : count}</span>;
};

export default PublicLanding;

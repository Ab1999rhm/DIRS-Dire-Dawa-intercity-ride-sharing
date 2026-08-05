import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FaCar, FaMapMarkerAlt, FaShieldAlt, FaMobileAlt, FaStar, FaClock,
  FaMoneyBillWave, FaUsers, FaArrowRight, FaCheckCircle, FaGlobe, FaMoon, FaSun,
  FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaInstagram, FaDownload
} from 'react-icons/fa';
import './PublicLanding.css';

const PublicLanding = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
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
      title: language === 'am' ? 'የተለያዩ ተORYS' : 'Multiple Vehicles',
      desc: language === 'am' ? 'በجاج ሰዳን ሚኒβאן እና በስ መምረጥ ይችላሉ' : 'Choose from Bajaj, Sedan, Minivan, and Bus for any trip',
    },
    {
      icon: <FaMapMarkerAlt />,
      title: language === 'am' ? 'ከropolis እና በ city ውስጥ' : 'Intra & Intercity',
      desc: language === 'am' ? 'ንዑስ ከropolis እና በ city ውስጥ ጉዞ ያድርጉ' : 'Ride within Dire Dawa or travel between cities',
    },
    {
      icon: <FaShieldAlt />,
      title: language === 'am' ? 'ደህንነት እና ጥበብ' : 'Safe & Secure',
      desc: language === 'am' ? 'የSOS አደረጃጋት እና የDriver verification' : 'SOS alerts, driver verification, and real-time tracking',
    },
    {
      icon: <FaMoneyBillWave />,
      title: language === 'am' ? 'ተመጣጣኝ ዋጋ' : 'Affordable',
      desc: language === 'am' ? 'ግልጽ የዋጋ ማስላት እና ተመጣጣኝ ክፍያ ዘዴዎች' : 'Transparent fare calculation and multiple payment options',
    },
    {
      icon: <FaMobileAlt />,
      title: language === 'am' ? 'በ ስልክ ላይ' : 'Mobile First',
      desc: language === 'am' ? 'በ ስልክ ላይ ብቻ ማስያዣ እና ማስተናገድ' : 'Book and manage rides right from your phone',
    },
    {
      icon: <FaClock />,
      title: language === 'am' ? 'ፈጣን አገልግሎት' : 'Fast Service',
      desc: language === 'am' ? '3-5 ደቂቃ ውስጥ driver ያግኙ' : 'Find a driver within 3-5 minutes',
    },
  ];

  const steps = [
    {
      num: '01',
      icon: <FaMapMarkerAlt />,
      title: language === 'am' ? 'መawni ያስይዙ' : 'Set Location',
      desc: language === 'am' ? 'የመነሻ እና የመድረሻ ቦታ ያስይዙ' : 'Enter your pickup and drop-off locations',
    },
    {
      num: '02',
      icon: <FaCar />,
      title: language === 'am' ? 'ተORYS ይምረጡ' : 'Choose Ride',
      desc: language === 'am' ? 'ለእርስዎ ተስማሚ ተORYS ይምረጡ' : 'Select the vehicle type that suits you',
    },
    {
      num: '03',
      icon: <FaCheckCircle />,
      title: language === 'am' ? 'ጉዞ ይጀምሩ' : 'Start Riding',
      desc: language === 'am' ? 'Driver እንደ ደረሰ ተመልከት እና ጉዞ ይጀምሩ' : 'Watch your driver arrive and enjoy the ride',
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>DIRS</span>
          </Link>
          <div className="public-nav-actions">
            <button className="public-nav-icon" onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}>
              <FaGlobe /> <span>{language === 'en' ? 'EN' : 'አማ'}</span>
            </button>
            <button className="public-nav-icon" onClick={toggleTheme}>
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
            {showInstall && (
              <button className="public-btn-install" onClick={handleInstall}>
                <FaDownload /> {language === 'am' ? 'ያግዙ' : 'Install App'}
              </button>
            )}
            <Link to="/login" className="public-btn-outline">{language === 'am' ? 'ግባ' : 'Login'}</Link>
            <Link to="/register" className="public-btn-primary">{language === 'am' ? 'ይመዝገቡ' : 'Sign Up'}</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="public-hero">
        <img src="/images/hero-bg.jpg" alt="Dire Dawa Transport" className="public-hero-bg" />
        <div className="public-hero-overlay"></div>
        <div className="public-hero-content">
          <div className="public-hero-badge">
            <FaStar /> {language === 'am' ? 'የደሃዋ ብቻ የጋራ ጉዞ ስистем' : "Dire Dawa's Ride Sharing"}
          </div>
          <h1>
            {language === 'am' ? 'በ ደሃዋ ውስጥ ቀላል እና ፈጣን ጉዞ' : 'Ride Easy, Ride Smart'}{' '}
            <span className="public-gradient-text">
              {language === 'am' ? 'በ ደሃዋ' : 'in Dire Dawa'}
            </span>
          </h1>
          <p className="public-hero-desc">
            {language === 'am'
              ? 'ከ ባጃጅ እስከ በስ፣ በ ደሃዋ ውስጥ እና ከ ደሃዋ ወደ ሌሎች ከropolis ተORYS ያስይዙ። ፈጣን፣ ተመጣጣኝ፣ ደህንነቱ የተጠበቀ።'
              : 'From Bajaj to Bus, ride within Dire Dawa or travel to other cities. Fast, affordable, and safe.'}
          </p>
          <div className="public-hero-btns">
            <Link to="/register" className="public-btn-hero">
              {language === 'am' ? 'ያስይዙ' : 'Book a Ride'} <FaArrowRight />
            </Link>
            <Link to="/login" className="public-btn-hero-outline">
              {language === 'am' ? 'መረጃ ይመልከቱ' : 'Learn More'}
            </Link>
          </div>
          <div className="public-hero-stats">
            <div className="public-stat">
              <strong>500+</strong>
              <span>{language === 'am' ? 'ተORYS' : 'Daily Rides'}</span>
            </div>
            <div className="public-stat-divider"></div>
            <div className="public-stat">
              <strong>200+</strong>
              <span>{language === 'am' ? 'Drivers' : 'Verified Drivers'}</span>
            </div>
            <div className="public-stat-divider"></div>
            <div className="public-stat">
              <strong>4.8</strong>
              <span>{language === 'am' ? 'ምብረት' : 'App Rating'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="public-features">
        <div className="public-section-container">
          <div className="public-section-header">
            <span className="public-section-tag">{language === 'am' ? 'ልዩ ነገር' : 'Why DIRS?'}</span>
            <h2>{language === 'am' ? 'ለምን DIRS?' : 'Why Choose DIRS?'}</h2>
            <p>{language === 'am' ? 'ለ ደሃዋ ምዕራፎች የተዘረዘረ' : 'Built for the needs of Dire Dawa residents'}</p>
          </div>
          <div className="public-features-grid">
            {features.map((f, i) => (
              <div className="public-feature-card" key={i}>
                <div className="public-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="public-how">
        <div className="public-section-container">
          <div className="public-section-header">
            <span className="public-section-tag">{language === 'am' ? 'እንዴት ይሠራል' : 'How It Works'}</span>
            <h2>{language === 'am' ? '3 ደረጃዎች' : '3 Simple Steps'}</h2>
          </div>
          <div className="public-steps-grid">
            {steps.map((s, i) => (
              <div className="public-step-card" key={i}>
                <div className="public-step-num">{s.num}</div>
                <div className="public-step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicles */}
      <section className="public-vehicles">
        <div className="public-section-container">
          <div className="public-section-header">
            <span className="public-section-tag">{language === 'am' ? 'ተORYS' : 'Vehicle Types'}</span>
            <h2>{language === 'am' ? 'ምረጥ ይምረጡ' : 'Choose Your Ride'}</h2>
          </div>
          <div className="public-vehicles-grid">
            {vehicles.map((v, i) => (
              <div className="public-vehicle-card" key={i} style={{ '--v-color': v.color }}>
                <div className="public-vehicle-icon">{v.icon}</div>
                <h3>{v.name}</h3>
                <div className="public-vehicle-capacity">
                  <FaUsers /> {v.capacity} {language === 'am' ? 'ቦታ' : 'seats'}
                </div>
                <div className="public-vehicle-price">from {v.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="public-cta">
        <div className="public-section-container">
          <div className="public-cta-card">
            <img src="/images/phone-car.jpg" alt="" className="public-cta-bg" />
            <div className="public-cta-content">
              <h2>{language === 'am' ? 'ያስይዙ ዛሬ!' : 'Ready to Ride?'}</h2>
              <p>{language === 'am' ? 'መዝግበኛል እና የመጀመሪያ ጉዞዎ ነፃ ነው!' : 'Sign up today and your first ride is free!'}</p>
              <div className="public-cta-btns">
                <Link to="/register" className="public-btn-hero">
                  {language === 'am' ? 'ያስይዙ' : 'Get Started'} <FaArrowRight />
                </Link>
                {showInstall && (
                  <button className="public-btn-hero-outline" onClick={handleInstall}>
                    <FaDownload /> {language === 'am' ? 'App ያግዙ' : 'Install App'}
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
              <h3>{language === 'am' ? ' DIRS አፕ ያግዙ' : 'Get the DIRS App'}</h3>
              <p>{language === 'am' ? 'በ ስልክ ላይ በቀላሉ ይጠቀሙ። ለ ኢኖርነት አይችሉም።' : 'Install DIRS on your phone for faster booking. Works offline too!'}</p>
            </div>
            {showInstall ? (
              <button className="public-btn-primary public-install-btn" onClick={handleInstall}>
                <FaDownload /> {language === 'am' ? 'ያግዙ' : 'Install Now'}
              </button>
            ) : (
              <div className="public-install-hint">
                <p>📱 {language === 'am' ? 'Chrome ላይ: ⋮ ምልክት → "Screen ላይ ያስይዙ"' : 'On Chrome: Tap ⋮ → "Add to Home Screen"'}</p>
                <p>🍎 {language === 'am' ? 'Safari ላይ: Share ቁልፍ → "Add to Home Screen"' : 'On Safari: Tap Share → "Add to Home Screen"'}</p>
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
              <div className="public-nav-logo" style={{ marginBottom: 16 }}>
                <div className="public-logo-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>DIRS</span>
              </div>
              <p>{language === 'am' ? 'የደሃዋ ብቻ የጋራ ጉዞ ስистем' : "Dire Dawa's Intercity and Ride Sharing System"}</p>
              <div className="public-footer-social">
                <a href="#fb"><FaFacebook /></a>
                <a href="#tw"><FaTwitter /></a>
                <a href="#ig"><FaInstagram /></a>
              </div>
            </div>
            <div className="public-footer-links">
              <h4>{language === 'am' ? 'አገልግሎት' : 'Service'}</h4>
              <Link to="/register">{language === 'am' ? 'ያስይዙ' : 'Book Ride'}</Link>
              <Link to="/register">{language === 'am' ? 'Driver ይሁኑ' : 'Become a Driver'}</Link>
              <Link to="/login">{language === 'am' ? 'ግባ' : 'Login'}</Link>
            </div>
            <div className="public-footer-links">
              <h4>{language === 'am' ? 'መረጃ' : 'Company'}</h4>
              <a href="#about">{language === 'am' ? 'ስለ እኛ' : 'About Us'}</a>
              <a href="#contact">{language === 'am' ? 'ያግኙን' : 'Contact'}</a>
              <a href="#terms">{language === 'am' ? 'ውሎች' : 'Terms'}</a>
            </div>
            <div className="public-footer-links">
              <h4>{language === 'am' ? 'ያግኙን' : 'Contact'}</h4>
              <a href="tel:+251911111111"><FaPhone /> +251 91 111 1111</a>
              <a href="mailto:info@dirs.et"><FaEnvelope /> info@dirs.et</a>
            </div>
          </div>
          <div className="public-footer-bottom">
            <p>© 2026 DIRS — {language === 'am' ? 'የመንግስት ፕሮጀክት' : 'Dire Dawa University Project'}</p>
            <p>{language === 'am' ? 'ጥበብ: አብርሃም ፊካዱ፣ ዖብሳ ቁመራ፣ እልዳና አሽናፊ' : 'Team: Abraham Fikadu, Obsa Kumera, Eldana Ashenafi'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { publicSupportAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import {
  FaHeadset, FaChevronDown, FaSearch, FaThumbsUp, FaThumbsDown,
  FaHome, FaBook, FaEnvelope, FaPhone
} from 'react-icons/fa';
import './PublicLanding.css';

const FAQ_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'getting_started', label: 'Getting Started' },
  { key: 'account', label: 'Account' },
  { key: 'payment', label: 'Payment' },
  { key: 'trips', label: 'Trips' },
  { key: 'driver', label: 'Driver' },
  { key: 'safety', label: 'Safety' },
  { key: 'technical', label: 'Technical' },
  { key: 'other', label: 'Other' },
];

const PublicFAQ = () => {
  const { t, language } = useLanguage();
  const toast = useToast();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);

  const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (category !== 'all') params.category = category;
      if (language) params.language = language;
      if (search.trim()) params.search = search.trim();
      const res = await publicSupportAPI.getFAQs(params);
      const data = res.data;
      setFaqs(Array.isArray(data) ? data : (data?.faqs || []));
    } catch (err) {
      setError(t('faq.loadError') || 'Unable to load FAQs. Please try again.');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [category, search, language, t]);

  useEffect(() => {
    const delay = setTimeout(() => fetchFAQs(), 250);
    return () => clearTimeout(delay);
  }, [fetchFAQs]);

  const handleFeedback = async (faqId, helpful) => {
    try {
      await publicSupportAPI.sendFeedback(faqId, helpful);
      setFaqs(prev => prev.map(f => f._id === faqId ? {
        ...f,
        helpful: helpful ? (f.helpful || 0) + 1 : (f.helpful || 0),
        notHelpful: !helpful ? (f.notHelpful || 0) + 1 : (f.notHelpful || 0)
      } : f));
      toast.success(helpful ? (t('faq.thanksHelpful') || 'Thanks for your feedback!') : (t('faq.thanksNotHelpful') || 'Thanks — we will improve this answer.'));
    } catch (err) { /* silent */ }
  };

  const filtered = faqs.filter(faq =>
    category === 'all' || faq.category === category
  );

  return (
    <div className="public-faq-page">
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
            <FaHome /> {t('faq.backHome') || 'Back to Home'}
          </Link>
        </div>
      </nav>

      <div className="public-faq-hero">
        <div className="public-section-container">
          <div className="public-faq-hero-icon"><FaHeadset /></div>
          <h1>{t('faq.title') || 'How can we help you?'}</h1>
          <p>{t('faq.subtitle') || 'Find answers to common questions about booking, payments, safety and more.'}</p>
          <div className="public-faq-search">
            <FaSearch />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('faq.searchPlaceholder') || 'Search for answers...'}
            />
          </div>
        </div>
      </div>

      <div className="public-section-container public-faq-body">
        <div className="public-faq-categories">
          {FAQ_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`public-faq-cat-btn ${category === cat.key ? 'active' : ''}`}
              onClick={() => setCategory(cat.key)}
            >
              {t(`faq.cat.${cat.key}`) || cat.label}
            </button>
          ))}
        </div>

        {loading && <div className="public-faq-loading">Loading FAQs...</div>}

        {!loading && error && <div className="public-faq-error">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="public-faq-empty">
            <FaBook size={36} />
            <p>{t('faq.noResults') || 'No answers found. Try a different search or contact support.'}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="public-faq-list">
            {filtered.map(faq => (
              <div key={faq._id} className={`public-faq-item ${openId === faq._id ? 'open' : ''}`}>
                <button className="public-faq-question" onClick={() => setOpenId(openId === faq._id ? null : faq._id)}>
                  <span>{faq.title}</span>
                  <FaChevronDown className="public-faq-chevron" />
                </button>
                {openId === faq._id && (
                  <div className="public-faq-answer">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{faq.content}</p>
                    <div className="public-faq-feedback">
                      <span className="public-faq-feedback-label">{t('faq.wasHelpful') || 'Was this helpful?'}</span>
                      <button onClick={() => handleFeedback(faq._id, true)} className="public-faq-feedback-btn">
                        <FaThumbsUp /> {faq.helpful || 0}
                      </button>
                      <button onClick={() => handleFeedback(faq._id, false)} className="public-faq-feedback-btn">
                        <FaThumbsDown /> {faq.notHelpful || 0}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="public-faq-contact">
          <FaHeadset />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{t('faq.stillNeedHelp') || 'Still need help?'}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{t('faq.contactSupport') || 'Our support team is here for you.'}</div>
          </div>
          <div className="public-faq-contact-actions">
            <Link to="/login" className="public-faq-contact-btn primary"><FaEnvelope /> {t('faq.contactUs') || 'Contact Us'}</Link>
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

export default PublicFAQ;

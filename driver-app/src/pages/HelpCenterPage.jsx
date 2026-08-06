import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronRight, FaChevronDown, FaHome, FaListUl, FaWallet, FaUser } from 'react-icons/fa';
import './Pages.css';

const faqData = [
  {
    category: 'Getting Started',
    questions: [
      { q: 'How do I go online?', a: 'Tap the Online/Offline toggle on your dashboard. You need to be verified and have an active vehicle to receive ride requests.' },
      { q: 'How do I become a verified driver?', a: 'Register, verify your email, then upload your license, national ID, and vehicle documents. Admin will review within 24-48 hours.' },
      { q: 'What documents do I need?', a: 'You need a valid driver\'s license, national ID, vehicle registration, and insurance certificate.' }
    ]
  },
  {
    category: 'Rides',
    questions: [
      { q: 'How do I accept a ride?', a: 'When a ride request comes in, tap "Accept" within 15 seconds. You can also tap "Decline" to skip it.' },
      { q: 'How do I cancel a trip?', a: 'Tap "Cancel" on the current trip card. Note: frequent cancellations may affect your rating.' },
      { q: 'How is the fare calculated?', a: 'Fare is based on distance, duration, and time of day. There may be surge pricing during high demand.' }
    ]
  },
  {
    category: 'Payments',
    questions: [
      { q: 'How do I withdraw my earnings?', a: 'Go to Earnings > Withdraw. Minimum withdrawal is 100 ETB. You can withdraw via Telebirr, CBE Birr, or bank transfer.' },
      { q: 'How long does withdrawal take?', a: 'Telebirr and CBE Birr withdrawals are typically instant. Bank transfers take 1-3 business days.' },
      { q: 'How is my commission calculated?', a: 'The platform takes 15% commission. You receive 85% of the fare as driver earnings.' }
    ]
  },
  {
    category: 'Account',
    questions: [
      { q: 'How do I update my profile?', a: 'Go to Profile > Edit to update your name, email, and profile photo.' },
      { q: 'How do I change my language?', a: 'Go to Settings > Language to switch between English and Amharic.' },
      { q: 'My account was suspended. What do I do?', a: 'Contact support through the app or email support@dirs.et for assistance.' }
    ]
  }
];

const HelpCenterPage = () => {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleQuestion = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setExpandedIndex(expandedIndex === key ? null : key);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <h2>Help Center</h2>
        <span className="spacer" />
      </header>

      <div className="help-content">
        {faqData.map((cat, catIdx) => (
          <div key={catIdx} className="help-category">
            <h3 className="help-category-title">{cat.category}</h3>
            {cat.questions.map((item, qIdx) => {
              const key = `${catIdx}-${qIdx}`;
              const isExpanded = expandedIndex === key;
              return (
                <div key={qIdx} className="faq-item" onClick={() => toggleQuestion(catIdx, qIdx)}>
                  <div className="faq-question">
                    <span>{item.q}</span>
                    {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                  </div>
                  {isExpanded && (
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <nav className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/')}>
          <FaHome /> <span>Home</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/trips')}>
          <FaListUl /> <span>Trips</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/earnings')}>
          <FaWallet /> <span>Earnings</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/profile')}>
          <FaUser /> <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default HelpCenterPage;

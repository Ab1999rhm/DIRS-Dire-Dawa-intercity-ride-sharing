import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaIdCard, FaCar, FaCamera, FaCheck, FaExclamationTriangle, FaFileUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import './Pages.css';

const checklistItems = [
  { id: 'email', label: 'Email Verified', icon: FaCheck, auto: true },
  { id: 'licenseNumber', label: 'License Number', icon: FaIdCard, field: 'licenseNumber' },
  { id: 'licenseExpiry', label: 'License Expiry Date', icon: FaIdCard, field: 'licenseExpiry' },
  { id: 'licensePhoto', label: 'License Photo', icon: FaCamera, field: 'licensePhoto' },
  { id: 'nationalId', label: 'National ID Number', icon: FaIdCard, field: 'nationalId' },
  { id: 'nationalIdPhoto', label: 'National ID Photo', icon: FaCamera, field: 'nationalIdPhoto' },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const response = await authAPI.getDocuments();
      setDocs(response.data);
    } catch (error) {
      console.error('Load docs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isItemCompleted = (item) => {
    if (item.auto) return true;
    if (!docs) return false;
    const val = docs.driver?.[item.field];
    return val && val !== 'PENDING' && val !== 'pending';
  };

  const completedCount = checklistItems.filter(isItemCompleted).length;
  const progress = (completedCount / checklistItems.length) * 100;

  const steps = [
    { title: 'Welcome to DIRS!', content: 'Complete these steps to start driving and earning money.' },
    { title: 'Your Documents', content: 'Upload the required documents to get verified.' },
    { title: 'Upload Documents', content: 'Go to the Documents page to upload your files.' }
  ];

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Onboarding</h2>
      </header>

      <div className="onboarding-content">
        {step === 0 && (
          <div className="onboarding-welcome">
            <div className="onboarding-icon">
              <FaCar size={64} color="#1a73e8" />
            </div>
            <h2>{steps[0].title}</h2>
            <p>{steps[0].content}</p>
            <button className="btn-primary" onClick={() => setStep(1)}>
              Get Started
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-checklist">
            <h2>{steps[1].title}</h2>
            <p>{steps[1].content}</p>

            <div className="onboarding-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-text">{completedCount}/{checklistItems.length} completed</span>
            </div>

            <div className="checklist">
              {checklistItems.map((item) => {
                const completed = isItemCompleted(item);
                return (
                  <div key={item.id} className={`checklist-item ${completed ? 'completed' : ''}`}>
                    <div className="checklist-icon">
                      {completed ? <FaCheck /> : <item.icon />}
                    </div>
                    <span className="checklist-label">{item.label}</span>
                    {completed && <FaCheck className="checkmark" />}
                  </div>
                );
              })}
            </div>

            <div className="onboarding-actions">
              <button className="btn-primary" onClick={() => navigate('/documents')}>
                <FaFileUpload /> Upload Documents
              </button>
              {progress >= 100 && (
                <button className="btn-primary success" onClick={() => setStep(2)}>
                  Continue
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-welcome">
            <div className="onboarding-icon">
              <FaCheck size={64} color="#00c853" />
            </div>
            <h2>All Set!</h2>
            <p>Your documents are submitted. Our team will review them within 24-48 hours. You'll be notified when approved.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;

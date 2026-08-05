import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Auth.css';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('send');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const registrationData = location.state?.registrationData;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.sendEmailOTP(email);
      setStep('verify');
      setCountdown(60);
      toast.success('OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.verifyEmailOTP(email, otp);
      toast.success('Email verified successfully!');
      if (registrationData) {
        try {
          await login(registrationData.phoneNumber, registrationData.password);
          navigate('/documents');
        } catch {
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (registrationData) {
      login(registrationData.phoneNumber, registrationData.password)
        .then(() => navigate('/documents'))
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <FaEnvelope className="auth-icon" />
          <h1>Verify Email</h1>
          <p>{step === 'send' ? 'Enter your email to receive a verification code' : `Enter the 6-digit code sent to ${email}`}</p>
        </div>

        {step === 'send' ? (
          <div className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button className="btn-primary" onClick={handleSendOTP} disabled={loading || !email}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <div className="input-group">
              <label>Verification Code</label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="otp-input"
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button className="btn-primary" onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              className="btn-resend"
              onClick={handleSendOTP}
              disabled={countdown > 0 || loading}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>
        )}

        <div className="auth-footer">
          <button className="btn-skip" onClick={handleSkip}>Skip for now</button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

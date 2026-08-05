import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Auth.css';

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(phoneNumber, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    try {
      await authAPI.sendOTP(phoneNumber);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      await authAPI.verifyOTP(phoneNumber, otp);
      setShowOTP(false);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    }
  };

  const handleForgotPassword = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }
    try {
      await authAPI.forgotPassword(phoneNumber);
      setShowOTP(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>DIRS</h1>
          <p>Digital Intercity and Ride Sharing</p>
        </div>

        {showOTP ? (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <h2>Verify OTP</h2>
            <p className="otp-info">Enter the code sent to {phoneNumber}</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
            <button type="submit" className="btn-primary">Verify</button>
            <button type="button" className="btn-secondary" onClick={() => setShowOTP(false)}>
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+251 9XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              {step === 1 && (
                <button type="button" className="btn-link" onClick={handleSendOTP}>
                  Send OTP
                </button>
              )}
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button type="button" className="btn-link" onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

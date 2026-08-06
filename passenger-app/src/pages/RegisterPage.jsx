import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import OTPInput from '../components/OTPInput';
import { toast } from 'react-toastify';
import './Auth.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'passenger'
  });
  const [step, setStep] = useState(1); // 1: form, 2: OTP verification
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData);
      
      // Send OTP after registering account
      try {
        await authAPI.sendOTP(formData.phoneNumber);
        toast.info(`OTP sent to ${formData.phoneNumber}`);
      } catch (otpErr) {
        console.warn('Auto send OTP failed:', otpErr);
      }
      
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.verifyOTP(formData.phoneNumber, otp);
      toast.success('Phone verified successfully!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.sendOTP(formData.phoneNumber);
      toast.info(`OTP resent to ${formData.phoneNumber}`);
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>DIRS</h1>
          <p>{step === 1 ? 'Create your account' : 'Verify Phone Number'}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-row">
              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="+251 9XX XXX XXX"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Email (Optional)</label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>I want to</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${formData.role === 'passenger' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'passenger' })}
                >
                  Ride
                </button>
                <button
                  type="button"
                  className={`role-btn ${formData.role === 'driver' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'driver' })}
                >
                  Drive
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <p className="otp-info">Enter the 6-digit code sent to {formData.phoneNumber}</p>
            
            <OTPInput value={otp} onChange={setOtp} onComplete={(val) => setOtp(val)} />

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Phone & Proceed'}
            </button>

            <button type="button" className="btn-link" onClick={handleResendOTP} style={{ textAlign: 'center' }}>
              Resend OTP Code
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

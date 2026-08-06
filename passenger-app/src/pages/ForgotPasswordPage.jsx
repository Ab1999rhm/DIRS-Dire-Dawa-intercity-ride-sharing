import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import OTPInput from '../components/OTPInput';
import { toast } from 'react-toastify';
import './Auth.css';

const ForgotPasswordPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: phone, 2: OTP & new password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(phoneNumber);
      toast.info(`Reset code sent to ${phoneNumber}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword(phoneNumber, otp, newPassword);
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>DIRS</h1>
          <p>Reset Password</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="auth-form">
            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+251 9XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <p className="otp-info">Enter the 6-digit code sent to {phoneNumber}</p>
            
            <OTPInput value={otp} onChange={setOtp} onComplete={(val) => setOtp(val)} />

            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Remembered your password? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

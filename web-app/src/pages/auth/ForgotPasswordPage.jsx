import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPhone, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../services/api';
import { DireDawaLogo } from '../../components/common/Backgrounds';
import { useToast } from '../../components/common/Toast';
import './Auth.css';

const ForgotPasswordPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!phoneNumber.trim()) {
      setError(t('auth.phoneRequired') || 'Phone number is required');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(phoneNumber);
      toast.success(t('auth.otpSent'));
      setStep(2);
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 0) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.forgotPassword(phoneNumber);
      toast.success(t('auth.otpResent'));
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 0) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value;
    setOtpDigits(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.verifyOTP(phoneNumber, code);
      toast.success('OTP verified!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ phoneNumber, password });
      toast.success(t('auth.passwordReset') || 'Password reset successfully!');
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    { num: 1, labelKey: 'auth.phoneNumber' },
    { num: 2, labelKey: 'auth.stepOtp' },
    { num: 3, labelKey: 'auth.resetPassword' },
    { num: 4, labelKey: 'common.confirm' },
  ];

  return (
    <div className="auth-page">
      <img src="/images/ride-sharing.jpg" alt="" className="auth-bg-image" />
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-wrapper">
              <DireDawaLogo />
            </div>
            <h2>
              {step === 4
                ? (t('auth.passwordResetDone'))
                : (t('auth.forgotPasswordTitle'))
              }
            </h2>
            <p>
              {step === 1 && (t('auth.forgotPasswordSubtitle'))}
              {step === 2 && (t('auth.enterOtp'))}
              {step === 3 && (t('auth.createNewPassword'))}
              {step === 4 && (t('auth.loginAgain'))}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="step-indicator">
            {stepLabels.slice(0, 3).map((s) => (
              <div key={s.num} className={`step ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
                <div className="step-number">{step > s.num ? <FaCheckCircle /> : s.num}</div>
                <span>{t(s.labelKey)}</span>
              </div>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Step 1: Phone Number */}
          {step === 1 && (
            <form className="auth-form" onSubmit={handleSendOTP}>
              <div className="input-group">
                <label>{t('auth.phoneNumber')}</label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="+251 9XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <span className="loading-dots"><span></span><span></span><span></span></span>
                ) : (
                  t('auth.sendOtp')
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="auth-form">
              <div className="otp-inputs" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="otp-input"
                    style={{
                      width: 48, height: 52, textAlign: 'center',
                      border: '2px solid var(--border)', borderRadius: 8,
                      fontSize: 20, fontWeight: 700, outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  />
                ))}
              </div>
              <button className="auth-submit" onClick={handleVerifyOTP} disabled={loading} style={{ width: '100%' }}>
                {loading ? (
                  <span className="loading-dots"><span></span><span></span><span></span></span>
                ) : (
                  t('auth.verifyOtp')
                )}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {resendTimer > 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('auth.resendIn', { seconds: resendTimer })}</span>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    style={{
                      background: 'none', border: 'none', color: 'var(--primary)',
                      fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    {t('auth.resendCode')}
                  </button>
                )}
              </div>
              <button
                onClick={() => { setStep(1); setOtpDigits(['', '', '', '', '', '']); setError(''); }}
                className="btn-back"
                style={{ marginTop: 12 }}
              >
                <FaArrowLeft /> {t('auth.back')}
              </button>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="input-group">
                <label>{t('auth.newPassword')}</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label>{t('auth.confirmPassword')}</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <span className="loading-dots"><span></span><span></span><span></span></span>
                ) : (
                  t('auth.resetPassword')
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--success-bg)', color: 'var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 20px',
              }}>
                <FaCheckCircle />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                {t('auth.passwordResetSuccess')}
              </p>
              <button className="auth-submit" onClick={() => navigate('/login')}>
                {t('auth.goToLogin')}
              </button>
            </div>
          )}

          <div className="auth-footer">
            {step < 4 && (
              <p>
                {t('auth.rememberPassword')}{' '}
                <Link to="/login">{t('auth.login')}</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

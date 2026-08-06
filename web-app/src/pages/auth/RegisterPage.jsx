import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPhone, FaLock, FaEye, FaEyeSlash, FaUser, FaCheckCircle, FaEnvelope, FaExternalLinkAlt } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { DireDawaLogo } from '../../components/common/Backgrounds';
import { useToast } from '../../components/common/Toast';
import './Auth.css';

const RegisterPage = () => {
  const { t } = useLanguage();
  const { register, completeRegistration } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'passenger',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [phoneOtpDigits, setPhoneOtpDigits] = useState(['', '', '', '', '', '']);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneResendTimer, setPhoneResendTimer] = useState(60);

  useEffect(() => {
    const code = otpDigits.join('');
    if (code.length === 6 && !otpLoading) {
      handleVerifyOTP();
    }
  }, [otpDigits]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!formData.firstName.trim()) return t('auth.firstName') + ' is required';
    if (!formData.lastName.trim()) return t('auth.lastName') + ' is required';
    if (!formData.phoneNumber.trim()) return t('auth.phoneRequired') || 'Phone number is required';
    if (!/^(\+251|0)?[97]\d{8}$/.test(formData.phoneNumber.trim())) return 'Please enter a valid Ethiopian phone number';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email';
    if (!formData.password) return t('auth.passwordRequired') || 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return t('auth.passwordMismatch') || 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      sendEmailOTP();
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOTP = async () => {
    setOtpSending(true);
    try {
      const res = await authAPI.sendEmailOTP(formData.email);
      setPreviewUrl(res.data.previewUrl || '');
      setOtpCode(res.data.otpCode || '');
      toast.success('OTP sent to your email!');
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 0) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Failed to send OTP email');
    }
    setOtpSending(false);
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
      toast.error('Enter the 6-digit code');
      return;
    }

    setOtpLoading(true);
    try {
      await authAPI.verifyEmailOTP(formData.email, code);
      toast.success('Email verified!');
      sendPhoneOTP();
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    }
    setOtpLoading(false);
  };

  const sendPhoneOTP = async () => {
    setPhoneOtpSending(true);
    try {
      const res = await authAPI.sendPhoneOTP({ phoneNumber: formData.phoneNumber });
      setPhoneOtpCode(res.data.otpCode || '');
      toast.success('OTP sent to your phone!');
      setPhoneResendTimer(60);
      const interval = setInterval(() => {
        setPhoneResendTimer(prev => {
          if (prev <= 0) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Failed to send phone OTP');
    }
    setPhoneOtpSending(false);
  };

  const handlePhoneOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...phoneOtpDigits];
    newOtp[index] = value;
    setPhoneOtpDigits(newOtp);
    if (value && index < 5) {
      document.getElementById(`phone-otp-${index + 1}`)?.focus();
    }
  };

  const handlePhoneOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !phoneOtpDigits[index] && index > 0) {
      document.getElementById(`phone-otp-${index - 1}`)?.focus();
    }
  };

  useEffect(() => {
    const code = phoneOtpDigits.join('');
    if (code.length === 6 && !phoneOtpLoading) {
      handleVerifyPhoneOTP();
    }
  }, [phoneOtpDigits]);

  const handleVerifyPhoneOTP = async () => {
    const code = phoneOtpDigits.join('');
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }

    setPhoneOtpLoading(true);
    try {
      const res = await authAPI.verifyPhoneOTP({ phoneNumber: formData.phoneNumber, otp: code });
      const { accessToken, refreshToken, user: verifiedUser, driverProfile } = res.data;
      completeRegistration(accessToken, refreshToken, verifiedUser, driverProfile);
      toast.success('Phone verified!');
      const userRole = formData.role;
      if (userRole === 'driver') navigate('/driver');
      else navigate('/passenger');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    }
    setPhoneOtpLoading(false);
  };

  const userRole = formData.role;

  return (
    <div className="auth-page">
      <img src="/images/ride-sharing.jpg" alt="" className="auth-bg-image" />
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-wrapper">
              <DireDawaLogo />
            </div>
            <h2>{step === 1 ? (t('auth.registerTitle') || 'Create account') : step === 2 ? 'Verify Your Email' : 'Verify Your Phone'}</h2>
            <p>{step === 1 ? (t('auth.registerSubtitle') || 'Join the ride-sharing community') : step === 2 ? `Enter the code sent to ${formData.email}` : `Enter the code sent to ${formData.phoneNumber}`}</p>
          </div>

          <div className="step-indicator">
            <div className={`step ${step === 1 ? 'active' : 'completed'}`}>
              <div className="step-number">{step === 1 ? '1' : <FaCheckCircle />}</div>
              <span>{t('auth.stepAccount') || 'Account'}</span>
            </div>
            <div className={`step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
              <div className="step-number">{step === 2 ? '2' : step > 2 ? <FaCheckCircle /> : '2'}</div>
              <span>{t('auth.stepOtp') || 'Verify'}</span>
            </div>
            <div className={`step ${step === 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span>{t('auth.phoneVerification') || 'Phone'}</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {step === 1 ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="role-tabs">
                <button
                  type="button"
                  className={`role-tab ${formData.role === 'passenger' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'passenger' })}
                >
                  {t('auth.passenger') || 'Passenger'}
                </button>
                <button
                  type="button"
                  className={`role-tab ${formData.role === 'driver' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'driver' })}
                >
                  {t('auth.driver') || 'Driver'}
                </button>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>{t('auth.firstName') || 'First Name'}</label>
                  <div className="input-wrapper">
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      name="firstName"
                      placeholder={t('auth.firstName') || 'First Name'}
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>{t('auth.lastName') || 'Last Name'}</label>
                  <div className="input-wrapper">
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      name="lastName"
                      placeholder={t('auth.lastName') || 'Last Name'}
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>{t('auth.phoneNumber') || 'Phone Number'}</label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="+251 9XX XXX XXX"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>{t('auth.password') || 'Password'}</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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
                <label>{t('auth.confirmPassword') || 'Confirm Password'}</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
                  <span className="loading-dots">
                    <span></span><span></span><span></span>
                  </span>
                ) : (
                  t('auth.register') || 'Register'
                )}
              </button>
            </form>
          ) : step === 2 ? (
            <div className="auth-form">
              {otpCode && (
                <div
                  style={{
                    padding: '12px 16px', background: '#fef3c7', borderRadius: 8,
                    color: '#92400e', fontWeight: 700, fontSize: 20,
                    marginBottom: 16, border: '1px solid #fbbf24',
                    textAlign: 'center', letterSpacing: 6
                  }}
                >
                  Your OTP: {otpCode}
                </div>
              )}
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 16px', background: '#eff6ff', borderRadius: 8,
                    color: '#2563eb', fontWeight: 600, fontSize: 14,
                    marginBottom: 16, textDecoration: 'none',
                    border: '1px solid #bfdbfe'
                  }}
                >
                  <FaExternalLinkAlt /> Open email to view OTP
                </a>
              )}

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
                      transition: 'border-color 0.2s'
                    }}
                  />
                ))}
              </div>

              <button
                className="auth-submit"
                onClick={handleVerifyOTP}
                disabled={otpLoading}
                style={{ width: '100%' }}
              >
                {otpLoading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {resendTimer > 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    onClick={sendEmailOTP}
                    disabled={otpSending}
                    style={{
                      background: 'none', border: 'none', color: 'var(--primary)',
                      fontWeight: 600, fontSize: 14, cursor: 'pointer'
                    }}
                  >
                    {otpSending ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                style={{
                  display: 'block', width: '100%', marginTop: 12,
                  padding: 12, background: 'var(--bg)', border: '2px solid var(--border)',
                  borderRadius: 8, fontWeight: 600, fontSize: 14,
                  color: 'var(--text-secondary)', cursor: 'pointer'
                }}
              >
                ← Back
              </button>
            </div>
          ) : step === 3 ? (
            <div className="auth-form">
              {phoneOtpCode && (
                <div
                  style={{
                    padding: '12px 16px', background: '#fef3c7', borderRadius: 8,
                    color: '#92400e', fontWeight: 700, fontSize: 20,
                    marginBottom: 16, border: '1px solid #fbbf24',
                    textAlign: 'center', letterSpacing: 6
                  }}
                >
                  Your OTP: {phoneOtpCode}
                </div>
              )}

              <div className="otp-inputs" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {phoneOtpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`phone-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePhoneOtpChange(i, e.target.value)}
                    onKeyDown={e => handlePhoneOtpKeyDown(i, e)}
                    className="otp-input"
                    style={{
                      width: 48, height: 52, textAlign: 'center',
                      border: '2px solid var(--border)', borderRadius: 8,
                      fontSize: 20, fontWeight: 700, outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                ))}
              </div>

              <button
                className="auth-submit"
                onClick={handleVerifyPhoneOTP}
                disabled={phoneOtpLoading}
                style={{ width: '100%' }}
              >
                {phoneOtpLoading ? 'Verifying...' : 'Verify Phone'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {phoneResendTimer > 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Resend in {phoneResendTimer}s</span>
                ) : (
                  <button
                    onClick={sendPhoneOTP}
                    disabled={phoneOtpSending}
                    style={{
                      background: 'none', border: 'none', color: 'var(--primary)',
                      fontWeight: 600, fontSize: 14, cursor: 'pointer'
                    }}
                  >
                    {phoneOtpSending ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                style={{
                  display: 'block', width: '100%', marginTop: 12,
                  padding: 12, background: 'var(--bg)', border: '2px solid var(--border)',
                  borderRadius: 8, fontWeight: 600, fontSize: 14,
                  color: 'var(--text-secondary)', cursor: 'pointer'
                }}
              >
                ← Back
              </button>
            </div>
          ) : null}

          <div className="auth-footer">
            <p>
              {t('auth.hasAccount') || 'Already have an account?'}{' '}
              <Link to="/login">{t('auth.login') || 'Login'}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

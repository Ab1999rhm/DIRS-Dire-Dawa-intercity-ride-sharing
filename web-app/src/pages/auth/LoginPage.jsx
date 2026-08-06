import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPhone, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { DireDawaLogo } from '../../components/common/Backgrounds';
import './Auth.css';

const LoginPage = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('passenger');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim()) {
      setError(t('auth.phoneRequired') || 'Phone number is required');
      return;
    }
    if (!/^(\+251|0)?[97]\d{8}$/.test(phoneNumber.trim())) {
      setError('Please enter a valid Ethiopian phone number');
      return;
    }
    if (!password.trim()) {
      setError(t('auth.passwordRequired') || 'Password is required');
      return;
    }

    setLoading(true);
    try {
      const userData = await login(phoneNumber, password);
      const userRole = userData?.role || role;
      if (userRole === 'driver') navigate('/driver');
      else if (userRole === 'admin') navigate('/admin');
      else navigate('/passenger');
    } catch (err) {
      console.error('Login error:', err);
      const data = err.response?.data;
      const msg = data?.error || data?.errors?.[0]?.msg || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <img src="/images/ride-sharing.jpg" alt="" className="auth-bg-image" />
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-wrapper">
              <DireDawaLogo />
            </div>
            <h2>{t('auth.loginTitle') || 'Welcome back'}</h2>
            <p>{t('auth.loginSubtitle') || 'Sign in to your account'}</p>
          </div>

          <div className="role-tabs">
            <button
              className={`role-tab ${role === 'passenger' ? 'active' : ''}`}
              onClick={() => setRole('passenger')}
            >
              {t('auth.passenger') || 'Passenger'}
            </button>
            <button
              className={`role-tab ${role === 'driver' ? 'active' : ''}`}
              onClick={() => setRole('driver')}
            >
              {t('auth.driver') || 'Driver'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>{t('auth.phoneNumber') || 'Phone Number'}</label>
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

            <div className="input-group">
              <label>{t('auth.password') || 'Password'}</label>
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

            <div className="auth-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {t('auth.rememberMe') || 'Remember me'}
              </label>
              <a href="/forgot-password" className="forgot-link">
                {t('auth.forgotPassword') || 'Forgot Password?'}
              </a>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="loading-dots">
                  <span></span><span></span><span></span>
                </span>
              ) : (
                t('auth.login') || 'Login'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t('auth.noAccount') || "Don't have an account?"}{' '}
              <Link to="/register">{t('auth.register') || 'Register'}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

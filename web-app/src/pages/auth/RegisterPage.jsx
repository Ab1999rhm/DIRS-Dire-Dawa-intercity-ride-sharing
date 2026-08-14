import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPhone, FaLock, FaEye, FaEyeSlash, FaUser, FaCheckCircle, FaEnvelope, FaExternalLinkAlt, FaGift, FaIdCard, FaFileUpload, FaShieldAlt, FaCalendarAlt } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import safeErrorMessage from '../../utils/safeErrorMessage';
import { useAuth } from '../../context/AuthContext';
import { authAPI, documentsAPI } from '../../services/api';
import { uploadToCloudinary } from '../../services/cloudinary';
import { DireDawaLogo } from '../../components/common/Backgrounds';
import { useToast } from '../../components/common/Toast';
import './Auth.css';

const RegisterPage = () => {
  const { t } = useLanguage();
  const { completeRegistration } = useAuth();
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
    referralCode: '',
    nationalId: '',
  });
  const [driverDocs, setDriverDocs] = useState({
    licensePhoto: null,
    nationalIdPhoto: null,
    licenseNumber: '',
    licenseExpiry: '',
  });
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [docsSubmitting, setDocsSubmitting] = useState(false);
  const driverDocRefs = {
    licensePhoto: useRef(null),
    nationalIdPhoto: useRef(null),
  };
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
  const emailTimerRef = useRef(null);

  useEffect(() => {
    const code = otpDigits.join('');
    if (code.length === 6 && !otpLoading) {
      handleVerifyOTP();
    }
  }, [otpDigits]);

  useEffect(() => {
    return () => {
      if (emailTimerRef.current) clearInterval(emailTimerRef.current);
    };
  }, []);

  const startCountdown = (setTimer, timerRef) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(60);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (score <= 2) return { level: 1, label: t('auth.passwordWeak'), color: '#ef4444' };
    if (score <= 4) return { level: 2, label: t('auth.passwordMedium'), color: '#f59e0b' };
    return { level: 3, label: t('auth.passwordStrong'), color: '#10b981' };
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!formData.firstName.trim()) return t('auth.firstName') + ' is required';
    if (!formData.lastName.trim()) return t('auth.lastName') + ' is required';
    if (!formData.nationalId.trim()) return 'FAN (National ID) number is required';
    if (!formData.phoneNumber.trim()) return t('auth.phoneRequired');
    if (!/^(\+251|0)?[97]\d{8}$/.test(formData.phoneNumber.trim())) return t('auth.validPhoneRequired');
    if (!formData.email.trim()) return t('auth.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t('auth.validEmailRequired');
    if (!formData.password) return t('auth.passwordRequired');
    if (formData.password.length < 8) return t('auth.passwordMinChars');
    if (formData.password !== formData.confirmPassword) return t('auth.passwordMismatch');
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
      await authAPI.checkDuplicate(formData.email, formData.phoneNumber);
      const sent = await sendEmailOTP();
      if (sent) {
        setStep(2);
      } else {
        setError('We could not send the OTP email right now. No account was created — please try again in a moment.');
      }
    } catch (err) {
      const msg = err?.response?.data?.error ||
        safeErrorMessage(err, t('auth.registrationFailed') || 'Registration failed. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOTP = async (overrideEmail) => {
    setOtpSending(true);
    try {
      const res = await authAPI.sendEmailOTP(overrideEmail || formData.email);
      setPreviewUrl(res.data.previewUrl || '');
      setOtpCode(res.data.otpCode || '');
      toast.success('OTP sent to your email!');
      startCountdown(setResendTimer, emailTimerRef);
      setOtpDigits(['', '', '', '', '', '']);
      return true;
    } catch (err) {
      setOtpCode('');
      setResendTimer(0);
      toast.error(`Could not send the OTP to ${overrideEmail || formData.email}. Please try again shortly.`);
      return false;
    } finally {
      setOtpSending(false);
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
      toast.error('Enter the 6-digit code');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        referralCode: formData.referralCode || undefined,
        nationalId: formData.nationalId,
        otp: code,
      });
      const { accessToken, refreshToken, user: verifiedUser, driverProfile } = res.data;
      completeRegistration(accessToken, refreshToken, verifiedUser, driverProfile);
      toast.success('Email verified! Registration complete.');
      if (formData.role === 'driver') setStep(3);
      else navigate('/passenger');
    } catch (err) {
      toast.error(err?.response?.data?.error || safeErrorMessage(err, 'Invalid OTP'));
    }
    setOtpLoading(false);
  };

  const handleDriverDocUpload = async (docKey) => {
    const file = driverDocRefs[docKey]?.current?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    try {
      setUploadingDoc(docKey);
      const url = await uploadToCloudinary(file, 'dirs-documents');
      setDriverDocs(prev => ({ ...prev, [docKey]: url }));
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmitDriverDocs = async (e) => {
    e.preventDefault();
    if (!driverDocs.licensePhoto || !driverDocs.nationalIdPhoto || !driverDocs.licenseNumber.trim()) {
      toast.error('Please upload your license and National ID photos and enter your license number.');
      return;
    }
    setDocsSubmitting(true);
    try {
      await documentsAPI.uploadDriver({
        licensePhotoUrl: driverDocs.licensePhoto,
        nationalIdPhotoUrl: driverDocs.nationalIdPhoto,
        licenseNumber: driverDocs.licenseNumber,
        licenseExpiry: driverDocs.licenseExpiry || undefined,
        nationalId: formData.nationalId,
      });
      toast.success('Documents submitted! Your driver account is pending admin verification.');
      navigate('/driver');
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || 'Failed to submit documents');
    } finally {
      setDocsSubmitting(false);
    }
  };

  const userRole = formData.role;
  const strength = getPasswordStrength(formData.password);

  return (
    <div className="auth-page">
      <img src="/images/phone-car.jpg" alt="Dire Dawa Mobile App" className="auth-bg-image" />
      <div className="auth-bg-overlay"></div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-wrapper">
              <DireDawaLogo />
            </div>
            <h2>{step === 1 ? (t('auth.registerTitle')) : step === 3 ? 'Driver Documents' : t('auth.verifyEmail')}</h2>
            <p>{step === 1 ? (t('auth.registerSubtitle')) : step === 3 ? 'Upload your driving license and National ID (FAN) so the admin can verify your driver account.' : `Enter the code sent to ${formData.email}`}</p>
          </div>

          <div className="step-indicator">
            <div className={`step ${step === 1 || step === 2 ? 'active' : 'completed'}`}>
              <div className="step-number">{step === 1 || step === 2 ? '1' : <FaCheckCircle />}</div>
              <span>{t('auth.stepAccount') || 'Account'}</span>
            </div>
            {formData.role === 'driver' ? (
              <div className={`step ${step === 3 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <span>{t('auth.stepDocuments') || 'Documents'}</span>
              </div>
            ) : (
              <div className={`step ${step === 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <span>{t('auth.stepOtp') || 'Verify'}</span>
              </div>
            )}
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
                <label>{t('auth.fanNumber') || 'FAN (National ID) Number'}</label>
                <div className="input-wrapper">
                  <FaIdCard className="input-icon" />
                  <input
                    type="text"
                    name="nationalId"
                    placeholder="Enter your FAN / National ID number"
                    value={formData.nationalId}
                    onChange={handleChange}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Your FAN (National ID) is required and will be verified by our team.
                </span>
              </div>

              <div className="input-group">
                <label>{t('auth.emailAddress')}</label>
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
                {formData.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          style={{
                            height: 4,
                            flex: 1,
                            borderRadius: 2,
                            background: strength.level >= i ? strength.color : 'var(--border)',
                            transition: 'background 0.2s'
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: strength.color, fontWeight: 600 }}>
                      {strength.label}
                    </div>
                  </div>
                )}
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

              <div className="input-group">
                <label>Referral Code (optional)</label>
                <div className="input-wrapper">
                  <FaGift className="input-icon" />
                  <input
                    type="text"
                    name="referralCode"
                    placeholder="DIRS-XXXX00002026"
                    value={formData.referralCode}
                    onChange={handleChange}
                  />
                </div>
                {formData.referralCode && (
                  <span style={{ fontSize: '11px', color: '#4caf50', marginTop: '4px', display: 'block' }}>
                    You and your friend will earn credits after your first trip!
                  </span>
                )}
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
                {otpLoading ? t('auth.verifying') : t('auth.verifyEmail')}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {resendTimer > 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('auth.resendIn', { seconds: resendTimer })}</span>
                ) : (
                  <button
                    onClick={() => sendEmailOTP()}
                    disabled={otpSending}
                    style={{
                      background: 'none', border: 'none', color: 'var(--primary)',
                      fontWeight: 600, fontSize: 14, cursor: 'pointer'
                    }}
                  >
                    {otpSending ? t('auth.sendingCode') : t('auth.resendCode')}
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
                ← {t('auth.back')}
              </button>
            </div>
          ) : step === 3 ? (
            <form className="auth-form" onSubmit={handleSubmitDriverDocs}>
              <div style={{
                padding: '12px 14px', background: 'var(--bg-info, #eff6ff)',
                border: '1px solid var(--border-info, #bfdbfe)', borderRadius: 8,
                marginBottom: 16, fontSize: 13, color: 'var(--primary, #2563eb)'
              }}>
                <FaShieldAlt style={{ marginRight: 6 }} />
                Submit your driving license and National ID (FAN) photo. Our admin will review and verify your account.
              </div>

              {/* License Photo */}
              <div className="input-group">
                <label>Driving License Photo</label>
                <input type="file" accept="image/*" ref={driverDocRefs.licensePhoto} style={{ display: 'none' }}
                  onChange={() => handleDriverDocUpload('licensePhoto')} />
                {driverDocs.licensePhoto ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <img src={driverDocs.licensePhoto} alt="License" style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-light)' }} />
                    <span style={{ fontSize: 12, color: 'var(--success, #16a34a)' }}><FaCheckCircle /> Uploaded</span>
                  </div>
                ) : (
                  <button type="button" className="doc-upload-btn" style={{ width: '100%' }}
                    onClick={() => driverDocRefs.licensePhoto.current?.click()}>
                    <FaFileUpload size={20} />
                    <span>{uploadingDoc === 'licensePhoto' ? 'Uploading...' : 'Upload License Photo'}</span>
                  </button>
                )}
              </div>

              {/* License details */}
              <div className="input-group">
                <label>License Number</label>
                <div className="input-wrapper">
                  <FaIdCard className="input-icon" />
                  <input
                    type="text"
                    value={driverDocs.licenseNumber}
                    onChange={e => setDriverDocs({ ...driverDocs, licenseNumber: e.target.value })}
                    placeholder="e.g. DD-12345"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>License Expiry Date</label>
                <div className="input-wrapper">
                  <FaCalendarAlt className="input-icon" />
                  <input
                    type="date"
                    value={driverDocs.licenseExpiry}
                    onChange={e => setDriverDocs({ ...driverDocs, licenseExpiry: e.target.value })}
                  />
                </div>
              </div>

              {/* National ID Photo */}
              <div className="input-group">
                <label>National ID (FAN) Photo</label>
                <input type="file" accept="image/*" ref={driverDocRefs.nationalIdPhoto} style={{ display: 'none' }}
                  onChange={() => handleDriverDocUpload('nationalIdPhoto')} />
                {driverDocs.nationalIdPhoto ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <img src={driverDocs.nationalIdPhoto} alt="National ID" style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-light)' }} />
                    <span style={{ fontSize: 12, color: 'var(--success, #16a34a)' }}><FaCheckCircle /> Uploaded</span>
                  </div>
                ) : (
                  <button type="button" className="doc-upload-btn" style={{ width: '100%' }}
                    onClick={() => driverDocRefs.nationalIdPhoto.current?.click()}>
                    <FaShieldAlt size={20} />
                    <span>{uploadingDoc === 'nationalIdPhoto' ? 'Uploading...' : 'Upload National ID Photo'}</span>
                  </button>
                )}
              </div>

              <button type="submit" className="auth-submit" disabled={docsSubmitting}>
                {docsSubmitting ? (
                  <span className="loading-dots"><span></span><span></span><span></span></span>
                ) : (
                  'Submit Documents & Finish'
                )}
              </button>
            </form>
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

import React, { useState, useRef, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { useToast } from './Toast';
import { FaShieldAlt, FaCheck, FaArrowLeft } from 'react-icons/fa';
import './OTPVerify.css';

const OTPVerify = ({ phoneNumber, onVerified, onBack }) => {
  const toast = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [sending, setSending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    sendOTP();
    const timer = setInterval(() => {
      setResendTimer(prev => prev <= 0 ? 0 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sendOTP = async () => {
    setSending(true);
    try {
      await authAPI.sendOTP(phoneNumber);
      toast.success('OTP sent!');
      setResendTimer(60);
    } catch (err) { toast.error('Failed to send OTP'); }
    setSending(false);
  };

  const handleChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = paste.split('').concat(Array(6 - paste.length).fill(''));
    setOtp(newOtp);
    inputRefs.current[Math.min(paste.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    try {
      await authAPI.verifyOTP(phoneNumber, code);
      toast.success('Phone verified!');
      onVerified();
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid OTP'); }
    setLoading(false);
  };

  return (
    <div className="otp-verify">
      <button className="otp-back" onClick={onBack}><FaArrowLeft /> Back</button>
      <div className="otp-icon"><FaShieldAlt /></div>
      <h2>Verify Your Phone</h2>
      <p className="otp-subtitle">Enter the 6-digit code sent to <strong>{phoneNumber}</strong></p>

      <div className="otp-inputs" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="otp-input"
          />
        ))}
      </div>

      <button className="otp-verify-btn" onClick={handleVerify} disabled={loading}>
        {loading ? 'Verifying...' : <><FaCheck /> Verify</>}
      </button>

      <div className="otp-resend">
        {resendTimer > 0 ? (
          <span>Resend code in {resendTimer}s</span>
        ) : (
          <button className="otp-resend-btn" onClick={sendOTP} disabled={sending}>
            {sending ? 'Sending...' : 'Resend Code'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OTPVerify;

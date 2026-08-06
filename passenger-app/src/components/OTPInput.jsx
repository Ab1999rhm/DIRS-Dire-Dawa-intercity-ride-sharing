import React, { useRef, useState, useEffect } from 'react';
import './OTPInput.css';

const OTPInput = ({ length = 6, onComplete, value = '', onChange }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (value) {
      const valArray = value.split('').slice(0, length);
      const newOtp = [...valArray, ...Array(length - valArray.length).fill('')];
      setOtp(newOtp);
    }
  }, [value, length]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (isNaN(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    const combined = newOtp.join('');
    if (onChange) onChange(combined);

    if (val && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    if (combined.length === length && !combined.includes('') && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.split('').slice(0, length);
    const newOtp = [...digits, ...Array(length - digits.length).fill('')];
    setOtp(newOtp);

    const combined = newOtp.join('');
    if (onChange) onChange(combined);
    if (combined.length === length && onComplete) onComplete(combined);

    const nextIndex = Math.min(digits.length, length - 1);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }
  };

  return (
    <div className="otp-input-container" onPaste={handlePaste}>
      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          ref={(el) => (inputRefs.current[index] = el)}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="otp-field"
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
};

export default OTPInput;

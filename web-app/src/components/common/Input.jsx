import React from 'react';
import './Input.css';

const Input = ({
  label, error, helperText, icon, iconRight, className = '',
  ...props
}) => (
  <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
    {label && <label className="input-label">{label}</label>}
    <div className="input-wrapper">
      {icon && <span className="input-icon-left">{icon}</span>}
      <input className={`input-field ${icon ? 'has-icon-left' : ''} ${iconRight ? 'has-icon-right' : ''}`} {...props} />
      {iconRight && <span className="input-icon-right">{iconRight}</span>}
    </div>
    {(error || helperText) && (
      <span className={`input-helper ${error ? 'input-helper-error' : ''}`}>
        {error || helperText}
      </span>
    )}
  </div>
);

export const Select = ({ label, options, placeholder, className = '', ...props }) => (
  <div className={`input-group ${className}`}>
    {label && <label className="input-label">{label}</label>}
    <select className="input-field select-field" {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
    {label && <label className="input-label">{label}</label>}
    <textarea className="input-field textarea-field" rows={4} {...props} />
    {error && <span className="input-helper input-helper-error">{error}</span>}
  </div>
);

export default Input;

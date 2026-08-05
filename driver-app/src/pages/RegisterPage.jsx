import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'driver'
  });
  const [vehicleData, setVehicleData] = useState({
    vehicleType: 'car',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    plateNumber: '',
    capacity: 4,
    serviceType: 'both'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVehicleChange = (e) => {
    setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>DIRS Driver</h1>
          <p>Create your driver account</p>
        </div>

        <div className="step-indicator">
          <span className={`step ${step >= 1 ? 'active' : ''}`}>1</span>
          <span className="step-line"></span>
          <span className={`step ${step >= 2 ? 'active' : ''}`}>2</span>
        </div>

        {step === 1 ? (
          <form onSubmit={() => setStep(2)} className="auth-form">
            <div className="input-row">
              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
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
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
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
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary">Next: Vehicle Info</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Vehicle Type</label>
              <select name="vehicleType" value={vehicleData.vehicleType} onChange={handleVehicleChange}>
                <option value="car">Car</option>
                <option value="minivan">Minivan</option>
                <option value="minibus">Minibus</option>
              </select>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Make</label>
                <input
                  type="text"
                  name="make"
                  placeholder="e.g., Toyota"
                  value={vehicleData.make}
                  onChange={handleVehicleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Model</label>
                <input
                  type="text"
                  name="model"
                  placeholder="e.g., Corolla"
                  value={vehicleData.model}
                  onChange={handleVehicleChange}
                  required
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Year</label>
                <input
                  type="number"
                  name="year"
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  value={vehicleData.year}
                  onChange={handleVehicleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  value={vehicleData.color}
                  onChange={handleVehicleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Plate Number</label>
              <input
                type="text"
                name="plateNumber"
                placeholder="e.g., A123456"
                value={vehicleData.plateNumber}
                onChange={handleVehicleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Seating Capacity</label>
              <input
                type="number"
                name="capacity"
                min="1"
                max="16"
                value={vehicleData.capacity}
                onChange={handleVehicleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Service Type</label>
              <select name="serviceType" value={vehicleData.serviceType} onChange={handleVehicleChange}>
                <option value="intra_city">Intra-City Only</option>
                <option value="intercity">Intercity Only</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="button-row">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

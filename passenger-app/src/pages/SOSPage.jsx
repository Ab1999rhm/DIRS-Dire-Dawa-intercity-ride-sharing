import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sosAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { FaExclamationTriangle, FaPhoneAlt, FaShareAlt, FaHistory, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './SOS.css';

const SOSPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sosHistory, setSosHistory] = useState([]);
  const [currentCoords, setCurrentCoords] = useState([41.8661, 9.5931]);
  const [locationName, setLocationName] = useState('Dire Dawa Area');

  useEffect(() => {
    fetchSOSHistory();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords([pos.coords.longitude, pos.coords.latitude]);
          setLocationName(`GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        (err) => console.warn('SOS GPS warning:', err)
      );
    }
  }, []);

  const fetchSOSHistory = async () => {
    try {
      const res = await sosAPI.getHistory();
      setSosHistory(res.data.alerts || res.data || []);
    } catch (err) {
      console.error('Failed to load SOS history:', err);
    }
  };

  const handleTriggerSOS = async () => {
    if (!window.confirm('Are you sure you want to trigger an EMERGENCY SOS ALERT? Police & emergency contacts will be notified.')) {
      return;
    }
    setLoading(true);
    try {
      await sosAPI.triggerSOS({
        location: {
          address: locationName,
          coordinates: currentCoords
        },
        reason: 'Passenger initiated emergency SOS trigger'
      });
      toast.error('EMERGENCY ALERT SENT! Help is on the way.', { autoClose: 8000 });
      fetchSOSHistory();
    } catch (err) {
      console.error('SOS Trigger error:', err);
      toast.error(err.response?.data?.error || 'Failed to send SOS alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sos-container">
      <header className="page-header sos-header">
        <h2><FaExclamationTriangle className="sos-title-icon" /> Emergency Assistance (SOS)</h2>
      </header>

      <div className="sos-body">
        {/* Main SOS Red Button */}
        <div className="sos-hero-card">
          <button
            className="sos-big-btn"
            onClick={handleTriggerSOS}
            disabled={loading}
          >
            <div className="sos-pulse"></div>
            <span>SOS</span>
            <small>TAP FOR EMERGENCY</small>
          </button>
          <p className="sos-notice">
            Pressing this button broadcasts your real-time coordinates to local dispatchers & saved emergency contacts.
          </p>
        </div>

        {/* Emergency Contacts Quick List */}
        <div className="sos-card">
          <h4>Registered Emergency Contacts</h4>
          {!user?.emergencyContacts || user.emergencyContacts.length === 0 ? (
            <p className="hint-text">No emergency contacts registered in your profile.</p>
          ) : (
            <div className="contacts-list">
              {user.emergencyContacts.map((contact) => (
                <div key={contact.phoneNumber} className="contact-item">
                  <div>
                    <strong>{contact.name}</strong>
                    <span className="sub-text">{contact.phoneNumber} ({contact.relationship || 'Contact'})</span>
                  </div>
                  <a href={`tel:${contact.phoneNumber}`} className="call-icon-btn">
                    <FaPhoneAlt />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SOS History */}
        <div className="sos-card">
          <h4><FaHistory /> Past Emergency Alerts</h4>
          {sosHistory.length === 0 ? (
            <p className="hint-text">No recent SOS alerts sent.</p>
          ) : (
            <div className="history-mini-list">
              {sosHistory.map((alert) => (
                <div key={alert._id} className="alert-history-item">
                  <FaCheckCircle style={{ color: alert.status === 'resolved' ? '#2e7d32' : '#f44336' }} />
                  <div>
                    <strong>Alert Sent</strong>
                    <span className="sub-text">{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Recent'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default SOSPage;

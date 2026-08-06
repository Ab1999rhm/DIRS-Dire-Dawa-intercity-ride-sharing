import React from 'react';
import { FaTimes, FaQrcode, FaBus, FaPrint, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import './DigitalTicketModal.css';

const DigitalTicketModal = ({ isOpen, onClose, trip, passenger }) => {
  if (!isOpen || !trip) return null;

  const ticketNumber = `DIRS-${trip._id ? trip._id.substring(18).toUpperCase() : '88A92F'}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="digital-ticket-modal">
        <div className="modal-header">
          <h3><FaBus /> Digital Intercity Boarding Pass</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="ticket-card-printable" id="printable-ticket">
          <div className="ticket-top-banner">
            <div className="brand-title">DIRS EXPRESS</div>
            <div className="ticket-no">{ticketNumber}</div>
          </div>

          <div className="ticket-route-box">
            <div className="city-point">
              <span className="city-code">DIR</span>
              <span className="city-name">{trip.pickupLocation?.address || 'Dire Dawa'}</span>
            </div>
            <div className="route-arrow">➔</div>
            <div className="city-point">
              <span className="city-code">DEST</span>
              <span className="city-name">{trip.dropoffLocation?.address || 'Intercity Station'}</span>
            </div>
          </div>

          <div className="ticket-info-grid">
            <div className="info-cell">
              <span className="info-label">Passenger Name</span>
              <span className="info-value">{passenger?.firstName} {passenger?.lastName}</span>
            </div>
            <div className="info-cell">
              <span className="info-label"><FaCalendarAlt /> Departure Date</span>
              <span className="info-value">{trip.scheduledTime ? new Date(trip.scheduledTime).toLocaleString() : 'Today (Scheduled)'}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">Selected Seats</span>
              <span className="info-value badge-highlight">{trip.seats?.join(', ') || 'General Admission'}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">Vehicle / Plate</span>
              <span className="info-value">{trip.vehicle?.make || 'Minibus Coaster'} ({trip.vehicle?.plateNumber || 'ET-3-88992'})</span>
            </div>
          </div>

          <div className="qr-section">
            {/* SVG simulated QR Code */}
            <div className="qr-box">
              <FaQrcode size={110} color="#1a73e8" />
            </div>
            <div className="qr-instructions">
              <p>Show this QR ticket to the bus terminal conductor upon boarding.</p>
              <small>Status: CONFIRMED & PAID</small>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handlePrint}>
            <FaPrint /> Print / Save PDF
          </button>
          <button className="btn-primary" onClick={onClose}>
            Close Pass
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalTicketModal;

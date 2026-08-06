import React from 'react';
import { FaTimes, FaQrcode, FaPrint, FaBus } from 'react-icons/fa';
import './DigitalTicketModal.css';

const DigitalTicketModal = ({ isOpen, onClose, trip, passenger }) => {
  if (!isOpen || !trip) return null;

  const ticketId = `DIRS-${(trip._id || '883921').slice(-6).toUpperCase()}`;

  return (
    <div className="modal-overlay">
      <div className="ticket-card">
        <div className="ticket-header">
          <div className="brand">
            <FaBus /> DIRS Intercity Boarding Ticket
          </div>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="ticket-body">
          <div className="ticket-qr-section">
            <FaQrcode className="qr-code-icon" />
            <span className="ticket-id">{ticketId}</span>
            <span className="scan-label">Scan at Bus Terminal</span>
          </div>

          <div className="ticket-info-grid">
            <div className="info-item">
              <span className="lbl">Passenger</span>
              <strong className="val">{passenger?.firstName} {passenger?.lastName}</strong>
            </div>
            <div className="info-item">
              <span className="lbl">Status</span>
              <strong className="val status-valid">CONFIRMED PASS</strong>
            </div>
            <div className="info-item">
              <span className="lbl">Pickup</span>
              <strong className="val">{trip.pickupLocation?.address || 'Dire Dawa'}</strong>
            </div>
            <div className="info-item">
              <span className="lbl">Destination</span>
              <strong className="val">{trip.dropoffLocation?.address || 'Harar'}</strong>
            </div>
            <div className="info-item">
              <span className="lbl">Vehicle Plate</span>
              <strong className="val">{trip.vehicle?.plateNumber || 'DIR-3-A1234'}</strong>
            </div>
            <div className="info-item">
              <span className="lbl">Total Paid</span>
              <strong className="val">{trip.fare?.totalFare || trip.estimatedFare || 150} ETB</strong>
            </div>
          </div>
        </div>

        <div className="ticket-footer">
          <button className="print-btn" onClick={() => window.print()}>
            <FaPrint /> Print / Save Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalTicketModal;

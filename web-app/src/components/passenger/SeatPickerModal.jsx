import React from 'react';
import { FaTimes, FaCheck } from 'react-icons/fa';
import './SeatPickerModal.css';

const SEAT_LAYOUT = [
  ['1A', '1B', null, '1C', '1D'],
  ['2A', '2B', null, '2C', '2D'],
  ['3A', '3B', null, '3C', '3D'],
  ['4A', '4B', '4C', '4D', '4E']
];

const SeatPickerModal = ({ isOpen, onClose, selectedSeats = [], onConfirmSeats, passengersCount = 1 }) => {
  if (!isOpen) return null;

  const toggleSeat = (seatId) => {
    if (!seatId) return;
    if (selectedSeats.includes(seatId)) {
      onConfirmSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      if (selectedSeats.length >= passengersCount) {
        onConfirmSeats([...selectedSeats.slice(1), seatId]);
      } else {
        onConfirmSeats([...selectedSeats, seatId]);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="seat-modal">
        <div className="seat-modal-header">
          <h3>Select Your Bus Seats ({selectedSeats.length}/{passengersCount})</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="bus-container">
          <div className="bus-driver-row">
            <span className="driver-wheel">🛞 Driver Position</span>
          </div>

          <div className="seat-grid">
            {SEAT_LAYOUT.map((row, rIdx) => (
              <div key={rIdx} className="seat-row">
                {row.map((seat, cIdx) => {
                  if (!seat) return <div key={cIdx} className="aisle"></div>;
                  const isSelected = selectedSeats.includes(seat);
                  return (
                    <button
                      key={seat}
                      className={`seat-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSeat(seat)}
                    >
                      {seat}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="seat-legend">
          <span className="legend-item"><span className="legend-box available"></span> Available</span>
          <span className="legend-item"><span className="legend-box selected"></span> Selected</span>
        </div>

        <button className="confirm-seat-btn" onClick={onClose}>
          <FaCheck /> Confirm {selectedSeats.length} Seat(s)
        </button>
      </div>
    </div>
  );
};

export default SeatPickerModal;

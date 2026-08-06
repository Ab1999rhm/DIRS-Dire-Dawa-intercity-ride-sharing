import React, { useState } from 'react';
import { FaTimes, FaCheck, FaChair } from 'react-icons/fa';
import './SeatPickerModal.css';

const TOTAL_SEATS = [
  ['1A', '1B', '', '1C'],
  ['2A', '2B', '', '2C'],
  ['3A', '3B', '', '3C'],
  ['4A', '4B', '', '4C'],
  ['5A', '5B', '5C', '5D']
];

const OCCUPIED_SEATS = ['1A', '3B'];

const SeatPickerModal = ({ isOpen, onClose, selectedSeats = [], onConfirmSeats, passengersCount = 1 }) => {
  const [currentSelection, setCurrentSelection] = useState(selectedSeats);

  if (!isOpen) return null;

  const handleToggleSeat = (seatId) => {
    if (OCCUPIED_SEATS.includes(seatId)) return;

    if (currentSelection.includes(seatId)) {
      setCurrentSelection(currentSelection.filter((s) => s !== seatId));
    } else {
      if (currentSelection.length >= passengersCount) {
        // Replace oldest selection if max seats reached
        setCurrentSelection([...currentSelection.slice(1), seatId]);
      } else {
        setCurrentSelection([...currentSelection, seatId]);
      }
    }
  };

  const handleConfirm = () => {
    onConfirmSeats(currentSelection);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="seat-picker-modal">
        <div className="modal-header">
          <h3><FaChair /> Select Intercity Bus Seats</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="seat-legend">
          <div className="legend-item"><span className="seat-sample available"></span> Available</div>
          <div className="legend-item"><span className="seat-sample selected"></span> Selected</div>
          <div className="legend-item"><span className="seat-sample occupied"></span> Occupied</div>
        </div>

        <div className="bus-chassis">
          <div className="driver-cabin">🚍 Driver Cabin (Front)</div>

          <div className="seats-grid">
            {TOTAL_SEATS.map((row, rIdx) => (
              <div key={rIdx} className="seat-row">
                {row.map((seat, cIdx) => {
                  if (!seat) return <div key={cIdx} className="aisle"></div>;

                  const isOccupied = OCCUPIED_SEATS.includes(seat);
                  const isSelected = currentSelection.includes(seat);

                  return (
                    <button
                      key={seat}
                      className={`seat-btn ${isOccupied ? 'occupied' : isSelected ? 'selected' : 'available'}`}
                      onClick={() => handleToggleSeat(seat)}
                      disabled={isOccupied}
                    >
                      {isSelected ? <FaCheck /> : seat}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <span>Selected ({currentSelection.length}/{passengersCount}): <strong>{currentSelection.join(', ') || 'None'}</strong></span>
          <button className="btn-primary" onClick={handleConfirm} disabled={currentSelection.length === 0}>
            Confirm Seats
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatPickerModal;

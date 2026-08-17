import React from 'react';
import { FaTimes, FaCheck } from 'react-icons/fa';
import './SeatPickerModal.css';

// Generate seat layout based on vehicle type and capacity
const generateSeatLayout = (vehicleType, capacity) => {
  // For car-type vehicles, no seat layout needed
  if (vehicleType === 'car') return [];
  
  // For minibus/bus, generate layout based on capacity
  const layout = [];
  const seatsPerRow = 4; // 2+2 layout typical for buses
  const totalSeats = capacity || 16;
  
  let seatNumber = 1;
  for (let row = 1; row <= Math.ceil(totalSeats / seatsPerRow); row++) {
    const rowSeats = [];
    for (let col = 1; col <= seatsPerRow; col++) {
      const seatLetter = String.fromCharCode(64 + col); // A, B, C, D
      const seatId = `${row}${seatLetter}`;
      
      // Add aisle between B and C
      if (col === 3) {
        rowSeats.push(null);
      }
      
      if (seatNumber <= totalSeats) {
        rowSeats.push(seatId);
        seatNumber++;
      }
    }
    layout.push(rowSeats);
  }
  
  return layout;
};

const SeatPickerModal = ({ isOpen, onClose, selectedSeats = [], onConfirmSeats, passengersCount = 1, vehicleType = 'minibus', capacity = 16, takenSeats = [], tripInfo = null }) => {
  if (!isOpen) return null;

  const seatLayout = generateSeatLayout(vehicleType, capacity);

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

  if (vehicleType === 'car') {
    // For cars, just show passenger count selector
    const count = Array.isArray(selectedSeats) ? selectedSeats.length : (passengersCount || 1);
    return (
      <div className="modal-overlay">
        <div className="seat-modal">
          <div className="seat-modal-header">
            <h3>Number of Passengers</h3>
            <button className="close-btn" onClick={onClose}><FaTimes /></button>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>{count}</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
              <button 
                onClick={() => {
                  const newCount = Math.max(1, count - 1);
                  onConfirmSeats(Array(newCount).fill(null).map((_, i) => `P${i + 1}`));
                }}
                disabled={count <= 1}
                style={{ padding: '10px 20px', fontSize: '18px', cursor: count <= 1 ? 'not-allowed' : 'pointer' }}
              >-</button>
              <button 
                onClick={() => {
                  const newCount = Math.min(4, count + 1);
                  onConfirmSeats(Array(newCount).fill(null).map((_, i) => `P${i + 1}`));
                }}
                disabled={count >= 4}
                style={{ padding: '10px 20px', fontSize: '18px', cursor: count >= 4 ? 'not-allowed' : 'pointer' }}
              >+</button>
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>Maximum 4 passengers for car rides</p>
          </div>
          <button className="confirm-seat-btn" onClick={onClose}>
            <FaCheck /> Confirm {count} Passenger(s)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="seat-modal">
        <div className="seat-modal-header">
          <h3>Select Your Seats ({selectedSeats.length}/{passengersCount})</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="bus-container">
          <div className="bus-driver-row">
            <span className="driver-wheel">🛞 Driver Position</span>
          </div>

          <div className="seat-grid">
            {seatLayout.map((row, rIdx) => (
              <div key={rIdx} className="seat-row">
                {row.map((seat, cIdx) => {
                  if (!seat) return <div key={cIdx} className="aisle"></div>;
                  const isSelected = selectedSeats.includes(seat);
                  const isTaken = takenSeats.includes(seat);
                  return (
                    <button
                      key={seat}
                      className={`seat-btn ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                      onClick={() => !isTaken && toggleSeat(seat)}
                      disabled={isTaken}
                      title={isTaken ? 'Seat taken' : `Seat ${seat}`}
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
          {takenSeats.length > 0 && (
            <span className="legend-item"><span className="legend-box taken"></span> Taken</span>
          )}
        </div>

        {tripInfo && (
          <div style={{ padding: '12px 16px', background: 'var(--primary-50)', borderRadius: 8, marginTop: 8, fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{tripInfo.vehicle}</div>
            <div style={{ color: 'var(--text-muted)' }}>{tripInfo.plateNumber} · {tripInfo.driver}</div>
            <div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
              {capacity - takenSeats.length} of {capacity} seats available
            </div>
          </div>
        )}

        <button className="confirm-seat-btn" onClick={onClose}>
          <FaCheck /> Confirm {selectedSeats.length} Seat(s)
        </button>
      </div>
    </div>
  );
};

export default SeatPickerModal;

import React from 'react';
import { FaTimes, FaBolt, FaTag, FaCalculator } from 'react-icons/fa';
import './FareBreakdownModal.css';

const FareBreakdownModal = ({ isOpen, onClose, fareDetails }) => {
  if (!isOpen || !fareDetails) return null;

  const {
    baseFare = 50,
    distanceKm = 5,
    perKmRate = 15,
    surgeMultiplier = 1.0,
    promoDiscount = 0,
    totalFare = 125,
    categoryName = 'Economy'
  } = fareDetails;

  const distanceTotal = Math.round(distanceKm * perKmRate);
  const subtotal = baseFare + distanceTotal;

  return (
    <div className="modal-overlay">
      <div className="breakdown-card">
        <div className="breakdown-header">
          <h3><FaCalculator /> Itemized Fare Breakdown</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="breakdown-body">
          <div className="tier-tag">{categoryName} Tier</div>

          <div className="breakdown-row">
            <span>Base Fare</span>
            <span>{baseFare} ETB</span>
          </div>

          <div className="breakdown-row">
            <span>Distance ({distanceKm.toFixed(1)} km @ {perKmRate} ETB/km)</span>
            <span>{distanceTotal} ETB</span>
          </div>

          {surgeMultiplier > 1 && (
            <div className="breakdown-row surge">
              <span><FaBolt /> Demand Surge ({surgeMultiplier}x)</span>
              <span>+{(subtotal * (surgeMultiplier - 1)).toFixed(0)} ETB</span>
            </div>
          )}

          {promoDiscount > 0 && (
            <div className="breakdown-row discount">
              <span><FaTag /> Promo Code Discount</span>
              <span>-{promoDiscount} ETB</span>
            </div>
          )}

          <div className="divider"></div>

          <div className="breakdown-row total">
            <span>Estimated Total</span>
            <span>{totalFare} ETB</span>
          </div>
        </div>

        <button className="gotit-btn" onClick={onClose}>
          Got It
        </button>
      </div>
    </div>
  );
};

export default FareBreakdownModal;

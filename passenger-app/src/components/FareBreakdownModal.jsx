import React from 'react';
import { FaTimes, FaBolt, FaTag, FaInfoCircle, FaCalculator } from 'react-icons/fa';
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

  const distanceFare = Math.round(distanceKm * perKmRate);

  return (
    <div className="modal-overlay">
      <div className="fare-modal">
        <div className="modal-header">
          <h3><FaCalculator /> Fare Breakdown</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="fare-body">
          <div className="category-tag-row">
            <span className="cat-badge">{categoryName} Tier</span>
            {surgeMultiplier > 1 && (
              <span className="surge-badge">
                <FaBolt /> {surgeMultiplier}x High Demand Surge
              </span>
            )}
          </div>

          <div className="breakdown-table">
            <div className="b-row">
              <span>Base Fare</span>
              <span>{baseFare} ETB</span>
            </div>
            <div className="b-row">
              <span>Distance ({distanceKm.toFixed(1)} km × {perKmRate} ETB/km)</span>
              <span>{distanceFare} ETB</span>
            </div>

            {surgeMultiplier > 1 && (
              <div className="b-row surge">
                <span>Surge Pricing Multiplier</span>
                <span>+{Math.round((baseFare + distanceFare) * (surgeMultiplier - 1))} ETB ({surgeMultiplier}x)</span>
              </div>
            )}

            {promoDiscount > 0 && (
              <div className="b-row discount">
                <span><FaTag /> Promo Discount</span>
                <span>-{promoDiscount} ETB</span>
              </div>
            )}

            <div className="b-row total">
              <span>Estimated Total</span>
              <span>{totalFare} ETB</span>
            </div>
          </div>

          <div className="fare-policy-note">
            <FaInfoCircle />
            <span>Fares may adjust slightly if actual route or traffic duration changes during the trip.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Got It</button>
        </div>
      </div>
    </div>
  );
};

export default FareBreakdownModal;

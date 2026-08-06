import React, { useState } from 'react';
import { FaTimes, FaMobileAlt, FaCreditCard, FaWallet } from 'react-icons/fa';
import './WalletTopupModal.css';

const PRESET_AMOUNTS = [100, 250, 500, 1000];

const WalletTopupModal = ({ isOpen, onClose, onTopupSuccess }) => {
  const [amount, setAmount] = useState(250);
  const [provider, setProvider] = useState('telebirr');
  const [phoneNumber, setPhoneNumber] = useState('');

  if (!isOpen) return null;

  const handleTopup = (e) => {
    e.preventDefault();
    if (onTopupSuccess) {
      onTopupSuccess(Number(amount));
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="wallet-modal">
        <div className="wallet-header">
          <h3><FaWallet /> Top Up App Wallet</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <form onSubmit={handleTopup}>
          <div className="provider-selector">
            <button
              type="button"
              className={`provider-btn ${provider === 'telebirr' ? 'active' : ''}`}
              onClick={() => setProvider('telebirr')}
            >
              <FaMobileAlt /> Telebirr
            </button>
            <button
              type="button"
              className={`provider-btn ${provider === 'chapa' ? 'active' : ''}`}
              onClick={() => setProvider('chapa')}
            >
              <FaCreditCard /> Chapa Pay
            </button>
          </div>

          <label className="input-lbl">Select Amount (ETB)</label>
          <div className="presets-row">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                className={`preset-chip ${amount === amt ? 'selected' : ''}`}
                onClick={() => setAmount(amt)}
              >
                +{amt} ETB
              </button>
            ))}
          </div>

          <input
            type="number"
            className="custom-amt-input"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="10"
            required
          />

          <label className="input-lbl">{provider === 'telebirr' ? 'Telebirr Phone Number' : 'Account Phone Number'}</label>
          <input
            type="tel"
            className="custom-amt-input"
            placeholder="0911000000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />

          <button type="submit" className="confirm-topup-btn">
            Pay {amount} ETB via {provider.toUpperCase()}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WalletTopupModal;

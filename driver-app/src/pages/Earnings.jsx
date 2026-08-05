import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../services/api';
import { FaWallet, FaArrowUp, FaCalendarDay, FaCalendarWeek, FaMoneyBillWave, FaHome, FaListUl, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Pages.css';

const EarningsPage = () => {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('telebirr');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const response = await paymentsAPI.getEarnings();
      setEarnings(response.data);
    } catch (error) {
      console.error('Load earnings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 100) {
      toast.warning('Minimum withdrawal is 100 ETB');
      return;
    }
    if (amount > (earnings?.availableBalance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setWithdrawing(true);
    try {
      await paymentsAPI.requestWithdrawal({ amount, method: withdrawMethod });
      toast.success('Withdrawal request submitted successfully');
      setWithdrawAmount('');
      loadEarnings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <div className="page-loading">Loading earnings...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Earnings</h2>
      </header>

      <div className="earnings-hero">
        <div className="earnings-main">
          <FaWallet className="earnings-icon" />
          <div>
            <p className="earnings-label">Available Balance</p>
            <p className="earnings-amount">{earnings?.availableBalance?.toLocaleString() || 0} ETB</p>
          </div>
        </div>
        <p className="earnings-total">Total Earned: {earnings?.totalEarnings?.toLocaleString() || 0} ETB</p>
      </div>

      <div className="earnings-grid">
        <div className="earnings-card">
          <FaCalendarDay className="earnings-card-icon today" />
          <div>
            <p className="card-value">{earnings?.todayEarnings?.toLocaleString() || 0}</p>
            <p className="card-label">Today (ETB)</p>
          </div>
        </div>
        <div className="earnings-card">
          <FaCalendarWeek className="earnings-card-icon week" />
          <div>
            <p className="card-value">{earnings?.weekEarnings?.toLocaleString() || 0}</p>
            <p className="card-label">This Week (ETB)</p>
          </div>
        </div>
        <div className="earnings-card">
          <FaMoneyBillWave className="earnings-card-icon month" />
          <div>
            <p className="card-value">{earnings?.monthEarnings?.toLocaleString() || 0}</p>
            <p className="card-label">This Month (ETB)</p>
          </div>
        </div>
        <div className="earnings-card">
          <FaArrowUp className="earnings-card-icon trips" />
          <div>
            <p className="card-value">{earnings?.totalTrips || 0}</p>
            <p className="card-label">Total Trips</p>
          </div>
        </div>
      </div>

      <div className="withdraw-section">
        <h3>Withdraw Funds</h3>
        <div className="withdraw-form">
          <div className="withdraw-input-group">
            <input
              type="number"
              placeholder="Amount (min 100 ETB)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              min="100"
            />
            <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)}>
              <option value="telebirr">Telebirr</option>
              <option value="cbe_birr">CBE Birr</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <button
            className="btn-withdraw"
            onClick={handleWithdraw}
            disabled={withdrawing || !withdrawAmount}
          >
            {withdrawing ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </div>
      </div>

      <nav className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/')}>
          <FaHome /> <span>Home</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/trips')}>
          <FaListUl /> <span>Trips</span>
        </button>
        <button className="nav-btn active" onClick={() => navigate('/earnings')}>
          <FaWallet /> <span>Earnings</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/profile')}>
          <FaUser /> <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default EarningsPage;

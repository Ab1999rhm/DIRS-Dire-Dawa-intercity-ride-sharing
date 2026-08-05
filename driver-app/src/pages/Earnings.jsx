import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../services/api';
import EarningsChart from '../components/EarningsChart';
import { FaWallet, FaArrowUp, FaCalendarDay, FaCalendarWeek, FaMoneyBillWave, FaHome, FaListUl, FaUser, FaCar, FaBolt } from 'react-icons/fa';
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
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [instantCashouting, setInstantCashouting] = useState(false);

  useEffect(() => {
    loadEarnings();
    loadPaymentHistory();
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

  const loadPaymentHistory = async () => {
    try {
      const response = await paymentsAPI.getPaymentHistory({ limit: 20 });
      setPaymentHistory(response.data.payments || []);
    } catch (error) {
      console.error('Load payment history error:', error);
    } finally {
      setHistoryLoading(false);
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
      loadPaymentHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleInstantCashout = async () => {
    const balance = earnings?.availableBalance || 0;
    if (balance < 100) {
      toast.warning('Minimum instant cashout is 100 ETB');
      return;
    }
    setInstantCashouting(true);
    try {
      await paymentsAPI.requestWithdrawal({ amount: balance, method: withdrawMethod, instant: true });
      toast.success('Instant cashout initiated!');
      loadEarnings();
      loadPaymentHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cashout failed');
    } finally {
      setInstantCashouting(false);
    }
  };

  const getChartData = () => {
    if (!paymentHistory || paymentHistory.length === 0) return [];
    const last7 = paymentHistory
      .filter(p => p.type === 'ride_payment')
      .slice(0, 7)
      .reverse();
    return last7.map((p, i) => ({
      label: new Date(p.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
      amount: p.amount || p.driverEarnings || 0
    }));
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

      {/* Earnings Chart */}
      <div style={{ padding: '0 16px' }}>
        <EarningsChart data={getChartData()} />
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
          <button
            className="btn-instant-cashout"
            onClick={handleInstantCashout}
            disabled={instantCashouting || (earnings?.availableBalance || 0) < 100}
          >
            <FaBolt /> {instantCashouting ? 'Processing...' : `Instant Cashout (${earnings?.availableBalance || 0} ETB)`}
          </button>
        </div>
      </div>

      {/* Payment History */}
      <div className="payment-history-section">
        <h3>Transaction History</h3>
        {historyLoading ? (
          <p className="empty-history">Loading...</p>
        ) : paymentHistory.length === 0 ? (
          <p className="empty-history">No transactions yet</p>
        ) : (
          <div className="payment-list">
            {paymentHistory.map((payment) => (
              <div key={payment._id} className="payment-item">
                <div className="payment-info">
                  <span className="payment-type">
                    {payment.type === 'ride_payment' ? 'Trip Payment' :
                     payment.type === 'withdrawal' ? 'Withdrawal' :
                     payment.type === 'bonus' ? 'Bonus' : payment.type}
                  </span>
                  <span className="payment-date">
                    {new Date(payment.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`payment-amount ${payment.type === 'withdrawal' ? 'debit' : 'credit'}`}>
                    {payment.type === 'withdrawal' ? '-' : '+'}{payment.amount} ETB
                  </span>
                  {payment.status && (
                    <span className={`payment-status-badge ${payment.status}`}>
                      {payment.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

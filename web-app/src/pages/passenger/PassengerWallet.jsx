import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaWallet, FaHistory, FaMoneyBillWave, FaMobileAlt, FaCreditCard,
  FaArrowUp, FaArrowDown, FaPlus,
  FaCheckCircle, FaClock, FaArrowLeft, FaExclamationTriangle
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { paymentsAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Passenger.css';

const PassengerWallet = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wallet');
  const [activeSection, setActiveSection] = useState('history');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpMethod, setTopUpMethod] = useState('telebirr');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const res = await paymentsAPI.history({ limit: 20 });
      const payments = res.data.payments || res.data || [];
      setTransactions(payments);
      const walletBalance = payments.reduce((sum, p) => {
        if (p.type === 'top_up' || p.status === 'refunded') return sum + (p.amount || 0);
        if (p.status === 'completed' || p.type === 'trip_payment') return sum - (p.amount || 0);
        return sum;
      }, 0);
      setBalance(Math.max(0, walletBalance));
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast.error(t('wallet.invalidAmount') || 'Please enter a valid amount');
      return;
    }
    setTopUpLoading(true);
    try {
      await paymentsAPI.process(null, {
        type: 'top_up',
        amount,
        method: topUpMethod,
        currency: 'ETB',
      });
      toast.success(t('wallet.topUpSuccess') || 'Top-up successful!');
      setTopUpAmount('');
      fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Top-up failed');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error(t('wallet.invalidAmount') || 'Please enter a valid amount');
      return;
    }
    if (amount > balance) {
      toast.error(t('wallet.insufficientBalance') || 'Insufficient balance');
      return;
    }
    setWithdrawLoading(true);
    try {
      await paymentsAPI.withdraw({ amount, currency: 'ETB' });
      toast.success(t('wallet.withdrawSuccess') || 'Withdrawal request submitted!');
      setWithdrawAmount('');
      fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatTransaction = (tx) => {
    const isCredit = tx.type === 'top_up' || tx.status === 'refunded';
    return {
      icon: isCredit ? <FaArrowDown /> : <FaArrowUp />,
      label: tx.description || (isCredit ? 'Top-up' : 'Trip Payment'),
      amount: isCredit ? `+ETB ${tx.amount}` : `-ETB ${tx.amount}`,
      date: new Date(tx.createdAt || tx.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
      status: tx.status || 'completed',
      isCredit,
    };
  };

  const quickAmounts = [50, 100, 200, 500];

  return (
    <div className="passenger-page">
      <div className="passenger-header-row">
        <div>
          <h1 className="passenger-greeting">{t('wallet.title') || 'My Wallet'}</h1>
          <p className="passenger-location"><FaWallet /> {t('wallet.subtitle') || 'Manage your balance'}</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="passenger-booking-card" style={{ background: 'linear-gradient(135deg, var(--primary), #1e3a5f)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>{t('wallet.currentBalance') || 'Current Balance'}</span>
          <FaWallet size={24} style={{ opacity: 0.7 }} />
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
          ETB {loading ? '...' : balance.toFixed(2)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="passenger-primary-btn"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', margin: 0, fontSize: 13, padding: '10px 0', flex: 1 }}
            onClick={() => setActiveSection('topup')}
          >
            <FaPlus /> {t('wallet.topUp') || 'Top Up'}
          </button>
          <button
            className="passenger-primary-btn"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', margin: 0, fontSize: 13, padding: '10px 0', flex: 1 }}
            onClick={() => setActiveSection('withdraw')}
          >
            <FaArrowUp /> {t('wallet.withdraw') || 'Withdraw'}
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="passenger-tab-bar" style={{ marginBottom: 16 }}>
        <button className={`passenger-tab ${activeSection === 'history' ? 'active' : ''}`} onClick={() => setActiveSection('history')}>
          <FaHistory /> {t('wallet.history') || 'History'}
        </button>
        <button className={`passenger-tab ${activeSection === 'topup' ? 'active' : ''}`} onClick={() => setActiveSection('topup')}>
          <FaPlus /> {t('wallet.topUp') || 'Top Up'}
        </button>
        <button className={`passenger-tab ${activeSection === 'withdraw' ? 'active' : ''}`} onClick={() => setActiveSection('withdraw')}>
          <FaArrowUp /> {t('wallet.withdraw') || 'Withdraw'}
        </button>
      </div>

      {/* Top Up Section */}
      {activeSection === 'topup' && (
        <div className="passenger-booking-card">
          <h3 className="passenger-subsection">{t('wallet.topUpBalance') || 'Top Up Balance'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {quickAmounts.map(amt => (
              <button
                key={amt}
                className={`passenger-service-card ${topUpAmount === String(amt) ? 'selected' : ''}`}
                onClick={() => setTopUpAmount(String(amt))}
                style={{ padding: '12px 4px' }}
              >
                <span className="service-card-price">ETB {amt}</span>
              </button>
            ))}
          </div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>{t('wallet.amount') || 'Amount (ETB)'}</label>
            <div className="input-wrapper">
              <FaMoneyBillWave className="input-icon" />
              <input
                type="number"
                placeholder="Enter amount"
                value={topUpAmount}
                onChange={e => setTopUpAmount(e.target.value)}
              />
            </div>
          </div>
          <h3 className="passenger-subsection">{t('wallet.selectMethod') || 'Payment Method'}</h3>
          <div className="passenger-payment-grid" style={{ marginBottom: 16 }}>
            {[
              { id: 'telebirr', icon: <FaMobileAlt />, label: 'Telebirr' },
              { id: 'chapa', icon: <FaCreditCard />, label: 'Chapa' },
            ].map(m => (
              <div
                key={m.id}
                className={`passenger-payment-option ${topUpMethod === m.id ? 'selected' : ''}`}
                onClick={() => setTopUpMethod(m.id)}
              >
                <div className="payment-icon">{m.icon}</div>
                <span className="payment-label">{m.label}</span>
              </div>
            ))}
          </div>
          <button className="passenger-primary-btn" disabled={topUpLoading} onClick={handleTopUp}>
            {topUpLoading ? 'Processing...' : (t('wallet.topUpNow') || 'Top Up Now')}
          </button>
        </div>
      )}

      {/* Withdraw Section */}
      {activeSection === 'withdraw' && (
        <div className="passenger-booking-card">
          <h3 className="passenger-subsection">{t('wallet.withdrawFunds') || 'Withdraw Funds'}</h3>
          <div style={{ padding: 14, background: 'var(--bg)', borderRadius: 12, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('wallet.availableBalance') || 'Available Balance'}: <strong style={{ color: 'var(--text)', fontSize: 15 }}>ETB {balance.toFixed(2)}</strong>
          </div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>{t('wallet.amount') || 'Amount (ETB)'}</label>
            <div className="input-wrapper">
              <FaMoneyBillWave className="input-icon" />
              <input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                max={balance}
              />
            </div>
          </div>
          <button className="passenger-primary-btn" disabled={withdrawLoading} onClick={handleWithdraw}>
            {withdrawLoading ? 'Processing...' : (t('wallet.withdrawNow') || 'Withdraw Now')}
          </button>
        </div>
      )}

      {/* Transaction History */}
      {activeSection === 'history' && (
        <div>
          <h3 className="passenger-subsection" style={{ marginBottom: 12 }}>{t('wallet.recentTransactions') || 'Recent Transactions'}</h3>
          {loading ? (
            <div className="trips-list">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="passenger-booking-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <FaWallet size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t('wallet.noTransactions') || 'No transactions yet'}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('wallet.noTransactionsDesc') || 'Your transaction history will appear here'}</p>
            </div>
          ) : (
            <div className="passenger-trips-list">
              {transactions.map((tx, idx) => {
                const formatted = formatTransaction(tx);
                return (
                  <div key={tx._id || idx} className="passenger-trip-item" style={{ alignItems: 'center' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: formatted.isCredit ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: formatted.isCredit ? 'var(--success)' : 'var(--danger)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                    }}>
                      {formatted.icon}
                    </div>
                    <div style={{ flex: 1, marginLeft: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{formatted.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <FaClock size={10} /> {formatted.date}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: formatted.isCredit ? 'var(--success)' : 'var(--danger)' }}>
                        {formatted.amount}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                        <FaCheckCircle size={10} /> {formatted.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default PassengerWallet;

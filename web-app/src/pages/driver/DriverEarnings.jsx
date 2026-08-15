import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { paymentsAPI } from '../../services/api';
import { Card } from '../../components/common';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import EmptyState from '../../components/common/EmptyState';
import { FaWallet, FaMoneyBillWave, FaCalendar, FaClock, FaChartLine, FaCar, FaArrowUp, FaMobileAlt, FaCreditCard, FaUser } from 'react-icons/fa';
import { useToast } from '../../components/common/Toast';
import './Driver.css';

const DriverEarnings = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();

  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0, total: 0, availableBalance: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('telebirr');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [banks, setBanks] = useState([]);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchEarnings();
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const res = await paymentsAPI.getBanks();
      setBanks(res.data.banks || []);
    } catch (err) {
      console.error('Failed to fetch banks:', err);
    }
  };

  const availableBalance = earnings.availableBalance || 0;

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const [earningsRes, historyRes] = await Promise.all([
        paymentsAPI.earnings(),
        paymentsAPI.earningsHistory({ limit: 50 })
      ]);

      if (earningsRes.data) {
        setEarnings({
          today: earningsRes.data.todayEarnings || earningsRes.data.today || 0,
          week: earningsRes.data.weekEarnings || earningsRes.data.week || 0,
          month: earningsRes.data.monthEarnings || earningsRes.data.month || 0,
          total: earningsRes.data.totalEarnings || earningsRes.data.total || 0,
          availableBalance: earningsRes.data.availableBalance || 0
        });
      }

      setHistory(historyRes.data?.payments || historyRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 100) {
      toast.error('Minimum withdrawal is 100 ETB');
      return;
    }
    if (amount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!accountName || !accountNumber) {
      toast.error('Enter your account name and number to withdraw');
      return;
    }
    if (withdrawMethod === 'bank' && !bankCode) {
      toast.error('Select a bank to withdraw');
      return;
    }

    setWithdrawing(true);
    try {
      await paymentsAPI.withdraw({
        amount,
        method: withdrawMethod,
        accountDetails: { accountName, accountNumber, bankCode }
      });
      toast.success('Withdrawal request submitted for admin approval');
      setWithdrawAmount('');
      setBankCode('');
      fetchEarnings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleInstantCashout = async () => {
    if (!availableBalance || availableBalance < 100) {
      toast.error('Minimum cashout is 100 ETB');
      return;
    }
    if (!accountName || !accountNumber) {
      toast.error('Enter your account name and number to cash out');
      return;
    }
    if (withdrawMethod === 'bank' && !bankCode) {
      toast.error('Select a bank to cash out');
      return;
    }

    setWithdrawing(true);
    try {
      await paymentsAPI.withdraw({
        amount: availableBalance,
        method: withdrawMethod,
        accountDetails: { accountName, accountNumber, bankCode }
      });
      toast.success('Cashout request submitted for admin approval');
      setBankCode('');
      fetchEarnings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cashout failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="driver-page">
        <h1 className="page-title">{t('driver.earnings')}</h1>
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    );
  }

  return (
    <div className="driver-page">
      <h1 className="page-title">{t('driver.earnings')}</h1>

      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}

      <Card className="balance-card" padding="lg" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
        <div className="balance-header">
          <FaWallet className="balance-icon" style={{ color: '#38bdf8' }} />
          <span>Driver Net Payout Wallet</span>
        </div>
        <div className="balance-amount" style={{ fontSize: '26px', fontWeight: '800', margin: '8px 0' }}>
          {availableBalance?.toFixed(0)} ETB
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.9, marginTop: '8px', borderTop: '1px solid #334155', paddingTop: '8px' }}>
          <span>Gross: {earnings.total?.toFixed(0)} ETB</span>
          <span>Platform Fee (-15%): -{(earnings.total * 0.15)?.toFixed(0)} ETB</span>
        </div>
      </Card>

      <Card className="earnings-section" padding="lg" style={{ marginTop: '16px' }}>
        <h2 className="section-title">Withdraw Funds</h2>

        <div className="input-group" style={{ marginBottom: 16 }}>
          <label>Amount (min 100 ETB)</label>
          <div className="input-wrapper">
            <FaMoneyBillWave className="input-icon" />
            <input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              min="100"
              max={availableBalance}
              style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', outline: 'none' }}
            />
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: 16 }}>
          <label>Withdrawal Method</label>
          <div className="driver-method-grid">
            {[
              { id: 'telebirr', icon: <FaMobileAlt />, label: 'Telebirr' },
              { id: 'cbe_birr', icon: <FaMobileAlt />, label: 'CBE Birr' },
              { id: 'bank', icon: <FaCreditCard />, label: 'Bank' },
            ].map(m => (
              <div
                key={m.id}
                className={`driver-method-option ${withdrawMethod === m.id ? 'selected' : ''}`}
                onClick={() => setWithdrawMethod(m.id)}
              >
                <div className="driver-method-icon">{m.icon}</div>
                <span className="driver-method-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: 16 }}>
          <label>Account Holder Name</label>
          <div className="input-wrapper">
            <FaUser className="input-icon" />
            <input
              type="text"
              placeholder={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Account holder name'}
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', outline: 'none' }}
            />
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: 16 }}>
          <label>{withdrawMethod === 'telebirr' ? 'Telebirr Number' : withdrawMethod === 'cbe_birr' ? 'CBE Birr Number' : 'Account Number'}</label>
          <div className="input-wrapper">
            <FaMobileAlt className="input-icon" />
            <input
              type="text"
              placeholder={withdrawMethod === 'bank' ? 'Account number' : '09...'}
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', outline: 'none' }}
            />
          </div>
        </div>

        {withdrawMethod === 'bank' && (
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>Bank</label>
            <div className="input-wrapper">
              <FaCreditCard className="input-icon" />
              <select
                style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', outline: 'none' }}
                value={bankCode}
                onChange={e => setBankCode(e.target.value)}
              >
                <option value="">Select bank</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="driver-withdraw-note">
          <FaClock size={13} /> <span>Withdrawals are reviewed and approved by an admin before processing (1-3 business days).</span>
        </div>
        <button
          type="button"
          disabled={withdrawing}
          onClick={handleWithdraw}
          style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}
        >
          <FaArrowUp style={{ marginRight: 6 }} /> {withdrawing ? 'Processing...' : '📲 Request Withdrawal'}
        </button>
        <button
          type="button"
          disabled={withdrawing || availableBalance < 100}
          onClick={handleInstantCashout}
          style={{ width: '100%', padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ⚡ {withdrawing ? 'Processing...' : `Cashout Full Balance (${availableBalance?.toFixed(0)} ETB)`}
        </button>
      </Card>

      <div className="earnings-section">
        <h2 className="section-title">{t('driver.earningsStats')}</h2>
        <div className="earnings-cards">
          <Card className="earnings-card today" padding="md">
            <span className="earnings-period"><FaClock /> {t('driver.today')}</span>
            <span className="earnings-value">{earnings.today?.toFixed(0)} ETB</span>
          </Card>
          <Card className="earnings-card week" padding="md">
            <span className="earnings-period"><FaCalendar /> {t('driver.thisWeek')}</span>
            <span className="earnings-value">{earnings.week?.toFixed(0)} ETB</span>
          </Card>
          <Card className="earnings-card month" padding="md">
            <span className="earnings-period"><FaChartLine /> {t('driver.thisMonth')}</span>
            <span className="earnings-value">{earnings.month?.toFixed(0)} ETB</span>
          </Card>
        </div>
      </div>

      <div className="earnings-history">
        <h2 className="section-title">{t('driver.earningsHistory')}</h2>

        {history.length === 0 ? (
          <EmptyState
            icon={<EmptyStateIllustration type="earnings" />}
            title={t('driver.noEarnings')}
            description={t('driver.noEarningsDesc')}
          />
        ) : (
          <div className="history-list">
            {history.map(payment => (
              <Card key={payment._id} className="history-item" padding="md">
                <div className="history-info">
                  {payment.type === 'withdrawal' ? (
                    <FaArrowUp className="history-icon" style={{ color: '#ef4444' }} />
                  ) : (
                    <FaCar className="history-icon" style={{ color: '#10b981' }} />
                  )}
                  <div>
                    <h4>
                      {payment.type === 'withdrawal' 
                        ? `Withdrawal - ${payment.method || 'N/A'}`
                        : payment.trip?.pickupLocation?.address 
                          ? `${payment.trip.pickupLocation.address} → ${payment.trip.dropoffLocation?.address || 'N/A'}`
                          : 'Trip Earning'
                      }
                    </h4>
                    <span className="history-date">{formatDate(payment.createdAt)}</span>
                  </div>
                </div>
                <div className="history-amount">
                  <span className="amount" style={{ color: payment.type === 'withdrawal' ? '#ef4444' : '#10b981' }}>
                    {payment.type === 'withdrawal' ? '-' : '+'}{payment.amount?.toFixed(0) || payment.driverEarnings?.toFixed(0) || 0} ETB
                  </span>
                  <span className={`status-badge ${payment.status}`}>{payment.status}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverEarnings;

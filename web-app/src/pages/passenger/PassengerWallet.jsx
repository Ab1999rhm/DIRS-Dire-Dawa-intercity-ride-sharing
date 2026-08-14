import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaWallet, FaHistory, FaMoneyBillWave, FaMobileAlt, FaCreditCard,
  FaArrowUp, FaArrowDown, FaPlus,
  FaCheckCircle, FaClock, FaArrowLeft, FaExclamationTriangle, FaTrashAlt, FaUser
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
  const [withdrawMethod, setWithdrawMethod] = useState('telebirr');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawBankCode, setWithdrawBankCode] = useState('');
  const [banks, setBanks] = useState([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchWalletData();
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

  const handleDelete = async (tx) => {
    if (!window.confirm('Delete this transaction from your history?')) return;
    setDeletingId(tx._id);
    try {
      await paymentsAPI.deleteTransaction(tx._id);
      toast.success('Transaction deleted');
      fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const res = await paymentsAPI.wallet({ limit: 30 });
      setBalance(res.data.balance || 0);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast.error(t('passenger.invalidAmount'));
      return;
    }
    setTopUpLoading(true);
    try {
      const res = await paymentsAPI.topUp({
        amount,
        method: topUpMethod,
        currency: 'ETB',
      });
      toast.success(t('passenger.topUpSuccess'));
      setTopUpAmount('');
      if (res.data?.checkoutUrl) {
        setActiveSection('history');
        window.open(res.data.checkoutUrl, '_blank');
      }
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
      toast.error(t('passenger.invalidAmount'));
      return;
    }
    if (amount < 100) {
      toast.error('Minimum withdrawal is 100 ETB');
      return;
    }
    if (amount > balance) {
      toast.error(t('passenger.insufficientBalance'));
      return;
    }
    const effectiveAccountName = withdrawAccountName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const effectiveAccountNumber = withdrawAccountNumber || user?.phoneNumber || '';
    if (!effectiveAccountName || !effectiveAccountNumber) {
      toast.error('Enter an account holder name and number to withdraw');
      return;
    }
    if (withdrawMethod === 'bank' && !withdrawBankCode) {
      toast.error('Select a bank to withdraw');
      return;
    }
    setWithdrawLoading(true);
    try {
      await paymentsAPI.walletWithdraw({
        amount,
        currency: 'ETB',
        method: withdrawMethod,
        accountDetails: {
          accountName: effectiveAccountName,
          accountNumber: effectiveAccountNumber,
          bankCode: withdrawBankCode,
        },
      });
      toast.success(t('passenger.withdrawSuccess'));
      setWithdrawAmount('');
      setWithdrawAccountName('');
      setWithdrawAccountNumber('');
      setWithdrawBankCode('');
      fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatTransaction = (tx) => {
    const isCredit = tx.type === 'top_up' || tx.type === 'credit' || tx.status === 'refunded';
    let label = tx.type === 'top_up' ? (t('passenger.topUp') || 'Top-up')
      : tx.type === 'withdrawal' ? (t('passenger.withdraw') || 'Withdrawal')
      : tx.type === 'credit' ? 'Wallet Credit'
      : (t('passenger.tripPayments') || 'Trip Payment');
    if (tx.paymentGatewayResponse?.reason) label = tx.paymentGatewayResponse.reason;
    return {
      icon: isCredit ? <FaArrowDown /> : <FaArrowUp />,
      label,
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
          <h1 className="passenger-greeting">{t('passenger.walletTitle')}</h1>
          <p className="passenger-location"><FaWallet /> {t('passenger.walletSubtitle')}</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="passenger-booking-card" style={{ background: 'linear-gradient(135deg, var(--primary), #1e3a5f)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>{t('passenger.currentBalance')}</span>
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
            <FaPlus /> {t('passenger.topUp')}
          </button>
          <button
            className="passenger-primary-btn"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', margin: 0, fontSize: 13, padding: '10px 0', flex: 1 }}
            onClick={() => setActiveSection('withdraw')}
          >
            <FaArrowUp /> {t('passenger.withdraw')}
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="passenger-tab-bar" style={{ marginBottom: 16 }}>
        <button className={`passenger-tab ${activeSection === 'history' ? 'active' : ''}`} onClick={() => setActiveSection('history')}>
          <FaHistory /> {t('passenger.history')}
        </button>
        <button className={`passenger-tab ${activeSection === 'topup' ? 'active' : ''}`} onClick={() => setActiveSection('topup')}>
          <FaPlus /> {t('passenger.topUp')}
        </button>
        <button className={`passenger-tab ${activeSection === 'withdraw' ? 'active' : ''}`} onClick={() => setActiveSection('withdraw')}>
          <FaArrowUp /> {t('passenger.withdraw')}
        </button>
      </div>

      {/* Top Up Section */}
      {activeSection === 'topup' && (
        <div className="passenger-booking-card">
          <h3 className="passenger-subsection">{t('passenger.topUpBalance')}</h3>
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
            <label>{t('passenger.amount')}</label>
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
          <h3 className="passenger-subsection">{t('passenger.selectMethod')}</h3>
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
            {topUpLoading ? 'Processing...' : (t('passenger.topUpNow'))}
          </button>
        </div>
      )}

      {/* Withdraw Section */}
      {activeSection === 'withdraw' && (
        <div className="passenger-booking-card">
          <h3 className="passenger-subsection">{t('passenger.withdrawFunds')}</h3>
          <div style={{ padding: 14, background: 'var(--bg)', borderRadius: 12, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('passenger.availableBalance')}: <strong style={{ color: 'var(--text)', fontSize: 15 }}>ETB {balance.toFixed(2)}</strong>
          </div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>{t('passenger.amount')}</label>
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
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>{t('passenger.selectMethod')}</label>
            <div className="input-wrapper">
              <FaMobileAlt className="input-icon" />
              <select
                style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', outline: 'none' }}
                value={withdrawMethod}
                onChange={e => setWithdrawMethod(e.target.value)}
              >
                <option value="telebirr">Telebirr</option>
                <option value="cbe_birr">CBE Birr</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>Account Holder Name</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Account holder name'}
                value={withdrawAccountName}
                onChange={e => setWithdrawAccountName(e.target.value)}
              />
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>{withdrawMethod === 'telebirr' ? 'Telebirr Number' : 'Account Number'}</label>
            <div className="input-wrapper">
              <FaMobileAlt className="input-icon" />
              <input
                type="text"
                placeholder={withdrawMethod === 'telebirr' ? '09...' : 'Account number'}
                value={withdrawAccountNumber}
                onChange={e => setWithdrawAccountNumber(e.target.value)}
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
                  value={withdrawBankCode}
                  onChange={e => setWithdrawBankCode(e.target.value)}
                >
                  <option value="">Select bank</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <button className="passenger-primary-btn" disabled={withdrawLoading} onClick={handleWithdraw}>
            {withdrawLoading ? 'Processing...' : (t('passenger.withdrawNow'))}
          </button>
        </div>
      )}

      {/* Transaction History */}
      {activeSection === 'history' && (
        <div>
          <h3 className="passenger-subsection" style={{ marginBottom: 12 }}>{t('passenger.recentTransactions')}</h3>
          {loading ? (
            <div className="trips-list">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="passenger-booking-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <FaWallet size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t('passenger.noTransactions')}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('passenger.noTransactionsDesc')}</p>
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
                      <div style={{ fontSize: 11, color: tx.status === 'pending' ? '#d97706' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                        <FaCheckCircle size={10} /> {formatted.status}
                      </div>
                      {(tx.type === 'top_up' && tx.status !== 'completed') && (
                        <button
                          type="button"
                          className="wallet-delete-btn"
                          disabled={deletingId === tx._id}
                          onClick={() => handleDelete(tx)}
                        >
                          {deletingId === tx._id ? 'Deleting…' : (<><FaTrashAlt size={10} /> Delete</>)}
                        </button>
                      )}
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

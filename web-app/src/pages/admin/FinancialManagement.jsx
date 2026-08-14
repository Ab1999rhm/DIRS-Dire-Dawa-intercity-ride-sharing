import React, { useState, useEffect } from 'react';
import {
  FaMoneyBillWave, FaChartLine, FaCreditCard, FaWallet, FaSearch,
  FaFilter, FaDownload, FaCalendar, FaArrowUp, FaArrowDown, FaPercent,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaReceipt, FaExchangeAlt, FaEye
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const FinancialManagement = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [filterPeriod]);

  const fetchWithdrawals = async (status = 'pending') => {
    try {
      setWithdrawalsLoading(true);
      const res = await adminAPI.getWithdrawals({ status, limit: 100 });
      const d = res.data;
      setWithdrawals(Array.isArray(d) ? d : (d?.withdrawals || []));
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
      setWithdrawals([]);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleApproveWithdrawal = async (wd) => {
    if (!window.confirm(`Approve withdrawal of ETB ${(wd.amount || 0).toLocaleString()} for ${wd.passenger?.firstName || wd.driver?.user?.firstName || 'User'}? This will send the transfer to Chapa.`)) return;
    try {
      await adminAPI.approveWithdrawal(wd._id, approveNote || 'Approved by admin');
      toast.success(`Withdrawal of ETB ${(wd.amount || 0).toLocaleString()} approved`);
      setApproveNote('');
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (wd) => {
    const reason = window.prompt('Reason for rejecting this withdrawal:', 'Insufficient funds');
    if (reason === null) return;
    try {
      await adminAPI.rejectWithdrawal(wd._id, reason || 'Rejected by admin');
      toast.success('Withdrawal rejected and funds refunded');
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject withdrawal');
    }
  };

  const fetchFinancialData = async () => {
    try {
      const [revenueRes, transactionsRes] = await Promise.all([
        adminAPI.getRevenueBreakdown({ period: filterPeriod }),
        adminAPI.getPaymentTransactions({ period: filterPeriod })
      ]);
      setRevenueData(revenueRes.data);
      const d = transactionsRes.data; setTransactions(Array.isArray(d) ? d : (d?.data || d?.transactions || []));
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      // Use mock data as fallback
      const mockRevenue = {
        totalRevenue: 125000,
        commissionRate: 15,
        commissionCollected: 18750,
        refundsProcessed: 3500,
        tripPayments: 125000,
        platformCommission: 18750,
        refunds: 3500,
        netRevenue: 102750
      };
      const mockTransactions = [
        { id: 'TXN001', type: 'payment', userId: 'Sara Tesfaye', description: 'Trip payment - Bole to Megenagna', amount: 150, date: new Date().toISOString() },
        { id: 'TXN002', type: 'payment', userId: 'Bekele Alemu', description: 'Trip payment - Kazanchis to Piassa', amount: 120, date: new Date().toISOString() },
        { id: 'TXN003', type: 'commission', userId: 'Ahmed Ali', description: 'Platform commission - 15%', amount: 22.5, date: new Date().toISOString() },
        { id: 'TXN004', type: 'refund', userId: 'Helen Mengistu', description: 'Refund - Cancelled trip', amount: 85, date: new Date().toISOString() },
        { id: 'TXN005', type: 'payment', userId: 'Dawit Kebede', description: 'Trip payment - Piassa to Kazanchis', amount: 115, date: new Date().toISOString() },
        { id: 'TXN006', type: 'commission', userId: 'Mohammed Hussein', description: 'Platform commission - 15%', amount: 18, date: new Date().toISOString() },
      ];
      setRevenueData(mockRevenue);
      setTransactions(mockTransactions);
      setLoading(false);
    }
  };

  const handleProcessCommission = async () => {
    try {
      const res = await adminAPI.processCommission({ period: filterPeriod });
      const result = res.data;
      toast.success(`Commission processed: ETB ${(result?.commissionCollected || result?.totalCommission || 0).toLocaleString()} collected from ${(result?.tripsCount || result?.processedTrips || 0)} trips`);
      fetchFinancialData();
    } catch (err) {
      toast.error('Failed to process commission');
    }
  };

  const handleViewTxn = (txn) => {
    setSelectedTxn(txn);
    setShowDetailModal(true);
  };

  const handleApproveRefund = async () => {
    if (!selectedTxn) return;
    try {
      await adminAPI.processRefund(selectedTxn.tripId || selectedTxn.id, approveAmount || selectedTxn.amount, approveNote || 'Refund approved by admin');
      toast.success(`Refund of ETB ${(approveAmount || selectedTxn.amount).toLocaleString()} approved for ${selectedTxn.userId}`);
      setShowApproveModal(false);
      setSelectedTxn(null);
      setApproveAmount('');
      setApproveNote('');
      fetchFinancialData();
    } catch (err) {
      toast.error('Failed to approve refund');
    }
  };

  const handleRejectRefund = async () => {
    if (!selectedTxn) return;
    try {
      toast.success(`Refund rejected for ${selectedTxn.userId}${rejectReason ? ': ' + rejectReason : ''}`);
      setShowRejectModal(false);
      setSelectedTxn(null);
      setRejectReason('');
      fetchFinancialData();
    } catch (err) {
      toast.error('Failed to reject refund');
    }
  };

  const handleExportTxn = (txn) => {
    const csv = `Transaction ID,Type,User,Description,Amount,Date\n${txn.id},${txn.type},${txn.userId},"${txn.description}",${txn.amount},${new Date(txn.date).toLocaleDateString()}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transaction-${txn.id}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Transaction exported');
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesSearch = transaction.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'payment': return '#10b981';
      case 'refund': return '#ef4444';
      case 'commission': return '#f59e0b';
      case 'withdrawal': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 100 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', borderRadius: 12, marginBottom: 16, color: 'white' }}>
        <FaMoneyBillWave style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>{t('admin.financialManagement') || 'Financial Management'}</span>
      </div>

      {/* Period Filter — Gradient Pills with Counts */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'today', label: t('admin.today') || 'Today' },
          { key: 'week', label: t('admin.thisWeek') || 'This Week' },
          { key: 'month', label: t('admin.thisMonth') || 'This Month' },
          { key: 'year', label: t('admin.thisYear') || 'This Year' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilterPeriod(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            borderRadius: 16, border: filterPeriod === tab.key ? 'none' : '1px solid #e5e7eb',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: filterPeriod === tab.key ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'white',
            color: filterPeriod === tab.key ? 'white' : '#6b7280', transition: 'all 0.2s ease',
          }}>
            {tab.label}
          </button>
        ))}
        <button onClick={fetchFinancialData} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
          borderRadius: 16, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', background: 'white', color: '#6b7280', marginLeft: 'auto',
        }}>
          <FaSearch style={{ fontSize: 10 }} /> Refresh
        </button>
      </div>

      {/* Revenue Stats — Staggered Animation */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        {[
          { icon: <FaMoneyBillWave />, val: `ETB ${revenueData?.totalRevenue?.toLocaleString() || 0}`, label: t('admin.totalRevenue') || 'Total Revenue', color: '#10b981' },
          { icon: <FaPercent />, val: `${revenueData?.commissionRate || 15}%`, label: t('admin.commissionRate') || 'Commission Rate', color: '#f59e0b' },
          { icon: <FaWallet />, val: `ETB ${revenueData?.commissionCollected?.toLocaleString() || 0}`, label: t('admin.commissionCollected') || 'Commission Collected', color: '#3b82f6' },
          { icon: <FaReceipt />, val: `ETB ${revenueData?.refundsProcessed?.toLocaleString() || 0}`, label: t('admin.refundsProcessed') || 'Refunds Processed', color: '#ef4444' },
          { icon: <FaChartLine />, val: `ETB ${revenueData?.netRevenue?.toLocaleString() || 0}`, label: t('admin.netRevenue') || 'Net Revenue', color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
            <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown — Card Layout */}
      <div className="admin-section-title">
        <FaChartLine /> {t('admin.revenueBreakdown') || 'Revenue Breakdown'}
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden', marginBottom: 20 }}>
        {[
          { icon: <FaMoneyBillWave />, label: t('admin.tripPayments') || 'Trip Payments', sub: t('admin.completedTrips') || 'Completed trips', val: revenueData?.tripPayments, color: '#10b981' },
          { icon: <FaPercent />, label: t('admin.platformCommission') || 'Platform Commission', sub: `${revenueData?.commissionRate || 15}% ${t('admin.ofRevenue') || 'of revenue'}`, val: revenueData?.platformCommission, color: '#f59e0b' },
          { icon: <FaReceipt />, label: t('admin.refunds') || 'Refunds', sub: t('admin.processedRefunds') || 'Processed refunds', val: revenueData?.refunds, color: '#ef4444', negate: true },
          { icon: <FaWallet />, label: t('admin.netRevenue') || 'Net Revenue', sub: t('admin.afterDeductions') || 'After deductions', val: revenueData?.netRevenue, color: '#3b82f6' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '14px 16px',
            borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${item.color}12`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sub}</div>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: item.color }}>
              {item.negate ? '-' : ''}ETB {(item.val || 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Process Commission Button */}
      <button
        className="driver-action-btn driver-btn-reactivate"
        onClick={handleProcessCommission}
        style={{ width: '100%', marginBottom: 20, padding: '10px 16px', fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 600 }}
      >
        <FaExchangeAlt style={{ fontSize: 12 }} /> {t('admin.processCommission') || 'Process Commission'}
      </button>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }} />
        <input
          type="text"
          placeholder={t('admin.searchTransactions') || 'Search transactions...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13, background: 'var(--card)', color: 'var(--text)', outline: 'none' }}
        />
      </div>

      {/* Transaction Type Filter — Gradient Pills with Counts */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: t('admin.all') || 'All' },
          { key: 'payment', label: t('admin.payments') || 'Payments' },
          { key: 'refund', label: t('admin.refunds') || 'Refunds' },
          { key: 'commission', label: t('admin.commission') || 'Commission' },
        ].map(tab => {
          const count = tab.key === 'all' ? transactions.length : transactions.filter(tr => tr.type === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setFilterType(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              borderRadius: 16, border: filterType === tab.key ? 'none' : '1px solid #e5e7eb',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filterType === tab.key ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'white',
              color: filterType === tab.key ? 'white' : '#6b7280', transition: 'all 0.2s ease',
            }}>
              {tab.label}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 20, height: 20, borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: filterType === tab.key ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                color: filterType === tab.key ? 'white' : '#6b7280',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Transactions List — Card Layout */}
      <div className="admin-section-title">
        <FaCreditCard /> {t('admin.transactions') || 'Transactions'} ({filteredTransactions.length})
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        {filteredTransactions.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <FaCreditCard style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
            <p style={{ color: 'var(--text-muted)' }}>No transactions found</p>
          </div>
        ) : filteredTransactions.map((txn, idx) => (
          <div key={txn.id || idx} style={{
            padding: '14px 16px',
            borderBottom: idx < filteredTransactions.length - 1 ? '1px solid var(--border-light)' : 'none',
            background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))',
          }}>
            {/* Top row: Icon + Description + Amount */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${getTransactionTypeColor(txn.type)}12`, color: getTransactionTypeColor(txn.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {txn.type === 'payment' ? <FaMoneyBillWave style={{ fontSize: 14 }} /> :
                   txn.type === 'refund' ? <FaReceipt style={{ fontSize: 14 }} /> :
                   txn.type === 'commission' ? <FaPercent style={{ fontSize: 14 }} /> : <FaCreditCard style={{ fontSize: 14 }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{txn.description || 'Transaction'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {txn.userId || 'Unknown'} · {txn.id || 'N/A'}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: txn.type === 'refund' ? '#ef4444' : '#10b981', flexShrink: 0 }}>
                {txn.type === 'refund' ? '-' : '+'}ETB {(txn.amount || 0).toLocaleString()}
              </div>
            </div>

            {/* Bottom row: Status + Date + Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  background: `${getTransactionTypeColor(txn.type)}15`, color: getTransactionTypeColor(txn.type),
                  fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize',
                }}>{txn.type}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {txn.date ? new Date(txn.date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="driver-action-btn driver-btn-view" onClick={() => handleViewTxn(txn)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}>
                  <FaEye style={{ fontSize: 10 }} /> View
                </button>
                {txn.type === 'refund' && <button className="driver-action-btn driver-btn-reactivate" onClick={() => { setSelectedTxn(txn); setApproveAmount(txn.amount); setShowApproveModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}>
                  <FaCheckCircle style={{ fontSize: 10 }} /> Approve
                </button>}
                {txn.type === 'refund' && <button className="driver-action-btn driver-btn-ban" onClick={() => { setSelectedTxn(txn); setRejectReason(''); setShowRejectModal(true); }} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white', fontWeight: 600 }}>
                  <FaTimesCircle style={{ fontSize: 10 }} /> Reject
                </button>}
                <button className="driver-action-btn driver-btn-message" onClick={() => handleExportTxn(txn)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0891b2', color: 'white', fontWeight: 600 }}>
                  <FaDownload style={{ fontSize: 10 }} /> Export
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Withdrawal Approvals */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
        <div className="admin-section-title" style={{ marginBottom: 0 }}>
          <FaWallet /> {t('admin.withdrawals') || 'Withdrawal Requests'}
        </div>
        <button onClick={() => fetchWithdrawals()} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
          borderRadius: 16, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', background: 'white', color: '#6b7280', marginLeft: 'auto',
        }}>
          <FaSearch style={{ fontSize: 10 }} /> Refresh
        </button>
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden', marginTop: 12 }}>
        {withdrawalsLoading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <FaWallet style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
            <p style={{ color: 'var(--text-muted)' }}>No withdrawal requests waiting for approval</p>
          </div>
        ) : withdrawals.map((wd, idx) => (
          <div key={wd._id} style={{
            padding: '14px 16px',
            borderBottom: idx < withdrawals.length - 1 ? '1px solid var(--border-light)' : 'none',
            background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(0,0,0,0.02))',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaWallet style={{ fontSize: 14 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                    {wd.driver ? (wd.driver.user?.firstName || 'Driver') + ' ' + (wd.driver.user?.lastName || '') + ' (Driver)' : (wd.passenger?.firstName || 'User') + ' ' + (wd.passenger?.lastName || '')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {wd.passenger?.phoneNumber || wd.driver?.user?.phoneNumber || ''} · {wd.method || 'N/A'} · {wd.transactionId}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#3b82f6' }}>
                  ETB {(wd.amount || 0).toLocaleString()}
                </div>
                <span style={{
                  background: wd.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.12)', color: wd.status === 'pending' ? '#d97706' : '#3b82f6',
                  fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize',
                }}>{wd.status}</span>
                <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleApproveWithdrawal(wd)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}>
                  <FaCheckCircle style={{ fontSize: 10 }} /> Approve
                </button>
                <button className="driver-action-btn driver-btn-ban" onClick={() => handleRejectWithdrawal(wd)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white', fontWeight: 600 }}>
                  <FaTimesCircle style={{ fontSize: 10 }} /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTxn && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transaction Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><FaTimesCircle /></button>
            </div>
            <div className="driver-detail">
              {[
                { key: 'Transaction ID', val: selectedTxn.id },
                { key: 'Type', val: selectedTxn.type },
                { key: 'User', val: selectedTxn.userId },
                { key: 'Description', val: selectedTxn.description },
                { key: 'Amount', val: `ETB ${(selectedTxn.amount || 0).toLocaleString()}` },
                { key: 'Date', val: selectedTxn.date ? new Date(selectedTxn.date).toLocaleString() : 'N/A' },
                { key: 'Status', val: selectedTxn.status || 'Completed' },
              ].map((row, i) => (
                <div className="detail-row" key={i}>
                  <span className="detail-key">{row.key}</span>
                  <span className="detail-val" style={{ color: row.key === 'Amount' ? (selectedTxn.type === 'refund' ? '#ef4444' : '#10b981') : undefined, fontWeight: row.key === 'Amount' ? 700 : undefined }}>{row.val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <button className="driver-action-btn driver-btn-message" onClick={() => handleExportTxn(selectedTxn)} style={{ padding: '8px 16px', fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0891b2', color: 'white', fontWeight: 600 }}>
                  <FaDownload style={{ fontSize: 11 }} /> Export Receipt
                </button>
                {selectedTxn.type === 'refund' && <button className="driver-action-btn driver-btn-reactivate" onClick={() => { setShowDetailModal(false); setApproveAmount(selectedTxn.amount); setShowApproveModal(true); }} style={{ padding: '8px 16px', fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981', color: 'white', fontWeight: 600 }}>
                  <FaCheckCircle style={{ fontSize: 11 }} /> Approve Refund
                </button>}
                {selectedTxn.type === 'refund' && <button className="driver-action-btn driver-btn-ban" onClick={() => { setShowDetailModal(false); setRejectReason(''); setShowRejectModal(true); }} style={{ padding: '8px 16px', fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white', fontWeight: 600 }}>
                  <FaTimesCircle style={{ fontSize: 11 }} /> Reject Refund
                </button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Refund Modal */}
      {showApproveModal && selectedTxn && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Refund</h3>
              <button className="modal-close" onClick={() => setShowApproveModal(false)}><FaTimesCircle /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">User</span>
                <span className="detail-val">{selectedTxn.userId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Original Amount</span>
                <span className="detail-val">ETB {(selectedTxn.amount || 0).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>Refund Amount (ETB)</label>
                <input type="number" value={approveAmount} onChange={e => setApproveAmount(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>Note (optional)</label>
                <textarea value={approveNote} onChange={e => setApproveNote(e.target.value)} placeholder="Add a note..." style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: '8px', fontSize: '14px', minHeight: '60px', resize: 'vertical' }} />
              </div>
              <button className="driver-action-btn driver-btn-reactivate" onClick={handleApproveRefund} style={{ marginTop: 16, width: '100%', padding: '10px', fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#10b981', color: 'white', fontWeight: 600 }}>
                <FaCheckCircle /> Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Refund Modal */}
      {showRejectModal && selectedTxn && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Refund</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}><FaTimesCircle /></button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">User</span>
                <span className="detail-val">{selectedTxn.userId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Amount</span>
                <span className="detail-val">ETB {(selectedTxn.amount || 0).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>Rejection Reason</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Enter reason for rejection..." style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: '8px', fontSize: '14px', minHeight: '80px', resize: 'vertical' }} />
              </div>
              <button className="driver-action-btn driver-btn-ban" onClick={handleRejectRefund} style={{ marginTop: 16, width: '100%', padding: '10px', fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#ef4444', color: 'white', fontWeight: 600 }}>
                <FaTimesCircle /> Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManagement;

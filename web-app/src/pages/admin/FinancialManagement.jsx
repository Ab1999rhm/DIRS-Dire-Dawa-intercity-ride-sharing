import React, { useState, useEffect } from 'react';
import {
  FaMoneyBillWave, FaChartLine, FaCreditCard, FaWallet, FaSearch,
  FaFilter, FaDownload, FaCalendar, FaArrowUp, FaArrowDown, FaPercent,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaReceipt, FaExchangeAlt
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

  useEffect(() => {
    fetchFinancialData();
  }, [filterPeriod]);

  const fetchFinancialData = async () => {
    try {
      const [revenueRes, transactionsRes] = await Promise.all([
        adminAPI.getRevenueBreakdown({ period: filterPeriod }),
        adminAPI.getPaymentTransactions({ period: filterPeriod })
      ]);
      setRevenueData(revenueRes.data);
      setTransactions(transactionsRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      setLoading(false);
    }
  };

  const handleProcessCommission = async () => {
    try {
      await adminAPI.processCommission({ period: filterPeriod });
      toast.success('Commission processed successfully');
      fetchFinancialData();
    } catch (err) {
      toast.error('Failed to process commission');
    }
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
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-greeting">
            {t('admin.financialManagement') || 'Financial Management'}
          </div>
          <div className="admin-role-badge">
            <FaMoneyBillWave /> {t('admin.finance') || 'Finance'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchFinancialData}>
            <FaSearch />
          </button>
          <button className="admin-icon-btn">
            <FaDownload />
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${filterPeriod === 'today' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('today')}
        >
          {t('admin.today') || 'Today'}
        </button>
        <button
          className={`admin-filter-tab ${filterPeriod === 'week' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('week')}
        >
          {t('admin.thisWeek') || 'This Week'}
        </button>
        <button
          className={`admin-filter-tab ${filterPeriod === 'month' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('month')}
        >
          {t('admin.thisMonth') || 'This Month'}
        </button>
        <button
          className={`admin-filter-tab ${filterPeriod === 'year' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('year')}
        >
          {t('admin.thisYear') || 'This Year'}
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaMoneyBillWave />
          </div>
          <div>
            <div className="admin-stat-value">ETB {revenueData?.totalRevenue?.toLocaleString() || 0}</div>
            <div className="admin-stat-label">{t('admin.totalRevenue') || 'Total Revenue'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaPercent />
          </div>
          <div>
            <div className="admin-stat-value">{revenueData?.commissionRate || 15}%</div>
            <div className="admin-stat-label">{t('admin.commissionRate') || 'Commission Rate'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaWallet />
          </div>
          <div>
            <div className="admin-stat-value">ETB {revenueData?.commissionCollected?.toLocaleString() || 0}</div>
            <div className="admin-stat-label">{t('admin.commissionCollected') || 'Commission Collected'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
            <FaReceipt />
          </div>
          <div>
            <div className="admin-stat-value">ETB {revenueData?.refundsProcessed?.toLocaleString() || 0}</div>
            <div className="admin-stat-label">{t('admin.refundsProcessed') || 'Refunds Processed'}</div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="admin-section-title">
        <FaChartLine /> {t('admin.revenueBreakdown') || 'Revenue Breakdown'}
      </div>
      <div className="admin-activity-list" style={{ marginBottom: 20 }}>
        <div className="admin-activity-item">
          <div className="admin-activity-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaMoneyBillWave />
          </div>
          <div className="admin-activity-info">
            <div className="admin-activity-text">{t('admin.tripPayments') || 'Trip Payments'}</div>
            <div className="admin-activity-time">{t('admin.completedTrips') || 'Completed trips'}</div>
          </div>
          <div style={{ fontWeight: 700, color: '#10b981' }}>
            ETB {revenueData?.tripPayments?.toLocaleString() || 0}
          </div>
        </div>
        <div className="admin-activity-item">
          <div className="admin-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaPercent />
          </div>
          <div className="admin-activity-info">
            <div className="admin-activity-text">{t('admin.platformCommission') || 'Platform Commission'}</div>
            <div className="admin-activity-time">{revenueData?.commissionRate || 15}% {t('admin.ofRevenue') || 'of revenue'}</div>
          </div>
          <div style={{ fontWeight: 700, color: '#f59e0b' }}>
            ETB {revenueData?.platformCommission?.toLocaleString() || 0}
          </div>
        </div>
        <div className="admin-activity-item">
          <div className="admin-activity-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
            <FaReceipt />
          </div>
          <div className="admin-activity-info">
            <div className="admin-activity-text">{t('admin.refunds') || 'Refunds'}</div>
            <div className="admin-activity-time">{t('admin.processedRefunds') || 'Processed refunds'}</div>
          </div>
          <div style={{ fontWeight: 700, color: '#ef4444' }}>
            -ETB {revenueData?.refunds?.toLocaleString() || 0}
          </div>
        </div>
        <div className="admin-activity-item">
          <div className="admin-activity-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaWallet />
          </div>
          <div className="admin-activity-info">
            <div className="admin-activity-text">{t('admin.netRevenue') || 'Net Revenue'}</div>
            <div className="admin-activity-time">{t('admin.afterDeductions') || 'After deductions'}</div>
          </div>
          <div style={{ fontWeight: 700, color: '#3b82f6' }}>
            ETB {revenueData?.netRevenue?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* Process Commission Button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: 20 }}
        onClick={handleProcessCommission}
      >
        <FaExchangeAlt /> {t('admin.processCommission') || 'Process Commission'}
      </button>

      {/* Search and Filter */}
      <div className="admin-search">
        <FaSearch />
        <input
          type="text"
          placeholder={t('admin.searchTransactions') || 'Search transactions...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          {t('admin.all') || 'All'}
        </button>
        <button
          className={`admin-filter-tab ${filterType === 'payment' ? 'active' : ''}`}
          onClick={() => setFilterType('payment')}
        >
          {t('admin.payments') || 'Payments'}
        </button>
        <button
          className={`admin-filter-tab ${filterType === 'refund' ? 'active' : ''}`}
          onClick={() => setFilterType('refund')}
        >
          {t('admin.refunds') || 'Refunds'}
        </button>
        <button
          className={`admin-filter-tab ${filterType === 'commission' ? 'active' : ''}`}
          onClick={() => setFilterType('commission')}
        >
          {t('admin.commission') || 'Commission'}
        </button>
      </div>

      {/* Transactions List */}
      <div className="admin-section-title">
        <FaCreditCard /> {t('admin.transactions') || 'Transactions'}
      </div>
      <div className="admin-activity-list">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="admin-activity-item">
            <div className="admin-activity-icon" style={{
              background: 'rgba(59, 130, 246, 0.08)',
              color: getTransactionTypeColor(transaction.type)
            }}>
              {transaction.type === 'payment' ? <FaMoneyBillWave /> :
               transaction.type === 'refund' ? <FaReceipt /> :
               transaction.type === 'commission' ? <FaPercent /> : <FaCreditCard />}
            </div>
            <div className="admin-activity-info">
              <div className="admin-activity-text">{transaction.description}</div>
              <div className="admin-activity-time">
                {transaction.userId} • {new Date(transaction.date).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="status-badge" style={{
                background: transaction.type === 'payment' ? '#dcfce7' :
                         transaction.type === 'refund' ? '#fef2f2' :
                         transaction.type === 'commission' ? '#fef3c7' : '#f3f4f6',
                color: transaction.type === 'payment' ? '#15803d' :
                       transaction.type === 'refund' ? '#dc2626' :
                       transaction.type === 'commission' ? '#92400e' : '#6b7280'
              }}>
                {transaction.type}
              </div>
              <div style={{ fontWeight: 700, color: transaction.type === 'refund' ? '#ef4444' : '#10b981' }}>
                {transaction.type === 'refund' ? '-' : '+'}ETB {transaction.amount?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialManagement;

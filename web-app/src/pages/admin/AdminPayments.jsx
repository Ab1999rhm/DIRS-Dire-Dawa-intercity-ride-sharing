import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaFilter } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import Badge, { StatusBadge } from '../../components/common/Badge';
import './Admin.css';

const AdminPayments = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overview, setOverview] = useState({ totalRevenue: 0, commission: 0, pendingPayouts: 0 });

  useEffect(() => {
    fetchPayments();
  }, [methodFilter, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (methodFilter !== 'all') params.method = methodFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.payments(params);
      setPayments(res.data.payments || res.data || []);
      if (res.data.overview) setOverview(res.data.overview);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const overviewCards = [
    { key: 'totalRevenue', label: t('admin.totalRevenue') || 'Total Revenue', value: overview.totalRevenue, color: '#2563eb' },
    { key: 'commission', label: t('admin.commission') || 'Commission', value: overview.commission, color: '#059669' },
    { key: 'pendingPayouts', label: t('admin.pendingPayouts') || 'Pending Payouts', value: overview.pendingPayouts, color: '#d97706' },
  ];

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.payments')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.payments')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--danger)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-logo-bar">
        <img src="/logo.svg?v=2" alt="DIRS" className="admin-logo" />
      </div>
      <div className="admin-header admin-animate-in">
        <h1>{t('admin.payments')}</h1>
      </div>

      <div className="payment-overview-cards admin-animate-in-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {overviewCards.map((card) => (
          <div key={card.key} className="overview-card" style={{ background: 'var(--card)', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                <FaMoneyBillWave />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{card.label}</span>
            </div>
            <h2 style={{ margin: 0 }}>ETB {(card.value || 0).toLocaleString()}</h2>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--card)' }}
        >
          <option value="all">{t('admin.allMethods') || 'All Methods'}</option>
          <option value="cash">{t('admin.cash') || 'Cash'}</option>
          <option value="telebirr">{t('admin.telebirr') || 'Telebirr'}</option>
          <option value="chapa">{t('admin.chapa') || 'Chapa'}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--card)' }}
        >
          <option value="all">{t('admin.allStatus') || 'All Status'}</option>
          <option value="completed">{t('admin.completed') || 'Completed'}</option>
          <option value="pending">{t('admin.pending') || 'Pending'}</option>
          <option value="failed">{t('admin.failed') || 'Failed'}</option>
        </select>
      </div>

      {payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <EmptyStateIllustration type="earnings" />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>{t('admin.noPayments') || 'No payments found'}</h3>
        </div>
      ) : (
        <div className="admin-table admin-animate-in-delay-2">
          <div className="admin-table-header">
            <div style={{ gridColumn: 'span 2' }}>{t('admin.user') || 'User'}</div>
            <div>{t('admin.amount') || 'Amount'}</div>
            <div>{t('admin.method') || 'Method'}</div>
            <div>{t('admin.status') || 'Status'}</div>
            <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>{t('admin.date') || 'Date'}</div>
          </div>
          {payments.map((payment) => (
            <div key={payment._id} className="admin-table-row">
              <div className="row-main">
                <div className="row-avatar">
                  {payment.user?.firstName?.[0] || payment.payer?.firstName?.[0] || '?'}
                </div>
                <div className="row-info">
                  <h4>{payment.user?.firstName || payment.payer?.firstName || 'N/A'} {payment.user?.lastName || payment.payer?.lastName || ''}</h4>
                  <p>{payment.user?.phoneNumber || payment.payer?.phoneNumber || ''}</p>
                </div>
              </div>
              <div><Badge variant="success">ETB {(payment.amount || 0).toLocaleString()}</Badge></div>
              <div style={{ textTransform: 'capitalize' }}>{payment.method || payment.paymentMethod || 'N/A'}</div>
              <div><StatusBadge status={payment.status} /></div>
              <div className="row-actions" style={{ gridColumn: 'span 2', justifyContent: 'flex-end' }}>
                {new Date(payment.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPayments;

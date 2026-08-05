import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { paymentsAPI } from '../../services/api';
import { Card } from '../../components/common';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import EmptyState from '../../components/common/EmptyState';
import { FaWallet, FaMoneyBillWave, FaCalendar, FaClock, FaChartLine, FaCar } from 'react-icons/fa';
import './Driver.css';

const DriverEarnings = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const [earningsRes, historyRes] = await Promise.all([
        paymentsAPI.earnings(),
        paymentsAPI.history()
      ]);

      if (earningsRes.data) {
        setEarnings({
          today: earningsRes.data.today || 0,
          week: earningsRes.data.week || 0,
          month: earningsRes.data.month || 0,
          total: earningsRes.data.total || 0
        });
      }

      setHistory(historyRes.data?.payments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
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

      <Card className="balance-card" padding="lg">
        <div className="balance-header">
          <FaWallet className="balance-icon" />
          <span>{t('driver.balance')}</span>
        </div>
        <div className="balance-amount">{earnings.total?.toFixed(0)} ETB</div>
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
                  <FaCar className="history-icon" />
                  <div>
                    <h4>{payment.trip?.pickup?.address} → {payment.trip?.dropoff?.address}</h4>
                    <span className="history-date">{formatDate(payment.createdAt)}</span>
                  </div>
                </div>
                <div className="history-amount">
                  <span className="amount">{payment.amount?.toFixed(0)} ETB</span>
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

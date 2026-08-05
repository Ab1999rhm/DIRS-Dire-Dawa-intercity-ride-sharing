import React, { useState } from 'react';
import { FaChartBar, FaMoneyBillWave, FaCar, FaUsers, FaDownload, FaFilter } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AdminReports = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const reportTypes = [
    { key: 'revenue', label: 'Revenue', icon: <FaMoneyBillWave />, color: '#2563eb', description: 'Detailed revenue breakdown' },
    { key: 'trips', label: 'Trips', icon: <FaCar />, color: '#059669', description: 'Trip statistics and analytics' },
    { key: 'users', label: 'Users', icon: <FaUsers />, color: '#7c3aed', description: 'User growth and activity' },
    { key: 'drivers', label: 'Drivers', icon: <FaCar />, color: '#d97706', description: 'Driver performance metrics' },
    { key: 'payments', label: 'Payments', icon: <FaMoneyBillWave />, color: '#ec4899', description: 'Payment method analytics' },
  ];

  const generateReport = async (type) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedReport(type);
      const params = { type };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await adminAPI.report(params);
      setReportData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderReportFields = () => {
    if (!reportData) return null;
    const data = reportData.report || reportData;

    const fields = Object.entries(data).filter(([key]) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key));

    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{selectedReport} Report</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedReport}-report.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <FaDownload /> Export
          </button>
        </div>
        <div className="detail-modal-content">
          {fields.map(([key, value]) => (
            <div key={key} className="detail-row">
              <span className="detail-key">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
              <span className="detail-val">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{t('admin.reports')}</h1>
      </div>

      <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {reportTypes.map((report) => (
          <button
            key={report.key}
            className={`report-type-card ${selectedReport === report.key ? 'active' : ''}`}
            onClick={() => generateReport(report.key)}
            style={{
              background: selectedReport === report.key ? `${report.color}10` : '#fff',
              border: `2px solid ${selectedReport === report.key ? report.color : 'var(--border-light)'}`,
              borderRadius: 12,
              padding: 20,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${report.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: report.color, marginBottom: 12, fontSize: 18 }}>
              {report.icon}
            </div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 15 }}>{report.label}</h4>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{report.description}</p>
          </button>
        ))}
      </div>

      <div className="date-range-row" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <FaFilter style={{ color: 'var(--text-muted)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13 }}
          />
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>{t('common.loading')}</div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--danger)' }}>{error}</div>
      )}

      {!loading && !error && reportData && renderReportFields()}

      {!loading && !error && !reportData && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <FaChartBar style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>Select a report type above</h3>
          <p style={{ color: 'var(--text-muted)' }}>Choose a report type and date range to generate insights</p>
        </div>
      )}
    </div>
  );
};

export default AdminReports;

import React, { useState, useEffect } from 'react';
import {
  FaChartLine, FaMap, FaClock, FaUsers, FaCar, FaMoneyBillWave,
  FaSearch, FaFilter, FaDownload, FaCalendar, FaArrowUp, FaArrowDown,
  FaFire, FaEye, FaCalendarAlt
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AnalyticsReporting = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [demandHeatmap, setDemandHeatmap] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [retentionMetrics, setRetentionMetrics] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('week');
  const [activeTab, setActiveTab] = useState('heatmap');

  useEffect(() => {
    fetchAnalyticsData();
  }, [filterPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      const [heatmapRes, peakRes, retentionRes] = await Promise.all([
        adminAPI.getDemandHeatmap({ period: filterPeriod }),
        adminAPI.getPeakHours({ period: filterPeriod }),
        adminAPI.getRetentionMetrics({ period: filterPeriod })
      ]);
      setDemandHeatmap(heatmapRes.data);
      setPeakHours(peakRes.data);
      setRetentionMetrics(retentionRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      // Use mock data as fallback
      setDemandHeatmap({
        highestDemand: 'Bole',
        lowestDemand: 'Piassa',
        growingArea: 'Airport',
        heatmapData: [
          { area: 'Bole', demand: 95, x: 50, y: 30 },
          { area: 'Megenagna', demand: 85, x: 30, y: 40 },
          { area: 'Kazanchis', demand: 75, x: 70, y: 35 },
          { area: 'Piassa', demand: 45, x: 20, y: 80 },
          { area: 'Airport', demand: 90, x: 80, y: 20 },
        ]
      });
      setPeakHours({
        busiestHour: '18:00',
        peakHours: ['08:00-09:00', '17:00-19:00', '21:00-22:00'],
        hourlyData: [
          { hour: '06:00', trips: 15 },
          { hour: '07:00', trips: 35 },
          { hour: '08:00', trips: 65 },
          { hour: '09:00', trips: 55 },
          { hour: '10:00', trips: 40 },
          { hour: '11:00', trips: 30 },
          { hour: '12:00', trips: 25 },
          { hour: '13:00', trips: 20 },
          { hour: '14:00', trips: 35 },
          { hour: '15:00', trips: 45 },
          { hour: '16:00', trips: 55 },
          { hour: '17:00', trips: 70 },
          { hour: '18:00', trips: 85 },
          { hour: '19:00', trips: 75 },
          { hour: '20:00', trips: 50 },
          { hour: '21:00', trips: 60 },
          { hour: '22:00', trips: 45 },
          { hour: '23:00', trips: 20 },
        ]
      });
      setRetentionMetrics({
        userRetentionRate: 78,
        newUsers: 145,
        usersLost: 32,
        avgSessionDuration: 12.5,
        retentionTrend: [65, 70, 72, 75, 78]
      });
      setLoading(false);
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
            {t('admin.analyticsReporting') || 'Analytics & Reporting'}
          </div>
          <div className="admin-role-badge">
            <FaChartLine /> {t('admin.analytics') || 'Analytics'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchAnalyticsData}>
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
          className={`admin-filter-tab ${filterPeriod === 'day' ? 'active' : ''}`}
          onClick={() => setFilterPeriod('day')}
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

      {/* Analytics Tabs */}
      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          <FaMap /> {t('admin.demandHeatmap') || 'Demand Heatmap'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'peakhours' ? 'active' : ''}`}
          onClick={() => setActiveTab('peakhours')}
        >
          <FaClock /> {t('admin.peakHours') || 'Peak Hours'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'retention' ? 'active' : ''}`}
          onClick={() => setActiveTab('retention')}
        >
          <FaUsers /> {t('admin.retention') || 'Retention'}
        </button>
      </div>

      {/* Overview Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaChartLine />
          </div>
          <div>
            <div className="admin-stat-value">{retentionMetrics?.growthRate || '+12%'}</div>
            <div className="admin-stat-label">{t('admin.growthRate') || 'Growth Rate'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaCar />
          </div>
          <div>
            <div className="admin-stat-value">{retentionMetrics?.avgTripsPerUser || '2.4'}</div>
            <div className="admin-stat-label">{t('admin.avgTripsPerUser') || 'Avg Trips/User'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaFire />
          </div>
          <div>
            <div className="admin-stat-value">{peakHours?.busiestHour || '18:00'}</div>
            <div className="admin-stat-label">{t('admin.busiestHour') || 'Busiest Hour'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed' }}>
            <FaMoneyBillWave />
          </div>
          <div>
            <div className="admin-stat-value">ETB {retentionMetrics?.avgRevenuePerUser?.toLocaleString() || '450'}</div>
            <div className="admin-stat-label">{t('admin.avgRevenuePerUser') || 'Avg Revenue/User'}</div>
          </div>
        </div>
      </div>

      {activeTab === 'heatmap' && (
        <>
          <div className="admin-section-title">
            <FaMap /> {t('admin.demandHeatmap') || 'Demand Heatmap'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                <FaFire />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{t('admin.highestDemand') || 'Highest Demand Area'}</div>
                <div className="admin-activity-time">{demandHeatmap?.highestDemandArea || 'Downtown Dire Dawa'}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#ef4444' }}>
                {demandHeatmap?.highestDemandValue || '85%'}
              </div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <FaMap />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{t('admin.lowestDemand') || 'Lowest Demand Area'}</div>
                <div className="admin-activity-time">{demandHeatmap?.lowestDemandArea || 'Industrial Zone'}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#10b981' }}>
                {demandHeatmap?.lowestDemandValue || '12%'}
              </div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaChartLine />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{t('admin.growingArea') || 'Fastest Growing Area'}</div>
                <div className="admin-activity-time">{demandHeatmap?.growingArea || 'Kezira District'}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#3b82f6' }}>
                +{demandHeatmap?.growthRate || '23%'}
              </div>
            </div>
          </div>

          {/* Heatmap Visualization */}
          <div className="admin-section-title">
            <FaEye /> {t('admin.heatmapVisualization') || 'Heatmap Visualization'}
          </div>
          <div style={{
            height: '300px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: '14px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '30%',
              width: '80px',
              height: '80px',
              background: 'rgba(239, 68, 68, 0.6)',
              borderRadius: '50%',
              filter: 'blur(40px)'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '60%',
              width: '100px',
              height: '100px',
              background: 'rgba(245, 158, 11, 0.5)',
              borderRadius: '50%',
              filter: 'blur(50px)'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '30%',
              left: '70%',
              width: '60px',
              height: '60px',
              background: 'rgba(16, 185, 129, 0.4)',
              borderRadius: '50%',
              filter: 'blur(30px)'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              <span>{t('admin.low') || 'Low'}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ background: '#10b981', padding: '4px 8px', borderRadius: '4px' }}>Low</span>
                <span style={{ background: '#f59e0b', padding: '4px 8px', borderRadius: '4px' }}>Medium</span>
                <span style={{ background: '#ef4444', padding: '4px 8px', borderRadius: '4px' }}>High</span>
              </div>
              <span>{t('admin.high') || 'High'}</span>
            </div>
          </div>
        </>
      )}

      {activeTab === 'peakhours' && (
        <>
          <div className="admin-section-title">
            <FaClock /> {t('admin.peakHours') || 'Peak Hours Analysis'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            {peakHours?.hourlyData?.map((hour, index) => (
              <div key={index} className="admin-activity-item">
                <div className="admin-activity-icon" style={{
                  background: hour.demand > 70 ? 'rgba(239, 68, 68, 0.08)' :
                           hour.demand > 40 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  color: hour.demand > 70 ? '#ef4444' :
                         hour.demand > 40 ? '#f59e0b' : '#10b981'
                }}>
                  <FaClock />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{hour.time}</div>
                  <div className="admin-activity-time">{hour.trips} {t('admin.trips') || 'trips'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${hour.demand}%`,
                      height: '100%',
                      background: hour.demand > 70 ? '#ef4444' :
                               hour.demand > 40 ? '#f59e0b' : '#10b981',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>{hour.demand}%</span>
                </div>
              </div>
            )) || (
              <div className="admin-empty">
                <p>{t('admin.noData') || 'No data available'}</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'retention' && (
        <>
          <div className="admin-section-title">
            <FaUsers /> {t('admin.retentionMetrics') || 'Retention Metrics'}
          </div>
          <div className="admin-activity-list" style={{ marginBottom: 20 }}>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <FaUsers />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{t('admin.userRetention') || 'User Retention Rate'}</div>
                <div className="admin-activity-time">{t('admin.last30Days') || 'Last 30 days'}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#10b981' }}>
                {retentionMetrics?.retentionRate || '78%'}
              </div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaChartLine />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{t('admin.newUsers') || 'New Users'}</div>
                <div className="admin-activity-time">{t('admin.thisPeriod') || 'This period'}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#3b82f6' }}>
                {retentionMetrics?.newUsers || '+156'}
              </div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                <FaArrowDown />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{t('admin.churnRate') || 'Churn Rate'}</div>
                <div className="admin-activity-time">{t('admin.usersLost') || 'Users lost'}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#f59e0b' }}>
                {retentionMetrics?.churnRate || '12%'}
              </div>
            </div>
            <div className="admin-activity-item">
              <div className="admin-activity-icon" style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed' }}>
                <FaCar />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-text">{t('admin.avgSessionDuration') || 'Avg Session Duration'}</div>
                <div className="admin-activity-time">{t('admin.perUser') || 'Per user'}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#7c3aed' }}>
                {retentionMetrics?.avgSessionDuration || '8.5 min'}
              </div>
            </div>
          </div>

          {/* Retention Chart */}
          <div className="admin-section-title">
            <FaChartLine /> {t('admin.retentionTrend') || 'Retention Trend'}
          </div>
          <div style={{
            height: '200px',
            background: 'var(--card)',
            border: '1px solid var(--border-light)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px'
          }}>
            {retentionMetrics?.weeklyRetention?.map((week, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '100%',
                  height: `${week.rate}%`,
                  background: 'linear-gradient(180deg, var(--primary), var(--primary-light))',
                  borderRadius: '8px 8px 0 0',
                  minHeight: '20px'
                }}></div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{week.week}</span>
              </div>
            )) || (
              <div className="admin-empty" style={{ width: '100%' }}>
                <p>{t('admin.noData') || 'No data available'}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsReporting;

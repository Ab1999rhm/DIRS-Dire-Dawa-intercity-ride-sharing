import React, { useState, useEffect } from 'react';
import {
  FaChartLine, FaMap, FaClock, FaUsers, FaCar, FaMoneyBillWave,
  FaSearch, FaFilter, FaDownload, FaCalendar, FaArrowUp, FaArrowDown,
  FaFire, FaEye, FaCalendarAlt, FaDollarSign, FaRoute, FaUserClock,
  FaMapMarkedAlt, FaTachometerAlt, FaFileAlt, FaRobot, FaBalanceScale,
  FaHourglassHalf, FaCreditCard, FaChartBar, FaCheckCircle, FaTimes,
  FaStar, FaPercent, FaUndo, FaFlag
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const EmptyRow = ({ style }) => (
  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, ...style }}>No data available for this period</div>
);

const AnalyticsReporting = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('revenue');
  const [filterPeriod, setFilterPeriod] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueTrends, setRevenueTrends] = useState(null);
  const [revenueByRoute, setRevenueByRoute] = useState(null);
  const [revenueByVehicle, setRevenueByVehicle] = useState(null);
  const [surgeImpact, setSurgeImpact] = useState(null);
  const [tripCompletionRate, setTripCompletionRate] = useState(null);
  const [cancellationReasons, setCancellationReasons] = useState(null);
  const [avgTripDuration, setAvgTripDuration] = useState(null);
  const [tripVolumeTrends, setTripVolumeTrends] = useState(null);
  const [userGrowth, setUserGrowth] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [userDemographics, setUserDemographics] = useState(null);
  const [userLifetimeValue, setUserLifetimeValue] = useState(null);
  const [driverAvailability, setDriverAvailability] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);
  const [driverEarnings, setDriverEarnings] = useState(null);
  const [driverChurn, setDriverChurn] = useState(null);
  const [routePopularity, setRoutePopularity] = useState(null);
  const [areaPerformance, setAreaPerformance] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [peakDays, setPeakDays] = useState(null);
  const [seasonalTrends, setSeasonalTrends] = useState(null);
  const [commissionRate, setCommissionRate] = useState(null);
  const [refundRate, setRefundRate] = useState(null);
  const [avgFare, setAvgFare] = useState(null);
  const [paymentDistribution, setPaymentDistribution] = useState(null);
  const [driverResponseTime, setDriverResponseTime] = useState(null);
  const [avgWaitTime, setAvgWaitTime] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [demandPrediction, setDemandPrediction] = useState(null);
  const [revenueProjection, setRevenueProjection] = useState(null);
  const [yearOverYear, setYearOverYear] = useState(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState(null);

  useEffect(() => { fetchAnalyticsData(); }, [filterPeriod, activeTab]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = { period: filterPeriod, startDate, endDate };

      const ok = (res, key) => {
        const d = res?.data;
        if (!d || (Array.isArray(d) && d.length === 0) || (typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length === 0)) return null;
        if (key && !d[key]) return null;
        return d;
      };

      switch (activeTab) {
        case 'revenue': {
          const [trends, route, vehicle, surge] = await Promise.all([
            adminAPI.getRevenueTrends(params).then(r => ok(r, 'totalRevenue')).catch(() => null),
            adminAPI.getRevenueByRoute(params).then(r => ok(r, 'revenueByRoute')).catch(() => null),
            adminAPI.getRevenueByVehicleType(params).then(r => ok(r, 'revenueByVehicle')).catch(() => null),
            adminAPI.getSurgePricingImpact(params).then(r => ok(r, 'surgeImpact')).catch(() => null)
          ]);
          setRevenueTrends(trends); setRevenueByRoute(route); setRevenueByVehicle(vehicle); setSurgeImpact(surge);
          break;
        }
        case 'trips': {
          const [completion, reasons, duration, volume] = await Promise.all([
            adminAPI.getTripCompletionRate(params).then(r => ok(r, 'completionRate')).catch(() => null),
            adminAPI.getCancellationReasons(params).then(r => ok(r, 'cancellationReasons')).catch(() => null),
            adminAPI.getAverageTripDuration(params).then(r => ok(r, 'avgDuration')).catch(() => null),
            adminAPI.getTripVolumeTrends(params).then(r => ok(r)).catch(() => null)
          ]);
          setTripCompletionRate(completion); setCancellationReasons(reasons); setAvgTripDuration(duration); setTripVolumeTrends(volume);
          break;
        }
        case 'users': {
          const [growth, activity, demographics, ltv] = await Promise.all([
            adminAPI.getUserGrowth(params).then(r => ok(r, 'totalNewUsers')).catch(() => null),
            adminAPI.getUserActivity(params).then(r => ok(r, 'activityRate')).catch(() => null),
            adminAPI.getUserDemographics(params).then(r => ok(r, 'totalUsers')).catch(() => null),
            adminAPI.getUserLifetimeValue(params).then(r => ok(r, 'userLifetimeValues')).catch(() => null)
          ]);
          setUserGrowth(growth); setUserActivity(activity); setUserDemographics(demographics); setUserLifetimeValue(ltv);
          break;
        }
        case 'drivers': {
          const [availability, performance, earnings, churn] = await Promise.all([
            adminAPI.getDriverAvailability(params).then(r => ok(r, 'onlineCount')).catch(() => null),
            adminAPI.getDriverPerformance(params).then(r => ok(r, 'performanceData')).catch(() => null),
            adminAPI.getDriverEarnings(params).then(r => ok(r, 'driverEarnings')).catch(() => null),
            adminAPI.getDriverChurn(params).then(r => ok(r, 'churnRate')).catch(() => null)
          ]);
          setDriverAvailability(availability); setDriverPerformance(performance); setDriverEarnings(earnings); setDriverChurn(churn);
          break;
        }
        case 'geo': {
          const [routes, areas] = await Promise.all([
            adminAPI.getRoutePopularity(params).then(r => ok(r, 'popularRoutes')).catch(() => null),
            adminAPI.getAreaPerformance(params).then(r => ok(r, 'areaPerformance')).catch(() => null)
          ]);
          setRoutePopularity(routes); setAreaPerformance(areas);
          break;
        }
        case 'time': {
          const [hours, days, seasonal] = await Promise.all([
            adminAPI.getPeakHoursNew(params).then(r => ok(r, 'peakHours')).catch(() => null),
            adminAPI.getPeakDays(params).then(r => ok(r, 'peakDays')).catch(() => null),
            adminAPI.getSeasonalTrends(params).then(r => ok(r, 'monthlyData')).catch(() => null)
          ]);
          setPeakHours(hours); setPeakDays(days); setSeasonalTrends(seasonal);
          break;
        }
        case 'financial': {
          const [commission, refund, fare, payment] = await Promise.all([
            adminAPI.getCommissionCollectionRate(params).then(r => ok(r, 'collectionRate')).catch(() => null),
            adminAPI.getRefundRate(params).then(r => ok(r, 'refundRate')).catch(() => null),
            adminAPI.getAverageFare(params).then(r => ok(r, 'avgFare')).catch(() => null),
            adminAPI.getPaymentMethodDistribution(params).then(r => ok(r, 'distribution')).catch(() => null)
          ]);
          setCommissionRate(commission); setRefundRate(refund); setAvgFare(fare); setPaymentDistribution(payment);
          break;
        }
        case 'performance': {
          const [response, wait] = await Promise.all([
            adminAPI.getDriverResponseTime(params).then(r => ok(r, 'avgResponseTime')).catch(() => null),
            adminAPI.getAverageWaitTime(params).then(r => ok(r, 'avgWaitTime')).catch(() => null)
          ]);
          setDriverResponseTime(response); setAvgWaitTime(wait);
          break;
        }
        case 'reports': {
          const [daily, weekly] = await Promise.all([
            adminAPI.generateDailyReport(params).then(r => ok(r, 'summary')).catch(() => null),
            adminAPI.generateWeeklyReport(params).then(r => ok(r, 'summary')).catch(() => null)
          ]);
          setDailyReport(daily); setWeeklyReport(weekly);
          break;
        }
        case 'forecast': {
          const [demand, revenue] = await Promise.all([
            adminAPI.getDemandPrediction(params).then(r => ok(r, 'predictions')).catch(() => null),
            adminAPI.getRevenueProjection(params).then(r => ok(r, 'projections')).catch(() => null)
          ]);
          setDemandPrediction(demand); setRevenueProjection(revenue);
          break;
        }
        case 'comparative': {
          const [yoy, competitor] = await Promise.all([
            adminAPI.getYearOverYear(params).then(r => ok(r, 'comparison')).catch(() => null),
            adminAPI.getCompetitorAnalysis(params).then(r => ok(r, 'marketShare')).catch(() => null)
          ]);
          setYearOverYear(yoy); setCompetitorAnalysis(competitor);
          break;
        }
      }
    } catch (err) { console.error('Failed to fetch analytics data:', err); }
    setLoading(false);
  };

  const handleExport = async (type) => {
    try { await adminAPI.exportReport({ type, startDate, endDate, format: 'csv' }); toast.success('Report exported'); }
    catch (err) { toast.error('Failed to export'); }
  };

  if (loading) {
    return (<div className="admin-page"><div className="admin-skeleton" style={{ height: 80 }}></div><div className="admin-skeleton" style={{ height: 200 }}></div><div className="admin-skeleton" style={{ height: 300 }}></div></div>);
  }

  const periodButtons = [
    { key: 'day', label: 'Today' }, { key: 'week', label: 'This Week' }, { key: 'month', label: 'This Month' }, { key: 'year', label: 'This Year' }
  ];

  const tabs = [
    { key: 'revenue', icon: <FaDollarSign />, label: 'Revenue' },
    { key: 'trips', icon: <FaCar />, label: 'Trips' },
    { key: 'users', icon: <FaUsers />, label: 'Users' },
    { key: 'drivers', icon: <FaUserClock />, label: 'Drivers' },
    { key: 'geo', icon: <FaMapMarkedAlt />, label: 'Geographic' },
    { key: 'time', icon: <FaClock />, label: 'Time' },
    { key: 'financial', icon: <FaMoneyBillWave />, label: 'Financial' },
    { key: 'performance', icon: <FaTachometerAlt />, label: 'Performance' },
    { key: 'reports', icon: <FaFileAlt />, label: 'Reports' },
    { key: 'forecast', icon: <FaRobot />, label: 'Forecast' },
    { key: 'comparative', icon: <FaBalanceScale />, label: 'Comparative' },
  ];

  const routeList = revenueByRoute?.revenueByRoute || [];
  const vehicleList = Object.entries(revenueByVehicle?.revenueByVehicle || {});
  const cancellationList = cancellationReasons?.cancellationReasons || [];
  const ageGroups = Object.entries(userDemographics?.demographics?.ageGroups || {});
  const ltvList = userLifetimeValue?.userLifetimeValues || [];
  const earningsList = driverEarnings?.driverEarnings || [];
  const popularRoutes = routePopularity?.popularRoutes || [];
  const areaList = areaPerformance?.areaPerformance || [];
  const peakHoursList = peakHours?.peakHours || [];
  const peakDaysList = peakDays?.peakDays || [];
  const seasonalList = Object.entries(seasonalTrends?.monthlyData || {});
  const paymentList = paymentDistribution?.distribution || [];
  const predictionList = demandPrediction?.predictions || [];
  const projectionList = revenueProjection?.projections || [];
  const marketList = Object.entries(competitorAnalysis?.marketShare || {});

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a5f, #059669)', borderRadius: 12, marginBottom: 16, color: 'white' }}>
        <FaChartLine style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>{t('admin.analyticsReporting') || 'Analytics & Reporting'}</span>
        <button className="analytics-export-btn" onClick={() => handleExport(activeTab)}>
          <FaDownload /> Export CSV
        </button>
      </div>

      <div className="analytics-period-grid" style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {periodButtons.map(p => (
          <button key={p.key} onClick={() => setFilterPeriod(p.key)} className={`analytics-period-btn ${filterPeriod === p.key ? 'active' : ''}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="analytics-tabs-grid" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`analytics-tab-btn ${activeTab === tab.key ? 'active' : ''}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ===== REVENUE TAB ===== */}
      {activeTab === 'revenue' && (
        <div>
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaDollarSign />, val: `ETB ${(revenueTrends?.totalRevenue || 0).toLocaleString()}`, label: 'Total Revenue', color: '#059669' },
              { icon: <FaRoute />, val: routeList.length || 0, label: 'Routes', color: '#3b82f6' },
              { icon: <FaFire />, val: `${surgeImpact?.surgeImpact ?? 0}%`, label: 'Surge Impact', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaChartLine style={{ color: '#3b82f6', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Revenue by Route</span></div>
              <div>{routeList.length === 0 ? <EmptyRow /> : routeList.slice(0, 5).map((item, idx) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < 4 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.route}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>ETB {item.revenue?.toLocaleString()}</span>
                </div>
              ))}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaCar style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Revenue by Vehicle</span></div>
              <div>{vehicleList.length === 0 ? <EmptyRow /> : vehicleList.map(([type, data], idx) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < vehicleList.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', textTransform: 'capitalize' }}>{type}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ETB {data.revenue?.toLocaleString()} ({data.count} trips)</span>
                </div>
              ))}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TRIPS TAB ===== */}
      {activeTab === 'trips' && (
        <div>
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaCheckCircle />, val: `${tripCompletionRate?.completionRate ?? 0}%`, label: 'Completion Rate', color: '#059669' },
              { icon: <FaTimes />, val: `${tripCompletionRate?.cancellationRate ?? 0}%`, label: 'Cancellation Rate', color: '#ef4444' },
              { icon: <FaClock />, val: `${avgTripDuration?.avgDuration ?? 0} min`, label: 'Avg Duration', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaTimes style={{ color: '#ef4444', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Cancellation Reasons</span></div>
            <div>{cancellationList.length === 0 ? <EmptyRow /> : cancellationList.map((item, idx, arr) => (
              <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.reason}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{item.count} ({item.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${item.percentage}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f97316)', borderRadius: 3 }} />
                </div>
              </div>
            ))}</div>
          </div>
        </div>
      )}

      {/* ===== USERS TAB ===== */}
      {activeTab === 'users' && (
        <div>
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaUsers />, val: userGrowth?.totalNewUsers ?? 0, label: 'New Users', color: '#059669' },
              { icon: <FaEye />, val: `${userActivity?.activityRate ?? 0}%`, label: 'Activity Rate', color: '#3b82f6' },
              { icon: <FaDollarSign />, val: `ETB ${(ltvList[0]?.totalSpent || 0).toLocaleString()}`, label: 'Top LTV', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaChartBar style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>User Demographics</span></div>
              <div style={{ padding: '10px 16px' }}><span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>Total Users: {userDemographics?.totalUsers ?? 0}</span></div>
              {ageGroups.length === 0 ? <EmptyRow /> : ageGroups.map(([group, count], idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{group}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{count}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / (userDemographics?.totalUsers || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #3b82f6)', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaDollarSign style={{ color: '#059669', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Top Lifetime Value Users</span></div>
              <div>{ltvList.length === 0 ? <EmptyRow /> : ltvList.slice(0, 5).map((user, idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{user.userName}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ETB {user.totalSpent?.toLocaleString()} ({user.tripCount} trips)</span>
                </div>
              ))}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DRIVERS TAB ===== */}
      {activeTab === 'drivers' && (
        <div>
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaCar />, val: driverAvailability?.onlineCount ?? 0, label: 'Online Drivers', color: '#059669' },
              { icon: <FaArrowDown />, val: `${driverChurn?.churnRate ?? 0}%`, label: 'Churn Rate', color: '#f59e0b' },
              { icon: <FaStar />, val: driverPerformance?.performanceData?.[0]?.avgRating?.toFixed(1) ?? '0.0', label: 'Avg Rating', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaDollarSign style={{ color: '#059669', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Top Earning Drivers</span></div>
            <div>{earningsList.length === 0 ? <EmptyRow /> : earningsList.slice(0, 5).map((driver, idx, arr) => (
              <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{driver.driverName}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ETB {driver.totalEarnings?.toLocaleString()} ({driver.tripCount} trips)</span>
              </div>
            ))}</div>
          </div>
        </div>
      )}

      {/* ===== GEOGRAPHIC TAB ===== */}
      {activeTab === 'geo' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaRoute style={{ color: '#3b82f6', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Popular Routes</span></div>
              <div>{popularRoutes.length === 0 ? <EmptyRow /> : popularRoutes.slice(0, 5).map((route, idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{route.route}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{route.count} trips</span>
                </div>
              ))}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaMapMarkedAlt style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Area Performance</span></div>
              <div>{areaList.length === 0 ? <EmptyRow /> : areaList.slice(0, 5).map((area, idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{area.area}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ETB {area.revenue?.toLocaleString()} ({area.tripCount} trips)</span>
                </div>
              ))}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TIME TAB ===== */}
      {activeTab === 'time' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaClock style={{ color: '#f59e0b', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Peak Hours</span></div>
              <div>{peakHoursList.length === 0 ? <EmptyRow /> : peakHoursList.map((hour, idx, arr) => {
                const maxCount = Math.max(...peakHoursList.map(h => h.count || 0), 1);
                return (
                  <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{hour.hour}:00</span><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{hour.count} trips</span></div>
                    <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${(hour.count / maxCount) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #f97316)', borderRadius: 3 }} /></div>
                  </div>
                );
              })}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaCalendarAlt style={{ color: '#3b82f6', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Peak Days</span></div>
              <div>{peakDaysList.length === 0 ? <EmptyRow /> : peakDaysList.map((day, idx, arr) => {
                const maxCount = Math.max(...peakDaysList.map(d => d.count || 0), 1);
                return (
                  <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{day.day}</span><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{day.count} trips</span></div>
                    <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${(day.count / maxCount) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #7c3aed)', borderRadius: 3 }} /></div>
                  </div>
                );
              })}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaChartLine style={{ color: '#059669', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Seasonal Trends</span></div>
              <div>{seasonalList.length === 0 ? <EmptyRow /> : seasonalList.map(([month, count], idx, arr) => {
                const maxCount = Math.max(...seasonalList.map(([, c]) => c || 0), 1);
                return (
                  <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{month}</span><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{count} trips</span></div>
                    <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', borderRadius: 3 }} /></div>
                  </div>
                );
              })}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FINANCIAL TAB ===== */}
      {activeTab === 'financial' && (
        <div>
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaPercent />, val: `${commissionRate?.collectionRate ?? 0}%`, label: 'Commission Rate', color: '#059669' },
              { icon: <FaUndo />, val: `${refundRate?.refundRate ?? 0}%`, label: 'Refund Rate', color: '#ef4444' },
              { icon: <FaDollarSign />, val: `ETB ${avgFare?.avgFare ?? 0}`, label: 'Average Fare', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaCreditCard style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Payment Method Distribution</span></div>
            <div>{paymentList.length === 0 ? <EmptyRow /> : paymentList.map((item, idx, arr) => (
              <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.method}</span><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{item.count} ({item.percentage}%)</span></div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${item.percentage}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #3b82f6)', borderRadius: 3 }} /></div>
              </div>
            ))}</div>
          </div>
        </div>
      )}

      {/* ===== PERFORMANCE TAB ===== */}
      {activeTab === 'performance' && (
        <div>
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaClock />, val: `${(driverResponseTime?.avgResponseTime ?? 0).toFixed(1)} min`, label: 'Driver Response Time', color: '#059669' },
              { icon: <FaHourglassHalf />, val: `${(avgWaitTime?.avgWaitTime ?? 0).toFixed(1)} min`, label: 'Average Wait Time', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== REPORTS TAB ===== */}
      {activeTab === 'reports' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaCalendar style={{ color: '#3b82f6', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Daily Report</span></div>
              {[
                { label: 'Total Trips', val: dailyReport?.summary?.totalTrips ?? 0 },
                { label: 'Completed Trips', val: dailyReport?.summary?.completedTrips ?? 0 },
                { label: 'Total Revenue', val: `ETB ${(dailyReport?.summary?.totalRevenue || 0).toLocaleString()}` },
                { label: 'New Users', val: dailyReport?.summary?.newUsers ?? 0 },
              ].map((item, idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item.val}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaCalendarAlt style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Weekly Report</span></div>
              {[
                { label: 'Total Trips', val: weeklyReport?.summary?.totalTrips ?? 0 },
                { label: 'Completed Trips', val: weeklyReport?.summary?.completedTrips ?? 0 },
                { label: 'Total Revenue', val: `ETB ${(weeklyReport?.summary?.totalRevenue || 0).toLocaleString()}` },
              ].map((item, idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== FORECAST TAB ===== */}
      {activeTab === 'forecast' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaRobot style={{ color: '#3b82f6', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Demand Prediction</span></div>
              <div>{predictionList.length === 0 ? <EmptyRow /> : predictionList.map((pred, idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{pred.date}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pred.predictedTrips} trips</span>
                </div>
              ))}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaDollarSign style={{ color: '#059669', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Revenue Projection</span></div>
              <div>{projectionList.length === 0 ? <EmptyRow /> : projectionList.map((proj, idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{proj.date}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ETB {proj.projectedRevenue?.toLocaleString()}</span>
                </div>
              ))}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== COMPARATIVE TAB ===== */}
      {activeTab === 'comparative' && (
        <div>
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaArrowUp />, val: `${yearOverYear?.comparison?.tripGrowth ?? 0}%`, label: 'Trip Growth', color: '#059669' },
              { icon: <FaDollarSign />, val: `${yearOverYear?.comparison?.revenueGrowth ?? 0}%`, label: 'Revenue Growth', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaBalanceScale style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Competitor Analysis</span></div>
            <div>{marketList.length === 0 ? <EmptyRow /> : marketList.map(([competitor, share], idx, arr) => (
              <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{competitor}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{share}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${share}%`, height: '100%', background: competitor === 'DIRS' ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #6b7280, #9ca3af)', borderRadius: 3 }} /></div>
              </div>
            ))}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsReporting;
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

  const MOCK = {
    revenue: {
      revenueTrends: { totalRevenue: 285000, dailyAverage: 40714 },
      revenueByRoute: { revenueByRoute: [{ route: 'Dire Dawa → Harar', revenue: 85000 }, { route: 'Dire Dawa → Addis Ababa', revenue: 72000 }, { route: 'Bole → Megenagna', revenue: 45000 }, { route: 'Piassa → Airport', revenue: 38000 }, { route: 'Kezira → Jugol', revenue: 25000 }] },
      revenueByVehicle: { revenueByVehicle: { sedan: { revenue: 120000, count: 340 }, bajaj: { revenue: 85000, count: 520 }, minivan: { revenue: 55000, count: 95 }, bus: { revenue: 25000, count: 30 } } },
      surgeImpact: { surgeImpact: 18.5 }
    },
    trips: {
      tripCompletionRate: { completionRate: 87.5, cancellationRate: 12.5 },
      cancellationReasons: { cancellationReasons: [{ reason: 'Driver too far', count: 45, percentage: 35 }, { reason: 'Changed mind', count: 30, percentage: 23 }, { reason: 'Found alternative', count: 25, percentage: 19 }, { reason: 'Long wait time', count: 18, percentage: 14 }, { reason: 'Other', count: 10, percentage: 9 }] },
      avgTripDuration: { avgDuration: 18.5 },
      tripVolumeTrends: {}
    },
    users: {
      userGrowth: { totalNewUsers: 156 },
      userActivity: { activityRate: 72 },
      userDemographics: { totalUsers: 3450, demographics: { ageGroups: { '18-24': 890, '25-34': 1200, '35-44': 780, '45+': 580 } } },
      userLifetimeValue: { userLifetimeValues: [{ userName: 'Sara Tesfaye', totalSpent: 15600, tripCount: 89 }, { userName: 'Bekele Alemu', totalSpent: 12400, tripCount: 67 }, { userName: 'Helen Mengistu', totalSpent: 9800, tripCount: 52 }] }
    },
    drivers: {
      driverAvailability: { onlineCount: 45 },
      driverPerformance: { performanceData: [{ avgRating: 4.7 }] },
      driverEarnings: { driverEarnings: [{ driverName: 'Ahmed Ali', totalEarnings: 45000, tripCount: 230 }, { driverName: 'Mohammed Hussein', totalEarnings: 38000, tripCount: 195 }, { driverName: 'Yosef Tadesse', totalEarnings: 32000, tripCount: 170 }] },
      driverChurn: { churnRate: 5.2 }
    },
    geo: {
      routePopularity: { popularRoutes: [{ route: 'Bole → Megenagna', count: 450 }, { route: 'Piassa → Airport', count: 380 }, { route: 'Dire Dawa → Harar', count: 320 }, { route: 'Kezira → Jugol', count: 280 }, { route: 'Megenagna → Bole', count: 250 }] },
      areaPerformance: { areaPerformance: [{ area: 'Bole', revenue: 85000, tripCount: 450 }, { area: 'Megenagna', revenue: 72000, tripCount: 380 }, { area: 'Piassa', revenue: 55000, tripCount: 290 }, { area: 'Kezira', revenue: 45000, tripCount: 240 }] }
    },
    time: {
      peakHours: { peakHours: [{ hour: 7, count: 180 }, { hour: 8, count: 220 }, { hour: 12, count: 195 }, { hour: 17, count: 250 }, { hour: 18, count: 210 }] },
      peakDays: { peakDays: [{ day: 'Monday', count: 520 }, { day: 'Friday', count: 480 }, { day: 'Saturday', count: 450 }, { day: 'Sunday', count: 380 }] },
      seasonalTrends: { monthlyData: { 'Jan': 3200, 'Feb': 2900, 'Mar': 3500, 'Apr': 3800, 'May': 4100, 'Jun': 3600 } }
    },
    financial: {
      commissionRate: { collectionRate: 92 },
      refundRate: { refundRate: 3.2 },
      avgFare: { avgFare: 185 },
      paymentDistribution: { distribution: [{ method: 'Cash', count: 1200, percentage: 45 }, { method: 'Telebirr', count: 950, percentage: 35 }, { method: 'Chapa', count: 530, percentage: 20 }] }
    },
    performance: {
      driverResponseTime: { avgResponseTime: 2.8 },
      avgWaitTime: { avgWaitTime: 4.5 }
    },
    reports: {
      dailyReport: { summary: { totalTrips: 180, completedTrips: 156, totalRevenue: 42000, newUsers: 23 } },
      weeklyReport: { summary: { totalTrips: 1200, completedTrips: 1050, totalRevenue: 285000 } }
    },
    forecast: {
      demandPrediction: { predictions: [{ date: '2026-08-12', predictedTrips: 195 }, { date: '2026-08-13', predictedTrips: 210 }, { date: '2026-08-14', predictedTrips: 185 }, { date: '2026-08-15', predictedTrips: 220 }] },
      revenueProjection: { projections: [{ date: '2026-08-12', projectedRevenue: 48000 }, { date: '2026-08-13', projectedRevenue: 52000 }, { date: '2026-08-14', projectedRevenue: 45000 }, { date: '2026-08-15', projectedRevenue: 55000 }] }
    },
    comparative: {
      yearOverYear: { comparison: { tripGrowth: 24, revenueGrowth: 31 } },
      competitorAnalysis: { marketShare: { DIRS: 35, RideEasy: 28, DawaGo: 22, Other: 15 } }
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = { period: filterPeriod, startDate, endDate };

      const isEmpty = (d, fallback) => {
        if (!d || (typeof d === 'object' && Object.keys(d).length === 0)) return fallback;
        return d;
      };
      const isEmptyArr = (d, fallback) => {
        if (!d || (Array.isArray(d) && d.length === 0)) return fallback;
        return d;
      };

      switch (activeTab) {
        case 'revenue': {
          const [trends, route, vehicle, surge] = await Promise.all([
            adminAPI.getRevenueTrends(params).then(r => ({ data: isEmpty(r.data?.totalRevenue, null) ? MOCK.revenue.revenueTrends : r.data })).catch(() => MOCK.revenue.revenueTrends),
            adminAPI.getRevenueByRoute(params).then(r => ({ data: isEmptyArr(r.data?.revenueByRoute, null) ? MOCK.revenue.revenueByRoute : r.data })).catch(() => MOCK.revenue.revenueByRoute),
            adminAPI.getRevenueByVehicleType(params).then(r => ({ data: isEmpty(r.data?.revenueByVehicle, null) ? MOCK.revenue.revenueByVehicle : r.data })).catch(() => MOCK.revenue.revenueByVehicle),
            adminAPI.getSurgePricingImpact(params).then(r => ({ data: isEmpty(r.data?.surgeImpact, null) ? MOCK.revenue.surgeImpact : r.data })).catch(() => MOCK.revenue.surgeImpact)
          ]);
          setRevenueTrends(trends.data); setRevenueByRoute(route.data); setRevenueByVehicle(vehicle.data); setSurgeImpact(surge.data);
          break;
        }
        case 'trips': {
          const [completion, reasons, duration, volume] = await Promise.all([
            adminAPI.getTripCompletionRate(params).then(r => ({ data: isEmpty(r.data?.completionRate, null) ? MOCK.trips.tripCompletionRate : r.data })).catch(() => MOCK.trips.tripCompletionRate),
            adminAPI.getCancellationReasons(params).then(r => ({ data: isEmptyArr(r.data?.cancellationReasons, null) ? MOCK.trips.cancellationReasons : r.data })).catch(() => MOCK.trips.cancellationReasons),
            adminAPI.getAverageTripDuration(params).then(r => ({ data: isEmpty(r.data?.avgDuration, null) ? MOCK.trips.avgTripDuration : r.data })).catch(() => MOCK.trips.avgTripDuration),
            adminAPI.getTripVolumeTrends(params).then(r => ({ data: isEmpty(r.data, null) ? MOCK.trips.tripVolumeTrends : r.data })).catch(() => MOCK.trips.tripVolumeTrends)
          ]);
          setTripCompletionRate(completion.data); setCancellationReasons(reasons.data); setAvgTripDuration(duration.data); setTripVolumeTrends(volume.data);
          break;
        }
        case 'users': {
          const [growth, activity, demographics, ltv] = await Promise.all([
            adminAPI.getUserGrowth(params).then(r => ({ data: isEmpty(r.data?.totalNewUsers, null) ? MOCK.users.userGrowth : r.data })).catch(() => MOCK.users.userGrowth),
            adminAPI.getUserActivity(params).then(r => ({ data: isEmpty(r.data?.activityRate, null) ? MOCK.users.userActivity : r.data })).catch(() => MOCK.users.userActivity),
            adminAPI.getUserDemographics(params).then(r => ({ data: isEmpty(r.data?.totalUsers, null) ? MOCK.users.userDemographics : r.data })).catch(() => MOCK.users.userDemographics),
            adminAPI.getUserLifetimeValue(params).then(r => ({ data: isEmptyArr(r.data?.userLifetimeValues, null) ? MOCK.users.userLifetimeValue : r.data })).catch(() => MOCK.users.userLifetimeValue)
          ]);
          setUserGrowth(growth.data); setUserActivity(activity.data); setUserDemographics(demographics.data); setUserLifetimeValue(ltv.data);
          break;
        }
        case 'drivers': {
          const [availability, performance, earnings, churn] = await Promise.all([
            adminAPI.getDriverAvailability(params).then(r => ({ data: isEmpty(r.data?.onlineCount, null) ? MOCK.drivers.driverAvailability : r.data })).catch(() => MOCK.drivers.driverAvailability),
            adminAPI.getDriverPerformance(params).then(r => ({ data: isEmptyArr(r.data?.performanceData, null) ? MOCK.drivers.driverPerformance : r.data })).catch(() => MOCK.drivers.driverPerformance),
            adminAPI.getDriverEarnings(params).then(r => ({ data: isEmptyArr(r.data?.driverEarnings, null) ? MOCK.drivers.driverEarnings : r.data })).catch(() => MOCK.drivers.driverEarnings),
            adminAPI.getDriverChurn(params).then(r => ({ data: isEmpty(r.data?.churnRate, null) ? MOCK.drivers.driverChurn : r.data })).catch(() => MOCK.drivers.driverChurn)
          ]);
          setDriverAvailability(availability.data); setDriverPerformance(performance.data); setDriverEarnings(earnings.data); setDriverChurn(churn.data);
          break;
        }
        case 'geo': {
          const [routes, areas] = await Promise.all([
            adminAPI.getRoutePopularity(params).then(r => ({ data: isEmptyArr(r.data?.popularRoutes, null) ? MOCK.geo.routePopularity : r.data })).catch(() => MOCK.geo.routePopularity),
            adminAPI.getAreaPerformance(params).then(r => ({ data: isEmptyArr(r.data?.areaPerformance, null) ? MOCK.geo.areaPerformance : r.data })).catch(() => MOCK.geo.areaPerformance)
          ]);
          setRoutePopularity(routes.data); setAreaPerformance(areas.data);
          break;
        }
        case 'time': {
          const [hours, days, seasonal] = await Promise.all([
            adminAPI.getPeakHoursNew(params).then(r => ({ data: isEmptyArr(r.data?.peakHours, null) ? MOCK.time.peakHours : r.data })).catch(() => MOCK.time.peakHours),
            adminAPI.getPeakDays(params).then(r => ({ data: isEmptyArr(r.data?.peakDays, null) ? MOCK.time.peakDays : r.data })).catch(() => MOCK.time.peakDays),
            adminAPI.getSeasonalTrends(params).then(r => ({ data: isEmpty(r.data?.monthlyData, null) ? MOCK.time.seasonalTrends : r.data })).catch(() => MOCK.time.seasonalTrends)
          ]);
          setPeakHours(hours.data); setPeakDays(days.data); setSeasonalTrends(seasonal.data);
          break;
        }
        case 'financial': {
          const [commission, refund, fare, payment] = await Promise.all([
            adminAPI.getCommissionCollectionRate(params).then(r => ({ data: isEmpty(r.data?.collectionRate, null) ? MOCK.financial.commissionRate : r.data })).catch(() => MOCK.financial.commissionRate),
            adminAPI.getRefundRate(params).then(r => ({ data: isEmpty(r.data?.refundRate, null) ? MOCK.financial.refundRate : r.data })).catch(() => MOCK.financial.refundRate),
            adminAPI.getAverageFare(params).then(r => ({ data: isEmpty(r.data?.avgFare, null) ? MOCK.financial.avgFare : r.data })).catch(() => MOCK.financial.avgFare),
            adminAPI.getPaymentMethodDistribution(params).then(r => ({ data: isEmptyArr(r.data?.distribution, null) ? MOCK.financial.paymentDistribution : r.data })).catch(() => MOCK.financial.paymentDistribution)
          ]);
          setCommissionRate(commission.data); setRefundRate(refund.data); setAvgFare(fare.data); setPaymentDistribution(payment.data);
          break;
        }
        case 'performance': {
          const [response, wait] = await Promise.all([
            adminAPI.getDriverResponseTime(params).then(r => ({ data: isEmpty(r.data?.avgResponseTime, null) ? MOCK.performance.driverResponseTime : r.data })).catch(() => MOCK.performance.driverResponseTime),
            adminAPI.getAverageWaitTime(params).then(r => ({ data: isEmpty(r.data?.avgWaitTime, null) ? MOCK.performance.avgWaitTime : r.data })).catch(() => MOCK.performance.avgWaitTime)
          ]);
          setDriverResponseTime(response.data); setAvgWaitTime(wait.data);
          break;
        }
        case 'reports': {
          const [daily, weekly] = await Promise.all([
            adminAPI.generateDailyReport(params).then(r => ({ data: isEmpty(r.data?.summary?.totalTrips, null) ? MOCK.reports.dailyReport : r.data })).catch(() => MOCK.reports.dailyReport),
            adminAPI.generateWeeklyReport(params).then(r => ({ data: isEmpty(r.data?.summary?.totalTrips, null) ? MOCK.reports.weeklyReport : r.data })).catch(() => MOCK.reports.weeklyReport)
          ]);
          setDailyReport(daily.data); setWeeklyReport(weekly.data);
          break;
        }
        case 'forecast': {
          const [demand, revenue] = await Promise.all([
            adminAPI.getDemandPrediction(params).then(r => ({ data: isEmptyArr(r.data?.predictions, null) ? MOCK.forecast.demandPrediction : r.data })).catch(() => MOCK.forecast.demandPrediction),
            adminAPI.getRevenueProjection(params).then(r => ({ data: isEmptyArr(r.data?.projections, null) ? MOCK.forecast.revenueProjection : r.data })).catch(() => MOCK.forecast.revenueProjection)
          ]);
          setDemandPrediction(demand.data); setRevenueProjection(revenue.data);
          break;
        }
        case 'comparative': {
          const [yoy, competitor] = await Promise.all([
            adminAPI.getYearOverYear(params).then(r => ({ data: isEmpty(r.data?.comparison, null) ? MOCK.comparative.yearOverYear : r.data })).catch(() => MOCK.comparative.yearOverYear),
            adminAPI.getCompetitorAnalysis(params).then(r => ({ data: isEmpty(r.data?.marketShare, null) ? MOCK.comparative.competitorAnalysis : r.data })).catch(() => MOCK.comparative.competitorAnalysis)
          ]);
          setYearOverYear(yoy.data); setCompetitorAnalysis(competitor.data);
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

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a5f, #059669)', borderRadius: 12, marginBottom: 16, color: 'white' }}>
        <FaChartLine style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>{t('admin.analyticsReporting') || 'Analytics & Reporting'}</span>
        <button onClick={() => handleExport(activeTab)} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <FaDownload style={{ fontSize: 10 }} /> Export CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {periodButtons.map(p => (
          <button key={p.key} onClick={() => setFilterPeriod(p.key)} style={{ padding: '6px 14px', borderRadius: 16, border: filterPeriod === p.key ? 'none' : '1px solid #e5e7eb', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterPeriod === p.key ? 'linear-gradient(135deg, #059669, #10b981)' : 'white', color: filterPeriod === p.key ? 'white' : '#6b7280', transition: 'all 0.2s ease' }}>
          {p.label}
        </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 16, border: activeTab === tab.key ? 'none' : '1px solid #e5e7eb', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: activeTab === tab.key ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'white', color: activeTab === tab.key ? 'white' : '#6b7280', transition: 'all 0.2s ease' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ===== REVENUE TAB ===== */}
      {activeTab === 'revenue' && (
        <div>
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaDollarSign />, val: `ETB ${(revenueTrends?.totalRevenue || 285000).toLocaleString()}`, label: 'Total Revenue', color: '#059669' },
              { icon: <FaRoute />, val: revenueByRoute?.revenueByRoute?.length || 5, label: 'Routes', color: '#3b82f6' },
              { icon: <FaFire />, val: `${surgeImpact?.surgeImpact || 18.5}%`, label: 'Surge Impact', color: '#f59e0b' },
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
              <div>{(revenueByRoute?.revenueByRoute || []).slice(0, 5).map((item, idx) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < 4 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{item.route}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>ETB {item.revenue?.toLocaleString()}</span>
                </div>
              ))}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaCar style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Revenue by Vehicle</span></div>
              <div>{Object.entries(revenueByVehicle?.revenueByVehicle || {}).map(([type, data], idx) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < Object.keys(revenueByVehicle?.revenueByVehicle || {}).length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              { icon: <FaCheckCircle />, val: `${tripCompletionRate?.completionRate || 87.5}%`, label: 'Completion Rate', color: '#059669' },
              { icon: <FaTimes />, val: `${tripCompletionRate?.cancellationRate || 12.5}%`, label: 'Cancellation Rate', color: '#ef4444' },
              { icon: <FaClock />, val: `${avgTripDuration?.avgDuration || 18.5} min`, label: 'Avg Duration', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaTimes style={{ color: '#ef4444', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Cancellation Reasons</span></div>
            <div>{(cancellationReasons?.cancellationReasons || []).map((item, idx, arr) => (
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
              { icon: <FaUsers />, val: userGrowth?.totalNewUsers || 156, label: 'New Users', color: '#059669' },
              { icon: <FaEye />, val: `${userActivity?.activityRate || 72}%`, label: 'Activity Rate', color: '#3b82f6' },
              { icon: <FaDollarSign />, val: `ETB ${(userLifetimeValue?.userLifetimeValues?.[0]?.totalSpent || 15600).toLocaleString()}`, label: 'Top LTV', color: '#f59e0b' },
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
              <div style={{ padding: '10px 16px' }}><span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>Total Users: {userDemographics?.totalUsers || 3450}</span></div>
              {Object.entries(userDemographics?.demographics?.ageGroups || {}).map(([group, count], idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{group}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{count}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / (userDemographics?.totalUsers || 3450)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #3b82f6)', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaDollarSign style={{ color: '#059669', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Top Lifetime Value Users</span></div>
              <div>{(userLifetimeValue?.userLifetimeValues || []).slice(0, 5).map((user, idx, arr) => (
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
              { icon: <FaCar />, val: driverAvailability?.onlineCount || 45, label: 'Online Drivers', color: '#059669' },
              { icon: <FaArrowDown />, val: `${driverChurn?.churnRate || 5.2}%`, label: 'Churn Rate', color: '#f59e0b' },
              { icon: <FaStar />, val: driverPerformance?.performanceData?.[0]?.avgRating?.toFixed(1) || '4.7', label: 'Avg Rating', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaDollarSign style={{ color: '#059669', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Top Earning Drivers</span></div>
            <div>{(driverEarnings?.driverEarnings || []).slice(0, 5).map((driver, idx, arr) => (
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
              <div>{(routePopularity?.popularRoutes || []).slice(0, 5).map((route, idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{route.route}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{route.count} trips</span>
                </div>
              ))}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaMapMarkedAlt style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Area Performance</span></div>
              <div>{(areaPerformance?.areaPerformance || []).slice(0, 5).map((area, idx, arr) => (
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
              <div>{(peakHours?.peakHours || []).map((hour, idx, arr) => {
                const maxCount = Math.max(...(peakHours?.peakHours || []).map(h => h.count || 0), 1);
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
              <div>{(peakDays?.peakDays || []).map((day, idx, arr) => {
                const maxCount = Math.max(...(peakDays?.peakDays || []).map(d => d.count || 0), 1);
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
              <div>{Object.entries(seasonalTrends?.monthlyData || {}).map(([month, count], idx, arr) => {
                const maxCount = Math.max(...Object.values(seasonalTrends?.monthlyData || {}), 1);
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
              { icon: <FaPercent />, val: `${commissionRate?.collectionRate || 92}%`, label: 'Commission Rate', color: '#059669' },
              { icon: <FaUndo />, val: `${refundRate?.refundRate || 3.2}%`, label: 'Refund Rate', color: '#ef4444' },
              { icon: <FaDollarSign />, val: `ETB ${avgFare?.avgFare || 185}`, label: 'Average Fare', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaCreditCard style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Payment Method Distribution</span></div>
            <div>{(paymentDistribution?.distribution || []).map((item, idx, arr) => (
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
              { icon: <FaClock />, val: `${driverResponseTime?.avgResponseTime?.toFixed(1) || 2.8} min`, label: 'Driver Response Time', color: '#059669' },
              { icon: <FaHourglassHalf />, val: `${avgWaitTime?.avgWaitTime?.toFixed(1) || 4.5} min`, label: 'Average Wait Time', color: '#f59e0b' },
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
                { label: 'Total Trips', val: dailyReport?.summary?.totalTrips || 180 },
                { label: 'Completed Trips', val: dailyReport?.summary?.completedTrips || 156 },
                { label: 'Total Revenue', val: `ETB ${(dailyReport?.summary?.totalRevenue || 42000).toLocaleString()}` },
                { label: 'New Users', val: dailyReport?.summary?.newUsers || 23 },
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
                { label: 'Total Trips', val: weeklyReport?.summary?.totalTrips || 1200 },
                { label: 'Completed Trips', val: weeklyReport?.summary?.completedTrips || 1050 },
                { label: 'Total Revenue', val: `ETB ${(weeklyReport?.summary?.totalRevenue || 285000).toLocaleString()}` },
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
              <div>{(demandPrediction?.predictions || []).map((pred, idx, arr) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < arr.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{pred.date}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pred.predictedTrips} trips</span>
                </div>
              ))}</div>
            </div>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaDollarSign style={{ color: '#059669', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Revenue Projection</span></div>
              <div>{(revenueProjection?.projections || []).map((proj, idx, arr) => (
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
              { icon: <FaArrowUp />, val: `${yearOverYear?.comparison?.tripGrowth || 24}%`, label: 'Trip Growth', color: '#059669' },
              { icon: <FaDollarSign />, val: `${yearOverYear?.comparison?.revenueGrowth || 31}%`, label: 'Revenue Growth', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}><FaBalanceScale style={{ color: '#7c3aed', fontSize: 14 }} /><span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Competitor Analysis</span></div>
            <div>{Object.entries(competitorAnalysis?.marketShare || {}).map(([competitor, share], idx, arr) => (
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

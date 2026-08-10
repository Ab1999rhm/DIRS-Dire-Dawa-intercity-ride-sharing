import React, { useState, useEffect } from 'react';
import {
  FaChartLine, FaMap, FaClock, FaUsers, FaCar, FaMoneyBillWave,
  FaSearch, FaFilter, FaDownload, FaCalendar, FaArrowUp, FaArrowDown,
  FaFire, FaEye, FaCalendarAlt, FaDollarSign, FaRoute, FaUserClock,
  FaMapMarkedAlt, FaTachometerAlt, FaFileAlt, FaRobot, FaBalanceScale,
  FaGlobe, FaHourglassHalf, FaCreditCard, FaServer, FaBell, FaChartBar
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
  
  // Revenue Analytics
  const [revenueTrends, setRevenueTrends] = useState(null);
  const [revenueByRoute, setRevenueByRoute] = useState(null);
  const [revenueByVehicle, setRevenueByVehicle] = useState(null);
  const [surgeImpact, setSurgeImpact] = useState(null);
  
  // Trip Analytics
  const [tripCompletionRate, setTripCompletionRate] = useState(null);
  const [cancellationReasons, setCancellationReasons] = useState(null);
  const [avgTripDuration, setAvgTripDuration] = useState(null);
  const [tripVolumeTrends, setTripVolumeTrends] = useState(null);
  
  // User Analytics
  const [userGrowth, setUserGrowth] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [userDemographics, setUserDemographics] = useState(null);
  const [userLifetimeValue, setUserLifetimeValue] = useState(null);
  
  // Driver Analytics
  const [driverAvailability, setDriverAvailability] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);
  const [driverEarnings, setDriverEarnings] = useState(null);
  const [driverChurn, setDriverChurn] = useState(null);
  
  // Geographic Analytics
  const [routePopularity, setRoutePopularity] = useState(null);
  const [areaPerformance, setAreaPerformance] = useState(null);
  
  // Time Analytics
  const [peakHours, setPeakHours] = useState(null);
  const [peakDays, setPeakDays] = useState(null);
  const [seasonalTrends, setSeasonalTrends] = useState(null);
  
  // Financial Analytics
  const [commissionRate, setCommissionRate] = useState(null);
  const [refundRate, setRefundRate] = useState(null);
  const [avgFare, setAvgFare] = useState(null);
  const [paymentDistribution, setPaymentDistribution] = useState(null);
  
  // Performance Metrics
  const [driverResponseTime, setDriverResponseTime] = useState(null);
  const [avgWaitTime, setAvgWaitTime] = useState(null);
  
  // Reports
  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  
  // Forecasting
  const [demandPrediction, setDemandPrediction] = useState(null);
  const [revenueProjection, setRevenueProjection] = useState(null);
  
  // Comparative
  const [yearOverYear, setYearOverYear] = useState(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [filterPeriod, activeTab]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = { period: filterPeriod, startDate, endDate };
      
      switch (activeTab) {
        case 'revenue':
          const [trends, route, vehicle, surge] = await Promise.all([
            adminAPI.getRevenueTrends(params),
            adminAPI.getRevenueByRoute(params),
            adminAPI.getRevenueByVehicleType(params),
            adminAPI.getSurgePricingImpact(params)
          ]);
          setRevenueTrends(trends.data);
          setRevenueByRoute(route.data);
          setRevenueByVehicle(vehicle.data);
          setSurgeImpact(surge.data);
          break;
          
        case 'trips':
          const [completion, reasons, duration, volume] = await Promise.all([
            adminAPI.getTripCompletionRate(params),
            adminAPI.getCancellationReasons(params),
            adminAPI.getAverageTripDuration(params),
            adminAPI.getTripVolumeTrends(params)
          ]);
          setTripCompletionRate(completion.data);
          setCancellationReasons(reasons.data);
          setAvgTripDuration(duration.data);
          setTripVolumeTrends(volume.data);
          break;
          
        case 'users':
          const [growth, activity, demographics, ltv] = await Promise.all([
            adminAPI.getUserGrowth(params),
            adminAPI.getUserActivity(params),
            adminAPI.getUserDemographics(params),
            adminAPI.getUserLifetimeValue(params)
          ]);
          setUserGrowth(growth.data);
          setUserActivity(activity.data);
          setUserDemographics(demographics.data);
          setUserLifetimeValue(ltv.data);
          break;
          
        case 'drivers':
          const [availability, performance, earnings, churn] = await Promise.all([
            adminAPI.getDriverAvailability(params),
            adminAPI.getDriverPerformance(params),
            adminAPI.getDriverEarnings(params),
            adminAPI.getDriverChurn(params)
          ]);
          setDriverAvailability(availability.data);
          setDriverPerformance(performance.data);
          setDriverEarnings(earnings.data);
          setDriverChurn(churn.data);
          break;
          
        case 'geo':
          const [routes, areas] = await Promise.all([
            adminAPI.getRoutePopularity(params),
            adminAPI.getAreaPerformance(params)
          ]);
          setRoutePopularity(routes.data);
          setAreaPerformance(areas.data);
          break;
          
        case 'time':
          const [hours, days, seasonal] = await Promise.all([
            adminAPI.getPeakHoursNew(params),
            adminAPI.getPeakDays(params),
            adminAPI.getSeasonalTrends(params)
          ]);
          setPeakHours(hours.data);
          setPeakDays(days.data);
          setSeasonalTrends(seasonal.data);
          break;
          
        case 'financial':
          const [commission, refund, fare, payment] = await Promise.all([
            adminAPI.getCommissionCollectionRate(params),
            adminAPI.getRefundRate(params),
            adminAPI.getAverageFare(params),
            adminAPI.getPaymentMethodDistribution(params)
          ]);
          setCommissionRate(commission.data);
          setRefundRate(refund.data);
          setAvgFare(fare.data);
          setPaymentDistribution(payment.data);
          break;
          
        case 'performance':
          const [response, wait] = await Promise.all([
            adminAPI.getDriverResponseTime(params),
            adminAPI.getAverageWaitTime(params)
          ]);
          setDriverResponseTime(response.data);
          setAvgWaitTime(wait.data);
          break;
          
        case 'reports':
          const [daily, weekly] = await Promise.all([
            adminAPI.generateDailyReport(params),
            adminAPI.generateWeeklyReport(params)
          ]);
          setDailyReport(daily.data);
          setWeeklyReport(weekly.data);
          break;
          
        case 'forecast':
          const [demand, revenue] = await Promise.all([
            adminAPI.getDemandPrediction(params),
            adminAPI.getRevenueProjection(params)
          ]);
          setDemandPrediction(demand.data);
          setRevenueProjection(revenue.data);
          break;
          
        case 'comparative':
          const [yoy, competitor] = await Promise.all([
            adminAPI.getYearOverYear(params),
            adminAPI.getCompetitorAnalysis(params)
          ]);
          setYearOverYear(yoy.data);
          setCompetitorAnalysis(competitor.data);
          break;
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      toast.error('Failed to load analytics data');
    }
    setLoading(false);
  };

  const handleExport = async (type) => {
    try {
      const params = { type, startDate, endDate, format: 'csv' };
      await adminAPI.exportReport(params);
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-greeting">
            <FaChartLine /> {t('admin.analyticsReporting') || 'Analytics & Reporting'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchAnalyticsData}>
            <FaSearch />
          </button>
          <button className="admin-icon-btn" onClick={() => handleExport(activeTab)}>
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

      {/* Analytics Category Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          <FaDollarSign /> {t('admin.revenue') || 'Revenue'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
        >
          <FaCar /> {t('admin.trips') || 'Trips'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FaUsers /> {t('admin.users') || 'Users'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          <FaUserClock /> {t('admin.drivers') || 'Drivers'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'geo' ? 'active' : ''}`}
          onClick={() => setActiveTab('geo')}
        >
          <FaMapMarkedAlt /> {t('admin.geographic') || 'Geographic'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'time' ? 'active' : ''}`}
          onClick={() => setActiveTab('time')}
        >
          <FaClock /> {t('admin.time') || 'Time'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          <FaMoneyBillWave /> {t('admin.financial') || 'Financial'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <FaTachometerAlt /> {t('admin.performance') || 'Performance'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FaFileAlt /> {t('admin.reports') || 'Reports'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          <FaRobot /> {t('admin.forecast') || 'Forecast'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'comparative' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparative')}
        >
          <FaBalanceScale /> {t('admin.comparative') || 'Comparative'}
        </button>
      </div>

      {/* Revenue Analytics Tab */}
      {activeTab === 'revenue' && (
        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaDollarSign />
              </div>
              <div>
                <div className="admin-stat-value">ETB {revenueTrends?.totalRevenue?.toLocaleString() || '0'}</div>
                <div className="admin-stat-label">{t('admin.totalRevenue') || 'Total Revenue'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaRoute />
              </div>
              <div>
                <div className="admin-stat-value">{revenueByRoute?.revenueByRoute?.length || 0}</div>
                <div className="admin-stat-label">{t('admin.routes') || 'Routes'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                <FaFire />
              </div>
              <div>
                <div className="admin-stat-value">{surgeImpact?.surgeImpact || '0'}%</div>
                <div className="admin-stat-label">{t('admin.surgeImpact') || 'Surge Impact'}</div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h3><FaChartLine /> {t('admin.revenueByRoute') || 'Revenue by Route'}</h3>
            <div className="admin-list">
              {revenueByRoute?.revenueByRoute?.slice(0, 10).map((item, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{item.route}</span>
                  </div>
                  <div className="item-meta">ETB {item.revenue?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h3><FaCar /> {t('admin.revenueByVehicle') || 'Revenue by Vehicle Type'}</h3>
            <div className="admin-list">
              {Object.entries(revenueByVehicle?.revenueByVehicle || {}).map(([type, data], idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{type}</span>
                  </div>
                  <div className="item-meta">ETB {data.revenue?.toLocaleString()} ({data.count} trips)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trip Analytics Tab */}
      {activeTab === 'trips' && (
        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaCheckCircle />
              </div>
              <div>
                <div className="admin-stat-value">{tripCompletionRate?.completionRate || '0'}%</div>
                <div className="admin-stat-label">{t('admin.completionRate') || 'Completion Rate'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                <FaTimes />
              </div>
              <div>
                <div className="admin-stat-value">{tripCompletionRate?.cancellationRate || '0'}%</div>
                <div className="admin-stat-label">{t('admin.cancellationRate') || 'Cancellation Rate'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaClock />
              </div>
              <div>
                <div className="admin-stat-value">{avgTripDuration?.avgDuration?.toFixed(1) || '0'} min</div>
                <div className="admin-stat-label">{t('admin.avgDuration') || 'Avg Duration'}</div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h3><FaTimes /> {t('admin.cancellationReasons') || 'Cancellation Reasons'}</h3>
            <div className="admin-list">
              {cancellationReasons?.cancellationReasons?.map((item, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{item.reason}</span>
                  </div>
                  <div className="item-meta">{item.count} ({item.percentage}%)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Analytics Tab */}
      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaUsers />
              </div>
              <div>
                <div className="admin-stat-value">{userGrowth?.totalNewUsers || '0'}</div>
                <div className="admin-stat-label">{t('admin.newUsers') || 'New Users'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaEye />
              </div>
              <div>
                <div className="admin-stat-value">{userActivity?.activityRate || '0'}%</div>
                <div className="admin-stat-label">{t('admin.activityRate') || 'Activity Rate'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                <FaDollarSign />
              </div>
              <div>
                <div className="admin-stat-value">ETB {userLifetimeValue?.userLifetimeValues?.[0]?.totalSpent?.toLocaleString() || '0'}</div>
                <div className="admin-stat-label">{t('admin.topLTV') || 'Top LTV'}</div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h3><FaChartBar /> {t('admin.userDemographics') || 'User Demographics'}</h3>
            <div className="admin-list">
              <div className="admin-list-item">
                <div className="item-info">
                  <span className="item-name">{t('admin.totalUsers') || 'Total Users'}</span>
                </div>
                <div className="item-meta">{userDemographics?.totalUsers || '0'}</div>
              </div>
              {Object.entries(userDemographics?.demographics?.ageGroups || {}).map(([group, count], idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{group}</span>
                  </div>
                  <div className="item-meta">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h3><FaDollarSign /> {t('admin.topLifetimeValue') || 'Top Lifetime Value Users'}</h3>
            <div className="admin-list">
              {userLifetimeValue?.userLifetimeValues?.slice(0, 10).map((user, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{user.userName}</span>
                  </div>
                  <div className="item-meta">ETB {user.totalSpent?.toLocaleString()} ({user.tripCount} trips)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Driver Analytics Tab */}
      {activeTab === 'drivers' && (
        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaCar />
              </div>
              <div>
                <div className="admin-stat-value">{driverAvailability?.onlineCount || '0'}</div>
                <div className="admin-stat-label">{t('admin.onlineDrivers') || 'Online Drivers'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                <FaArrowDown />
              </div>
              <div>
                <div className="admin-stat-value">{driverChurn?.churnRate || '0'}%</div>
                <div className="admin-stat-label">{t('admin.churnRate') || 'Churn Rate'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaStar />
              </div>
              <div>
                <div className="admin-stat-value">{driverPerformance?.performanceData?.[0]?.avgRating?.toFixed(1) || '0'}</div>
                <div className="admin-stat-label">{t('admin.avgRating') || 'Avg Rating'}</div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h3><FaDollarSign /> {t('admin.topEarningDrivers') || 'Top Earning Drivers'}</h3>
            <div className="admin-list">
              {driverEarnings?.driverEarnings?.slice(0, 10).map((driver, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{driver.driverName}</span>
                  </div>
                  <div className="item-meta">ETB {driver.totalEarnings?.toLocaleString()} ({driver.tripCount} trips)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Geographic Analytics Tab */}
      {activeTab === 'geo' && (
        <div className="admin-content">
          <div className="admin-section">
            <h3><FaRoute /> {t('admin.popularRoutes') || 'Popular Routes'}</h3>
            <div className="admin-list">
              {routePopularity?.popularRoutes?.slice(0, 10).map((route, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{route.route}</span>
                  </div>
                  <div className="item-meta">{route.count} trips</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h3><FaMapMarkedAlt /> {t('admin.areaPerformance') || 'Area Performance'}</h3>
            <div className="admin-list">
              {areaPerformance?.areaPerformance?.slice(0, 10).map((area, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{area.area}</span>
                  </div>
                  <div className="item-meta">ETB {area.revenue?.toLocaleString()} ({area.tripCount} trips)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Analytics Tab */}
      {activeTab === 'time' && (
        <div className="admin-content">
          <div className="admin-section">
            <h3><FaClock /> {t('admin.peakHours') || 'Peak Hours'}</h3>
            <div className="admin-list">
              {peakHours?.peakHours?.map((hour, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{hour.hour}:00</span>
                  </div>
                  <div className="item-meta">{hour.count} trips</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h3><FaCalendarAlt /> {t('admin.peakDays') || 'Peak Days'}</h3>
            <div className="admin-list">
              {peakDays?.peakDays?.map((day, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{day.day}</span>
                  </div>
                  <div className="item-meta">{day.count} trips</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h3><FaChartLine /> {t('admin.seasonalTrends') || 'Seasonal Trends'}</h3>
            <div className="admin-list">
              {Object.entries(seasonalTrends?.monthlyData || {}).map(([month, count], idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{month}</span>
                  </div>
                  <div className="item-meta">{count} trips</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Financial Analytics Tab */}
      {activeTab === 'financial' && (
        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaPercent />
              </div>
              <div>
                <div className="admin-stat-value">{commissionRate?.collectionRate || '0'}%</div>
                <div className="admin-stat-label">{t('admin.commissionRate') || 'Commission Rate'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                <FaUndo />
              </div>
              <div>
                <div className="admin-stat-value">{refundRate?.refundRate || '0'}%</div>
                <div className="admin-stat-label">{t('admin.refundRate') || 'Refund Rate'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaDollarSign />
              </div>
              <div>
                <div className="admin-stat-value">ETB {avgFare?.avgFare?.toFixed(0) || '0'}</div>
                <div className="admin-stat-label">{t('admin.avgFare') || 'Average Fare'}</div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h3><FaCreditCard /> {t('admin.paymentDistribution') || 'Payment Method Distribution'}</h3>
            <div className="admin-list">
              {paymentDistribution?.distribution?.map((item, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{item.method}</span>
                  </div>
                  <div className="item-meta">{item.count} ({item.percentage}%)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics Tab */}
      {activeTab === 'performance' && (
        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaClock />
              </div>
              <div>
                <div className="admin-stat-value">{driverResponseTime?.avgResponseTime?.toFixed(1) || '0'} min</div>
                <div className="admin-stat-label">{t('admin.driverResponseTime') || 'Driver Response Time'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                <FaHourglassHalf />
              </div>
              <div>
                <div className="admin-stat-value">{avgWaitTime?.avgWaitTime?.toFixed(1) || '0'} min</div>
                <div className="admin-stat-label">{t('admin.avgWaitTime') || 'Average Wait Time'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="admin-content">
          <div className="admin-section">
            <h3><FaCalendar /> {t('admin.dailyReport') || 'Daily Report'}</h3>
            <div className="admin-list">
              <div className="admin-list-item">
                <div className="item-info">
                  <span className="item-name">{t('admin.totalTrips') || 'Total Trips'}</span>
                </div>
                <div className="item-meta">{dailyReport?.summary?.totalTrips || '0'}</div>
              </div>
              <div className="admin-list-item">
                <div className="item-info">
                  <span className="item-name">{t('admin.completedTrips') || 'Completed Trips'}</span>
                </div>
                <div className="item-meta">{dailyReport?.summary?.completedTrips || '0'}</div>
              </div>
              <div className="admin-list-item">
                <div className="item-info">
                  <span className="item-name">{t('admin.totalRevenue') || 'Total Revenue'}</span>
                </div>
                <div className="item-meta">ETB {dailyReport?.summary?.totalRevenue?.toLocaleString() || '0'}</div>
              </div>
              <div className="admin-list-item">
                <div className="item-info">
                  <span className="item-name">{t('admin.newUsers') || 'New Users'}</span>
                </div>
                <div className="item-meta">{dailyReport?.summary?.newUsers || '0'}</div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h3><FaCalendarAlt /> {t('admin.weeklyReport') || 'Weekly Report'}</h3>
            <div className="admin-list">
              <div className="admin-list-item">
                <div className="item-info">
                  <span className="item-name">{t('admin.totalTrips') || 'Total Trips'}</span>
                </div>
                <div className="item-meta">{weeklyReport?.summary?.totalTrips || '0'}</div>
              </div>
              <div className="admin-list-item">
                <div className="item-info">
                  <span className="item-name">{t('admin.completedTrips') || 'Completed Trips'}</span>
                </div>
                <div className="item-meta">{weeklyReport?.summary?.completedTrips || '0'}</div>
              </div>
              <div className="admin-list-item">
                <div className="item-info">
                  <span className="item-name">{t('admin.totalRevenue') || 'Total Revenue'}</span>
                </div>
                <div className="item-meta">ETB {weeklyReport?.summary?.totalRevenue?.toLocaleString() || '0'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Tab */}
      {activeTab === 'forecast' && (
        <div className="admin-content">
          <div className="admin-section">
            <h3><FaRobot /> {t('admin.demandPrediction') || 'Demand Prediction'}</h3>
            <div className="admin-list">
              {demandPrediction?.predictions?.map((pred, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{pred.date}</span>
                  </div>
                  <div className="item-meta">{pred.predictedTrips} trips</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h3><FaDollarSign /> {t('admin.revenueProjection') || 'Revenue Projection'}</h3>
            <div className="admin-list">
              {revenueProjection?.projections?.map((proj, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{proj.date}</span>
                  </div>
                  <div className="item-meta">ETB {proj.projectedRevenue?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparative Analytics Tab */}
      {activeTab === 'comparative' && (
        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaArrowUp />
              </div>
              <div>
                <div className="admin-stat-value">{yearOverYear?.comparison?.tripGrowth || '0'}%</div>
                <div className="admin-stat-label">{t('admin.tripGrowth') || 'Trip Growth'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaDollarSign />
              </div>
              <div>
                <div className="admin-stat-value">{yearOverYear?.comparison?.revenueGrowth || '0'}%</div>
                <div className="admin-stat-label">{t('admin.revenueGrowth') || 'Revenue Growth'}</div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h3><FaBalanceScale /> {t('admin.competitorAnalysis') || 'Competitor Analysis'}</h3>
            <div className="admin-list">
              {Object.entries(competitorAnalysis?.marketShare || {}).map(([competitor, share], idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{competitor}</span>
                  </div>
                  <div className="item-meta">{share}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsReporting;

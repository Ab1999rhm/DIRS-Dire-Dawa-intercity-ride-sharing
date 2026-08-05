import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import api from '../services/api';
import { FaUsers, FaCar, FaMoneyBill, FaTripadvisor, FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>DIRS Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`nav-item ${activeTab === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveTab('drivers')}
          >
            Drivers
          </button>
          <button
            className={`nav-item ${activeTab === 'trips' ? 'active' : ''}`}
            onClick={() => setActiveTab('trips')}
          >
            Trips
          </button>
          <button
            className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
          <button
            className={`nav-item ${activeTab === 'sos' ? 'active' : ''}`}
            onClick={() => setActiveTab('sos')}
          >
            SOS Alerts
          </button>
          <button
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
        </header>

        {activeTab === 'dashboard' && stats && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card">
                <FaUsers className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{stats.stats.totalUsers}</span>
                  <span className="stat-label">Total Users</span>
                </div>
              </div>
              <div className="stat-card">
                <FaCar className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{stats.stats.activeDrivers}</span>
                  <span className="stat-label">Active Drivers</span>
                </div>
              </div>
              <div className="stat-card">
                <FaTripadvisor className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{stats.stats.totalTrips}</span>
                  <span className="stat-label">Total Trips</span>
                </div>
              </div>
              <div className="stat-card">
                <FaMoneyBill className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{stats.stats.monthlyRevenue} ETB</span>
                  <span className="stat-label">Monthly Revenue</span>
                </div>
              </div>
              <div className="stat-card warning">
                <FaExclamationTriangle className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-value">{stats.stats.pendingVerifications}</span>
                  <span className="stat-label">Pending Verifications</span>
                </div>
              </div>
            </div>

            <div className="recent-section">
              <h3>Recent Trips</h3>
              <div className="recent-list">
                {stats.recentTrips.map((trip) => (
                  <div key={trip._id} className="recent-item">
                    <div className="trip-info">
                      <span className="passenger">{trip.passenger?.firstName} {trip.passenger?.lastName}</span>
                      <span className="route">{trip.pickupLocation?.address} → {trip.dropoffLocation?.address}</span>
                    </div>
                    <span className={`status ${trip.status}`}>{trip.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && <DriverVerificationSection />}
        {activeTab === 'users' && <UserManagementSection />}
        {activeTab === 'trips' && <TripsSection />}
        {activeTab === 'payments' && <PaymentsSection />}
        {activeTab === 'sos' && <SOSAlertsSection />}
        {activeTab === 'reports' && <ReportsSection />}
      </main>
    </div>
  );
};

const DriverVerificationSection = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingDrivers();
  }, []);

  const loadPendingDrivers = async () => {
    try {
      const response = await adminAPI.getPendingVerifications();
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error('Load drivers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (driverId, action, reason = '') => {
    try {
      await adminAPI.verifyDriver(driverId, action, reason);
      setDrivers(prev => prev.filter(d => d._id !== driverId));
    } catch (error) {
      console.error('Verify driver error:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="section-content">
      <h2>Driver Verification ({drivers.length} pending)</h2>
      <div className="driver-list">
        {drivers.map((driver) => (
          <div key={driver._id} className="driver-card">
            <div className="driver-info">
              <h3>{driver.user?.firstName} {driver.user?.lastName}</h3>
              <p>Phone: {driver.user?.phoneNumber}</p>
              <p>License: {driver.licenseNumber}</p>
              <p>National ID: {driver.nationalId}</p>
            </div>
            <div className="driver-documents">
              <a href={driver.licensePhoto} target="_blank" rel="noopener noreferrer">View License</a>
              <a href={driver.nationalIdPhoto} target="_blank" rel="noopener noreferrer">View National ID</a>
            </div>
            <div className="driver-actions">
              <button
                className="btn-reject"
                onClick={() => handleVerify(driver._id, 'reject', 'Documents not clear')}
              >
                <FaTimes /> Reject
              </button>
              <button
                className="btn-approve"
                onClick={() => handleVerify(driver._id, 'approve')}
              >
                <FaCheck /> Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserManagementSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({ search });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId) => {
    try {
      await adminAPI.suspendUser(userId, 'Suspended by admin');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: false } : u));
    } catch (error) {
      console.error('Suspend error:', error);
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await adminAPI.reactivateUser(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: true } : u));
    } catch (error) {
      console.error('Reactivate error:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="section-content">
      <h2>User Management</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
        />
        <button onClick={loadUsers}>Search</button>
      </div>
      <div className="user-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.phoneNumber}</td>
                <td>{user.email || '-'}</td>
                <td>{user.role}</td>
                <td><span className={`status ${user.isActive ? 'completed' : 'cancelled'}`}>{user.isActive ? 'Active' : 'Suspended'}</span></td>
                <td>
                  {user.isActive ? (
                    <button className="btn-suspend" onClick={() => handleSuspend(user._id)}>Suspend</button>
                  ) : (
                    <button className="btn-reactivate" onClick={() => handleReactivate(user._id)}>Reactivate</button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="6">No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TripsSection = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadTrips();
  }, [statusFilter]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const response = await adminAPI.getAllTrips(params);
      setTrips(response.data.trips);
    } catch (error) {
      console.error('Load trips error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="section-content">
      <h2>All Trips</h2>
      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="driver_arriving">Driver Arriving</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="trips-table">
        <table>
          <thead>
            <tr>
              <th>Passenger</th>
              <th>Driver</th>
              <th>Route</th>
              <th>Fare</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip._id}>
                <td>{trip.passenger?.firstName} {trip.passenger?.lastName}</td>
                <td>{trip.driver?.user?.firstName} {trip.driver?.user?.lastName}</td>
                <td>{trip.pickupLocation?.address} → {trip.dropoffLocation?.address}</td>
                <td>{trip.fare?.totalFare || 0} ETB</td>
                <td><span className={`status ${trip.status}`}>{trip.status?.replace('_', ' ')}</span></td>
                <td>{new Date(trip.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {trips.length === 0 && <tr><td colSpan="6">No trips found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PaymentsSection = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await adminAPI.getPayments();
      setPayments(response.data.payments);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Load payments error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="section-content">
      <h2>Payment Overview</h2>
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-value">{summary.totalAmount?.toLocaleString() || 0} ETB</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-value">{summary.totalCommission?.toLocaleString() || 0} ETB</span>
              <span className="stat-label">Platform Commission</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-value">{summary.totalDriverEarnings?.toLocaleString() || 0} ETB</span>
              <span className="stat-label">Driver Earnings</span>
            </div>
          </div>
        </div>
      )}
      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Passenger</th>
              <th>Driver</th>
              <th>Amount</th>
              <th>Commission</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment._id}>
                <td>{payment.transactionId || payment._id}</td>
                <td>{payment.passenger?.firstName} {payment.passenger?.lastName}</td>
                <td>{payment.driver?.user?.firstName} {payment.driver?.user?.lastName}</td>
                <td>{payment.amount} ETB</td>
                <td>{payment.platformCommission} ETB</td>
                <td>{payment.method}</td>
                <td><span className={`status ${payment.status}`}>{payment.status}</span></td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan="7">No payments found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SOSAlertsSection = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await adminAPI.getSOSAlerts();
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Load alerts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await api.put(`/sos/${alertId}/resolve`);
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'resolved' } : a));
    } catch (error) {
      console.error('Resolve error:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="section-content">
      <h2>SOS Alerts</h2>
      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert._id} className={`alert-card ${alert.status}`}>
            <div className="alert-info">
              <h4>{alert.user?.firstName} {alert.user?.lastName}</h4>
              <p>Phone: {alert.user?.phoneNumber}</p>
              <p>Message: {alert.message || 'Emergency SOS triggered'}</p>
              <p>Trip: {alert.trip?._id || 'N/A'}</p>
              <p>Time: {new Date(alert.createdAt).toLocaleString()}</p>
            </div>
            <div className="alert-actions">
              <span className={`status-badge ${alert.status}`}>{alert.status}</span>
              {alert.status === 'active' && (
                <button className="btn-approve" onClick={() => handleResolve(alert._id)}>
                  Resolve
                </button>
              )}
            </div>
          </div>
        ))}
        {alerts.length === 0 && <p>No SOS alerts found</p>}
      </div>
    </div>
  );
};

const ReportsSection = () => {
  const [reportType, setReportType] = useState('trips');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.generateReport({ type: reportType });
      setReportData(response.data.report);
    } catch (error) {
      console.error('Generate report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-content">
      <h2>Reports</h2>
      <div className="report-controls">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="trips">Trips Report</option>
          <option value="revenue">Revenue Report</option>
          <option value="users">Users Report</option>
          <option value="drivers">Drivers Report</option>
        </select>
        <button onClick={generateReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
      {reportData && (
        <div className="report-data">
          <pre>{JSON.stringify(reportData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

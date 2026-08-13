import React, { useState, useCallback, useEffect, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import NetworkStatus from './components/common/NetworkStatus';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import offlineService from './services/offlineService';
import './styles/pages.css';

const PassengerBottomNav = React.lazy(() => import('./components/layout/PassengerBottomNav'));
const DriverBottomNav = React.lazy(() => import('./components/layout/DriverBottomNav'));
const AdminBottomNav = React.lazy(() => import('./components/layout/AdminBottomNav'));
const Sidebar = React.lazy(() => import('./components/layout/Sidebar'));
const AdminMobileHeader = React.lazy(() => import('./components/layout/AdminMobileHeader'));
const PublicLanding = React.lazy(() => import('./pages/public/PublicLanding'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));
const PassengerHome = React.lazy(() => import('./pages/passenger/PassengerHome'));
const PassengerTrips = React.lazy(() => import('./pages/passenger/PassengerTrips'));
const PassengerHistory = React.lazy(() => import('./pages/passenger/PassengerHistory'));
const PassengerFavorites = React.lazy(() => import('./pages/passenger/PassengerFavorites'));
const PassengerProfile = React.lazy(() => import('./pages/passenger/PassengerProfile'));
const PassengerWallet = React.lazy(() => import('./pages/passenger/PassengerWallet'));
const PassengerTripDetail = React.lazy(() => import('./pages/passenger/PassengerTripDetail'));
const DriverDashboard = React.lazy(() => import('./pages/driver/DriverDashboard'));
const DriverTrips = React.lazy(() => import('./pages/driver/DriverTrips'));
const DriverEarnings = React.lazy(() => import('./pages/driver/DriverEarnings'));
const DriverVehicle = React.lazy(() => import('./pages/driver/DriverVehicle'));
const DriverProfile = React.lazy(() => import('./pages/driver/DriverProfile'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminDrivers = React.lazy(() => import('./pages/admin/AdminDrivers'));
const AdminTrips = React.lazy(() => import('./pages/admin/AdminTrips'));
const AdminPayments = React.lazy(() => import('./pages/admin/AdminPayments'));
const AdminSOS = React.lazy(() => import('./pages/admin/AdminSOS'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminTariffs = React.lazy(() => import('./pages/admin/AdminTariffs'));
const AdminPromos = React.lazy(() => import('./pages/admin/AdminPromos'));
const RealTimeMonitoring = React.lazy(() => import('./pages/admin/RealTimeMonitoring'));
const DriverManagement = React.lazy(() => import('./pages/admin/DriverManagement'));
const PassengerManagement = React.lazy(() => import('./pages/admin/PassengerManagement'));
const TripManagement = React.lazy(() => import('./pages/admin/TripManagement'));
const FinancialManagement = React.lazy(() => import('./pages/admin/FinancialManagement'));
const SafetySecurity = React.lazy(() => import('./pages/admin/SafetyDashboard'));
const DispatchContacts = React.lazy(() => import('./pages/admin/DispatchContacts'));
const SupportSystem = React.lazy(() => import('./pages/admin/SupportDashboard'));
const AnalyticsReporting = React.lazy(() => import('./pages/admin/AnalyticsReporting'));
const ContentNotifications = React.lazy(() => import('./pages/admin/ContentNotifications'));
const SystemConfiguration = React.lazy(() => import('./pages/admin/SystemConfiguration'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

const LoadingSpinner = ({ waking }) => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    {waking && (
      <div style={{
        marginTop: '20px',
        color: '#94a3b8',
        fontSize: '14px',
        textAlign: 'center',
        padding: '0 24px',
        lineHeight: '1.6'
      }}>
        ⏳ Waking up server...<br />
        <span style={{ fontSize: '12px', opacity: 0.7 }}>This takes up to 30 seconds on first load</span>
      </div>
    )}
  </div>
);

class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: 20, textAlign: 'center'
        }}>
          <p style={{ fontSize: 16, marginBottom: 16 }}>Failed to load this page.</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PrivateRoute = React.memo(({ children }) => {
  const { user, loading, serverWaking } = useAuth();
  if (loading) return <LoadingSpinner waking={serverWaking} />;
  return user ? children : <Navigate to="/login" />;
});

const RoleRoute = React.memo(({ children, allowedRole }) => {
  const { user, loading, serverWaking } = useAuth();
  if (loading) return <LoadingSpinner waking={serverWaking} />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== allowedRole) {
    if (user.role === 'driver') return <Navigate to="/driver" />;
    if (user.role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to="/passenger" />;
  }
  return children;
});

const PublicRoute = React.memo(({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) {
    if (user.role === 'driver') return <Navigate to="/driver" />;
    if (user.role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to="/passenger" />;
  }
  return children;
});

const ShellScrollReset = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const scroller = document.querySelector('.app-shell .app-body');
    if (scroller) scroller.scrollTop = 0;
  }, [pathname]);
  return null;
};

const AppLayout = React.memo(({ children, bottomNav, adminNav }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  return (
    <div className={`app-layout ${bottomNav ? 'app-shell' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {adminNav && (
        <Suspense fallback={null}>
          <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <AdminMobileHeader onMenuClick={() => setSidebarOpen(true)} />
        </Suspense>
      )}
      <ShellScrollReset />
      <div className={adminNav ? 'app-body' : 'app-body app-body-flush'}>
        <main className={(bottomNav || adminNav) ? 'app-main has-bottom-nav' : 'app-main'} style={(bottomNav || adminNav) ? { marginLeft: 0 } : {}}>
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </main>
      </div>
      {bottomNav && (
        <Suspense fallback={<LoadingSpinner />}>
          <PassengerBottomNav />
        </Suspense>
      )}
    </div>
  );
});

const PassengerRoutes = React.memo(() => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route index element={<PassengerHome />} />
      <Route path="trips" element={<PassengerTrips />} />
      <Route path="trip/:tripId" element={<PassengerTripDetail />} />
      <Route path="wallet" element={<PassengerWallet />} />
      <Route path="history" element={<PassengerHistory />} />
      <Route path="favorites" element={<PassengerFavorites />} />
      <Route path="profile" element={<PassengerProfile />} />
      <Route path="*" element={<Navigate to="/passenger" />} />
    </Routes>
  </Suspense>
));

const DriverRoutes = React.memo(() => (
  <div className="app-layout app-shell">
    <div className="app-body">
      <ShellScrollReset />
      <main className="app-main" style={{ marginLeft: 0 }}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route index element={<DriverDashboard />} />
            <Route path="trips" element={<DriverTrips />} />
            <Route path="earnings" element={<DriverEarnings />} />
            <Route path="vehicle" element={<DriverVehicle />} />
            <Route path="profile" element={<DriverProfile />} />
            <Route path="*" element={<Navigate to="/driver" />} />
          </Routes>
        </Suspense>
      </main>
    </div>
    <Suspense fallback={null}>
      <DriverBottomNav />
    </Suspense>
  </div>
));

const AdminRoutes = React.memo(() => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="drivers" element={<AdminDrivers />} />
      <Route path="trips" element={<AdminTrips />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="sos" element={<AdminSOS />} />
      <Route path="reports" element={<AdminReports />} />
      <Route path="tariffs" element={<AdminTariffs />} />
      <Route path="promos" element={<AdminPromos />} />
      <Route path="monitoring" element={<RealTimeMonitoring />} />
      <Route path="driver-management" element={<DriverManagement />} />
      <Route path="passenger-management" element={<PassengerManagement />} />
      <Route path="trip-management" element={<TripManagement />} />
      <Route path="financials" element={<FinancialManagement />} />
      <Route path="safety" element={<SafetySecurity />} />
      <Route path="dispatch-contacts" element={<DispatchContacts />} />
      <Route path="support" element={<SupportSystem />} />
      <Route path="analytics" element={<AnalyticsReporting />} />
      <Route path="content" element={<ContentNotifications />} />
      <Route path="configuration" element={<SystemConfiguration />} />
      <Route path="*" element={<Navigate to="/admin" />} />
    </Routes>
  </Suspense>
));

function App() {
  useEffect(() => {
    offlineService.init();
  }, []);

  const passengerRoute = useMemo(() => (
    <RoleRoute allowedRole="passenger">
      <AppLayout bottomNav>
        <PassengerRoutes />
      </AppLayout>
    </RoleRoute>
  ), []);

  const driverRoute = useMemo(() => (
    <RoleRoute allowedRole="driver">
      <DriverRoutes />
    </RoleRoute>
  ), []);

  const adminRoute = useMemo(() => (
    <RoleRoute allowedRole="admin">
      <AppLayout adminNav>
        <AdminRoutes />
      </AppLayout>
    </RoleRoute>
  ), []);

  const publicLanding = useMemo(() => <PublicLanding />, []);
  const loginPage = useMemo(() => <LoginPage />, []);
  const registerPage = useMemo(() => <RegisterPage />, []);
  const forgotPasswordPage = useMemo(() => <ForgotPasswordPage />, []);
  const notFoundPage = useMemo(() => <NotFound />, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <NetworkStatus />
                <PWAInstallPrompt />
                <a href="#main-content" className="skip-link" style={{
                  position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px',
                  overflow: 'hidden', zIndex: 9999
                }}>
                  Skip to main content
                </a>
                <Routes>
                  <Route path="/" element={<PublicRoute><LazyErrorBoundary><Suspense fallback={<LoadingSpinner />}>{publicLanding}</Suspense></LazyErrorBoundary></PublicRoute>} />
                  <Route path="/login" element={<PublicRoute><LazyErrorBoundary><Suspense fallback={<LoadingSpinner />}>{loginPage}</Suspense></LazyErrorBoundary></PublicRoute>} />
                  <Route path="/register" element={<PublicRoute><LazyErrorBoundary><Suspense fallback={<LoadingSpinner />}>{registerPage}</Suspense></LazyErrorBoundary></PublicRoute>} />
                  <Route path="/forgot-password" element={<PublicRoute><LazyErrorBoundary><Suspense fallback={<LoadingSpinner />}>{forgotPasswordPage}</Suspense></LazyErrorBoundary></PublicRoute>} />
                  <Route path="/passenger/*" element={passengerRoute} />
                  <Route path="/driver/*" element={driverRoute} />
                  <Route path="/admin/*" element={adminRoute} />
                  <Route path="*" element={<LazyErrorBoundary><Suspense fallback={<LoadingSpinner />}>{notFoundPage}</Suspense></LazyErrorBoundary>} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

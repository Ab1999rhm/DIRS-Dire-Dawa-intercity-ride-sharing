import React, { useState, useCallback, useEffect, Suspense } from 'react';
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

const Navbar = React.lazy(() => import('./components/layout/Navbar'));
const Sidebar = React.lazy(() => import('./components/layout/Sidebar'));
const PublicLanding = React.lazy(() => import('./pages/public/PublicLanding'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const PassengerHome = React.lazy(() => import('./pages/passenger/PassengerHome'));
const PassengerTrips = React.lazy(() => import('./pages/passenger/PassengerTrips'));
const PassengerHistory = React.lazy(() => import('./pages/passenger/PassengerHistory'));
const PassengerFavorites = React.lazy(() => import('./pages/passenger/PassengerFavorites'));
const PassengerProfile = React.lazy(() => import('./pages/passenger/PassengerProfile'));
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

const LoadingSpinner = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) {
    if (user.role === 'driver') return <Navigate to="/driver" />;
    if (user.role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to="/passenger" />;
  }
  return children;
};

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback((open) => setSidebarOpen(open), []);

  return (
    <div className="app-layout">
      <Suspense fallback={<LoadingSpinner />}>
        <Navbar onMenuToggle={toggleSidebar} />
      </Suspense>
      <div className="app-body">
        <Suspense fallback={<LoadingSpinner />}>
          <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </Suspense>
        <main className="app-main">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const PassengerRoutes = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route index element={<PassengerHome />} />
      <Route path="trips" element={<PassengerTrips />} />
      <Route path="history" element={<PassengerHistory />} />
      <Route path="favorites" element={<PassengerFavorites />} />
      <Route path="profile" element={<PassengerProfile />} />
      <Route path="*" element={<Navigate to="/passenger" />} />
    </Routes>
  </Suspense>
);

const DriverRoutes = () => (
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
);

const AdminRoutes = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="drivers" element={<AdminDrivers />} />
      <Route path="trips" element={<AdminTrips />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="sos" element={<AdminSOS />} />
      <Route path="reports" element={<AdminReports />} />
      <Route path="*" element={<Navigate to="/admin" />} />
    </Routes>
  </Suspense>
);

function App() {
  useEffect(() => {
    offlineService.init();
  }, []);

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
                  <Route path="/" element={<PublicRoute><Suspense fallback={<LoadingSpinner />}><PublicLanding /></Suspense></PublicRoute>} />
                  <Route path="/login" element={<PublicRoute><Suspense fallback={<LoadingSpinner />}><LoginPage /></Suspense></PublicRoute>} />
                  <Route path="/register" element={<PublicRoute><Suspense fallback={<LoadingSpinner />}><RegisterPage /></Suspense></PublicRoute>} />
                  <Route path="/passenger/*" element={<PrivateRoute><AppLayout><PassengerRoutes /></AppLayout></PrivateRoute>} />
                  <Route path="/driver/*" element={<PrivateRoute><AppLayout><DriverRoutes /></AppLayout></PrivateRoute>} />
                  <Route path="/admin/*" element={<PrivateRoute><AppLayout><AdminRoutes /></AppLayout></PrivateRoute>} />
                  <Route path="*" element={<Navigate to="/" />} />
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

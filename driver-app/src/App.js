import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DriverDashboard from './pages/Dashboard';
import TripsPage from './pages/Trips';
import EarningsPage from './pages/Earnings';
import VehiclePage from './pages/Vehicle';
import ProfilePage from './pages/Profile';
import DocumentsPage from './pages/Documents';
import TripDetailPage from './pages/TripDetail';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import SupportChatPage from './pages/SupportChatPage';
import OnboardingPage from './pages/OnboardingPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className="App">
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/documents" element={
              <PrivateRoute>
                <DocumentsPage />
              </PrivateRoute>
            } />
              <Route path="/" element={
                <PrivateRoute>
                  <DriverDashboard />
                </PrivateRoute>
              } />
              <Route path="/trips" element={
                <PrivateRoute>
                  <TripsPage />
                </PrivateRoute>
              } />
              <Route path="/earnings" element={
                <PrivateRoute>
                  <EarningsPage />
                </PrivateRoute>
              } />
              <Route path="/vehicle" element={
                <PrivateRoute>
                  <VehiclePage />
                </PrivateRoute>
              } />
              <Route path="/trip/:tripId" element={
              <PrivateRoute>
                <TripDetailPage />
              </PrivateRoute>
            } />
            <Route path="/chat" element={
              <PrivateRoute>
                <ChatPage />
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            } />
            <Route path="/help" element={
              <PrivateRoute>
                <HelpCenterPage />
              </PrivateRoute>
            } />
            <Route path="/support" element={
              <PrivateRoute>
                <SupportChatPage />
              </PrivateRoute>
            } />
            <Route path="/onboarding" element={
              <PrivateRoute>
                <OnboardingPage />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              } />
            </Routes>
          </div>
        </Router>
      </LanguageProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

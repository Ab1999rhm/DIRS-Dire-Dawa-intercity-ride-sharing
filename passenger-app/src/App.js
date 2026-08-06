import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RideProvider } from './context/RideContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import TripDetailsPage from './pages/TripDetailsPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SOSPage from './pages/SOSPage';
import FavoritesPage from './pages/FavoritesPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>Loading DIRS...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <RideProvider>
        <Router>
          <div className="App">
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route path="/" element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              } />

              <Route path="/trip/:tripId" element={
                <PrivateRoute>
                  <TripDetailsPage />
                </PrivateRoute>
              } />

              <Route path="/history" element={
                <PrivateRoute>
                  <HistoryPage />
                </PrivateRoute>
              } />

              <Route path="/profile" element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              } />

              <Route path="/sos" element={
                <PrivateRoute>
                  <SOSPage />
                </PrivateRoute>
              } />

              <Route path="/favorites" element={
                <PrivateRoute>
                  <FavoritesPage />
                </PrivateRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </RideProvider>
    </AuthProvider>
  );
}

export default App;

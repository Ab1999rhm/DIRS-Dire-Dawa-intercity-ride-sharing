import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DriverDashboard from './pages/Dashboard';
import TripsPage from './pages/Trips';
import EarningsPage from './pages/Earnings';
import VehiclePage from './pages/Vehicle';
import ProfilePage from './pages/Profile';
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
    <AuthProvider>
      <Router>
        <div className="App">
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

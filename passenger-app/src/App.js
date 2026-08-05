import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RideProvider } from './context/RideContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TripDetailsPage from './pages/TripDetailsPage';
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
      <RideProvider>
        <Router>
          <div className="App">
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
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
                  <div>History Page</div>
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <div>Profile Page</div>
                </PrivateRoute>
              } />
              <Route path="/sos" element={
                <PrivateRoute>
                  <div>SOS Page</div>
                </PrivateRoute>
              } />
            </Routes>
          </div>
        </Router>
      </RideProvider>
    </AuthProvider>
  );
}

export default App;

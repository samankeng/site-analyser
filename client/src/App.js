import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import Navbar from './components/common/Navbar';
import PrivateRoute from './components/common/PrivateRoute';
import HomePage from './pages/HomePage';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import SecurityReport from './pages/reports/SecurityReport';
import NewScan from './pages/scans/NewScan';
import ScanStatus from './pages/scans/ScanStatus';
import Account from './pages/settings/Account';
import Notifications from './pages/settings/Notifications';
import Security from './pages/settings/Security';
import NotFound from './pages/NotFound';
import ErrorPage from './pages/ErrorPage';
import { checkAuthStatus } from './store/actions/authActions';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is already logged in
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <AlertProvider>
      <AuthProvider>
        <Navbar />
        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/scan" element={
              <PrivateRoute>
                <NewScan />
              </PrivateRoute>
            } />
            
            <Route path="/scan/:scanId" element={
              <PrivateRoute>
                <ScanStatus />
              </PrivateRoute>
            } />
            
            <Route path="/reports/:scanId" element={
              <PrivateRoute>
                <SecurityReport />
              </PrivateRoute>
            } />
            
            <Route path="/settings/account" element={
              <PrivateRoute>
                <Account />
              </PrivateRoute>
            } />
            
            <Route path="/settings/notifications" element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            } />
            
            <Route path="/settings/security" element={
              <PrivateRoute>
                <Security />
              </PrivateRoute>
            } />
            
            {/* Error routes */}
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </main>
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;
import React, { Suspense, useEffect } from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { ThemeContextProvider } from './contexts/ThemeContext';

import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import Navbar from './components/common/Navbar';
import PrivateRoute from './components/common/PrivateRoute';
import { checkAuthStatus } from './store/actions/authActions';
import GlobalSnackbar from './components/common/GlobalSnackbar';
import ErrorBoundary from './components/common/ErrorBoundary';

// Import all your page components
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
import ReportList from './pages/reports/ReportList';


function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <ThemeContextProvider>
      <AlertProvider>
        <AuthProvider>
          <ErrorBoundary fallback={<ErrorPage />}>
            <div className="App">
              <Navbar />
              <main className="container">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  {/* <Route path="/dashboard" element={<Dashboard />} /> */}

                  {/* Protected routes */}
                  <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
                  <Route path="/scan" element={<PrivateRoute element={<NewScan />} />} />
                  <Route path="/scans/:scanId" element={<PrivateRoute element={<ScanStatus />} />} />
                  <Route
                    path="/reports/:scanId"
                    element={<PrivateRoute element={<SecurityReport />} />}
                  />

                  {/* Settings routes */}
                  <Route path="/settings">
                    <Route path="account" element={<PrivateRoute element={<Account />} />} />
                    <Route
                      path="notifications"
                      element={<PrivateRoute element={<Notifications />} />}
                    />
                    <Route path="security" element={<PrivateRoute element={<Security />} />} />
                    <Route index element={<Navigate to="/settings/account" replace />} />
                  </Route>

                  {/* Error routes */}
                  <Route path="/error" element={<ErrorPage />} />
                  <Route path="/not-found" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/not-found" replace />} />

                  {/* Protected Report Routes - Grouped */}
                  <Route path="/reports">
                    <Route index element={<PrivateRoute element={<ReportList />} />} />
                    <Route
                      path=":reportId"
                      element={<PrivateRoute element={<SecurityReport />} />}
                    />
                  </Route>
                </Routes>
              </main>
              <GlobalSnackbar />
            </div>
          </ErrorBoundary>
        </AuthProvider>
      </AlertProvider>
    </ThemeContextProvider>
  );
}

export default App;

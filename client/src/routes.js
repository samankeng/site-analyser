import React, { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense } from 'react';

// Import common components
import { CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';
import PrivateRoute from './components/common/PrivateRoute';

// Custom loader component using MUI v6
const Loader = ({ fullScreen = false }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: fullScreen ? '100vh' : '100%',
      width: '100%',
      minHeight: fullScreen ? undefined : '200px',
    }}
  >
    <CircularProgress color="primary" />
  </Box>
);

// Layout components for nested routes
const SettingsLayout = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
    <h1>Settings</h1>
    <Outlet />
  </Box>
);

// Lazy load pages with improved error handling for React 19
const lazyWithRetry = importFn => {
  return lazy(() =>
    importFn().catch(error => {
      console.error('Error loading component:', error);
      return import('./pages/ErrorPage');
    })
  );
};

// Lazy load pages for performance
const HomePage = lazyWithRetry(() => import('./pages/HomePage'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const ErrorPage = lazyWithRetry(() => import('./pages/ErrorPage'));

// Auth Pages
const Login = lazyWithRetry(() => import('./pages/auth/Login'));
const Register = lazyWithRetry(() => import('./pages/auth/Register'));
const ResetPassword = lazyWithRetry(() => import('./pages/auth/ResetPassword'));

// Dashboard & Account Pages
const Dashboard = lazyWithRetry(() => import('./pages/dashboard/Dashboard'));
const AccountSettings = lazyWithRetry(() => import('./pages/settings/Account'));
const NotificationSettings = lazyWithRetry(() => import('./pages/settings/Notifications'));
const SecuritySettings = lazyWithRetry(() => import('./pages/settings/Security'));

// Scan Pages
const NewScan = lazyWithRetry(() => import('./pages/scans/NewScan'));
const ScanStatus = lazyWithRetry(() => import('./pages/scans/ScanStatus'));

// Report Pages
const ReportList = lazyWithRetry(() => import('./pages/reports/ReportList'));
const SecurityReport = lazyWithRetry(() => import('./pages/reports/SecurityReport'));

/**
 * Application Routing Configuration
 * Updated for React 19 and MUI v6 with improved pattern
 */
const AppRoutes = () => {
  return (
    <Router>
      <Suspense fallback={<Loader fullScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />

          {/* Protected Scan Routes - Grouped */}
          <Route path="/scans">
            <Route path="new" element={<PrivateRoute element={<NewScan />} />} />
            <Route path=":scanId" element={<PrivateRoute element={<ScanStatus />} />} />
            {/* Redirect /scans to /scans/new */}
            <Route index element={<Navigate to="/scans/new" replace />} />
          </Route>

          {/* Protected Report Routes - Grouped */}
          <Route path="/reports">
            <Route index element={<PrivateRoute element={<ReportList />} />} />
            <Route path=":reportId" element={<PrivateRoute element={<SecurityReport />} />} />
          </Route>

          {/* Protected Settings Routes with Layout */}
          <Route path="/settings" element={<PrivateRoute element={<SettingsLayout />} />}>
            <Route path="account" element={<AccountSettings />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="security" element={<SecuritySettings />} />
            {/* Default settings page */}
            <Route index element={<Navigate to="/settings/account" replace />} />
          </Route>

          {/* Error Handling Routes */}
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/unauthorized" element={<ErrorPage />} />

          {/* 404 Route - Always keep this last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;

/**
 * Utility function for programmatic navigation
 * @param {string} path - Path to redirect to
 * @param {Object} options - Optional navigation options
 * @returns {JSX.Element} - Navigate component
 */
export const redirectTo = (path, options = {}) => {
  const { replace = true, state = null } = options;
  return <Navigate to={path} replace={replace} state={state} />;
};

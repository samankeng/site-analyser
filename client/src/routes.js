import React, { lazy, Suspense } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';

// Import common components
import { Loader } from './components/common';
import PrivateRoute from './components/common/PrivateRoute';

// Lazy load pages for performance
const HomePage = lazy(() => import('./pages/HomePage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// Dashboard & Account Pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const AccountSettings = lazy(() => import('./pages/settings/Account'));
const NotificationSettings = lazy(() => import('./pages/settings/Notifications'));
const SecuritySettings = lazy(() => import('./pages/settings/Security'));

// Scan Pages
const NewScan = lazy(() => import('./pages/scans/NewScan'));
const ScanStatus = lazy(() => import('./pages/scans/ScanStatus'));

// Report Pages
const ReportList = lazy(() => import('./pages/reports/ReportList'));
const SecurityReport = lazy(() => import('./pages/reports/SecurityReport'));

/**
 * Application Routing Configuration
 * Defines all routes with lazy loading and authentication checks
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
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />

          {/* Protected Scan Routes */}
          <Route 
            path="/scans/new" 
            element={
              <PrivateRoute>
                <NewScan />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/scans/:scanId" 
            element={
              <PrivateRoute>
                <ScanStatus />
              </PrivateRoute>
            } 
          />

          {/* Protected Report Routes */}
          <Route 
            path="/reports" 
            element={
              <PrivateRoute>
                <ReportList />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/reports/:reportId" 
            element={
              <PrivateRoute>
                <SecurityReport />
              </PrivateRoute>
            } 
          />

          {/* Protected Settings Routes */}
          <Route 
            path="/settings/account" 
            element={
              <PrivateRoute>
                <AccountSettings />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/settings/notifications" 
            element={
              <PrivateRoute>
                <NotificationSettings />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/settings/security" 
            element={
              <PrivateRoute>
                <SecuritySettings />
              </PrivateRoute>
            } 
          />

          {/* Error Handling Routes */}
          <Route path="/error" element={<ErrorPage />} />
          
          {/* 404 Route - Always keep this last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;

// Utility function for redirecting
export const redirectTo = (path) => <Navigate to={path} replace />;

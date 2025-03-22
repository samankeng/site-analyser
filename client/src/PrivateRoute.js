import React, { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';

/**
 * PrivateRoute component to protect routes that require authentication
 * Updated for React 19 and MUI v6
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.element - Element to render (preferred in React 19 over children)
 * @param {Object} props.requireRoles - Optional roles required to access this route
 */
const PrivateRoute = ({ element, requireRoles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);

  // Loading state with MUI v6 CircularProgress
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // If not authenticated, redirect to login with the current location state
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If roles are required, check if user has the required role
  if (requireRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = requireRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      // Redirect to unauthorized page or dashboard
      return (
        <Navigate
          to="/unauthorized"
          state={{ from: location.pathname, requiredRoles: requireRoles }}
          replace
        />
      );
    }
  }

  // Use Suspense for lazy-loaded components in React 19
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      }
    >
      {element}
    </Suspense>
  );
};

export default PrivateRoute;

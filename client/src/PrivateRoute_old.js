import React, { Suspense, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ element, requireRoles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useSelector(state => {
    console.log('Full Redux state:', state); // Log entire Redux state
    return state.auth;
  });

  // Debug logging
  useEffect(() => {
    console.log('PrivateRoute - Auth State:', { isAuthenticated, loading, user });
  }, [isAuthenticated, loading, user]);

  // Loading state
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

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role-based access control (if needed)
  if (requireRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = requireRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      console.log('User does not have required roles');
      return (
        <Navigate
          to="/unauthorized"
          state={{ from: location.pathname, requiredRoles: requireRoles }}
          replace
        />
      );
    }
  }

  // Render the protected route
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

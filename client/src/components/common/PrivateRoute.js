// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import Loader from './Loader';

// /**
//  * PrivateRoute component for protecting routes that require authentication
//  * Redirects to login page if user is not authenticated
//  *
//  * @param {React.ReactNode} children - The components to render if authenticated
//  */
// const PrivateRoute = ({ children }) => {
//   const { isAuthenticated, loading } = useAuth();
//   const location = useLocation();

//   // Show loader while checking authentication
//   if (loading) {
//     return <Loader text="Authenticating..." />;
//   }

//   // Redirect to login if not authenticated
//   if (!isAuthenticated) {
//     // Save the location they were trying to go to
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   // If authenticated, render the protected component
//   return children;
// };

// export default PrivateRoute;

import React, { Suspense, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress, Box, Typography } from '@mui/material';

// Define debug mode - set to false for production
const DEBUG_MODE = true;

const PrivateRoute = ({ element, requireRoles = [] }) => {
  const location = useLocation();

  // Get the full Redux state
  const fullState = useSelector(state => state);

  // Debug logging for full state
  if (DEBUG_MODE) {
    console.log('PrivateRoute - Full Redux State:', fullState);
  }

  // Extract auth state
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);

  // Debug logging
  useEffect(() => {
    console.log('PrivateRoute - Auth State:', {
      isAuthenticated,
      loading,
      user,
      path: location.pathname,
    });
  }, [isAuthenticated, loading, user, location.pathname]);

  // Loading state
  if (loading) {
    console.log('PrivateRoute - Showing loading state');
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress color="primary" size={60} thickness={5} />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Loading your data...
        </Typography>
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login from', location.pathname);
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // For debugging - wrap the element with visual indicators in debug mode
  const wrappedElement = DEBUG_MODE ? (
    <Box
      sx={{
        position: 'relative',
        border: '1px dashed #1976d2',
        padding: '2px',
        minHeight: '200px',
      }}
    >
      {element}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          padding: '2px 8px',
          borderRadius: '0 0 0 4px',
          fontSize: '10px',
        }}
      >
        Protected Route: {location.pathname}
      </Box>
    </Box>
  ) : (
    element
  );

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
      {wrappedElement}
    </Suspense>
  );
};

export default PrivateRoute;

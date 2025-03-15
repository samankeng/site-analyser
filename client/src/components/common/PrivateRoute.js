import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loader from './Loader';

/**
 * PrivateRoute component for protecting routes that require authentication
 * Redirects to login page if user is not authenticated
 * 
 * @param {React.ReactNode} children - The components to render if authenticated
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loader while checking authentication
  if (loading) {
    return <Loader text="Authenticating..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default PrivateRoute;
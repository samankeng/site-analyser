import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * PrivateRoute component to protect routes that require authentication
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  // If still loading authentication state, show nothing or a loader
  if (loading) {
    return null; // Or you could return a global loader
  }

  // If not authenticated, redirect to login with the current location state
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // If authenticated, render the children
  return children;
};

export default PrivateRoute;

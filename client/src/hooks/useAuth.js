import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  loginAction, 
  logoutAction, 
  registerAction, 
  resetPasswordAction 
} from '../store/actions/authActions';

/**
 * Custom hook for managing authentication state and operations
 * @returns {Object} Authentication-related state and methods
 */
const useAuth = () => {
  const dispatch = useDispatch();
  const { 
    user, 
    isAuthenticated, 
    loading, 
    error 
  } = useSelector(state => state.auth);

  // Login method
  const login = useCallback(async (email, password) => {
    try {
      await dispatch(loginAction(email, password));
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  }, [dispatch]);

  // Logout method
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutAction());
      return true;
    } catch (err) {
      console.error('Logout failed', err);
      return false;
    }
  }, [dispatch]);

  // Register method
  const register = useCallback(async (userData) => {
    try {
      await dispatch(registerAction(userData));
      return true;
    } catch (err) {
      console.error('Registration failed', err);
      return false;
    }
  }, [dispatch]);

  // Reset password method
  const resetPassword = useCallback(async (email) => {
    try {
      await dispatch(resetPasswordAction(email));
      return true;
    } catch (err) {
      console.error('Password reset failed', err);
      return false;
    }
  }, [dispatch]);

  // Check authentication status on component mount
  useEffect(() => {
    // Optional: Add token validation or refresh logic here
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    resetPassword
  };
};

export default useAuth;

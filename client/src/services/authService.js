import api from './api';
import { 
  storeToken, 
  removeToken, 
  storeUserData, 
  removeUserData 
} from '../utils/storage';

const authService = {
  /**
   * Log in a user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} Login response
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store authentication token
      storeToken(response.data.token);
      
      // Store user data
      storeUserData(response.data.user);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Registration response
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Store authentication token
      storeToken(response.data.token);
      
      // Store user data
      storeUserData(response.data.user);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Log out the current user
   * @returns {Promise} Logout response
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
      
      // Remove token and user data
      removeToken();
      removeUserData();
      
      return true;
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Request password reset
   * @param {string} email - User's email
   * @returns {Promise} Password reset response
   */
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Confirm password reset
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise} Password reset confirmation response
   */
  confirmPasswordReset: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/confirm-reset-password', { 
        token, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      console.error('Password reset confirmation error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Refresh authentication token
   * @returns {Promise} New authentication token
   */
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      
      // Store new token
      storeToken(response.data.token);
      
      return response.data.token;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      
      // If token refresh fails, log out the user
      removeToken();
      removeUserData();
      
      throw error;
    }
  }
};

export default authService;

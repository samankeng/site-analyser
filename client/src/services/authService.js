import api from './api';
import { storeToken, removeToken, storeUser, removeUser } from '../utils/storage';

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
      storeUser(response.data.user);

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
  register: async userData => {
    try {
      const response = await api.post('/auth/register', userData);

      // Store authentication token
      storeToken(response.data.token);

      // Store user data
      storeUser(response.data.user);

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
      removeUser();

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
  requestPasswordReset: async email => {
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
        newPassword,
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
      removeUser();

      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} userData - Updated user profile data
   * @returns {Promise} Updated user data
   */
  updateProfile: async userData => {
    try {
      const response = await api.put('/users/profile', userData);

      // Update stored user data
      storeUser(response.data.user);

      return response.data;
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update user password
   * @param {Object} passwordData - Object containing current and new password
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise} Password update response
   */
  updatePassword: async passwordData => {
    try {
      const response = await api.put('/users/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Password update error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete user account
   * @returns {Promise} Account deletion response
   */
  deleteAccount: async () => {
    try {
      const response = await api.delete('/users/account');

      // Remove token and user data on successful deletion
      removeToken();
      removeUser();

      return response.data;
    } catch (error) {
      console.error('Account deletion error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update notification settings
   * @param {Object} settings - Updated notification settings
   * @returns {Promise} Updated user data
   */
  updateNotificationSettings: async settings => {
    try {
      const response = await api.put('/users/notifications', settings);

      // Update stored user data
      storeUser(response.data.user);

      return response.data;
    } catch (error) {
      console.error('Notification settings update error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update security settings
   * @param {Object} settings - Security settings to update
   * @returns {Promise} Updated user data
   */
  updateSecuritySettings: async settings => {
    try {
      const response = await api.put('/users/security', settings);

      // Update stored user data
      storeUser(response.data.user);

      return response.data;
    } catch (error) {
      console.error('Security settings update error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Enable two-factor authentication
   * @returns {Promise} Two-factor setup data (QR code, secret)
   */
  enableTwoFactor: async () => {
    try {
      const response = await api.post('/users/2fa/enable');
      return response.data;
    } catch (error) {
      console.error('Two-factor enable error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Disable two-factor authentication
   * @returns {Promise} Response data
   */
  disableTwoFactor: async () => {
    try {
      const response = await api.post('/users/2fa/disable');
      return response.data;
    } catch (error) {
      console.error('Two-factor disable error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Generate a new API key
   * @param {string} name - Name for the API key
   * @returns {Promise} Generated API key data
   */
  generateApiKey: async name => {
    try {
      const response = await api.post('/users/api-keys', { name });
      return response.data;
    } catch (error) {
      console.error('API key generation error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Revoke an API key
   * @param {string} keyId - ID of the API key to revoke
   * @returns {Promise} Response data
   */
  revokeApiKey: async keyId => {
    try {
      const response = await api.delete(`/users/api-keys/${keyId}`);
      return response.data;
    } catch (error) {
      console.error('API key revocation error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default authService;

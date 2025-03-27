import api from './api';
import { storeToken, removeToken, storeUser, removeUser } from '../utils/storage';

/**
 * Authentication and user management service
 */
const authService = {
  /**
   * Log in a user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} Login response with user data and token
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const { token, user } = response.data;

      // Store authentication token and user data
      storeToken(token);
      storeUser(user);

      // Verify token was saved
      const savedToken = localStorage.getItem('token');
      console.log('Token saved verification:', !!savedToken);

      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);

      // Enhance error message with more context
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to log in. Please check your credentials.';

      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Registration response with user data and token
   */
  register: async userData => {
    try {
      const response = await api.post('/auth/register', userData);

      const { token, user } = response.data;

      // Store authentication token and user data
      storeToken(token);
      storeUser(user);

      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);

      // Get validation errors from the proper location in the response
      const validationErrors = error.response?.data?.errors;
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Registration failed. Please try again.';

      // Create enhanced error with properly structured validation errors
      const enhancedError = new Error(errorMessage);
      enhancedError.data = error.response?.data; // Include the full error data
      enhancedError.validationErrors = validationErrors;
      throw enhancedError;
    }
  },

  /**
   * Log out the current user
   * @returns {Promise<boolean>} Logout success status
   */
  logout: async () => {
    try {
      // Attempt to notify the server about logout
      await api.post('/auth/logout');
    } catch (error) {
      // Log error but continue with local logout
      console.warn('Logout server notification failed:', error.message);
    } finally {
      // Always remove local tokens and user data regardless of server response
      removeToken();
      removeUser();
      return true;
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
      console.error('Password reset request error:', error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to request password reset. Please try again later.';

      throw new Error(errorMessage);
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

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to reset password. The link may have expired.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Refresh authentication token
   * @returns {Promise<string>} New authentication token
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

      throw new Error('Your session has expired. Please log in again.');
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

      const validationErrors = error.response?.data?.errors;
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update profile. Please try again.';

      const enhancedError = new Error(errorMessage);
      enhancedError.validationErrors = validationErrors;
      throw enhancedError;
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

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update password. Please check your current password.';

      throw new Error(errorMessage);
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

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to delete account. Please try again later.';

      throw new Error(errorMessage);
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

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update notification settings.';

      throw new Error(errorMessage);
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

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update security settings.';

      throw new Error(errorMessage);
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

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to enable two-factor authentication.';

      throw new Error(errorMessage);
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

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to disable two-factor authentication.';

      throw new Error(errorMessage);
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

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to generate API key.';

      throw new Error(errorMessage);
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

      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Failed to revoke API key.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  /**
   * Get the current user from storage
   * @returns {Object|null} User data or null if not logged in
   */
  getCurrentUser: () => {
    try {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      removeUser(); // Clear corrupted data
      return null;
    }
  },
};

export default authService;

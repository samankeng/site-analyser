import {
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_ERROR,
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_ERROR,
  LOGOUT,
  USER_LOADED,
  AUTH_ERROR,
  UPDATE_PROFILE_REQUEST,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PROFILE_ERROR,
} from './types';
import authService from '../../services/authService';
import { setAlert } from './alertActions';
import { storeToken, removeToken, storeUser, removeUser } from '../../utils/storage';

/**
 * Load user data
 */
export const loadUser = () => async dispatch => {
  try {
    // Retrieve user data from local storage
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (storedUser) {
      dispatch({
        type: USER_LOADED,
        payload: storedUser,
      });
    }
  } catch (err) {
    dispatch({
      type: AUTH_ERROR,
    });
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 */
export const register = userData => async dispatch => {
  try {
    dispatch({ type: REGISTER_REQUEST });

    const response = await authService.register(userData);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: response.user,
    });

    dispatch(setAlert('Registration successful', 'success'));

    return response.user;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Registration failed' }];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));

    dispatch({
      type: REGISTER_ERROR,
      payload: errors,
    });

    return null;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 */
export const login = (email, password) => async dispatch => {
  try {
    dispatch({ type: LOGIN_REQUEST });

    const response = await authService.login(email, password);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: response.user,
    });

    dispatch(setAlert('Login successful', 'success'));

    return response.user;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Login failed' }];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));

    dispatch({
      type: LOGIN_ERROR,
      payload: errors,
    });

    return null;
  }
};

/**
 * Logout user
 */
export const logout = () => async dispatch => {
  try {
    await authService.logout();

    dispatch({ type: LOGOUT });

    dispatch(setAlert('Logged out successfully', 'success'));
  } catch (err) {
    dispatch(setAlert('Logout failed', 'error'));
  }
};

/**
 * Update user profile
 * @param {Object} userData - Updated user data
 */
export const updateProfile = userData => async dispatch => {
  try {
    dispatch({ type: UPDATE_PROFILE_REQUEST });

    const response = await authService.updateProfile(userData);

    dispatch({
      type: UPDATE_PROFILE_SUCCESS,
      payload: response.user,
    });

    dispatch(setAlert('Profile updated successfully', 'success'));

    return response.user;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Profile update failed' }];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));

    dispatch({
      type: UPDATE_PROFILE_ERROR,
      payload: errors,
    });

    return null;
  }
};

/**
 * Reset password
 * @param {string} email - User's email
 */
export const resetPassword = email => async dispatch => {
  try {
    await authService.requestPasswordReset(email);

    dispatch(setAlert('Password reset instructions sent', 'success'));
    return true;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Password reset failed' }];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));

    return false;
  }
};
/**
 * Check authentication status
 * Verifies if the user is currently authenticated
 */
export const checkAuthStatus = () => async dispatch => {
  try {
    // Check if token exists in local storage
    const token = localStorage.getItem('token');

    if (!token) {
      dispatch({
        type: AUTH_ERROR,
      });
      return false;
    }

    // Token exists, so load user data
    dispatch(loadUser());
    return true;
  } catch (err) {
    dispatch({
      type: AUTH_ERROR,
    });
    return false;
  }
};

/**
 * Delete user account
 * Permanently removes the user's account from the system
 */
export const deleteAccount = () => async dispatch => {
  try {
    // Call the API service to delete the account
    await authService.deleteAccount();

    // On successful deletion, log the user out
    dispatch({ type: LOGOUT });

    // Clear local storage data
    removeToken();
    removeUser();

    dispatch(setAlert('Account deleted successfully', 'success'));
    return true;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Account deletion failed' }];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));

    return false;
  }
};

/**
 * Update user password
 * @param {Object} passwordData - Object containing current and new password
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 */
export const updateUserPassword = passwordData => async dispatch => {
  try {
    // You might want to add action types for password update
    // dispatch({ type: UPDATE_PASSWORD_REQUEST });

    const response = await authService.updatePassword(passwordData);

    dispatch(setAlert('Password updated successfully', 'success'));

    return true;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Password update failed' }];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));

    return false;
  }
};

/**
 * Update user notification settings
 * @param {Object} settings - Notification settings
 */
export const updateNotificationSettings = settings => async dispatch => {
  try {
    // You might want to add action types for notification settings update
    // dispatch({ type: UPDATE_NOTIFICATION_SETTINGS_REQUEST });

    const response = await authService.updateNotificationSettings(settings);

    // Update user in Redux state with new notification settings
    dispatch({
      type: UPDATE_PROFILE_SUCCESS,
      payload: response.user,
    });

    dispatch(setAlert('Notification settings updated successfully', 'success'));
    return true;
  } catch (err) {
    const errors = err.response?.data?.errors || [
      { msg: 'Failed to update notification settings' },
    ];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    return false;
  }
};

/**
 * Update security settings
 * @param {Object} settings - Security settings to update
 */
export const updateSecuritySettings = settings => async dispatch => {
  try {
    const response = await authService.updateSecuritySettings(settings);

    // Update user in Redux state with new security settings
    dispatch({
      type: UPDATE_PROFILE_SUCCESS,
      payload: response.user,
    });

    dispatch(setAlert('Security settings updated successfully', 'success'));
    return true;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Failed to update security settings' }];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    return false;
  }
};

/**
 * Enable two-factor authentication
 */
export const enableTwoFactor = () => async dispatch => {
  try {
    const response = await authService.enableTwoFactor();
    return response;
  } catch (err) {
    const errors = err.response?.data?.errors || [
      { msg: 'Failed to enable two-factor authentication' },
    ];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    throw err;
  }
};

/**
 * Disable two-factor authentication
 */
export const disableTwoFactor = () => async dispatch => {
  try {
    await authService.disableTwoFactor();

    dispatch(setAlert('Two-factor authentication disabled successfully', 'success'));
    return true;
  } catch (err) {
    const errors = err.response?.data?.errors || [
      { msg: 'Failed to disable two-factor authentication' },
    ];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    throw err;
  }
};

/**
 * Generate a new API key
 * @param {string} name - Name for the API key
 */
export const generateApiKey = name => async dispatch => {
  try {
    const response = await authService.generateApiKey(name);
    return response;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Failed to generate API key' }];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    throw err;
  }
};

/**
 * Revoke an API key
 * @param {string} keyId - ID of the API key to revoke
 */
export const revokeApiKey = keyId => async dispatch => {
  try {
    await authService.revokeApiKey(keyId);

    dispatch(setAlert('API key revoked successfully', 'success'));
    return true;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Failed to revoke API key' }];

    errors.forEach(error => dispatch(setAlert(error.msg, 'error')));
    throw err;
  }
};

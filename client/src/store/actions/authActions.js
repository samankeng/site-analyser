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
  UPDATE_PASSWORD_REQUEST,
  UPDATE_PASSWORD_SUCCESS,
  UPDATE_PASSWORD_ERROR,
  UPDATE_NOTIFICATION_SETTINGS_REQUEST,
  UPDATE_NOTIFICATION_SETTINGS_SUCCESS,
  UPDATE_NOTIFICATION_SETTINGS_ERROR,
  UPDATE_SECURITY_SETTINGS_REQUEST,
  UPDATE_SECURITY_SETTINGS_SUCCESS,
  UPDATE_SECURITY_SETTINGS_ERROR,
  TWO_FACTOR_ENABLE_REQUEST,
  TWO_FACTOR_ENABLE_SUCCESS,
  TWO_FACTOR_ENABLE_ERROR,
  TWO_FACTOR_DISABLE_REQUEST,
  TWO_FACTOR_DISABLE_SUCCESS,
  TWO_FACTOR_DISABLE_ERROR,
  API_KEY_GENERATE_REQUEST,
  API_KEY_GENERATE_SUCCESS,
  API_KEY_GENERATE_ERROR,
  API_KEY_REVOKE_REQUEST,
  API_KEY_REVOKE_SUCCESS,
  API_KEY_REVOKE_ERROR,
  DELETE_ACCOUNT_REQUEST,
  DELETE_ACCOUNT_SUCCESS,
  DELETE_ACCOUNT_ERROR,
  PASSWORD_RESET_REQUEST,
  PASSWORD_RESET_SUCCESS,
  PASSWORD_RESET_ERROR,
} from './types';
import authService from '../../services/authService';
import { setAlert, setErrorAlert, setSuccessAlert } from './alertActions';
import { storeToken, removeToken, storeUser, removeUser } from '../../utils/storage';

/**
 * Load user data from local storage
 */
export const loadUser = () => async dispatch => {
  try {
    // Retrieve user data from local storage
    const storedUser = authService.getCurrentUser();

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
 * @returns {Promise<Object|null>} - Registered user data or null on failure
 */
export const register = userData => async dispatch => {
  dispatch({ type: REGISTER_REQUEST });

  try {
    const response = await authService.register(userData);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: response.user,
    });

    dispatch(setSuccessAlert('Registration successful'));

    return response.user;
  } catch (err) {
    console.error('Full error object:', JSON.stringify(err, null, 2));
    // Handle validation errors if they exist
    if (err.validationErrors) {
      // If it's an array, use it directly
      if (Array.isArray(err.validationErrors)) {
        err.validationErrors.forEach(error => dispatch(setErrorAlert(error.msg)));
      }
      // If it's an object, convert it to array first
      else {
        Object.keys(err.validationErrors).forEach(key => {
          dispatch(setErrorAlert(err.validationErrors[key]));
        });
      }
    } else {
      dispatch(setErrorAlert(err.message || 'Registration failed'));
    }

    dispatch({
      type: REGISTER_ERROR,
      payload: err.validationErrors || [{ msg: err.message || 'Registration failed' }],
    });

    return null;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object|null>} - User data or null on failure
 */
export const login = (email, password) => async dispatch => {
  dispatch({ type: LOGIN_REQUEST });

  try {
    const response = await authService.login(email, password);
    console.log('Login response:', response); // Add this for debugging

    dispatch({
      type: LOGIN_SUCCESS,
      payload: {
        // Include both user and token in the payload
        user: response.user,
        token: response.token,
      },
    });

    dispatch(setSuccessAlert('Login successful'));

    return response.user;
  } catch (err) {
    dispatch(setErrorAlert(err.message || 'Login failed. Please check your credentials.'));

    dispatch({
      type: LOGIN_ERROR,
      payload: err.validationErrors || [{ msg: err.message || 'Login failed' }],
    });

    return null;
  }
};

/**
 * Logout user
 * @returns {Promise<boolean>} - Success status
 */
export const logout = () => async dispatch => {
  try {
    await authService.logout();

    dispatch({ type: LOGOUT });
    dispatch(setSuccessAlert('Logged out successfully'));

    return true;
  } catch (err) {
    // Even if server logout fails, we should still clear local state
    dispatch({ type: LOGOUT });
    dispatch(setErrorAlert('Logout encountered an issue, but you have been logged out locally.'));

    return true;
  }
};

/**
 * Update user profile
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object|null>} - Updated user data or null on failure
 */
export const updateProfile = userData => async dispatch => {
  dispatch({ type: UPDATE_PROFILE_REQUEST });

  try {
    const response = await authService.updateProfile(userData);

    dispatch({
      type: UPDATE_PROFILE_SUCCESS,
      payload: response.user,
    });

    dispatch(setSuccessAlert('Profile updated successfully'));

    return response.user;
  } catch (err) {
    if (err.validationErrors) {
      err.validationErrors.forEach(error => dispatch(setErrorAlert(error.msg)));
    } else {
      dispatch(setErrorAlert(err.message || 'Profile update failed'));
    }

    dispatch({
      type: UPDATE_PROFILE_ERROR,
      payload: err.validationErrors || [{ msg: err.message || 'Profile update failed' }],
    });

    return null;
  }
};

/**
 * Reset password
 * @param {string} email - User's email
 * @returns {Promise<boolean>} - Success status
 */
export const resetPassword = email => async dispatch => {
  dispatch({ type: PASSWORD_RESET_REQUEST });

  try {
    await authService.requestPasswordReset(email);

    dispatch({ type: PASSWORD_RESET_SUCCESS });
    dispatch(setSuccessAlert('Password reset instructions sent to your email'));

    return true;
  } catch (err) {
    dispatch({ type: PASSWORD_RESET_ERROR, payload: err.message });
    dispatch(setErrorAlert(err.message || 'Password reset request failed'));

    return false;
  }
};

/**
 * Check authentication status
 * @returns {Promise<boolean>} - Authentication status
 */
export const checkAuthStatus = () => async dispatch => {
  try {
    // Use the authentication service to check status
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
      dispatch({ type: AUTH_ERROR });
      return false;
    }

    // If authenticated, load user data
    dispatch(loadUser());
    return true;
  } catch (err) {
    dispatch({ type: AUTH_ERROR });
    return false;
  }
};

/**
 * Delete user account
 * @returns {Promise<boolean>} - Success status
 */
export const deleteAccount = () => async dispatch => {
  dispatch({ type: DELETE_ACCOUNT_REQUEST });

  try {
    await authService.deleteAccount();

    dispatch({ type: DELETE_ACCOUNT_SUCCESS });
    dispatch({ type: LOGOUT });
    dispatch(setSuccessAlert('Account deleted successfully'));

    return true;
  } catch (err) {
    dispatch({ type: DELETE_ACCOUNT_ERROR, payload: err.message });
    dispatch(setErrorAlert(err.message || 'Account deletion failed'));

    return false;
  }
};

/**
 * Update user password
 * @param {Object} passwordData - Object containing current and new password
 * @returns {Promise<boolean>} - Success status
 */
export const updateUserPassword = passwordData => async dispatch => {
  dispatch({ type: UPDATE_PASSWORD_REQUEST });

  try {
    await authService.updatePassword(passwordData);

    dispatch({ type: UPDATE_PASSWORD_SUCCESS });
    dispatch(setSuccessAlert('Password updated successfully'));

    return true;
  } catch (err) {
    dispatch({ type: UPDATE_PASSWORD_ERROR, payload: err.message });
    dispatch(setErrorAlert(err.message || 'Password update failed'));

    return false;
  }
};

/**
 * Update user notification settings
 * @param {Object} settings - Notification settings
 * @returns {Promise<boolean>} - Success status
 */
export const updateNotificationSettings = settings => async dispatch => {
  dispatch({ type: UPDATE_NOTIFICATION_SETTINGS_REQUEST });

  try {
    const response = await authService.updateNotificationSettings(settings);

    dispatch({
      type: UPDATE_NOTIFICATION_SETTINGS_SUCCESS,
      payload: response.user,
    });

    dispatch(setSuccessAlert('Notification settings updated successfully'));

    return true;
  } catch (err) {
    dispatch({ type: UPDATE_NOTIFICATION_SETTINGS_ERROR, payload: err.message });
    dispatch(setErrorAlert(err.message || 'Failed to update notification settings'));

    return false;
  }
};

/**
 * Update security settings
 * @param {Object} settings - Security settings to update
 * @returns {Promise<boolean>} - Success status
 */
export const updateSecuritySettings = settings => async dispatch => {
  dispatch({ type: UPDATE_SECURITY_SETTINGS_REQUEST });

  try {
    const response = await authService.updateSecuritySettings(settings);

    dispatch({
      type: UPDATE_SECURITY_SETTINGS_SUCCESS,
      payload: response.user,
    });

    dispatch(setSuccessAlert('Security settings updated successfully'));

    return true;
  } catch (err) {
    dispatch({ type: UPDATE_SECURITY_SETTINGS_ERROR, payload: err.message });
    dispatch(setErrorAlert(err.message || 'Failed to update security settings'));

    return false;
  }
};

/**
 * Enable two-factor authentication
 * @returns {Promise<Object>} - Two-factor setup data
 */
export const enableTwoFactor = () => async dispatch => {
  dispatch({ type: TWO_FACTOR_ENABLE_REQUEST });

  try {
    const response = await authService.enableTwoFactor();

    dispatch({ type: TWO_FACTOR_ENABLE_SUCCESS });

    return response;
  } catch (err) {
    dispatch({ type: TWO_FACTOR_ENABLE_ERROR, payload: err.message });
    dispatch(setErrorAlert(err.message || 'Failed to enable two-factor authentication'));

    throw err;
  }
};

/**
 * Disable two-factor authentication
 * @returns {Promise<boolean>} - Success status
 */
export const disableTwoFactor = () => async dispatch => {
  dispatch({ type: TWO_FACTOR_DISABLE_REQUEST });

  try {
    await authService.disableTwoFactor();

    dispatch({ type: TWO_FACTOR_DISABLE_SUCCESS });
    dispatch(setSuccessAlert('Two-factor authentication disabled successfully'));

    return true;
  } catch (err) {
    dispatch({ type: TWO_FACTOR_DISABLE_ERROR, payload: err.message });
    dispatch(setErrorAlert(err.message || 'Failed to disable two-factor authentication'));

    throw err;
  }
};

/**
 * Generate a new API key
 * @param {string} name - Name for the API key
 * @returns {Promise<Object>} - Generated API key data
 */
export const generateApiKey = name => async dispatch => {
  dispatch({ type: API_KEY_GENERATE_REQUEST });

  try {
    const response = await authService.generateApiKey(name);

    dispatch({ type: API_KEY_GENERATE_SUCCESS });

    return response;
  } catch (err) {
    dispatch({ type: API_KEY_GENERATE_ERROR, payload: err.message });
    dispatch(setErrorAlert(err.message || 'Failed to generate API key'));

    throw err;
  }
};

/**
 * Revoke an API key
 * @param {string} keyId - ID of the API key to revoke
 * @returns {Promise<boolean>} - Success status
 */
export const revokeApiKey = keyId => async dispatch => {
  dispatch({ type: API_KEY_REVOKE_REQUEST });

  try {
    await authService.revokeApiKey(keyId);

    dispatch({ type: API_KEY_REVOKE_SUCCESS });
    dispatch(setSuccessAlert('API key revoked successfully'));

    return true;
  } catch (err) {
    dispatch({ type: API_KEY_REVOKE_ERROR, payload: err.message });
    dispatch(setErrorAlert(err.message || 'Failed to revoke API key'));

    throw err;
  }
};

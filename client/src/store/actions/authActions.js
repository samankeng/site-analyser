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
  UPDATE_PROFILE_ERROR
} from './types';
import authService from '../../services/authService';
import { setAlert } from './alertActions';
import { 
  storeToken, 
  removeToken, 
  storeUserData, 
  removeUserData 
} from '../../utils/storage';

/**
 * Load user data
 */
export const loadUser = () => async (dispatch) => {
  try {
    // Retrieve user data from local storage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    
    if (storedUser) {
      dispatch({
        type: USER_LOADED,
        payload: storedUser
      });
    }
  } catch (err) {
    dispatch({
      type: AUTH_ERROR
    });
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 */
export const register = (userData) => async (dispatch) => {
  try {
    dispatch({ type: REGISTER_REQUEST });

    const response = await authService.register(userData);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: response.user
    });

    dispatch(setAlert('Registration successful', 'success'));

    return response.user;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Registration failed' }];

    errors.forEach(error => 
      dispatch(setAlert(error.msg, 'error'))
    );

    dispatch({
      type: REGISTER_ERROR,
      payload: errors
    });

    return null;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 */
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: LOGIN_REQUEST });

    const response = await authService.login(email, password);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: response.user
    });

    dispatch(setAlert('Login successful', 'success'));

    return response.user;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Login failed' }];

    errors.forEach(error => 
      dispatch(setAlert(error.msg, 'error'))
    );

    dispatch({
      type: LOGIN_ERROR,
      payload: errors
    });

    return null;
  }
};

/**
 * Logout user
 */
export const logout = () => async (dispatch) => {
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
export const updateProfile = (userData) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_PROFILE_REQUEST });

    const response = await authService.updateProfile(userData);

    dispatch({
      type: UPDATE_PROFILE_SUCCESS,
      payload: response.user
    });

    dispatch(setAlert('Profile updated successfully', 'success'));

    return response.user;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Profile update failed' }];

    errors.forEach(error => 
      dispatch(setAlert(error.msg, 'error'))
    );

    dispatch({
      type: UPDATE_PROFILE_ERROR,
      payload: errors
    });

    return null;
  }
};

/**
 * Reset password
 * @param {string} email - User's email
 */
export const resetPassword = (email) => async (dispatch) => {
  try {
    await authService.requestPasswordReset(email);

    dispatch(setAlert('Password reset instructions sent', 'success'));
    return true;
  } catch (err) {
    const errors = err.response?.data?.errors || [{ msg: 'Password reset failed' }];

    errors.forEach(error => 
      dispatch(setAlert(error.msg, 'error'))
    );

    return false;
  }
};

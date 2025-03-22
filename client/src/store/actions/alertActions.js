import { v4 as uuidv4 } from 'uuid';
import { SET_ALERT, REMOVE_ALERT, CLEAR_ALL_ALERTS } from './types';

// Using object constants for alert types to prevent typos
export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Set an alert with a unique ID
 * @param {string} msg - Alert message
 * @param {string} alertType - Type of alert (success, error, warning, info)
 * @param {Object} options - Additional alert options
 * @param {number} [options.timeout=5000] - Time before alert automatically dismisses (0 for no auto-dismiss)
 * @param {boolean} [options.dismissible=true] - Whether the alert can be manually dismissed
 * @param {string} [options.title] - Optional alert title
 * @param {string} [options.position='bottom'] - Alert position (top, bottom, top-left, etc.)
 */
export const setAlert =
  (msg, alertType = ALERT_TYPES.INFO, options = {}) =>
  dispatch => {
    const { timeout = 5000, dismissible = true, title = '', position = 'bottom' } = options;

    const id = uuidv4();

    dispatch({
      type: SET_ALERT,
      payload: { msg, alertType, id, dismissible, title, position },
    });

    // Automatically remove alert after timeout if timeout > 0
    if (timeout > 0) {
      setTimeout(() => {
        dispatch({
          type: REMOVE_ALERT,
          payload: id,
        });
      }, timeout);
    }

    // Return the alert ID so it can be referenced later if needed
    return id;
  };

/**
 * Set an error alert with a message
 * @param {string} msg - Error message
 * @param {Object} options - Additional alert options
 * @returns {string} Alert ID
 */
export const setErrorAlert = (msg, options = {}) => setAlert(msg, ALERT_TYPES.ERROR, options);

/**
 * Set a success alert with a message
 * @param {string} msg - Success message
 * @param {Object} options - Additional alert options
 * @returns {string} Alert ID
 */
export const setSuccessAlert = (msg, options = {}) => setAlert(msg, ALERT_TYPES.SUCCESS, options);

/**
 * Set a warning alert with a message
 * @param {string} msg - Warning message
 * @param {Object} options - Additional alert options
 * @returns {string} Alert ID
 */
export const setWarningAlert = (msg, options = {}) => setAlert(msg, ALERT_TYPES.WARNING, options);

/**
 * Set an info alert with a message
 * @param {string} msg - Info message
 * @param {Object} options - Additional alert options
 * @returns {string} Alert ID
 */
export const setInfoAlert = (msg, options = {}) => setAlert(msg, ALERT_TYPES.INFO, options);

/**
 * Remove a specific alert by its ID
 * @param {string} id - Unique identifier of the alert to remove
 */
export const removeAlert = id => ({
  type: REMOVE_ALERT,
  payload: id,
});

/**
 * Clear all alerts
 */
export const clearAlerts = () => ({
  type: CLEAR_ALL_ALERTS,
});

/**
 * Create an alert from an API error response
 * @param {Error} error - Error object, typically from an API call
 * @param {Object} options - Additional alert options
 * @returns {Function} Dispatch function to set the alert
 */
export const setAlertFromError =
  (error, options = {}) =>
  dispatch => {
    let errorMessage;

    // Extract error message from various possible error structures
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    } else {
      errorMessage = 'An unknown error occurred';
    }

    return dispatch(setErrorAlert(errorMessage, options));
  };

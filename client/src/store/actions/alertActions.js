import { v4 as uuidv4 } from 'uuid';
import {
  SET_ALERT,
  REMOVE_ALERT
} from './types';

/**
 * Set an alert with a unique ID
 * @param {string} msg - Alert message
 * @param {string} alertType - Type of alert (success, error, warning, info)
 * @param {number} [timeout=5000] - Time before alert automatically dismisses
 */
export const setAlert = (msg, alertType, timeout = 5000) => dispatch => {
  const id = uuidv4();

  dispatch({
    type: SET_ALERT,
    payload: { msg, alertType, id }
  });

  // Automatically remove alert after timeout
  setTimeout(() => dispatch({
    type: REMOVE_ALERT,
    payload: id
  }), timeout);
};

/**
 * Remove a specific alert by its ID
 * @param {string} id - Unique identifier of the alert to remove
 */
export const removeAlert = (id) => ({
  type: REMOVE_ALERT,
  payload: id
});

/**
 * Clear all alerts
 */
export const clearAlerts = () => dispatch => {
  dispatch({
    type: 'CLEAR_ALL_ALERTS'
  });
};

import { createSelector } from 'reselect';

// Get the entire alerts state
const getAlertsState = (state) => state.alerts;

/**
 * Select all alerts
 */
export const selectAlerts = createSelector(
  [getAlertsState],
  (alerts) => alerts
);

/**
 * Select alerts by type
 * @param {string} alertType - Type of alert to filter (e.g., 'success', 'error')
 */
export const selectAlertsByType = createSelector(
  [getAlertsState, (_, alertType) => alertType],
  (alerts, alertType) => alerts.filter(alert => alert.alertType === alertType)
);

/**
 * Check if there are any alerts
 */
export const selectHasAlerts = createSelector(
  [getAlertsState],
  (alerts) => alerts.length > 0
);

/**
 * Get the most recent alert
 */
export const selectLatestAlert = createSelector(
  [getAlertsState],
  (alerts) => alerts.length > 0 ? alerts[alerts.length - 1] : null
);

/**
 * Count alerts by type
 */
export const selectAlertCounts = createSelector(
  [getAlertsState],
  (alerts) => {
    return alerts.reduce((counts, alert) => {
      counts[alert.alertType] = (counts[alert.alertType] || 0) + 1;
      return counts;
    }, {});
  }
);

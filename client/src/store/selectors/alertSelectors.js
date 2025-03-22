// For React 19 and MUI v6, we can continue using createSelector from reselect
// React 19 doesn't affect selectors directly, but there might be changes in how state is structured
import { createSelector } from 'reselect';

// Get the entire alerts state
const getAlertsState = state => state.alerts;

/**
 * Select all alerts
 */
export const selectAlerts = createSelector([getAlertsState], alerts => alerts);

/**
 * Select alerts by type
 * @param {string} alertType - Type of alert to filter (e.g., 'success', 'error', 'warning', 'info')
 */
export const selectAlertsByType = createSelector(
  [selectAlerts, (_, alertType) => alertType],
  (alerts, alertType) => alerts.filter(alert => alert.alertType === alertType)
);

/**
 * Check if there are any alerts
 */
export const selectHasAlerts = createSelector([selectAlerts], alerts => alerts.length > 0);

/**
 * Get the most recent alert
 */
export const selectLatestAlert = createSelector([selectAlerts], alerts =>
  alerts.length > 0 ? alerts[alerts.length - 1] : null
);

/**
 * Count alerts by type
 * This is compatible with MUI v6 alert types: 'success', 'error', 'warning', 'info'
 */
export const selectAlertCounts = createSelector([selectAlerts], alerts => {
  return alerts.reduce((counts, alert) => {
    counts[alert.alertType] = (counts[alert.alertType] || 0) + 1;
    return counts;
  }, {});
});

/**
 * Get alerts by severity (MUI v6 terminology)
 * MUI v6 uses 'severity' consistently instead of alternating between type/severity
 */
export const selectAlertsBySeverity = createSelector(
  [selectAlerts, (_, severity) => severity],
  (alerts, severity) => alerts.filter(alert => alert.severity === severity)
);

/**
 * Get alerts that are currently visible (not dismissed)
 */
export const selectVisibleAlerts = createSelector([selectAlerts], alerts =>
  alerts.filter(alert => !alert.dismissed)
);

import { createSelector } from 'reselect';

// Get the entire scans state
const getScansState = (state) => state.scans;

/**
 * Select the current scan
 */
export const selectCurrentScan = createSelector(
  [getScansState],
  (scans) => scans.scan
);

/**
 * Select scan status
 */
export const selectScanStatus = createSelector(
  [getScansState],
  (scans) => scans.status
);

/**
 * Select scan results
 */
export const selectScanResults = createSelector(
  [getScansState],
  (scans) => scans.results
);

/**
 * Select recent scans
 */
export const selectRecentScans = createSelector(
  [getScansState],
  (scans) => scans.recentScans
);

/**
 * Check if a scan is currently loading
 */
export const selectIsScanLoading = createSelector(
  [getScansState],
  (scans) => scans.loading
);

/**
 * Check if scan status is loading
 */
export const selectIsScanStatusLoading = createSelector(
  [getScansState],
  (scans) => scans.statusLoading
);

/**
 * Check if scan results are loading
 */
export const selectAreScanResultsLoading = createSelector(
  [getScansState],
  (scans) => scans.resultsLoading
);

/**
 * Get scan error
 */
export const selectScanError = createSelector(
  [getScansState],
  (scans) => scans.error
);

/**
 * Select scans by status
 * @param {string} status - Scan status to filter
 */
export const selectScansByStatus = createSelector(
  [selectRecentScans, (_, status) => status],
  (recentScans, status) => recentScans.filter(scan => scan.status === status)
);

/**
 * Select scans performed within a specific time frame
 * @param {number} days - Number of days to look back
 */
export const selectRecentScansInDays = createSelector(
  [selectRecentScans, (_, days) => days],
  (recentScans, days) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return recentScans.filter(scan => {
      const scanDate = new Date(scan.createdAt);
      return scanDate >= cutoffDate;
    });
  }
);

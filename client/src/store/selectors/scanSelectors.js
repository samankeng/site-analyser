import { createSelector } from 'reselect';

// Get the entire scans state
const getScansState = state => state.scans;

/**
 * Select the current scan
 */
export const selectCurrentScan = createSelector([getScansState], scans => scans.scan);

/**
 * Select scan status
 */
export const selectScanStatus = createSelector([getScansState], scans => scans.status);

/**
 * Select scan results
 */
export const selectScanResults = createSelector([getScansState], scans => scans.results);

/**
 * Select recent scans
 */
export const selectRecentScans = createSelector([getScansState], scans => scans.recentScans);

/**
 * Check if a scan is currently loading
 */
export const selectIsScanLoading = createSelector([getScansState], scans => scans.loading);

/**
 * Check if scan status is loading
 */
export const selectIsScanStatusLoading = createSelector(
  [getScansState],
  scans => scans.statusLoading
);

/**
 * Check if scan results are loading
 */
export const selectAreScanResultsLoading = createSelector(
  [getScansState],
  scans => scans.resultsLoading
);

/**
 * Get scan error
 */
export const selectScanError = createSelector([getScansState], scans => scans.error);

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

/**
 * Select in-progress scans
 * Takes advantage of MUI v6's standardized status naming
 */
export const selectInProgressScans = createSelector([selectRecentScans], recentScans =>
  recentScans.filter(scan => scan.status === 'in_progress' || scan.status === 'processing')
);

/**
 * Select completed scans with issues found
 */
export const selectScansWithIssues = createSelector([selectRecentScans], recentScans =>
  recentScans.filter(
    scan => scan.status === 'completed' && scan.issuesFound && scan.issuesFound > 0
  )
);

/**
 * Get the most recent completed scan
 */
export const selectLatestCompletedScan = createSelector([selectRecentScans], recentScans => {
  const completedScans = recentScans.filter(scan => scan.status === 'completed');

  if (completedScans.length === 0) return null;

  return completedScans.reduce((latest, current) => {
    const latestDate = new Date(latest.completedAt || latest.createdAt);
    const currentDate = new Date(current.completedAt || current.createdAt);

    return currentDate > latestDate ? current : latest;
  }, completedScans[0]);
});

/**
 * Memoized selector for scan statistics (compatible with MUI v6 data display components)
 */
export const selectScanStatistics = createSelector([selectRecentScans], recentScans => {
  const total = recentScans.length;
  const completed = recentScans.filter(scan => scan.status === 'completed').length;
  const failed = recentScans.filter(scan => scan.status === 'failed').length;
  const inProgress = recentScans.filter(scan =>
    ['in_progress', 'processing'].includes(scan.status)
  ).length;

  return {
    total,
    completed,
    failed,
    inProgress,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
});

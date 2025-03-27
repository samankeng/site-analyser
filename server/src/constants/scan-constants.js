/**
 * Constants for scan statuses
 * Provides consistent status references across frontend and backend
 */
const SCAN_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * Constants for scan depth
 */
const SCAN_DEPTH = {
  BASIC: 1,
  STANDARD: 2,
  COMPREHENSIVE: 3,
};

/**
 * Constants for scan option names
 * These should match exactly the option names in the backend Scan model
 */
const SCAN_OPTIONS = {
  SSL_CHECK: 'sslCheck',
  HEADER_ANALYSIS: 'headerAnalysis',
  PORT_SCAN: 'portScan',
  VULN_DETECTION: 'vulnDetection',
  CONTENT_ANALYSIS: 'contentAnalysis',
  PERFORMANCE_CHECK: 'performanceCheck',
};

/**
 * API route constants
 */
const API_ROUTES = {
  SCAN: {
    BASE: '/scans',
    START: '/scans',
    STATUS: '/scans/:scanId',
    RESULTS: '/scans/:scanId/results',
    CANCEL: '/scans/:scanId',
    RECENT: '/scans/recent',
  },
};

module.exports = {
  SCAN_STATUS,
  SCAN_DEPTH,
  SCAN_OPTIONS,
  API_ROUTES,
};

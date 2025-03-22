import {
  SCAN_REQUEST,
  SCAN_SUCCESS,
  SCAN_ERROR,
  SCAN_STATUS_REQUEST,
  SCAN_STATUS_SUCCESS,
  SCAN_STATUS_ERROR,
  SCAN_RESULTS_REQUEST,
  SCAN_RESULTS_SUCCESS,
  SCAN_RESULTS_ERROR,
  SCAN_CANCEL_REQUEST,
  SCAN_CANCEL_SUCCESS,
  SCAN_CANCEL_ERROR,
  RECENT_SCANS_REQUEST,
  RECENT_SCANS_SUCCESS,
  RECENT_SCANS_ERROR,
  CLEAR_SCAN_STATE,
} from '../actions/types';

/**
 * Initial state for scan management
 * Structured for React 19 compatibility
 */
const initialState = {
  loading: false,
  statusLoading: false,
  resultsLoading: false,
  cancelLoading: false,
  recentScansLoading: false,
  scan: null,
  status: null,
  results: null,
  recentScans: [],
  error: null,
  lastUpdated: null, // Timestamp for React 19 change detection
};

/**
 * Scan reducer - manages scanning state
 * Updated for React 19 and MUI v6 compatibility
 */
const scanReducer = (state = initialState, action) => {
  switch (action.type) {
    // New scan
    case SCAN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SCAN_SUCCESS:
      return {
        ...state,
        loading: false,
        scan: action.payload ? { ...action.payload } : null,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case SCAN_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Scan status
    case SCAN_STATUS_REQUEST:
      return {
        ...state,
        statusLoading: true,
        error: null,
      };

    case SCAN_STATUS_SUCCESS:
      return {
        ...state,
        statusLoading: false,
        status: action.payload ? { ...action.payload } : null,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case SCAN_STATUS_ERROR:
      return {
        ...state,
        statusLoading: false,
        error: action.payload,
      };

    // Scan results
    case SCAN_RESULTS_REQUEST:
      return {
        ...state,
        resultsLoading: true,
        error: null,
      };

    case SCAN_RESULTS_SUCCESS:
      return {
        ...state,
        resultsLoading: false,
        results: action.payload
          ? Array.isArray(action.payload)
            ? [...action.payload]
            : { ...action.payload }
          : null,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case SCAN_RESULTS_ERROR:
      return {
        ...state,
        resultsLoading: false,
        error: action.payload,
      };

    // Cancel scan
    case SCAN_CANCEL_REQUEST:
      return {
        ...state,
        cancelLoading: true,
        error: null,
      };

    case SCAN_CANCEL_SUCCESS:
      return {
        ...state,
        cancelLoading: false,
        // Ensure scan exists before updating its properties
        scan: state.scan
          ? {
              ...state.scan,
              status: 'cancelled',
            }
          : null,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case SCAN_CANCEL_ERROR:
      return {
        ...state,
        cancelLoading: false,
        error: action.payload,
      };

    // Recent scans
    case RECENT_SCANS_REQUEST:
      return {
        ...state,
        recentScansLoading: true,
        error: null,
      };

    case RECENT_SCANS_SUCCESS:
      return {
        ...state,
        recentScansLoading: false,
        recentScans: Array.isArray(action.payload) ? [...action.payload] : [],
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case RECENT_SCANS_ERROR:
      return {
        ...state,
        recentScansLoading: false,
        error: action.payload,
      };

    // Clear state
    case CLEAR_SCAN_STATE:
      return {
        ...initialState,
        lastUpdated: new Date().toISOString(),
      };

    default:
      return state;
  }
};

// Optional selectors for easier component access
export const selectScan = state => state.scans.scan;
export const selectScanStatus = state => state.scans.status;
export const selectScanResults = state => state.scans.results;
export const selectRecentScans = state => state.scans.recentScans;
export const selectScanLoading = state => state.scans.loading;
export const selectStatusLoading = state => state.scans.statusLoading;
export const selectResultsLoading = state => state.scans.resultsLoading;
export const selectScanError = state => state.scans.error;

export default scanReducer;

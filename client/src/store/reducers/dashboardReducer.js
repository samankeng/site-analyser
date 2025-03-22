import {
  DASHBOARD_DATA_REQUEST,
  DASHBOARD_DATA_SUCCESS,
  DASHBOARD_DATA_ERROR,
  SECURITY_SCORE_REQUEST,
  SECURITY_SCORE_SUCCESS,
  SECURITY_SCORE_ERROR,
  RECENT_ALERTS_REQUEST,
  RECENT_ALERTS_SUCCESS,
  RECENT_ALERTS_ERROR,
} from '../actions/types';

/**
 * Initial state for dashboard data
 * Structured to work well with React 19's rendering optimizations
 */
const initialState = {
  loading: false,
  securityScoreLoading: false,
  alertsLoading: false,
  recentScans: [],
  recentAlerts: [],
  securityScore: null,
  error: null,
  lastUpdated: null, // Added timestamp for React 19 change detection
};

/**
 * Dashboard reducer - manages dashboard state
 * Updated for React 19 and MUI v6 compatibility
 */
const dashboardReducer = (state = initialState, action) => {
  switch (action.type) {
    // Dashboard full data
    case DASHBOARD_DATA_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case DASHBOARD_DATA_SUCCESS:
      return {
        ...state,
        loading: false,
        recentScans: Array.isArray(action.payload.recentScans)
          ? [...action.payload.recentScans]
          : [],
        recentAlerts: Array.isArray(action.payload.recentAlerts)
          ? [...action.payload.recentAlerts]
          : [],
        securityScore: action.payload.securityScore,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case DASHBOARD_DATA_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Security Score
    case SECURITY_SCORE_REQUEST:
      return {
        ...state,
        securityScoreLoading: true,
        error: null,
      };

    case SECURITY_SCORE_SUCCESS:
      return {
        ...state,
        securityScoreLoading: false,
        securityScore: action.payload,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case SECURITY_SCORE_ERROR:
      return {
        ...state,
        securityScoreLoading: false,
        error: action.payload,
      };

    // Recent Alerts
    case RECENT_ALERTS_REQUEST:
      return {
        ...state,
        alertsLoading: true,
        error: null,
      };

    case RECENT_ALERTS_SUCCESS:
      return {
        ...state,
        alertsLoading: false,
        recentAlerts: Array.isArray(action.payload) ? [...action.payload] : [],
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case RECENT_ALERTS_ERROR:
      return {
        ...state,
        alertsLoading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

// Export selectors for easier component access
export const selectDashboardData = state => state.dashboard;
export const selectSecurityScore = state => state.dashboard.securityScore;
export const selectRecentAlerts = state => state.dashboard.recentAlerts;
export const selectRecentScans = state => state.dashboard.recentScans;
export const selectIsLoading = state =>
  state.dashboard.loading || state.dashboard.securityScoreLoading || state.dashboard.alertsLoading;

export default dashboardReducer;

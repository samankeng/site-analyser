import {
  DASHBOARD_DATA_REQUEST,
  DASHBOARD_DATA_SUCCESS,
  DASHBOARD_DATA_ERROR,
  SECURITY_SCORE_REQUEST,
  SECURITY_SCORE_SUCCESS,
  SECURITY_SCORE_ERROR,
  RECENT_ALERTS_REQUEST,
  RECENT_ALERTS_SUCCESS,
  RECENT_ALERTS_ERROR
} from '../actions/types';

const initialState = {
  loading: false,
  securityScoreLoading: false,
  alertsLoading: false,
  recentScans: [],
  recentAlerts: [],
  securityScore: null,
  error: null
};

const dashboardReducer = (state = initialState, action) => {
  switch (action.type) {
    // Dashboard full data
    case DASHBOARD_DATA_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case DASHBOARD_DATA_SUCCESS:
      return {
        ...state,
        loading: false,
        recentScans: action.payload.recentScans,
        recentAlerts: action.payload.recentAlerts,
        securityScore: action.payload.securityScore,
        error: null
      };
    case DASHBOARD_DATA_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Security Score
    case SECURITY_SCORE_REQUEST:
      return {
        ...state,
        securityScoreLoading: true,
        error: null
      };
    case SECURITY_SCORE_SUCCESS:
      return {
        ...state,
        securityScoreLoading: false,
        securityScore: action.payload,
        error: null
      };
    case SECURITY_SCORE_ERROR:
      return {
        ...state,
        securityScoreLoading: false,
        error: action.payload
      };

    // Recent Alerts
    case RECENT_ALERTS_REQUEST:
      return {
        ...state,
        alertsLoading: true,
        error: null
      };
    case RECENT_ALERTS_SUCCESS:
      return {
        ...state,
        alertsLoading: false,
        recentAlerts: action.payload,
        error: null
      };
    case RECENT_ALERTS_ERROR:
      return {
        ...state,
        alertsLoading: false,
        error: action.payload
      };

    default:
      return state;
  }
};

export default dashboardReducer;

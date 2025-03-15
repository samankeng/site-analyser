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
  error: null
};

const scanReducer = (state = initialState, action) => {
  switch (action.type) {
    // New scan
    case SCAN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case SCAN_SUCCESS:
      return {
        ...state,
        loading: false,
        scan: action.payload,
        error: null
      };
    case SCAN_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    // Scan status
    case SCAN_STATUS_REQUEST:
      return {
        ...state,
        statusLoading: true,
        error: null
      };
    case SCAN_STATUS_SUCCESS:
      return {
        ...state,
        statusLoading: false,
        status: action.payload,
        error: null
      };
    case SCAN_STATUS_ERROR:
      return {
        ...state,
        statusLoading: false,
        error: action.payload
      };
    
    // Scan results
    case SCAN_RESULTS_REQUEST:
      return {
        ...state,
        resultsLoading: true,
        error: null
      };
    case SCAN_RESULTS_SUCCESS:
      return {
        ...state,
        resultsLoading: false,
        results: action.payload,
        error: null
      };
    case SCAN_RESULTS_ERROR:
      return {
        ...state,
        resultsLoading: false,
        error: action.payload
      };
    
    // Cancel scan
    case SCAN_CANCEL_REQUEST:
      return {
        ...state,
        cancelLoading: true,
        error: null
      };
    case SCAN_CANCEL_SUCCESS:
      return {
        ...state,
        cancelLoading: false,
        scan: {
          ...state.scan,
          status: 'cancelled'
        },
        error: null
      };
    case SCAN_CANCEL_ERROR:
      return {
        ...state,
        cancelLoading: false,
        error: action.payload
      };
    
    // Recent scans
    case RECENT_SCANS_REQUEST:
      return {
        ...state,
        recentScansLoading: true,
        error: null
      };
    case RECENT_SCANS_SUCCESS:
      return {
        ...state,
        recentScansLoading: false,
        recentScans: action.payload,
        error: null
      };
    case RECENT_SCANS_ERROR:
      return {
        ...state,
        recentScansLoading: false,
        error: action.payload
      };
    
    // Clear state
    case CLEAR_SCAN_STATE:
      return {
        ...initialState
      };
      
    default:
      return state;
  }
};

export default scanReducer;
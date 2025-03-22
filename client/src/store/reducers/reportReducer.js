import {
  REPORT_LIST_REQUEST,
  REPORT_LIST_SUCCESS,
  REPORT_LIST_ERROR,
  REPORT_DETAILS_REQUEST,
  REPORT_DETAILS_SUCCESS,
  REPORT_DETAILS_ERROR,
  REPORT_GENERATE_REQUEST,
  REPORT_GENERATE_SUCCESS,
  REPORT_GENERATE_ERROR,
  REPORT_DELETE_REQUEST,
  REPORT_DELETE_SUCCESS,
  REPORT_DELETE_ERROR,
} from '../actions/types';

/**
 * Initial state for reports management
 * Structured for React 19 compatibility
 */
const initialState = {
  reports: [],
  currentReport: null,
  loading: false,
  detailsLoading: false,
  generateLoading: false,
  deleteLoading: false,
  error: null,
  lastUpdated: null, // Timestamp for React 19 change detection
};

/**
 * Report reducer - manages report state
 * Updated for React 19 and MUI v6 compatibility
 */
const reportReducer = (state = initialState, action) => {
  switch (action.type) {
    // Report List
    case REPORT_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case REPORT_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        reports: Array.isArray(action.payload) ? [...action.payload] : [],
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case REPORT_LIST_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Report Details
    case REPORT_DETAILS_REQUEST:
      return {
        ...state,
        detailsLoading: true,
        currentReport: null,
        error: null,
      };

    case REPORT_DETAILS_SUCCESS:
      return {
        ...state,
        detailsLoading: false,
        currentReport: action.payload ? { ...action.payload } : null,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case REPORT_DETAILS_ERROR:
      return {
        ...state,
        detailsLoading: false,
        currentReport: null,
        error: action.payload,
      };

    // Generate Report
    case REPORT_GENERATE_REQUEST:
      return {
        ...state,
        generateLoading: true,
        error: null,
      };

    case REPORT_GENERATE_SUCCESS:
      return {
        ...state,
        generateLoading: false,
        // Add new report to the beginning of the array while creating a new array reference
        reports: action.payload ? [{ ...action.payload }, ...state.reports] : [...state.reports],
        currentReport: action.payload ? { ...action.payload } : null,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case REPORT_GENERATE_ERROR:
      return {
        ...state,
        generateLoading: false,
        error: action.payload,
      };

    // Delete Report
    case REPORT_DELETE_REQUEST:
      return {
        ...state,
        deleteLoading: true,
        error: null,
      };

    case REPORT_DELETE_SUCCESS:
      return {
        ...state,
        deleteLoading: false,
        // Filter out the deleted report while creating a new array reference
        reports: state.reports.filter(report => report.id !== action.payload),
        // Clear current report if it was the one deleted
        currentReport:
          state.currentReport && state.currentReport.id === action.payload
            ? null
            : state.currentReport,
        error: null,
        lastUpdated: new Date().toISOString(),
      };

    case REPORT_DELETE_ERROR:
      return {
        ...state,
        deleteLoading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

// Optional selectors for easier component access
export const selectReports = state => state.reports.reports;
export const selectCurrentReport = state => state.reports.currentReport;
export const selectReportsLoading = state => state.reports.loading;
export const selectReportDetailsLoading = state => state.reports.detailsLoading;
export const selectReportGenerateLoading = state => state.reports.generateLoading;
export const selectReportDeleteLoading = state => state.reports.deleteLoading;
export const selectReportsError = state => state.reports.error;

export default reportReducer;

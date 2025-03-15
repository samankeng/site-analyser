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
  REPORT_DELETE_ERROR
} from '../actions/types';

const initialState = {
  reports: [],
  currentReport: null,
  loading: false,
  detailsLoading: false,
  generateLoading: false,
  deleteLoading: false,
  error: null
};

const reportReducer = (state = initialState, action) => {
  switch (action.type) {
    // Report List
    case REPORT_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case REPORT_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        reports: action.payload,
        error: null
      };
    case REPORT_LIST_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // Report Details
    case REPORT_DETAILS_REQUEST:
      return {
        ...state,
        detailsLoading: true,
        currentReport: null,
        error: null
      };
    case REPORT_DETAILS_SUCCESS:
      return {
        ...state,
        detailsLoading: false,
        currentReport: action.payload,
        error: null
      };
    case REPORT_DETAILS_ERROR:
      return {
        ...state,
        detailsLoading: false,
        currentReport: null,
        error: action.payload
      };

    // Generate Report
    case REPORT_GENERATE_REQUEST:
      return {
        ...state,
        generateLoading: true,
        error: null
      };
    case REPORT_GENERATE_SUCCESS:
      return {
        ...state,
        generateLoading: false,
        reports: [action.payload, ...state.reports],
        currentReport: action.payload,
        error: null
      };
    case REPORT_GENERATE_ERROR:
      return {
        ...state,
        generateLoading: false,
        error: action.payload
      };

    // Delete Report
    case REPORT_DELETE_REQUEST:
      return {
        ...state,
        deleteLoading: true,
        error: null
      };
    case REPORT_DELETE_SUCCESS:
      return {
        ...state,
        deleteLoading: false,
        reports: state.reports.filter(report => report.id !== action.payload),
        currentReport: null,
        error: null
      };
    case REPORT_DELETE_ERROR:
      return {
        ...state,
        deleteLoading: false,
        error: action.payload
      };

    default:
      return state;
  }
};

export default reportReducer;

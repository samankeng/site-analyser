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
} from './types';
import reportService from '../../services/reportService';
import { setAlert } from './alertActions';

/**
 * Fetch list of reports
 * @param {Object} [params] - Optional query parameters
 */
export const fetchReports = (params = {}) => async (dispatch) => {
  try {
    dispatch({ type: REPORT_LIST_REQUEST });

    const response = await reportService.getReports(params);

    dispatch({
      type: REPORT_LIST_SUCCESS,
      payload: response.reports
    });

    return response.reports;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to fetch reports';
    
    dispatch({
      type: REPORT_LIST_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return [];
  }
};

/**
 * Fetch detailed report by ID
 * @param {string} reportId - ID of the report
 */
export const fetchReportDetails = (reportId) => async (dispatch) => {
  try {
    dispatch({ type: REPORT_DETAILS_REQUEST });

    const response = await reportService.getReportById(reportId);

    dispatch({
      type: REPORT_DETAILS_SUCCESS,
      payload: response.report
    });

    return response.report;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to fetch report details';
    
    dispatch({
      type: REPORT_DETAILS_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return null;
  }
};

/**
 * Generate a new report from a scan
 * @param {string} scanId - ID of the scan to generate report from
 */
export const generateReport = (scanId) => async (dispatch) => {
  try {
    dispatch({ type: REPORT_GENERATE_REQUEST });

    const response = await reportService.generateReport(scanId);

    dispatch({
      type: REPORT_GENERATE_SUCCESS,
      payload: response.report
    });

    dispatch(setAlert('Report generated successfully', 'success'));

    return response.report;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to generate report';
    
    dispatch({
      type: REPORT_GENERATE_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return null;
  }
};

/**
 * Delete a report
 * @param {string} reportId - ID of the report to delete
 */
export const deleteReport = (reportId) => async (dispatch) => {
  try {
    dispatch({ type: REPORT_DELETE_REQUEST });

    await reportService.deleteReport(reportId);

    dispatch({
      type: REPORT_DELETE_SUCCESS,
      payload: reportId
    });

    dispatch(setAlert('Report deleted successfully', 'success'));

    return true;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to delete report';
    
    dispatch({
      type: REPORT_DELETE_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return false;
  }
};

/**
 * Export report in a specific format
 * @param {string} reportId - ID of the report to export
 * @param {string} [format='pdf'] - Export format
 */
export const exportReport = (reportId, format = 'pdf') => async (dispatch) => {
  try {
    const response = await reportService.exportReport(reportId, format);

    dispatch(setAlert('Report exported successfully', 'success'));

    return response;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to export report';
    
    dispatch(setAlert(errorMessage, 'error'));
    return null;
  }
};

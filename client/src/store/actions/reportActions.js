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
} from './types';
import reportService from '../../services/reportService';
import { setAlert } from './alertActions';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { useCallback } from 'react';

/**
 * Fetch list of reports (React 19 & MUI v6 compatible)
 * @param {Object} [params] - Optional query parameters
 */
export const fetchReports = createAsyncThunk(
  'reports/fetchList',
  async (params = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: REPORT_LIST_REQUEST });

      const response = await reportService.getReports(params);
      const reports = response.reports;

      dispatch({
        type: REPORT_LIST_SUCCESS,
        payload: reports,
      });

      return reports;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch reports';

      dispatch({
        type: REPORT_LIST_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Fetch detailed report by ID (React 19 & MUI v6 compatible)
 * @param {string} reportId - ID of the report
 */
export const fetchReportDetails = createAsyncThunk(
  'reports/fetchDetails',
  async (reportId, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: REPORT_DETAILS_REQUEST });

      const response = await reportService.getReportById(reportId);
      const report = response.report;

      dispatch({
        type: REPORT_DETAILS_SUCCESS,
        payload: report,
      });

      return report;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch report details';

      dispatch({
        type: REPORT_DETAILS_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Generate a new report from a scan (React 19 & MUI v6 compatible)
 * @param {string} scanId - ID of the scan to generate report from
 */
export const generateReport = createAsyncThunk(
  'reports/generate',
  async (scanId, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: REPORT_GENERATE_REQUEST });

      const response = await reportService.generateReport(scanId);
      const report = response.report;

      dispatch({
        type: REPORT_GENERATE_SUCCESS,
        payload: report,
      });

      dispatch(setAlert('Report generated successfully', 'success'));

      return report;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to generate report';

      dispatch({
        type: REPORT_GENERATE_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Delete a report (React 19 & MUI v6 compatible)
 * @param {string} reportId - ID of the report to delete
 */
export const deleteReport = createAsyncThunk(
  'reports/delete',
  async (reportId, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: REPORT_DELETE_REQUEST });

      await reportService.deleteReport(reportId);

      dispatch({
        type: REPORT_DELETE_SUCCESS,
        payload: reportId,
      });

      dispatch(setAlert('Report deleted successfully', 'success'));

      return reportId;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete report';

      dispatch({
        type: REPORT_DELETE_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Export report in a specific format (React 19 & MUI v6 compatible)
 * @param {Object} params - Parameters object
 * @param {string} params.reportId - ID of the report to export
 * @param {string} [params.format='pdf'] - Export format
 */
export const exportReport = createAsyncThunk(
  'reports/export',
  async ({ reportId, format = 'pdf' }, { dispatch, rejectWithValue }) => {
    try {
      const response = await reportService.exportReport(reportId, format);

      dispatch(setAlert('Report exported successfully', 'success'));

      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to export report';

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Custom hook for report actions
 * Provides a more React 19 friendly way to use these actions in components
 */
export const useReportActions = () => {
  const dispatch = useDispatch();

  const getReports = useCallback(
    (params = {}) => {
      return dispatch(fetchReports(params));
    },
    [dispatch]
  );

  const getReportDetails = useCallback(
    reportId => {
      return dispatch(fetchReportDetails(reportId));
    },
    [dispatch]
  );

  const createReport = useCallback(
    scanId => {
      return dispatch(generateReport(scanId));
    },
    [dispatch]
  );

  const removeReport = useCallback(
    reportId => {
      return dispatch(deleteReport(reportId));
    },
    [dispatch]
  );

  const downloadReport = useCallback(
    (reportId, format = 'pdf') => {
      return dispatch(exportReport({ reportId, format }));
    },
    [dispatch]
  );

  return {
    getReports,
    getReportDetails,
    createReport,
    removeReport,
    downloadReport,
  };
};

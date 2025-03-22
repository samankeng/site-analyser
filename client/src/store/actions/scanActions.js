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
} from './types';
import { setAlert } from './alertActions';
import api from '../../services/api';
import { createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

/**
 * Initiate a new security scan (React 19 & MUI v6 compatible)
 */
export const initiateScan = createAsyncThunk(
  'scans/initiate',
  async (scanData, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: SCAN_REQUEST });

      const res = await api.post('/scans', scanData);
      const scanResult = res.data.data;

      dispatch({
        type: SCAN_SUCCESS,
        payload: scanResult,
      });

      dispatch(setAlert('Scan initiated successfully', 'success'));

      return scanResult;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to initiate scan';

      dispatch({
        type: SCAN_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Get scan status (React 19 & MUI v6 compatible)
 */
export const getScanStatus = createAsyncThunk(
  'scans/getStatus',
  async (scanId, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: SCAN_STATUS_REQUEST });

      const res = await api.get(`/scans/${scanId}`);
      const statusData = res.data.data;

      dispatch({
        type: SCAN_STATUS_SUCCESS,
        payload: statusData,
      });

      return statusData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to get scan status';

      dispatch({
        type: SCAN_STATUS_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Get scan results (React 19 & MUI v6 compatible)
 */
export const getScanResults = createAsyncThunk(
  'scans/getResults',
  async (scanId, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: SCAN_RESULTS_REQUEST });

      const res = await api.get(`/scans/${scanId}/results`);
      const resultsData = res.data.data;

      dispatch({
        type: SCAN_RESULTS_SUCCESS,
        payload: resultsData,
      });

      return resultsData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to get scan results';

      dispatch({
        type: SCAN_RESULTS_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Cancel a scan (React 19 & MUI v6 compatible)
 */
export const cancelScan = createAsyncThunk(
  'scans/cancel',
  async (scanId, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: SCAN_CANCEL_REQUEST });

      const res = await api.delete(`/scans/${scanId}`);

      dispatch({
        type: SCAN_CANCEL_SUCCESS,
        payload: res.data,
      });

      dispatch(setAlert('Scan cancelled successfully', 'success'));

      return scanId;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel scan';

      dispatch({
        type: SCAN_CANCEL_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Get recent scans (React 19 & MUI v6 compatible)
 */
export const getRecentScans = createAsyncThunk(
  'scans/getRecent',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: RECENT_SCANS_REQUEST });

      const res = await api.get('/scans/recent');
      const scansData = res.data.data;

      dispatch({
        type: RECENT_SCANS_SUCCESS,
        payload: scansData,
      });

      return scansData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to get recent scans';

      dispatch({
        type: RECENT_SCANS_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage) || [];
    }
  }
);

/**
 * Clear scan state (React 19 & MUI v6 compatible)
 */
export const clearScanState = createAction(CLEAR_SCAN_STATE);

/**
 * Custom hook for scan actions
 */
export const useScanActions = () => {
  const dispatch = useDispatch();

  const startScan = useCallback(
    scanData => {
      return dispatch(initiateScan(scanData));
    },
    [dispatch]
  );

  const checkScanStatus = useCallback(
    scanId => {
      return dispatch(getScanStatus(scanId));
    },
    [dispatch]
  );

  const fetchScanResults = useCallback(
    scanId => {
      return dispatch(getScanResults(scanId));
    },
    [dispatch]
  );

  const stopScan = useCallback(
    scanId => {
      return dispatch(cancelScan(scanId));
    },
    [dispatch]
  );

  const fetchRecentScans = useCallback(() => {
    return dispatch(getRecentScans());
  }, [dispatch]);

  const resetScanState = useCallback(() => {
    return dispatch(clearScanState());
  }, [dispatch]);

  return {
    startScan,
    checkScanStatus,
    fetchScanResults,
    stopScan,
    fetchRecentScans,
    resetScanState,
  };
};

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

// Initiate a new security scan
export const initiateScan = (scanData) => async (dispatch) => {
  try {
    dispatch({ type: SCAN_REQUEST });

    const res = await api.post('/scans', scanData);

    dispatch({
      type: SCAN_SUCCESS,
      payload: res.data.data
    });

    dispatch(setAlert('Scan initiated successfully', 'success'));

    return res.data.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to initiate scan';
    
    dispatch({
      type: SCAN_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return null;
  }
};

// Get scan status
export const getScanStatus = (scanId) => async (dispatch) => {
  try {
    dispatch({ type: SCAN_STATUS_REQUEST });

    const res = await api.get(`/scans/${scanId}`);

    dispatch({
      type: SCAN_STATUS_SUCCESS,
      payload: res.data.data
    });

    return res.data.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to get scan status';
    
    dispatch({
      type: SCAN_STATUS_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return null;
  }
};

// Get scan results
export const getScanResults = (scanId) => async (dispatch) => {
  try {
    dispatch({ type: SCAN_RESULTS_REQUEST });

    const res = await api.get(`/scans/${scanId}/results`);

    dispatch({
      type: SCAN_RESULTS_SUCCESS,
      payload: res.data.data
    });

    return res.data.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to get scan results';
    
    dispatch({
      type: SCAN_RESULTS_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return null;
  }
};

// Cancel a scan
export const cancelScan = (scanId) => async (dispatch) => {
  try {
    dispatch({ type: SCAN_CANCEL_REQUEST });

    const res = await api.delete(`/scans/${scanId}`);

    dispatch({
      type: SCAN_CANCEL_SUCCESS,
      payload: res.data
    });

    dispatch(setAlert('Scan cancelled successfully', 'success'));

    return true;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to cancel scan';
    
    dispatch({
      type: SCAN_CANCEL_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return false;
  }
};

// Get recent scans
export const getRecentScans = () => async (dispatch) => {
  try {
    dispatch({ type: RECENT_SCANS_REQUEST });

    const res = await api.get('/scans/recent');

    dispatch({
      type: RECENT_SCANS_SUCCESS,
      payload: res.data.data
    });

    return res.data.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to get recent scans';
    
    dispatch({
      type: RECENT_SCANS_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return [];
  }
};

// Clear scan state
export const clearScanState = () => ({
  type: CLEAR_SCAN_STATE
});
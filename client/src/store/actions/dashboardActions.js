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
} from './types';
import api from '../../services/api';
import { setAlert } from './alertActions';

/**
 * Fetch overall dashboard data
 */
export const fetchDashboardData = () => async (dispatch) => {
  try {
    dispatch({ type: DASHBOARD_DATA_REQUEST });

    const [
      scansResponse, 
      alertsResponse, 
      scoreResponse
    ] = await Promise.all([
      api.get('/scans/recent'),
      api.get('/alerts/recent'),
      api.get('/dashboard/security-score')
    ]);

    dispatch({
      type: DASHBOARD_DATA_SUCCESS,
      payload: {
        recentScans: scansResponse.data.data,
        recentAlerts: alertsResponse.data.data,
        securityScore: scoreResponse.data.data
      }
    });

    return {
      recentScans: scansResponse.data.data,
      recentAlerts: alertsResponse.data.data,
      securityScore: scoreResponse.data.data
    };
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to fetch dashboard data';
    
    dispatch({
      type: DASHBOARD_DATA_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return null;
  }
};

/**
 * Fetch current security score
 */
export const fetchSecurityScore = () => async (dispatch) => {
  try {
    dispatch({ type: SECURITY_SCORE_REQUEST });

    const response = await api.get('/dashboard/security-score');

    dispatch({
      type: SECURITY_SCORE_SUCCESS,
      payload: response.data.data
    });

    return response.data.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to fetch security score';
    
    dispatch({
      type: SECURITY_SCORE_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return null;
  }
};

/**
 * Fetch recent alerts
 */
export const fetchRecentAlerts = () => async (dispatch) => {
  try {
    dispatch({ type: RECENT_ALERTS_REQUEST });

    const response = await api.get('/alerts/recent');

    dispatch({
      type: RECENT_ALERTS_SUCCESS,
      payload: response.data.data
    });

    return response.data.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Failed to fetch recent alerts';
    
    dispatch({
      type: RECENT_ALERTS_ERROR,
      payload: errorMessage
    });

    dispatch(setAlert(errorMessage, 'error'));
    return [];
  }
};

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
} from './types';
import api from '../../services/api';
import { setAlert } from './alertActions';
import { createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Fetch overall dashboard data (React 19 & MUI v6 compatible)
 */
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: DASHBOARD_DATA_REQUEST });

      const [scansResponse, alertsResponse, scoreResponse] = await Promise.all([
        api.get('/scans/recent'),
        api.get('/alerts/recent'),
        api.get('/dashboard/security-score'),
      ]);

      const dashboardData = {
        recentScans: scansResponse.data.data,
        recentAlerts: alertsResponse.data.data,
        securityScore: scoreResponse.data.data,
      };

      dispatch({
        type: DASHBOARD_DATA_SUCCESS,
        payload: dashboardData,
      });

      return dashboardData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch dashboard data';

      dispatch({
        type: DASHBOARD_DATA_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Fetch current security score (React 19 & MUI v6 compatible)
 */
export const fetchSecurityScore = createAsyncThunk(
  'dashboard/fetchSecurityScore',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: SECURITY_SCORE_REQUEST });

      const response = await api.get('/dashboard/security-score');
      const scoreData = response.data.data;

      dispatch({
        type: SECURITY_SCORE_SUCCESS,
        payload: scoreData,
      });

      return scoreData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch security score';

      dispatch({
        type: SECURITY_SCORE_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Fetch recent alerts (React 19 & MUI v6 compatible)
 */
export const fetchRecentAlerts = createAsyncThunk(
  'dashboard/fetchRecentAlerts',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: RECENT_ALERTS_REQUEST });

      const response = await api.get('/alerts/recent');
      const alertsData = response.data.data;

      dispatch({
        type: RECENT_ALERTS_SUCCESS,
        payload: alertsData,
      });

      return alertsData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch recent alerts';

      dispatch({
        type: RECENT_ALERTS_ERROR,
        payload: errorMessage,
      });

      dispatch(setAlert(errorMessage, 'error'));
      return rejectWithValue(errorMessage) || [];
    }
  }
);

// Modern hook-based approach for components (alternative to using these actions directly)
export const useDashboardData = () => {
  const dispatch = useDispatch();

  const fetchData = useCallback(() => {
    return dispatch(fetchDashboardData());
  }, [dispatch]);

  const fetchScore = useCallback(() => {
    return dispatch(fetchSecurityScore());
  }, [dispatch]);

  const fetchAlerts = useCallback(() => {
    return dispatch(fetchRecentAlerts());
  }, [dispatch]);

  return { fetchData, fetchScore, fetchAlerts };
};

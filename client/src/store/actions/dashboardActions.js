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
import { useCallback } from 'react';

/**
 * Fetch overall dashboard data (React 19 & MUI v6 compatible)
 */
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch({ type: DASHBOARD_DATA_REQUEST });
      console.log('Fetching dashboard data from API...');

      // Log each API request separately
      console.log('Fetching recent scans...');
      const scansResponse = await api.get('/scans/recent');
      console.log('Scans response:', scansResponse.data);

      console.log('Fetching recent alerts...');
      const alertsResponse = await api.get('/alerts/recent');
      console.log('Alerts response:', alertsResponse.data);

      console.log('Fetching security score...');
      const scoreResponse = await api.get('/dashboard/security-score');
      console.log('Score response:', scoreResponse.data);

      const dashboardData = {
        recentScans: scansResponse.data.data,
        recentAlerts: alertsResponse.data.data,
        securityScore: scoreResponse.data.data,
      };

      console.log('Dashboard data assembled:', dashboardData);
      dispatch({
        type: DASHBOARD_DATA_SUCCESS,
        payload: dashboardData,
      });

      return dashboardData;
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
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

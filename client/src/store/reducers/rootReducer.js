import { combineReducers } from 'redux';

// Import individual reducers
import alertReducer from './alertReducer';
import authReducer from './authReducer';
import scanReducer from './scanReducer';
import reportReducer from './reportReducer';
import dashboardReducer from './dashboardReducer';

/**
 * Root reducer that combines all application reducers
 * Updated for compatibility with React 19 and MUI v6
 */
const rootReducer = combineReducers({
  // Change 'alerts' to 'alert' to match the selector
  alert: alertReducer,
  auth: authReducer,
  scans: scanReducer,
  reports: reportReducer,
  dashboard: dashboardReducer,
});

export default rootReducer;

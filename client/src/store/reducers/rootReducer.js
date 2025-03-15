import { combineReducers } from 'redux';

// Import individual reducers
import alertReducer from './alertReducer';
import authReducer from './authReducer';
import scanReducer from './scanReducer';
import reportReducer from './reportReducer';
import dashboardReducer from './dashboardReducer';

// Combine reducers into a root reducer
const rootReducer = combineReducers({
  alerts: alertReducer,
  auth: authReducer,
  scans: scanReducer,
  reports: reportReducer,
  dashboard: dashboardReducer
});

export default rootReducer;

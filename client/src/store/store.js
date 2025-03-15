import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer from './reducers/authReducer';
import alertReducer from './reducers/alertReducer';
import dashboardReducer from './reducers/dashboardReducer';
import scanReducer from './reducers/scanReducer';
import reportReducer from './reducers/reportReducer';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  alert: alertReducer,
  dashboard: dashboardReducer,
  scan: scanReducer,
  report: reportReducer
});

// Configure Redux store with middleware
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
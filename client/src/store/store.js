import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

import authReducer from './reducers/authReducer';
import alertReducer from './reducers/alertReducer';
import dashboardReducer from './reducers/dashboardReducer';
import scanReducer from './reducers/scanReducer';
import reportReducer from './reducers/reportReducer';

// Persist configuration for auth and potentially other reducers
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth'], // Only persist auth reducer
  // Adding migrate to handle potential state structure changes in React 19
  migrate: state => {
    // You can add migration logic here if needed
    return Promise.resolve(state);
  },
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  alert: alertReducer,
  dashboard: dashboardReducer,
  scans: scanReducer, // Changed from 'scan' to 'scans' to match selector naming
  reports: reportReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure Redux store with middleware
const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore specific paths for MUI v6 components that might contain non-serializable values
        ignoredPaths: ['alerts.notifications'],
      },
      // Ensure immutability checks are enabled for better debugging
      immutableCheck: true,
    }),
  devTools: process.env.NODE_ENV !== 'production',
  // Adding preloadedState option for better testing support in React 19
  preloadedState: undefined,
});

// Create persistor
const persistor = persistStore(store);

// Export the store and persistor
export { store, persistor };

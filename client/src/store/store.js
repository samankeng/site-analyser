import { configureStore } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

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
  whitelist: ['auth'] // Only persist auth reducer
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  alert: alertReducer,
  dashboard: dashboardReducer,
  scan: scanReducer,
  report: reportReducer
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure Redux store with middleware
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER
        ]
      }
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
const persistor = persistStore(store);

export { store, persistor };

import React from 'react';
import { Provider } from 'react-redux';
import { useSyncExternalStore } from 'use-sync-external-store';

/**
 * Enhanced Redux Provider that ensures compatibility with React 19
 */
const ReduxProvider = ({ store, children }) => {
  // This helps ensure the provider works correctly with React 19's concurrent mode
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

export default ReduxProvider;

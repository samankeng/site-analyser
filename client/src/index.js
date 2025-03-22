import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './App';
import { store, persistor } from './store/store';
import './assets/css/index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <StyledEngineProvider injectFirst>
            <App />
          </StyledEngineProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// Add this for better error handling in development mode
if (process.env.NODE_ENV !== 'production') {
  // Enable React DevTools profiler in development mode
  // This helps identify performance bottlenecks
  if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.injection.injectRenderer(
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher
    );
  }
}

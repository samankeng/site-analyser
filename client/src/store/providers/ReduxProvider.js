import React from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

/**
 * Enhanced Redux Provider that ensures compatibility with React 19 and MUI v6
 * This component combines the Redux store provider with MUI's ThemeProvider
 * for a complete setup compatible with React 19's concurrent rendering features.
 */
const ReduxProvider = ({ store, theme, children }) => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstarts an elegant, consistent, and simple baseline to build upon */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Provider>
  );
};

export default ReduxProvider;

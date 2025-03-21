import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import StyledEngineProvider from '../components/providers/StyledEngineProvider';
import { ThemeProvider, createTheme } from '@mui/styles';
import { CssBaseline } from '@mui/material';

// Create a context for theme management
const ThemeContext = createContext();

// Theme configuration
const getTheme = (mode) => createTheme({
  palette: {
    type: mode,
    primary: {
      main: mode === 'dark' ? '#3f51b5' : '#1976d2',
    },
    secondary: {
      main: mode === 'dark' ? '#f50057' : '#dc004e',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#f4f4f4',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#ffffff' : '#000000',
      secondary: mode === 'dark' ? '#b0b0b0' : '#666666',
    },
    error: {
      main: mode === 'dark' ? '#ff6b6b' : '#f44336',
    },
    success: {
      main: mode === 'dark' ? '#4caf50' : '#2e7d32',
    },
    warning: {
      main: mode === 'dark' ? '#ff9800' : '#ed6c02',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        body: {
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
      },
    },
  },
});

/**
 * Theme Context Provider Component
 * Manages application-wide theme state and provides theme switching functionality
 */
export const ThemeContextProvider = ({ children }) => {
  // Check for saved theme preference or default to system preference
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode) return savedMode;
    
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  });

  // Create memoized theme object
  const theme = useMemo(() => getTheme(mode), [mode]);

  // Save theme preference to local storage
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  // Toggle theme between light and dark modes
  const toggleThemeMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleThemeMode }}>
      <StrictMode><StyledEngineProvider><ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider></StyledEngineProvider></StrictMode>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context with mode and toggle function
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
};

export default ThemeContext;

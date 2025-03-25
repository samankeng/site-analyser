// src/contexts/ThemeContext.js
import React, { createContext, useContext, useState, useMemo } from 'react';

const ThemeContext = createContext();

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  // Using useMemo to prevent recreating this object on every render
  const contextValue = useMemo(() => {
    const toggleThemeMode = () => {
      setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
    };

    return { mode, toggleThemeMode };
  }, [mode]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
};

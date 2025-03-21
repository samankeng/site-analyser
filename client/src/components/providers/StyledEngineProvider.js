import React from 'react';
import { StyledEngineProvider as MuiStyledEngineProvider } from '@mui/material/styles';

/**
 * Custom StyledEngineProvider to fix styling conflicts between JSS and Emotion
 */
const StyledEngineProvider = ({ children }) => {
  return (
    <MuiStyledEngineProvider injectFirst>
      {children}
    </MuiStyledEngineProvider>
  );
};

export default StyledEngineProvider;

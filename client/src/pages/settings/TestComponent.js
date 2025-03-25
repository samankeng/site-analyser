// TestComponent.js
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TestComponent = () => {
  return (
    <Box sx={{ 
      p: 3, 
      border: '3px solid red',
      backgroundColor: 'yellow',
      minHeight: '300px'
    }}>
      <Typography variant="h3" color="error">
        TEST COMPONENT IS VISIBLE
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mt: 2, backgroundColor: 'lightblue' }}>
        <Typography>
          If you can see this, components are rendering correctly.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TestComponent;
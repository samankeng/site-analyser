import React, { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

/**
 * Error Boundary component for catching and displaying React errors
 * Compatible with React 19 and MUI v6
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to your monitoring system here if needed
    // logErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      const fallback = this.props.fallback;
      
      if (fallback) {
        return fallback;
      }
      
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            bgcolor: 'background.default'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom color="error">
              Something went wrong
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              We're sorry, but there was an error loading this page. Our team has been notified and is working to fix the issue.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  p: 2,
                  my: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  textAlign: 'left'
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Error details:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', color: 'error.main' }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => window.location.href = '/'}
              >
                Go to Homepage
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={this.resetError}
              >
                Try Again
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;

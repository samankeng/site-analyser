import { useEffect } from 'react';
import { Container, Typography, Button, Paper, Box } from '@mui/material';
import { styled } from '@mui/system';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Using styled API instead of makeStyles
const StyledContainer = styled(Container)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 500,
  textAlign: 'center',
}));

const StyledIcon = styled(ErrorOutlineIcon)(({ theme }) => ({
  fontSize: 100,
  color: theme.palette.error.main,
  marginBottom: theme.spacing(2),
}));

const ErrorBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#f0f0f0',
  padding: 16,
  borderRadius: 4,
  maxWidth: '100%',
  wordBreak: 'break-word',
}));

const ErrorPage = ({
  title = 'Unexpected Error',
  message = 'An unexpected error occurred. Please try again later.',
  error,
}) => {
  // Log error to console for debugging
  useEffect(() => {
    if (error) {
      console.error('Unexpected Error:', error);
    }
  }, [error]);

  return (
    <StyledContainer component="main">
      <StyledPaper elevation={3}>
        <StyledIcon />

        <Typography variant="h4" color="error" gutterBottom>
          {title}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          {message}
        </Typography>

        {error && (
          <ErrorBox>
            <Typography variant="body2" color="text.secondary">
              {error.toString()}
            </Typography>
          </ErrorBox>
        )}

        <Box
          sx={{
            mt: 3,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Button variant="filled" color="primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>

          <Button variant="outlined" color="inherit" onClick={() => navigate('/')}>
            Return Home
          </Button>
        </Box>
      </StyledPaper>
    </StyledContainer>
  );
};

export default ErrorPage;

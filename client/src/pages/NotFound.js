import { Container, Typography, Button, Paper, Box } from '@mui/material';
import { styled } from '@mui/system';
import { Link as RouterLink } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';

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

const StyledIcon = styled(SearchOffIcon)(({ theme }) => ({
  fontSize: 100,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

const NotFound = () => {
  return (
    <StyledContainer component="main">
      <StyledPaper elevation={3}>
        <StyledIcon />

        <Typography variant="h4" color="text.primary" gutterBottom>
          Page Not Found
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are looking for doesn't exist or has been moved. Check the URL or return to
          our homepage.
        </Typography>

        <Box
          sx={{
            mt: 3,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Button variant="filled" color="primary" component={RouterLink} to="/dashboard">
            Go to Dashboard
          </Button>

          <Button variant="outlined" color="inherit" component={RouterLink} to="/">
            Return Home
          </Button>
        </Box>
      </StyledPaper>
    </StyledContainer>
  );
};

export default NotFound;

import React from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Paper 
} from '@material-ui/core';
import { makeStyles } from '@mui/styles';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: 500,
    textAlign: 'center',
  },
  icon: {
    fontSize: 100,
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
  },
  actionButtons: {
    marginTop: theme.spacing(3),
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(2),
  }
}));

const ErrorPage = ({ 
  title = 'Unexpected Error', 
  message = 'An unexpected error occurred. Please try again later.',
  error 
}) => {
  const classes = useStyles();

  // Log error to console for debugging
  React.useEffect(() => {
    if (error) {
      console.error('Unexpected Error:', error);
    }
  }, [error]);

  return (
    <Container component="main" className={classes.root}>
      <Paper elevation={6} className={classes.paper}>
        <ErrorOutlineIcon className={classes.icon} />
        
        <Typography variant="h4" color="error" gutterBottom>
          {title}
        </Typography>
        
        <Typography variant="body1" color="textSecondary" paragraph>
          {message}
        </Typography>

        {error && (
          <Typography 
            variant="body2" 
            color="textSecondary" 
            style={{ 
              backgroundColor: '#f0f0f0', 
              padding: 16, 
              borderRadius: 4,
              maxWidth: '100%',
              wordBreak: 'break-word'
            }}
          >
            {error.toString()}
          </Typography>
        )}

        <div className={classes.actionButtons}>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/dashboard"
          >
            Go to Dashboard
          </Button>
          
          <Button
            variant="outlined"
            color="default"
            component={RouterLink}
            to="/"
          >
            Return Home
          </Button>
        </div>
      </Paper>
    </Container>
  );
};

export default ErrorPage;

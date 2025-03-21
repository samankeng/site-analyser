import React from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Paper 
} from '@material-ui/core';
import { makeStyles } from '@mui/styles';
import { Link as RouterLink } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';

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
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  actionButtons: {
    marginTop: theme.spacing(3),
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(2),
  }
}));

const NotFound = () => {
  const classes = useStyles();

  return (
    <Container component="main" className={classes.root}>
      <Paper elevation={6} className={classes.paper}>
        <SearchOffIcon className={classes.icon} />
        
        <Typography variant="h4" color="textPrimary" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="textSecondary" paragraph>
          The page you are looking for doesn't exist or has been moved.
          Check the URL or return to our homepage.
        </Typography>

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

export default NotFound;

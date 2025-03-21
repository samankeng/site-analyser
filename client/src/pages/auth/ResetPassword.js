import React, { useState } from 'react';
import { Container, Typography, Button, Paper, Grid, TextField } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import { useDispatch } from 'react-redux';
import { resetPassword } from '../../store/actions/authActions';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  info: {
    textAlign: 'center',
    marginBottom: theme.spacing(2),
  },
}));

const ResetPassword = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetStep, setResetStep] = useState('request');

  const handleResetPassword = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(resetPassword(email));
      setResetStep('instructions');
    } catch (error) {
      // Handle error (you might want to add error state and display)
      console.error('Password reset failed', error);
    } finally {
      setLoading(false);
    }
  };

  const renderResetContent = () => {
    switch (resetStep) {
      case 'request':
        return (
          <form className={classes.form} onSubmit={handleResetPassword}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              disabled={loading}
            >
              {loading ? 'Sending Instructions...' : 'Reset Password'}
            </Button>
            <Grid container>
              <Grid item xs>
                <RouterLink to="/auth/login" style={{ textDecoration: 'none', color: 'primary' }}>
                  Back to Login
                </RouterLink>
              </Grid>
              <Grid item>
                <RouterLink
                  to="/auth/register"
                  style={{ textDecoration: 'none', color: 'primary' }}
                >
                  Create new account
                </RouterLink>
              </Grid>
            </Grid>
          </form>
        );

      case 'instructions':
        return (
          <div className={classes.form}>
            <Typography variant="h6" color="primary" className={classes.info}>
              Password Reset Instructions Sent
            </Typography>
            <Typography variant="body1" paragraph className={classes.info}>
              We've sent password reset instructions to {email}. Please check your email inbox (and
              spam folder) for further steps to reset your password.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              onClick={() => setResetStep('request')}
              disabled={loading}
            >
              Resend Instructions
            </Button>
            <Grid container justifyContent="center" style={{ marginTop: 16 }}>
              <Grid item>
                <RouterLink to="/auth/login" style={{ textDecoration: 'none', color: 'primary' }}>
                  Return to Login
                </RouterLink>
              </Grid>
            </Grid>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="xs" className={classes.root}>
      <Paper elevation={6} className={classes.paper}>
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
        {renderResetContent()}
      </Paper>
    </Container>
  );
};

export default ResetPassword;

import { useState } from 'react';
import { Container, Typography, Button, Paper, Grid, TextField, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { resetPassword } from '../../store/actions/authActions';

// Using styled API instead of makeStyles
const StyledContainer = styled(Container)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: 400,
}));

const StyledForm = styled('form')(({ theme }) => ({
  width: '100%', // Fix IE 11 issue.
  marginTop: theme.spacing(1),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));

const InfoText = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(2),
}));

const FormDiv = styled('div')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const ResetPassword = () => {
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
          <StyledForm onSubmit={handleResetPassword}>
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
            <SubmitButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Sending Instructions...' : 'Reset Password'}
            </SubmitButton>
            <Grid container>
              <Grid item xs>
                <Link component={RouterLink} to="/auth/login" color="primary">
                  Back to Login
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/auth/register" color="primary">
                  Create new account
                </Link>
              </Grid>
            </Grid>
          </StyledForm>
        );

      case 'instructions':
        return (
          <FormDiv>
            <InfoText variant="h6" color="primary">
              Password Reset Instructions Sent
            </InfoText>
            <InfoText variant="body1" paragraph>
              We've sent password reset instructions to {email}. Please check your email inbox (and
              spam folder) for further steps to reset your password.
            </InfoText>
            <SubmitButton
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => setResetStep('request')}
              disabled={loading}
            >
              Resend Instructions
            </SubmitButton>
            <Grid container justifyContent="center" sx={{ marginTop: 2 }}>
              <Grid item>
                <Link component={RouterLink} to="/auth/login" color="primary">
                  Return to Login
                </Link>
              </Grid>
            </Grid>
          </FormDiv>
        );

      default:
        return null;
    }
  };

  return (
    <StyledContainer component="main" maxWidth="xs">
      <StyledPaper elevation={6}>
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
        {renderResetContent()}
      </StyledPaper>
    </StyledContainer>
  );
};

export default ResetPassword;

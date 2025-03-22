import { useState } from 'react';
import { Container, Typography, TextField, Button, Paper, Link, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';

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
  maxWidth: 400,
  width: '100%',
}));

const StyledForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addAlert } = useAlert(); // Updated to use addAlert instead of showAlert

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        addAlert('Login successful', 'success');
        navigate('/dashboard');
      } else {
        addAlert('Invalid credentials', 'error');
      }
    } catch (error) {
      addAlert('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer component="main" maxWidth="xs">
      <StyledPaper elevation={6}>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <StyledForm onSubmit={handleSubmit}>
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
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <SubmitButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </SubmitButton>
          <Grid container>
            <Grid item xs>
              <Link onClick={() => navigate('/reset-password')}>Forgot password?</Link>
            </Grid>
            <Grid item>
              <Link onClick={() => navigate('/register')}>{"Don't have an account? Sign Up"}</Link>
            </Grid>
          </Grid>
        </StyledForm>
      </StyledPaper>
    </StyledContainer>
  );
};

export default Login;

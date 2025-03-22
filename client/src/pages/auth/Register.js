import { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { isValidEmail as validateEmail, validatePassword } from '../../utils/validators';

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

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addAlert } = useAlert();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [passwordInfo, setPasswordInfo] = useState({
    isValid: false,
    helperText: '',
    color: 'error',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Update password validation in real-time
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordInfo({
        isValid: validation.isValid,
        helperText: validation.helperText,
        color: validation.color,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Password validation is now separated out
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0] || 'Invalid password';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async event => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };

      const success = await register(userData);

      if (success) {
        addAlert('Registration successful', 'success');
        navigate('/dashboard');
      } else {
        addAlert('Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      addAlert('Registration error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer component="main" maxWidth="xs">
      <StyledPaper elevation={6}>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <StyledForm onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="given-name"
                name="firstName"
                variant="outlined"
                required
                fullWidth
                id="firstName"
                label="First Name"
                autoFocus
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password || (passwordInfo.color === 'error' && formData.password)}
                color={passwordInfo.color !== 'error' ? passwordInfo.color : undefined}
                helperText={errors.password || (formData.password ? passwordInfo.helperText : '')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="termsAccepted"
                    color="primary"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                  />
                }
                label="I accept the Terms and Conditions"
              />
              {errors.termsAccepted && (
                <Typography color="error" variant="body2">
                  {errors.termsAccepted}
                </Typography>
              )}
            </Grid>
          </Grid>
          <SubmitButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </SubmitButton>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </StyledForm>
      </StyledPaper>
    </StyledContainer>
  );
};

export default Register;

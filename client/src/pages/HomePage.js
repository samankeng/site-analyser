import { useState } from 'react';
import { Container, Typography, Button, Grid, Paper, TextField, Box } from '@mui/material';
import { styled } from '@mui/system';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import BarChartIcon from '@mui/icons-material/BarChart';
import ScanForm from '../components/security/ScanForm';

// Using styled API instead of makeStyles
const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,
}));

const HeroSection = styled('section')(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(6),
}));

const FeatureSection = styled('section')(({ theme }) => ({
  marginTop: theme.spacing(6),
}));

const StyledFeatureIcon = styled('span')(({ theme }) => ({
  '& .MuiSvgIcon-root': {
    fontSize: 64,
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
  },
}));

const FeatureItem = styled(Paper)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
}));

const ScanSection = styled('section')(({ theme }) => ({
  marginTop: theme.spacing(6),
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
}));

const CtaButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5, 4),
}));

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SecurityIcon />,
      title: 'Comprehensive Security Scanning',
      description:
        'Analyze websites for vulnerabilities, SSL/TLS issues, and potential security risks.',
    },
    {
      icon: <SpeedIcon />,
      title: 'Performance Insights',
      description: 'Get detailed performance metrics and optimization recommendations.',
    },
    {
      icon: <BarChartIcon />,
      title: 'Detailed Reporting',
      description: 'Receive comprehensive reports with actionable security insights.',
    },
  ];

  const handleScanComplete = scanResult => {
    // Navigate to scan results page
    navigate(`/scans/${scanResult.id}`);
  };

  return (
    <StyledContainer maxWidth="lg">
      {/* Hero Section */}
      <HeroSection>
        <Typography variant="h2" color="primary" sx={{ fontWeight: 700, marginBottom: 2 }}>
          Secure Your Web Presence
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ marginBottom: 4 }}>
          Advanced Security Scanning and Analysis
        </Typography>

        {/* Scan Form */}
        <ScanForm onScanComplete={handleScanComplete} variant="outlined" fullWidth />
      </HeroSection>

      {/* Features Section */}
      <FeatureSection>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <FeatureItem elevation={3}>
                <StyledFeatureIcon>{feature.icon}</StyledFeatureIcon>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </FeatureItem>
            </Grid>
          ))}
        </Grid>
      </FeatureSection>

      {/* Call to Action */}
      <ScanSection>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Ready to Secure Your Website?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create an account to save and track your security scans.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              <CtaButton
                variant="filled"
                color="primary"
                size="large"
                component={RouterLink}
                to="/auth/register"
              >
                Sign Up Free
              </CtaButton>
            </Box>
          </Grid>
        </Grid>
      </ScanSection>
    </StyledContainer>
  );
};

export default HomePage;

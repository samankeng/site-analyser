import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  TextField 
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import SecurityIcon from '@material-ui/icons/Security';
import SpeedIcon from '@material-ui/icons/Speed';
import BarChartIcon from '@material-ui/icons/BarChart';
import { ScanForm } from '../../components/security';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: theme.palette.background.default,
  },
  heroSection: {
    textAlign: 'center',
    marginBottom: theme.spacing(6),
  },
  headline: {
    fontWeight: 700,
    marginBottom: theme.spacing(2),
  },
  subheadline: {
    marginBottom: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  featureSection: {
    marginTop: theme.spacing(6),
  },
  featureItem: {
    textAlign: 'center',
    padding: theme.spacing(3),
  },
  featureIcon: {
    fontSize: 64,
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
  },
  ctaButton: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5, 4),
  },
  scanSection: {
    marginTop: theme.spacing(6),
    padding: theme.spacing(4),
    backgroundColor: theme.palette.background.paper,
  },
}));

const HomePage = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  const features = [
    {
      icon: <SecurityIcon className={classes.featureIcon} />,
      title: 'Comprehensive Security Scanning',
      description: 'Analyze websites for vulnerabilities, SSL/TLS issues, and potential security risks.'
    },
    {
      icon: <SpeedIcon className={classes.featureIcon} />,
      title: 'Performance Insights',
      description: 'Get detailed performance metrics and optimization recommendations.'
    },
    {
      icon: <BarChartIcon className={classes.featureIcon} />,
      title: 'Detailed Reporting',
      description: 'Receive comprehensive reports with actionable security insights.'
    }
  ];

  const handleScanComplete = (scanResult) => {
    // Navigate to scan results page
    navigate(`/scans/${scanResult.id}`);
  };

  return (
    <Container maxWidth="lg" className={classes.root}>
      {/* Hero Section */}
      <section className={classes.heroSection}>
        <Typography 
          variant="h2" 
          className={classes.headline} 
          color="primary"
        >
          Secure Your Web Presence
        </Typography>
        <Typography 
          variant="h5" 
          className={classes.subheadline}
        >
          Advanced Security Scanning and Analysis
        </Typography>
        
        {/* Scan Form */}
        <ScanForm 
          onScanComplete={handleScanComplete}
          variant="outlined"
          fullWidth
        />
      </section>

      {/* Features Section */}
      <section className={classes.featureSection}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper elevation={3} className={classes.featureItem}>
                {feature.icon}
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </section>

      {/* Call to Action */}
      <section className={classes.scanSection}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Ready to Secure Your Website?
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Create an account to save and track your security scans.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} style={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to="/auth/register"
              className={classes.ctaButton}
            >
              Sign Up Free
            </Button>
          </Grid>
        </Grid>
      </section>
    </Container>
  );
};

export default HomePage;

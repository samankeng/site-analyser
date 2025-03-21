import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import SecurityScoreCard from '../../components/security/SecurityScoreCard';
import AlertsWidget from '../../components/dashboard/AlertsWidget';
import ScanHistoryTable from '../../components/dashboard/ScanHistoryTable';
import VulnerabilityChart from '../../components/dashboard/VulnerabilityChart';

import useScan from '../../hooks/useScan';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlert } from '../../contexts/AlertContext';
import { Link as RouterLink } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  newScanButton: {
    marginLeft: theme.spacing(2),
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const { user } = useAuth();
  const { getRecentScans, loading } = useScan();
  const { mode, toggleThemeMode } = useTheme();
  const { showAlert } = useAlert();

  const [recentScans, setRecentScans] = useState([]);
  const [securityScore, setSecurityScore] = useState(null);

  useEffect(() => {
    // Fetch recent scans and security score
    const fetchDashboardData = async () => {
      try {
        const scans = getRecentScans(5);
        setRecentScans(scans);

        // Simulate security score calculation
        // In a real app, this would come from backend
        const calculateSecurityScore = () => {
          if (!scans.length) return null;

          const vulnerabilityScore =
            scans.reduce((score, scan) => {
              return score + (scan.vulnerabilityCount || 0);
            }, 0) / scans.length;

          return Math.max(0, 100 - vulnerabilityScore * 10);
        };

        setSecurityScore(calculateSecurityScore());
      } catch (error) {
        showAlert('Failed to load dashboard data', 'error');
      }
    };

    fetchDashboardData();
  }, [getRecentScans, showAlert]);

  return (
    <Container className={classes.root} maxWidth="xl">
      <div className={classes.headerContainer}>
        <Typography variant="h4">Welcome, {user?.firstName || 'User'}</Typography>
        <div>
          <Button variant="contained" color="secondary" onClick={toggleThemeMode}>
            {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/scans/new"
            className={classes.newScanButton}
          >
            New Scan
          </Button>
        </div>
      </div>

      <Grid container spacing={3}>
        {/* Security Score */}
        <Grid item xs={12} md={4}>
          <Paper className={classes.paper}>
            <SecurityScoreCard score={securityScore} loading={loading} />
          </Paper>
        </Grid>

        {/* Alerts Widget */}
        <Grid item xs={12} md={8}>
          <Paper className={classes.paper}>
            <AlertsWidget />
          </Paper>
        </Grid>

        {/* Vulnerability Chart */}
        <Grid item xs={12} md={6}>
          <Paper className={classes.paper}>
            <VulnerabilityChart scans={recentScans} />
          </Paper>
        </Grid>

        {/* Scan History */}
        <Grid item xs={12} md={6}>
          <Paper className={classes.paper}>
            <ScanHistoryTable scans={recentScans} loading={loading} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;

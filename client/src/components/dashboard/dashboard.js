import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@mui/styles';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardData } from '../store/actions/dashboardActions';
import SecurityScoreCard from '../components/dashboard/SecurityScoreCard';
import VulnerabilityChart from '../components/dashboard/VulnerabilityChart';
import ScanHistoryTable from '../components/dashboard/ScanHistoryTable';
import AlertsWidget from '../components/dashboard/AlertsWidget';
import ScanForm from '../security/ScanForm';
import { useAuth } from '../contexts/AuthContext';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    height: '100%',
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  scoreContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    marginTop: theme.spacing(2),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);

  const { loading, securityScore, vulnerabilities, recentScans, alerts } = useSelector(
    state => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const handleNewScan = async scanData => {
    setIsScanning(true);
    // Implement scan logic here
    setTimeout(() => {
      setIsScanning(false);
      // Refresh dashboard data after scan
      dispatch(fetchDashboardData());
    }, 3000);
  };

  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <Container maxWidth="lg" className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Security Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Security Score */}
        <Grid item xs={12} md={4}>
          <Paper className={classes.paper}>
            <SecurityScoreCard score={securityScore} />
            <Box className={classes.actionButton}>
              <Button variant="contained" color="primary" fullWidth onClick={() => {}}>
                View Full Report
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Vulnerability Distribution */}
        <Grid item xs={12} md={8}>
          <Paper className={classes.paper}>
            <Typography variant="h6" gutterBottom>
              Vulnerability Distribution
            </Typography>
            <VulnerabilityChart data={vulnerabilities} />
          </Paper>
        </Grid>

        {/* New Scan */}
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography variant="h6" gutterBottom>
              Run New Security Analysis
            </Typography>
            <ScanForm onSubmit={handleNewScan} isLoading={isScanning} />
          </Paper>
        </Grid>

        {/* Recent Scans */}
        <Grid item xs={12} md={8}>
          <Paper className={classes.paper}>
            <Typography variant="h6" gutterBottom>
              Recent Security Scans
            </Typography>
            <ScanHistoryTable scans={recentScans} />
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={4}>
          <Paper className={classes.paper}>
            <Typography variant="h6" gutterBottom>
              Security Alerts
            </Typography>
            <AlertsWidget alerts={alerts} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;

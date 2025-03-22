import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardData } from '../store/actions/dashboardActions';
import SecurityScoreCard from '../components/dashboard/SecurityScoreCard';
import VulnerabilityChart from '../components/dashboard/VulnerabilityChart';
import ScanHistoryTable from '../components/dashboard/ScanHistoryTable';
import AlertsWidget from '../components/dashboard/AlertsWidget';
import ScanForm from '../security/ScanForm';
import { useAuth } from '../contexts/AuthContext';

// Using styled API instead of makeStyles
const StyledContainer = styled(Container)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
}));

const TitleTypography = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ScoreContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ActionButton = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
}));

const Dashboard = () => {
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
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  return (
    <StyledContainer maxWidth="lg">
      <TitleTypography variant="h4">Security Dashboard</TitleTypography>

      <Grid container spacing={3}>
        {/* Security Score */}
        <Grid item xs={12} md={4}>
          <StyledPaper elevation={3}>
            <SecurityScoreCard score={securityScore} />
            <ActionButton>
              <Button variant="contained" color="primary" fullWidth onClick={() => {}}>
                View Full Report
              </Button>
            </ActionButton>
          </StyledPaper>
        </Grid>

        {/* Vulnerability Distribution */}
        <Grid item xs={12} md={8}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Vulnerability Distribution
            </Typography>
            <VulnerabilityChart data={vulnerabilities} />
          </StyledPaper>
        </Grid>

        {/* New Scan */}
        <Grid item xs={12}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Run New Security Analysis
            </Typography>
            <ScanForm onSubmit={handleNewScan} isLoading={isScanning} />
          </StyledPaper>
        </Grid>

        {/* Recent Scans */}
        <Grid item xs={12} md={8}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Recent Security Scans
            </Typography>
            <ScanHistoryTable scans={recentScans} />
          </StyledPaper>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={4}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Security Alerts
            </Typography>
            <AlertsWidget alerts={alerts} />
          </StyledPaper>
        </Grid>
      </Grid>
    </StyledContainer>
  );
};

export default Dashboard;

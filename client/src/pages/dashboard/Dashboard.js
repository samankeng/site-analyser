import { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import SecurityScoreCard from '../../components/security/SecurityScoreCard';
import AlertsWidget from '../../components/dashboard/AlertsWidget';
import ScanHistoryTable from '../../components/dashboard/ScanHistoryTable';
import VulnerabilityChart from '../../components/dashboard/VulnerabilityChart';

import useScan from '../../hooks/useScan';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlert } from '../../contexts/AlertContext';
import { Link as RouterLink } from 'react-router-dom';

// Using styled API instead of makeStyles
const StyledContainer = styled(Container)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const HeaderContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const NewScanButton = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(2),
}));

const Dashboard = () => {
  const { user } = useAuth();
  const { getRecentScans, loading } = useScan();
  const { mode, toggleThemeMode } = useTheme();
  const { addAlert } = useAlert(); // Updated from showAlert to addAlert

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
        addAlert('Failed to load dashboard data', 'error');
      }
    };

    fetchDashboardData();
  }, [getRecentScans, addAlert]);

  return (
    <StyledContainer maxWidth="xl">
      <HeaderContainer>
        <Typography variant="h4">Welcome, {user?.firstName || 'User'}</Typography>
        <div>
          <Button variant="contained" color="secondary" onClick={toggleThemeMode}>
            {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
          </Button>
          <NewScanButton variant="contained" color="primary" component={RouterLink} to="/scans/new">
            New Scan
          </NewScanButton>
        </div>
      </HeaderContainer>

      <Grid container spacing={3}>
        {/* Security Score */}
        <Grid item xs={12} md={4}>
          <StyledPaper>
            <SecurityScoreCard score={securityScore} loading={loading} />
          </StyledPaper>
        </Grid>

        {/* Alerts Widget */}
        <Grid item xs={12} md={8}>
          <StyledPaper>
            <AlertsWidget />
          </StyledPaper>
        </Grid>

        {/* Vulnerability Chart */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <VulnerabilityChart scans={recentScans} />
          </StyledPaper>
        </Grid>

        {/* Scan History */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <ScanHistoryTable scans={recentScans} loading={loading} />
          </StyledPaper>
        </Grid>
      </Grid>
    </StyledContainer>
  );
};

export default Dashboard;

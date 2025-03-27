import { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, Button, Box, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';

// Components
import SecurityScoreCard from '../../components/dashboard/SecurityScoreCard';
import AlertsWidget from '../../components/dashboard/AlertsWidget';
import ScanHistoryTable from '../../components/dashboard/ScanHistoryTable';
import VulnerabilityChart from '../../components/dashboard/VulnerabilityChart';

// Hooks and Context
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlert } from '../../contexts/AlertContext';
import useScan from '../../hooks/useScan';

// MUI v6 uses styled as a function import instead of a named import
import { styled } from '@mui/material/styles';

// Styled components - updated for MUI v6
const StyledContainer = styled(Container)({
  flexGrow: 1,
  padding: '24px', // Using direct values instead of theme.spacing in v6
});

const StyledPaper = styled(Paper)({
  padding: '16px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const HeaderContainer = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
});

const NewScanButton = styled(Button)({
  marginLeft: '16px',
});

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
});

const Dashboard = () => {
  console.log('Dashboard rendering attempt...');
  const { user } = useAuth();
  const { getRecentScans, loading } = useScan();
  const { mode, toggleThemeMode } = useTheme();
  const { addAlert } = useAlert();

  const [recentScans, setRecentScans] = useState([]);
  const [securityScore, setSecurityScore] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const response = await getRecentScans(5);

        if (isMounted && response && response.data) {
          // The actual scan data is in response.data based on your backend
          const scans = response.data || [];
          setRecentScans(scans);

          if (scans.length) {
            const vulnData = processVulnerabilityData(scans);
            setVulnerabilities(vulnData);

            const score = calculateSecurityScore(scans);
            setSecurityScore(score);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching dashboard data:', error);
          addAlert('Failed to load dashboard data', 'error');
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Process vulnerability data for chart
  const processVulnerabilityData = scans => {
    const vulnTypes = {};

    scans.forEach(scan => {
      if (scan.vulnerabilities) {
        scan.vulnerabilities.forEach(vuln => {
          const type = vuln.type || 'Unknown';
          vulnTypes[type] = (vulnTypes[type] || 0) + 1;
        });
      }
    });

    return Object.entries(vulnTypes).map(([name, count]) => ({ name, count }));
  };

  // Calculate security score
  const calculateSecurityScore = scans => {
    if (!scans.length) return null;

    const vulnerabilityScore =
      scans.reduce((score, scan) => {
        return score + (scan.vulnerabilityCount || 0);
      }, 0) / scans.length;

    return Math.max(0, 100 - vulnerabilityScore * 10);
  };

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }
  console.log(user);
  return (
    <StyledContainer maxWidth="xl">
      <HeaderContainer>
        <Typography variant="h4">Welcome, {user?.name || 'User'}</Typography>
        <div>
          <Button variant="contained" color="secondary" onClick={toggleThemeMode}>
            {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
          </Button>
          <NewScanButton variant="contained" color="primary" component={Link} to="/scan">
            New Scan
          </NewScanButton>
        </div>
      </HeaderContainer>

      <Grid container spacing={3}>
        {/* Security Score */}
        <Grid item xs={12} md={4}>
          <StyledPaper elevation={3}>
            <SecurityScoreCard score={securityScore} loading={loading} />
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" color="primary" fullWidth component={Link} to="/reports">
                View Full Report
              </Button>
            </Box>
          </StyledPaper>
        </Grid>

        {/* Alerts Widget */}
        <Grid item xs={12} md={8}>
          <StyledPaper elevation={3}>
            <AlertsWidget />
          </StyledPaper>
        </Grid>

        {/* Vulnerability Chart */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Vulnerability Distribution
            </Typography>
            <VulnerabilityChart data={vulnerabilities} scans={recentScans} />
          </StyledPaper>
        </Grid>

        {/* Scan History */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
              Recent Security Scans
            </Typography>
            <ScanHistoryTable scans={recentScans} loading={loading} />
          </StyledPaper>
        </Grid>
      </Grid>
    </StyledContainer>
  );
};

export default Dashboard;

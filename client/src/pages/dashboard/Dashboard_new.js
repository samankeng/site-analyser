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

// Mock data for immediate UI display
const mockScans = [
  {
    id: '1',
    url: 'https://example.com',
    status: 'completed',
    createdAt: new Date().toISOString(),
    vulnerabilityCount: 12,
    vulnerabilities: [
      { id: '1', type: 'Critical', severity: 'critical' },
      { id: '2', type: 'High', severity: 'high' },
      { id: '3', type: 'Medium', severity: 'medium' },
      { id: '4', type: 'Low', severity: 'low' },
    ],
  },
  {
    id: '2',
    url: 'https://test-site.com',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    vulnerabilityCount: 5,
    vulnerabilities: [
      { id: '5', type: 'High', severity: 'high' },
      { id: '6', type: 'Medium', severity: 'medium' },
      { id: '7', type: 'Low', severity: 'low' },
    ],
  },
];

// Mock alerts for the alert widget
const mockAlerts = [
  {
    id: '1',
    title: 'Critical Vulnerability Detected',
    message: 'SSL certificate expiring in 3 days',
    type: 'security',
    severity: 'critical',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    title: 'Security Headers Missing',
    message: 'X-Content-Type-Options header not set',
    type: 'security',
    severity: 'medium',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    read: true,
  },
];

const Dashboard = () => {
  console.log('Dashboard rendering attempt...');
  const { user } = useAuth();
  const { getRecentScans, loading } = useScan();
  const { mode, toggleThemeMode } = useTheme();
  const { addAlert } = useAlert();

  const [recentScans, setRecentScans] = useState(mockScans);
  const [securityScore, setSecurityScore] = useState(78);
  const [vulnerabilities, setVulnerabilities] = useState([
    { name: 'Critical', count: 2 },
    { name: 'High', count: 5 },
    { name: 'Medium', count: 8 },
    { name: 'Low', count: 12 },
    { name: 'Info', count: 3 },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Attempting to fetch dashboard data...');
        // Fetch recent scans
        const scans = await getRecentScans(5);
        console.log('Fetched scans:', scans);

        if (scans && scans.length) {
          setRecentScans(scans);

          // Extract vulnerability data for chart
          const vulnData = processVulnerabilityData(scans);
          setVulnerabilities(vulnData);

          // Get security score
          const score = calculateSecurityScore(scans);
          setSecurityScore(score);
        } else {
          console.log('No scans returned, using mock data');
          // Keep using mock data if API returns empty
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        addAlert('Failed to load dashboard data', 'error');
      }
    };

    fetchDashboardData();
  }, [getRecentScans, addAlert]);

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

  console.log('User data:', user);
  console.log('Current scans data:', recentScans);

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
            <AlertsWidget alerts={mockAlerts} />
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

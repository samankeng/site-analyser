import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Button, Tabs, Tab, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';

import ScanProgress from '../../components/security/ScanProgress';
import SecurityScoreCard from '../../components/security/SecurityScoreCard';
import HeaderAnalysis from '../../components/reports/HeaderAnalysis';
import SslAnalysis from '../../components/reports/SslAnalysis';
import VulnerabilityList from '../../components/reports/VulnerabilityList';
import AiRecommendations from '../../components/reports/AiRecommendations';

import useScan from '../../hooks/useScan';
import { useAlert } from '../../contexts/AlertContext';

// Using styled API instead of makeStyles
const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const Header = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const TabPanel = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  width: '100%',
}));

const ActionButtons = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(3),
}));

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <TabPanel
      role="tabpanel"
      hidden={value !== index}
      id={`scan-tabpanel-${index}`}
      aria-labelledby={`scan-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </TabPanel>
  );
}

const ScanStatus = () => {
  const navigate = useNavigate();
  const { scanId } = useParams();
  const { fetchScanResults, currentScan, cancelScan } = useScan();
  const { addAlert } = useAlert(); // Changed from showAlert to addAlert

  const [tabValue, setTabValue] = useState(0);
  const [scanResults, setScanResults] = useState(null);

  useEffect(() => {
    const loadScanResults = async () => {
      try {
        const results = await fetchScanResults(scanId);
        if (results) {
          setScanResults(results);
        } else {
          addAlert('Failed to load scan results', 'error');
        }
      } catch (error) {
        addAlert('Error retrieving scan details', 'error');
      }
    };

    if (currentScan?.status === 'completed') {
      loadScanResults();
    }
  }, [scanId, currentScan, fetchScanResults, addAlert]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCancelScan = async () => {
    try {
      const success = await cancelScan(scanId);
      if (success) {
        addAlert('Scan cancelled successfully', 'info');
        navigate('/dashboard');
      }
    } catch (error) {
      addAlert('Failed to cancel scan', 'error');
    }
  };

  return (
    <StyledContainer maxWidth="lg">
      <Header>
        <Typography variant="h4">
          Scan Results
          {currentScan?.targetUrl && (
            <Typography variant="subtitle1" color="text.secondary">
              {currentScan.targetUrl}
            </Typography>
          )}
        </Typography>
        <Button variant="outlined" color="primary" onClick={() => navigate('/scan')}>
          New Scan
        </Button>
      </Header>

      {/* Scan Progress Indicator */}
      <ScanProgress
        scan={currentScan}
        onCancel={handleCancelScan}
        onViewResults={() => {}}
        onNewScan={() => navigate('/scan')}
      />

      {/* Detailed Results */}
      {currentScan?.status === 'completed' && (
        <>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <SecurityScoreCard
                score={scanResults?.securityScore}
                details={scanResults?.scoreDetails}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Vulnerabilities" />
                  <Tab label="Headers" />
                  <Tab label="SSL/TLS" />
                  <Tab label="AI Recommendations" />
                </Tabs>

                <CustomTabPanel value={tabValue} index={0}>
                  <VulnerabilityList vulnerabilities={scanResults?.vulnerabilities} />
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={1}>
                  <HeaderAnalysis headers={scanResults?.headers} />
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={2}>
                  <SslAnalysis sslDetails={scanResults?.sslAnalysis} />
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={3}>
                  <AiRecommendations recommendations={scanResults?.aiRecommendations} />
                </CustomTabPanel>
              </Paper>
            </Grid>
          </Grid>

          <ActionButtons>
            <Button variant="outlined" color="inherit" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                /* Export Report */
              }}
            >
              Export Full Report
            </Button>
          </ActionButtons>
        </>
      )}
    </StyledContainer>
  );
};

export default ScanStatus;

import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Button, Tabs, Tab, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useParams, useNavigate } from 'react-router-dom';

import ScanProgress from '../../components/security/ScanProgress';
import SecurityScoreCard from '../../components/security/SecurityScoreCard';
import HeaderAnalysis from '../../components/reports/HeaderAnalysis';
import SslAnalysis from '../../components/reports/SslAnalysis';
import VulnerabilityList from '../../components/reports/VulnerabilityList';
import AiRecommendations from '../../components/reports/AiRecommendations';

import useScan from '../../hooks/useScan';
import { useAlert } from '../../contexts/AlertContext';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  tabPanel: {
    marginTop: theme.spacing(2),
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(3),
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scan-tabpanel-${index}`}
      aria-labelledby={`scan-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

const ScanStatus = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { scanId } = useParams();
  const { fetchScanResults, currentScan, cancelScan } = useScan();
  const { showAlert } = useAlert();

  const [tabValue, setTabValue] = useState(0);
  const [scanResults, setScanResults] = useState(null);

  useEffect(() => {
    const loadScanResults = async () => {
      try {
        const results = await fetchScanResults(scanId);
        if (results) {
          setScanResults(results);
        } else {
          showAlert('Failed to load scan results', 'error');
        }
      } catch (error) {
        showAlert('Error retrieving scan details', 'error');
      }
    };

    if (currentScan?.status === 'completed') {
      loadScanResults();
    }
  }, [scanId, currentScan, fetchScanResults, showAlert]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCancelScan = async () => {
    try {
      const success = await cancelScan(scanId);
      if (success) {
        showAlert('Scan cancelled successfully', 'info');
        navigate('/dashboard');
      }
    } catch (error) {
      showAlert('Failed to cancel scan', 'error');
    }
  };

  return (
    <Container maxWidth="lg" className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h4">
          Scan Results
          {currentScan?.targetUrl && (
            <Typography variant="subtitle1" color="textSecondary">
              {currentScan.targetUrl}
            </Typography>
          )}
        </Typography>
        <Button variant="outlined" color="primary" onClick={() => navigate('/scans/new')}>
          New Scan
        </Button>
      </div>

      {/* Scan Progress Indicator */}
      <ScanProgress
        scan={currentScan}
        onCancel={handleCancelScan}
        onViewResults={() => {}}
        onNewScan={() => navigate('/scans/new')}
      />

      {/* Detailed Results */}
      {currentScan?.status === 'completed' && (
        <>
          <Grid container spacing={3} style={{ marginTop: 16 }}>
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

                <TabPanel value={tabValue} index={0}>
                  <VulnerabilityList vulnerabilities={scanResults?.vulnerabilities} />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  <HeaderAnalysis headers={scanResults?.headers} />
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                  <SslAnalysis sslDetails={scanResults?.sslAnalysis} />
                </TabPanel>
                <TabPanel value={tabValue} index={3}>
                  <AiRecommendations recommendations={scanResults?.aiRecommendations} />
                </TabPanel>
              </Paper>
            </Grid>
          </Grid>

          <div className={classes.actionButtons}>
            <Button variant="outlined" color="default" onClick={() => navigate('/dashboard')}>
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
          </div>
        </>
      )}
    </Container>
  );
};

export default ScanStatus;

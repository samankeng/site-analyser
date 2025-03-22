import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { fetchReportDetails } from '../../store/actions/reportActions';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import HeaderAnalysis from '../../components/reports/HeaderAnalysis';
import SslAnalysis from '../../components/reports/SslAnalysis';
import VulnerabilityList from '../../components/reports/VulnerabilityList';
import AiRecommendations from '../../components/reports/AiRecommendations';
import { formatDate } from '../../utils/formatters';

const SecurityReport = () => {
  const { reportId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentReport, loading, error } = useSelector(state => state.reports);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (reportId) {
      dispatch(fetchReportDetails(reportId));
    }
  }, [dispatch, reportId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/reports');
  };

  const getRiskLevel = score => {
    if (score > 70) return { text: 'High Risk', color: 'error' };
    if (score > 40) return { text: 'Medium Risk', color: 'warning' };
    return { text: 'Low Risk', color: 'success' };
  };

  const handleDownloadReport = () => {
    // Logic to download PDF report
    console.log('Downloading report...');
  };

  const handleShareReport = () => {
    // Logic to share report
    console.log('Sharing report...');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) return <Loader />;
  if (error) return <Alert severity="error" message={error} />;
  if (!currentReport) return <Alert severity="info" message="Report not found" />;

  const riskLevel = getRiskLevel(currentReport.riskScore);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Security Report
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              {currentReport.domain}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scan completed on {formatDate(currentReport.createdAt)}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`Scan Type: ${currentReport.scanType}`}
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
              <Chip
                label={`${currentReport.vulnerabilitiesCount} vulnerabilities found`}
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={100 - currentReport.riskScore}
                size={80}
                thickness={5}
                sx={{
                  color: theme => theme.palette[riskLevel.color].main,
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" component="div" color="text.secondary">
                  {currentReport.riskScore}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <Chip label={riskLevel.text} color={riskLevel.color} />
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Download PDF Report">
            <IconButton onClick={handleDownloadReport} sx={{ ml: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share Report">
            <IconButton onClick={handleShareReport} sx={{ ml: 1 }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Report">
            <IconButton onClick={handlePrintReport} sx={{ ml: 1 }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Overview" />
          <Tab label="Vulnerabilities" />
          <Tab label="Headers Analysis" />
          <Tab label="SSL/TLS Analysis" />
          <Tab label="AI Recommendations" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Typography paragraph>{currentReport.summary}</Typography>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Risk Score Breakdown
                    </Typography>
                    {/* Risk score visualization would go here */}
                    <Typography variant="body2" color="text.secondary">
                      The overall risk score is calculated based on the severity and number of
                      detected vulnerabilities.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Quick Facts
                    </Typography>
                    <Box sx={{ '& > div': { mb: 1 } }}>
                      <Typography variant="body2">
                        <strong>Server:</strong> {currentReport.serverInfo?.server || 'Unknown'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>IP Address:</strong> {currentReport.serverInfo?.ip || 'Unknown'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>SSL Grade:</strong> {currentReport.sslInfo?.grade || 'Unknown'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Response Time:</strong>{' '}
                        {currentReport.performanceInfo?.responseTime || 'Unknown'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 1 && <VulnerabilityList vulnerabilities={currentReport.vulnerabilities} />}

          {tabValue === 2 && <HeaderAnalysis headers={currentReport.headers} />}

          {tabValue === 3 && <SslAnalysis sslInfo={currentReport.sslInfo} />}

          {tabValue === 4 && (
            <AiRecommendations recommendations={currentReport.aiRecommendations} />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SecurityReport;

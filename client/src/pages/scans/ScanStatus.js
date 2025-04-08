import { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Grid, Paper, Button, Tabs, Tab, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import ScanProgress from '../../components/security/ScanProgress';
import SecurityScoreCard from '../../components/security/SecurityScoreCard';
import HeaderAnalysis from '../../components/reports/HeaderAnalysis';
import SslAnalysis from '../../components/reports/SslAnalysis';
import VulnerabilityList from '../../components/reports/VulnerabilityList';
import AiRecommendations from '../../components/reports/AiRecommendations';

import { useAlert } from '../../contexts/AlertContext';
import { getScanStatus, getScanResults, cancelScan } from '../../store/actions/scanActions';

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
  const dispatch = useDispatch();
  const { scanId } = useParams();
  const { addAlert } = useAlert();

  // Access Redux state directly for scan data
  const { scan, status, results, loading, statusLoading, resultsLoading } = useSelector(state => state.scans);
  const currentScan = scan || status; // Use whichever has data

  const [tabValue, setTabValue] = useState(0);
  const [scanResults, setScanResults] = useState(null);
  const [lastResultsFetch, setLastResultsFetch] = useState(null);
  const [lastStatusFetch, setLastStatusFetch] = useState(null);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Load scan results 
  const loadScanResults = useCallback(async () => {
    // Don't fetch if we already fetched recently (prevent duplicate requests)
    const now = new Date();
    if (lastResultsFetch && now - lastResultsFetch < 5000) {
      console.log('Skipping results fetch - last fetch was too recent');
      return; // Don't fetch if less than 5 seconds since last fetch
    }

    try {
      if (scanId) {
        console.log('Attempting to load results for scanId:', scanId);
        
        try {
          // First try direct API call for results
          const apiUrl = `/api/scans/${scanId}/results?t=${Date.now()}`;
          console.log('Fetching scan results via direct API:', apiUrl);
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              console.log('Successfully loaded results via direct API');
              setScanResults(data.data);
              setLastResultsFetch(new Date());
              
              // Also update Redux store if needed
              dispatch({
                type: 'GET_SCAN_RESULTS_SUCCESS',
                payload: data.data
              });
              
              console.log('Results loaded successfully');
              return data.data;
            } else {
              console.warn('API response missing success or data:', data);
            }
          } else {
            console.warn('Direct API call failed:', response.statusText);
          }
        } catch (directApiError) {
          console.warn('Direct API call exception:', directApiError);
        }
        
        // Fall back to Redux action if direct API call fails
        console.log('Falling back to Redux action for results');
        try {
          const resultAction = await dispatch(getScanResults(scanId));
          if (resultAction.payload) {
            console.log('Successfully loaded results via Redux');
            setScanResults(resultAction.payload);
            setLastResultsFetch(new Date());
            return resultAction.payload;
          } else {
            console.error('Failed to load results via Redux:', resultAction.error);
          }
        } catch (reduxError) {
          console.error('Redux error:', reduxError);
        }
        
        // If both approaches fail, try to use current scan data as a fallback
        if (currentScan && currentScan.summary) {
          console.log('Using current scan data as fallback for results');
          // Create a minimal results object from currentScan
          const fallbackResults = {
            scanId: currentScan._id,
            url: currentScan.url,
            summary: currentScan.summary,
            createdAt: currentScan.createdAt,
            completedAt: currentScan.completedAt,
            aiAnalysis: currentScan.aiAnalysis
          };
          
          setScanResults(fallbackResults);
          setLastResultsFetch(new Date());
          return fallbackResults;
        }
        
        // Still no results, show error
        addAlert('Failed to load scan results after multiple attempts', 'error');
      }
    } catch (error) {
      console.error('Error loading scan results:', error);
      
      // Only show error if we haven't shown one recently
      if (!lastResultsFetch || (now - lastResultsFetch > 30000)) {
        addAlert('Error retrieving scan details', 'error');
      }
    }
    
    return null;
  }, [scanId, dispatch, addAlert, lastResultsFetch, currentScan]);

  // Define status fetch function
  const fetchScanStatus = useCallback(async () => {
    try {
      if (scanId) {
        console.log('Fetching scan status for scanId:', scanId);
        
        // Direct API call to get the latest status - bypassing all cache
        const apiUrl = `/api/scans/${scanId}?nocache=${Date.now()}`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Log the raw response data
            console.log('Raw API response:', JSON.stringify(result.data));
            setLastStatusFetch(new Date());
            
            // Force update Redux store
            dispatch({
              type: 'GET_SCAN_STATUS_SUCCESS',
              payload: result.data
            });
            
            // Check if status is completed
            const isCompleted = 
              result.data.status?.toLowerCase().includes('complete') || 
              result.data.progress === 100 ||
              (result.data.summary && Object.keys(result.data.summary).length > 0) ||
              Boolean(result.data.completedAt);
              
            if (isCompleted && !scanResults) {
              console.log('Scan is completed, loading results immediately');
              await loadScanResults();
              
              // Force a page refresh if we still don't have results
              setTimeout(() => {
                if (!scanResults) {
                  console.log('Still no results after loading, forcing page refresh');
                  window.location.reload();
                }
              }, 2000);
            }
            
            return result.data;
          }
        } else {
          console.error('API error during direct fetch:', response.statusText);
        }
        
        // Fall back to Redux action if direct API call fails
        const statusAction = await dispatch(getScanStatus(scanId));
        return statusAction.payload;
      }
    } catch (error) {
      console.error('Error fetching scan status:', error);
    }
    return null;
  }, [scanId, dispatch, scanResults, loadScanResults]);

  // Set up polling on component mount
  useEffect(() => {
    // Fetch status immediately - force a direct fetch
    const initialFetch = async () => {
      // Direct API call to get the current state immediately
      try {
        const response = await fetch(`/api/scans/${scanId}?init=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('Initial fetch data:', result.data);
            
            // Update Redux store directly
            dispatch({
              type: 'GET_SCAN_STATUS_SUCCESS',
              payload: result.data
            });
            
            // Check if completed to load results
            if (result.data.status === 'completed' || 
                result.data.progress === 100 || 
                result.data.completedAt) {
              loadScanResults();
            }
          }
        }
      } catch (error) {
        console.error('Initial fetch error:', error);
      }
      
      // Regular fetch as fallback
      fetchScanStatus();
    };
    
    initialFetch();

    // Set up polling interval with silent updates 
    const interval = setInterval(fetchScanStatus, 3000);

    return () => clearInterval(interval);
  }, [fetchScanStatus, scanId, loadScanResults, dispatch]);

  // Fetch results when scan completes
  useEffect(() => {
    // Skip if we already have results
    if (scanResults) return;
    
    // Check if we have valid scan data
    if (!currentScan) return;
    
    // Normalize status to handle different formats
    const normalizedStatus = currentScan.status ? 
      currentScan.status.toLowerCase().replace(/_/g, '') : '';
    
    console.log('Checking if we should load results. Status:', normalizedStatus);
    
    // Multiple conditions to detect a completed scan
    const shouldLoadResults = 
      normalizedStatus.includes('complete') || 
      (currentScan.summary && Object.keys(currentScan.summary).length > 0) ||
      (currentScan.results && currentScan.results !== null) ||
      (currentScan.progress >= 95) || // High progress is likely completed
      currentScan.completedAt != null; // Has completion date
    
    if (shouldLoadResults) {
      console.log('Status indicates completed scan or we have summary/results, loading results');
      loadScanResults();
    }
  }, [currentScan, scanResults, loadScanResults]);

  // Add a guaranteed render fallback
  useEffect(() => {
    // Emergency fallback: If we've been on this page for a while and still don't see results
    const emergencyTimeout = setTimeout(() => {
      if (scanId) {
        // Direct API call to get the absolute latest data
        fetch(`/api/scans/${scanId}?emergency=true&t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            console.log('EMERGENCY CHECK - Current scan state:', data.data);
            
            // Force update redux store
            dispatch({
              type: 'GET_SCAN_STATUS_SUCCESS',
              payload: data.data
            });
            
            // If scan is completed in DB but not showing correctly, force reload
            if (data.data.status === 'completed' && 
                (!scanResults || !currentScan || currentScan.status !== 'completed')) {
              console.log('EMERGENCY RELOAD - Database shows completed but UI doesn\'t');
              window.location.reload();
            }
          }
        })
        .catch(error => {
          console.error('Emergency check failed:', error);
        });
      }
    }, 30000); // 30 seconds after mount
    
    return () => clearTimeout(emergencyTimeout);
  }, [scanId, scanResults, currentScan, dispatch]);

  // Detect and fix inconsistent state
  useEffect(() => {
    // Check for inconsistent state between what we have and what's displayed
    const checkConsistency = () => {
      if (!currentScan) return;
      
      // If we have evidence the scan is completed but not showing it correctly
      const hasCompletionData = 
        currentScan.summary || 
        currentScan.completedAt || 
        currentScan.progress === 100 ||
        (currentScan.results && currentScan.results !== null);
      
      const isShownAsCompleted = 
        currentScan.status === 'completed' || 
        (scanResults !== null);
      
      if (hasCompletionData && !isShownAsCompleted) {
        console.log('Detected inconsistent state - scan appears completed but not showing correctly');
        console.log('Current data:', currentScan);
        
        // Force a window reload to fix the inconsistent state
        if (!window.hasAutoReloaded) {
          console.log('Setting reload timeout');
          window.hasAutoReloaded = true;
          
          setTimeout(() => {
            console.log('Forcing reload due to inconsistent state');
            window.location.reload();
          }, 3000);
        }
      }
    };
    
    // Run consistency check initially and on state changes
    checkConsistency();
    
    // Also set up a periodic check
    const interval = setInterval(checkConsistency, 5000);
    
    return () => clearInterval(interval);
  }, [currentScan, scanResults]);

  // Cancel scan handler
  const handleCancelScan = async (force = false) => {
    try {
      console.log('Cancelling scan with ID:', scanId, 'Force:', force);
      
      if (force) {
        // Direct API call for force cancellation
        const apiUrl = `/api/scans/${scanId}?force=true`;
        console.log('Making direct API call to:', apiUrl);
        
        try {
          const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            addAlert('Scan successfully force reset', 'success');
            // Refresh data after force reset
            await dispatch(getScanStatus(scanId));
          } else {
            const errorData = await response.json();
            addAlert(`Force reset failed: ${errorData.message || 'Unknown error'}`, 'error');
          }
        } catch (apiError) {
          console.error('Direct API call failed:', apiError);
          addAlert(`API error: ${apiError.message}`, 'error');
        }
      } else {
        // Use redux action for normal cancellation
        const resultAction = await dispatch(cancelScan(scanId));
        
        if (!resultAction.error) {
          addAlert('Scan cancelled successfully', 'info');
          // Refresh status after cancellation
          dispatch(getScanStatus(scanId));
        } else {
          addAlert(`Failed to cancel scan: ${resultAction.error?.message || 'Unknown error'}`, 'error');
          console.error('Cancel scan error:', resultAction.error);
        }
      }
    } catch (error) {
      addAlert(`Failed to cancel scan: ${error.message || 'Unknown error'}`, 'error');
      console.error('Error cancelling scan:', error);
    }
  };

  // Handle retry for results when there's an error
  const handleRetryResults = () => {
    loadScanResults();
  };

  // Force refresh status and results
  const handleForceRefresh = async () => {
    try {
      addAlert('Force refreshing scan status...', 'info');
      
      // First try to reset Redux state
      dispatch({ type: 'RESET_SCAN_DATA' });
      
      // Direct API call with cache busting
      const response = await fetch(`/api/scans/${scanId}?forcereload=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('Force refresh received data:', data.data);
          
          // Force update Redux store
          dispatch({
            type: 'GET_SCAN_STATUS_SUCCESS',
            payload: data.data
          });
          
          // Load results if completed
          if (data.data.status === 'completed' || 
              data.data.progress === 100 || 
              data.data.summary || 
              data.data.completedAt) {
            await loadScanResults();
            
            // If still no results, force page reload
            if (!scanResults) {
              console.log('Force refreshing page after results load attempt');
              window.location.reload();
            }
          }
          
          addAlert('Scan status refreshed successfully', 'success');
        } else {
          addAlert('Received invalid response from server', 'error');
        }
      } else {
        // If direct call fails, force a page reload
        addAlert('Error refreshing status, reloading page', 'warning');
        window.location.reload();
      }
    } catch (error) {
      addAlert('Error refreshing scan status, reloading page', 'error');
      console.error('Refresh error:', error);
      // Last resort: reload the page
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  // Determine if we're loading
  const isLoading = loading || statusLoading || !currentScan;

  return (
    <StyledContainer maxWidth="lg">
      <Header>
        <Typography variant="h4">
          Scan Results
          {currentScan?.url && (
            <Typography variant="subtitle1" color="text.secondary">
              {currentScan.url}
            </Typography>
          )}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="secondary" onClick={handleForceRefresh}>
            Refresh Status
          </Button>
          <Button variant="outlined" color="primary" onClick={() => navigate('/scan')}>
            New Scan
          </Button>
        </Box>
      </Header>

      {/* Scan Progress Indicator */}
      <ScanProgress
        scan={currentScan}
        onCancel={handleCancelScan}
        onViewResults={() => {
          // If we have completed scan but no results, try to load them
          if (!scanResults) {
            loadScanResults();
          }
        }}
        onNewScan={() => navigate('/scan')}
        loading={isLoading && !currentScan} // Only show loading if we have no scan data at all
      />

      {/* Detailed Results */}
      {(currentScan?.status?.toLowerCase().includes('complete') || 
        scanResults || 
        (currentScan?.summary && Object.keys(currentScan.summary).length > 0) ||
        currentScan?.completedAt ||
        currentScan?.progress === 100) && (
        <>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <SecurityScoreCard
                score={scanResults?.summary?.overall || currentScan?.summary?.overall}
                details={scanResults?.scoreDetails || currentScan?.summary}
                loading={resultsLoading || (!scanResults && !currentScan?.summary)}
                onRetry={handleRetryResults}
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
                  <VulnerabilityList 
                    vulnerabilities={scanResults?.vulnerabilities || []} 
                    loading={resultsLoading || !scanResults}
                  />
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={1}>
                  <HeaderAnalysis 
                    headers={scanResults?.headers || []} 
                    rawHeaders={scanResults?.rawHeaders || {}}
                    loading={resultsLoading || !scanResults}
                  />
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={2}>
                  <SslAnalysis 
                    findings={scanResults?.sslAnalysis?.findings || []}
                    metadata={scanResults?.sslAnalysis?.metadata || {}}
                    loading={resultsLoading || !scanResults}
                  />
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={3}>
                  <AiRecommendations 
                    analysis={scanResults?.aiRecommendations || currentScan?.aiAnalysis || {}}
                    loading={resultsLoading || !scanResults}
                    onGenerateAnalysis={() => {
                      addAlert('Generating AI recommendations...', 'info');
                      // Here you would implement a call to generate AI recommendations
                      // if they weren't generated automatically
                    }}
                  />
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
                addAlert('Exporting report...', 'info');
                /* Here you would implement export functionality */
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
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Button,
  Divider,
  Grid,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import LanguageIcon from '@mui/icons-material/Language';
import BugReportIcon from '@mui/icons-material/BugReport';
import WifiIcon from '@mui/icons-material/Wifi';
import CodeIcon from '@mui/icons-material/Code';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningIcon from '@mui/icons-material/Warning';
import { formatDuration } from '../../utils/formatters';
import { getScanStatus } from '../../store/actions/scanActions';
import { useAlert } from '../../contexts/AlertContext';

/**
 * Scan status constants
 */
const SCAN_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Using styled API instead of makeStyles
const Root = styled(Paper)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(3),
}));

const Header = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
}));

const UrlChip = styled(Chip)(({ theme }) => ({
  padding: theme.spacing(1),
  fontSize: '1rem',
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const ProgressText = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
}));

const InfoGrid = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const InfoItem = styled(Grid)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1.2rem',
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

const ActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(3, 0),
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  backgroundColor: 'transparent',
}));

const StepIcon = styled('span')(({ theme }) => ({
  marginRight: theme.spacing(1),
}));

const StyledStepContent = styled(StepContent)(({ theme }) => ({
  paddingBottom: theme.spacing(2),
}));

const StepperContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  padding: theme.spacing(4),
}));

const EstimatedTime = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontStyle: 'italic',
}));

const CancelButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.grey[300],
  '&:hover': {
    backgroundColor: theme.palette.grey[400],
  },
}));

// Status icon styles
const IconCompleted = styled(CheckCircleIcon)(({ theme }) => ({
  color: theme.palette.success.main,
}));

const IconError = styled(ErrorIcon)(({ theme }) => ({
  color: theme.palette.error.main,
}));

const IconCancel = styled(CancelIcon)(({ theme }) => ({
  color: theme.palette.error.main,
}));

const IconProgress = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Rate limit error handling
const refreshIntervals = {
  initial: 5000,       // Start at 5 seconds
  backoff: 15000,      // Back off to 15 seconds if rate limited
  completed: 30000,    // When completed, check less frequently
  error: 10000         // Error state check interval
};

/**
 * Scan progress component for displaying the current status of a security scan
 *
 * @param {Object} props - Component props
 * @param {Object} props.scan - Scan object with status and progress information
 * @param {Function} props.onCancel - Function called when user cancels the scan
 * @param {Function} props.onViewResults - Function called when user wants to view results
 * @param {Function} props.onNewScan - Function called when user wants to start a new scan
 * @param {boolean} props.loading - Whether scan data is loading
 */
const ScanProgress = ({ scan = {}, onCancel, onViewResults, onNewScan, loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const { addAlert } = useAlert();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [pollInterval, setPollInterval] = useState(refreshIntervals.initial);
  const [rateLimitHit, setRateLimitHit] = useState(false);

  // Start timer when scan is in progress
  useEffect(() => {
    let timer;

    if (scan && (scan.status === SCAN_STATUS.IN_PROGRESS || scan.status === SCAN_STATUS.PENDING)) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else if (scan && scan.startedAt && scan.completedAt) {
      // Calculate elapsed time for completed scans
      const start = new Date(scan.startedAt);
      const end = new Date(scan.completedAt);
      const diffSeconds = Math.floor((end - start) / 1000);
      setTimeElapsed(diffSeconds);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [scan?.status, scan?.startedAt, scan?.completedAt]);

  // Update active step based on progress
  useEffect(() => {
    if (!scan) return;
    
    const progress = scan.progress || 0;
    
    if (progress >= 75) {
      setActiveStep(3);
    } else if (progress >= 50) {
      setActiveStep(2);
    } else if (progress >= 25) {
      setActiveStep(1);
    } else {
      setActiveStep(0);
    }
  }, [scan?.progress]);

  // Normalize scan status from database to match UI constants
  const normalizeStatus = (status) => {
    if (!status) return SCAN_STATUS.PENDING;
    
    // Convert status to lowercase and handle different formats
    const normalizedStatus = status.toLowerCase().replace(/_/g, '');
    
    if (normalizedStatus.includes('inprogress') || normalizedStatus.includes('in_progress')) 
      return SCAN_STATUS.IN_PROGRESS;
    if (normalizedStatus.includes('complete')) 
      return SCAN_STATUS.COMPLETED;
    if (normalizedStatus.includes('fail')) 
      return SCAN_STATUS.FAILED;
    if (normalizedStatus.includes('cancel')) 
      return SCAN_STATUS.CANCELLED;
    
    return SCAN_STATUS.PENDING;
  };

  // Calculate estimated remaining time
  const getEstimatedTimeRemaining = () => {
    if (!scan?.estimatedCompletionTime) return null;

    const now = new Date();
    const completionTime = new Date(scan.estimatedCompletionTime);
    const remainingMs = completionTime - now;

    if (remainingMs <= 0) return 'Finalizing...';

    // Convert to seconds
    const remainingSeconds = Math.floor(remainingMs / 1000);
    return formatDuration(remainingSeconds);
  };

  // Get status icon
  const getStatusIcon = (status) => {
    if (!status) return <IconProgress size={20} />;
    
    // Always normalize status to handle any potential inconsistencies
    const normalizedStatus = normalizeStatus(status);
    console.log('Normalized status for icon:', normalizedStatus, 'Original:', status);
    
    switch (normalizedStatus) {
      case SCAN_STATUS.COMPLETED:
        return <IconCompleted />;
      case SCAN_STATUS.FAILED:
        return <IconError />;
      case SCAN_STATUS.CANCELLED:
        return <IconCancel />;
      case SCAN_STATUS.IN_PROGRESS:
        return <IconProgress size={20} />;
      case SCAN_STATUS.PENDING:
        return <IconProgress size={20} />;
      default:
        // Fall back to in-progress for unrecognized status
        console.warn('Unrecognized status:', status);
        return <IconProgress size={20} />;
    }
  };

  // Get scan stage steps
  const getScanSteps = () => {
    const steps = [
      {
        label: 'Initializing Scan',
        icon: <BugReportIcon sx={{ mr: 1 }} />,
        description: 'Setting up scan parameters and preparing security analyzers.',
      },
      {
        label: 'SSL/TLS Analysis',
        icon: <LockIcon sx={{ mr: 1 }} />,
        description: 'Analyzing SSL certificates, protocols, and cipher configurations.',
      },
      {
        label: 'Security Headers & Port Scanning',
        icon: <LanguageIcon sx={{ mr: 1 }} />,
        description: 'Evaluating HTTP security headers and checking for open ports.',
      },
      {
        label: 'Vulnerability Assessment',
        icon: <SpeedIcon sx={{ mr: 1 }} />,
        description: 'Conducting in-depth analysis of potential security vulnerabilities.',
      },
    ];

    return steps;
  };

  const handleForceReset = async () => {
    try {
      // Make direct API call to force cancel the scan 
      addAlert('Attempting to force reset scan...', 'info');
      
      try {
        // Try to make direct API call if onCancel fails
        const response = await fetch(`/api/scans/${scan._id}?force=true`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          addAlert('Scan state has been force reset', 'success');
          // Refresh the page after successful force reset
          window.location.reload();
        } else {
          // Fall back to the provided onCancel function
          onCancel(true);
        }
      } catch (apiError) {
        console.error('Direct API call failed, using onCancel fallback', apiError);
        // Fall back to the provided onCancel function
        onCancel(true);
      }
    } catch (error) {
      addAlert(`Failed to reset scan: ${error.message}`, 'error');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Root>
        <LoadingContainer>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading scan information...
          </Typography>
        </LoadingContainer>
      </Root>
    );
  }

  // If no scan data, show message
  if (!scan || Object.keys(scan).length === 0) {
    return (
      <Root>
        <LoadingContainer>
          <Typography variant="h6">
            No scan data available
          </Typography>
        </LoadingContainer>
      </Root>
    );
  }

  // Display formatted scan status 
  const displayStatus = (status) => {
    // If no status, show loading
    if (!status) return 'LOADING';
    
    const normalizedStatus = normalizeStatus(status);
    
    // Format the status for display
    if (normalizedStatus === SCAN_STATUS.IN_PROGRESS) return 'IN PROGRESS';
    if (normalizedStatus === SCAN_STATUS.COMPLETED) return 'COMPLETED';
    if (normalizedStatus === SCAN_STATUS.FAILED) return 'FAILED';
    if (normalizedStatus === SCAN_STATUS.CANCELLED) return 'CANCELLED';
    if (normalizedStatus === SCAN_STATUS.PENDING) return 'PENDING';
    
    // Fallback: uppercase whatever we got
    return status.toUpperCase();
  };

  // Get progress value, ensuring it's a number and between 0-100
  const getProgressValue = () => {
    // Handle case where progress is missing
    if (scan.progress === undefined || scan.progress === null) {
      // Return different values based on status for better UX
      if (normalizeStatus(scan.status) === SCAN_STATUS.COMPLETED) return 100;
      if (normalizeStatus(scan.status) === SCAN_STATUS.FAILED) return 100;
      if (normalizeStatus(scan.status) === SCAN_STATUS.CANCELLED) return 100;
      if (normalizeStatus(scan.status) === SCAN_STATUS.IN_PROGRESS) return 50; // default to 50% for in-progress
      return 0; // Default for pending or unknown
    }
    
    const progress = Number(scan.progress);
    if (isNaN(progress)) return 0;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Normalize scan.url, which might be in targetUrl or url
  const scanUrl = scan.targetUrl || scan.url || '';

  // For debugging
  console.log('ScanProgress rendering with scan:', scan);

  // Render main scan progress view
  return (
    <Root>
      {/* Scan Header */}
      <Header>
        <Typography variant="h5">Security Scan Progress</Typography>
        {scanUrl && (
          <UrlChip icon={<WifiIcon />} label={scanUrl} color="primary" variant="outlined" />
        )}
      </Header>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 2, p: 1, bgcolor: theme.palette.info.light, borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            Status: {scan.status || 'N/A'} | 
            Progress: {scan.progress || 0}% | 
            Has results: {scan.results ? 'Yes' : 'No'} | 
            DB ID: {scan._id || 'N/A'}
          </Typography>
        </Box>
      )}

      {/* Rate limit warning if hit */}
      {rateLimitHit && (
        <Box sx={{ mb: 2, p: 1, bgcolor: theme.palette.warning.light, borderRadius: 1 }}>
          <Typography variant="body2" color="warning.dark">
            Status updates are being throttled due to API rate limits. Updates will continue at a slower pace.
          </Typography>
        </Box>
      )}

      {/* Overall Progress */}
      <ProgressContainer>
        <LinearProgress
          variant="determinate"
          value={getProgressValue()}
          color={
            normalizeStatus(scan.status) === SCAN_STATUS.FAILED ? 'error' : 
            normalizeStatus(scan.status) === SCAN_STATUS.COMPLETED ? 'success' : 'primary'
          }
        />
        <ProgressText>
          <Typography variant="body2">{`${getProgressValue()}% Complete`}</Typography>
          {normalizeStatus(scan.status) === SCAN_STATUS.IN_PROGRESS && (
            <EstimatedTime variant="body2">
              Estimated Time Remaining: {getEstimatedTimeRemaining() || 'Calculating...'}
            </EstimatedTime>
          )}
        </ProgressText>
      </ProgressContainer>

      {/* Scan Information Grid */}
      <InfoGrid container spacing={2}>
        <InfoItem item xs={12} sm={4}>
          <InfoLabel>Status</InfoLabel>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {getStatusIcon(scan.status)}
            <InfoValue sx={{ ml: 1 }}>
              {displayStatus(scan.status)}
            </InfoValue>
          </Box>
        </InfoItem>
        <InfoItem item xs={12} sm={4}>
          <InfoLabel>Time Elapsed</InfoLabel>
          <InfoValue>{formatDuration(timeElapsed)}</InfoValue>
        </InfoItem>
        <InfoItem item xs={12} sm={4}>
          <InfoLabel>Detected Issues</InfoLabel>
          <InfoValue
            sx={{ color: scan.issues && scan.issues.length > 0 ? 'error.main' : 
                 scan.summary && scan.summary.findings ? 
                   theme.palette.error.main : 'inherit' }}
          >
            {scan.issues ? scan.issues.length : 
             scan.summary && scan.summary.findings ? 
               (scan.summary.findings.critical || 0) + 
               (scan.summary.findings.high || 0) + 
               (scan.summary.findings.medium || 0) : 0}
          </InfoValue>
        </InfoItem>
      </InfoGrid>

      {/* Scan Stage Stepper */}
      <StepperContainer>
        <StyledStepper activeStep={activeStep} orientation="vertical">
          {getScanSteps().map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                icon={step.icon}
                StepIconProps={{
                  sx: {
                    color:
                      index < activeStep
                        ? 'success.main'
                        : index === activeStep
                        ? 'primary.main'
                        : 'inherit',
                  },
                }}
              >
                {step.label}
              </StepLabel>
              <StyledStepContent>
                <Typography variant="body2">{step.description}</Typography>
              </StyledStepContent>
            </Step>
          ))}
        </StyledStepper>
      </StepperContainer>

      {/* Action Buttons */}
      <StyledDivider />
      <ActionsContainer>
        {/* Cancel Scan Button */}
        {(normalizeStatus(scan.status) === SCAN_STATUS.PENDING || 
          normalizeStatus(scan.status) === SCAN_STATUS.IN_PROGRESS) && (
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => onCancel()}
            >
            Cancel Scan
          </Button>
        )}

        {/* Force Reset Button - Only show for stuck scans */}
        {(normalizeStatus(scan.status) === SCAN_STATUS.IN_PROGRESS && getProgressValue() >= 95) && (
          <Button 
            variant="outlined" 
            color="warning" 
            onClick={handleForceReset}
            >
            Force Reset Scan
          </Button>
        )}

        {/* View Results Button */}
        {(normalizeStatus(scan.status) === SCAN_STATUS.COMPLETED) && (
          <Button variant="contained" color="primary" onClick={onViewResults}>
            View Results
          </Button>
        )}

        {/* Debug Button - For stuck/failed scans */}
        {(normalizeStatus(scan.status) === SCAN_STATUS.FAILED || 
          normalizeStatus(scan.status) === SCAN_STATUS.CANCELLED ||
          (normalizeStatus(scan.status) === SCAN_STATUS.COMPLETED && !scan.results)) && (
          <Button variant="outlined" color="warning" onClick={handleForceReset}>
            Force Reset Scan
          </Button>
        )}

        {/* New Scan Button */}
        {(normalizeStatus(scan.status) === SCAN_STATUS.COMPLETED ||
          normalizeStatus(scan.status) === SCAN_STATUS.FAILED ||
          normalizeStatus(scan.status) === SCAN_STATUS.CANCELLED) && (
          <Button variant="outlined" color="primary" onClick={onNewScan}>
            Start New Scan
          </Button>
        )}
      </ActionsContainer>
    </Root>
  );
};

export default ScanProgress;
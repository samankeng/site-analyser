import React, { useState, useEffect } from 'react';
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

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  // Start timer when scan is in progress
  useEffect(() => {
    let timer;

    if (scan.status === SCAN_STATUS.IN_PROGRESS || scan.status === SCAN_STATUS.PENDING) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [scan.status]);

  // Update active step based on progress
  useEffect(() => {
    if (scan.progress >= 75) {
      setActiveStep(3);
    } else if (scan.progress >= 50) {
      setActiveStep(2);
    } else if (scan.progress >= 25) {
      setActiveStep(1);
    } else {
      setActiveStep(0);
    }
  }, [scan.progress]);

  // Calculate estimated remaining time
  const getEstimatedTimeRemaining = () => {
    if (!scan.estimatedCompletionTime) return null;

    const now = new Date();
    const completionTime = new Date(scan.estimatedCompletionTime);
    const remainingMs = completionTime - now;

    if (remainingMs <= 0) return 'Finalizing...';

    // Convert to seconds
    const remainingSeconds = Math.floor(remainingMs / 1000);
    return formatDuration(remainingSeconds);
  };

  // Get status icon
  const getStatusIcon = status => {
    switch (status) {
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
        return null;
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

  // Render main scan progress view
  return (
    <Root>
      {/* Scan Header */}
      <Header>
        <Typography variant="h5">Security Scan Progress</Typography>
        {scan.targetUrl && (
          <UrlChip icon={<WifiIcon />} label={scan.targetUrl} color="primary" variant="outlined" />
        )}
      </Header>

      {/* Overall Progress */}
      <ProgressContainer>
        <LinearProgress
          variant="determinate"
          value={scan.progress || 0}
          color={
            scan.status === SCAN_STATUS.FAILED ? 'error' : 
            scan.status === SCAN_STATUS.COMPLETED ? 'primary' : 'primary'
          }
        />
        <ProgressText>
          <Typography variant="body2">{`${scan.progress || 0}% Complete`}</Typography>
          {scan.status === SCAN_STATUS.IN_PROGRESS && (
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
              {scan.status ? scan.status.replace('_', ' ').toUpperCase() : 'N/A'}
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
            sx={{ color: scan.issues && scan.issues.length > 0 ? 'error.main' : 'inherit' }}
          >
            {scan.issues ? scan.issues.length : 0}
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
        {(scan.status === SCAN_STATUS.PENDING || scan.status === SCAN_STATUS.IN_PROGRESS) && (
          <CancelButton variant="contained" onClick={onCancel}>
            Cancel Scan
          </CancelButton>
        )}

        {/* View Results Button */}
        {(scan.status === SCAN_STATUS.COMPLETED || scan.status === SCAN_STATUS.FAILED) && (
          <Button variant="contained" color="primary" onClick={onViewResults}>
            View Results
          </Button>
        )}

        {/* New Scan Button */}
        {(scan.status === SCAN_STATUS.COMPLETED ||
          scan.status === SCAN_STATUS.FAILED ||
          scan.status === SCAN_STATUS.CANCELLED) && (
          <Button variant="outlined" color="primary" onClick={onNewScan}>
            Start New Scan
          </Button>
        )}
      </ActionsContainer>
    </Root>
  );
};

export default ScanProgress;
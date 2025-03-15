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
  useMediaQuery
} from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import CancelIcon from '@material-ui/icons/Cancel';
import LockIcon from '@material-ui/icons/Lock';
import LanguageIcon from '@material-ui/icons/Language';
import BugReportIcon from '@material-ui/icons/BugReport';
import WifiIcon from '@material-ui/icons/Wifi';
import CodeIcon from '@material-ui/icons/Code';
import SpeedIcon from '@material-ui/icons/Speed';
import WarningIcon from '@material-ui/icons/Warning';
import { formatDuration } from '../../utils/formatters';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    padding: theme.spacing(3),
  },
  header: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  urlChip: {
    padding: theme.spacing(1),
    fontSize: '1rem',
  },
  progressContainer: {
    marginBottom: theme.spacing(3),
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  },
  infoGrid: {
    marginBottom: theme.spacing(3),
  },
  infoItem: {
    textAlign: 'center',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
  },
  infoValue: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
  },
  infoLabel: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  stepper: {
    backgroundColor: 'transparent',
  },
  stepIcon: {
    marginRight: theme.spacing(1),
  },
  stepContent: {
    paddingBottom: theme.spacing(2),
  },
  stepperContainer: {
    marginTop: theme.spacing(3),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: theme.spacing(4),
  },
  inProgress: {
    color: theme.palette.primary.main,
  },
  completed: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  estimatedTime: {
    marginTop: theme.spacing(1),
    fontStyle: 'italic',
  },
  cancelButton: {
    backgroundColor: theme.palette.grey[300],
    '&:hover': {
      backgroundColor: theme.palette.grey[400],
    },
  },
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
const ScanProgress = ({ 
  scan = {}, 
  onCancel, 
  onViewResults, 
  onNewScan,
  loading = false 
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  
  // Start timer when scan is in progress
  useEffect(() => {
    let timer;
    
    if (scan.status === 'in_progress' || scan.status === 'pending') {
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
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className={classes.completed} />;
      case 'failed':
        return <ErrorIcon className={classes.error} />;
      case 'cancelled':
        return <CancelIcon className={classes.error} />;
      case 'in_progress':
        return <CircularProgress size={20} className={classes.inProgress} />;
      case 'pending':
        return <CircularProgress size={20} className={classes.inProgress} />;
      default:
        return null;
    }
  };
  
  // Get scan stage steps
  const getScanSteps = () => {
    const steps = [
      {
        label: 'Initializing Scan',
        icon: <BugReportIcon className={classes.stepIcon} />,
        description: 'Setting up scan parameters and preparing security analyzers.'
      },
      {
        label: 'SSL/TLS Analysis',
        icon: <LockIcon className={classes.stepIcon} />,
        description: 'Analyzing SSL certificates, protocols, and cipher configurations.'
      },
      {
        label: 'Security Headers & Port Scanning',
        icon: <LanguageIcon className={classes.stepIcon} />,
        description: 'Evaluating HTTP security headers and checking for open ports.'
      },
      {
        label: 'Vulnerability Assessment',
        icon: <SpeedIcon className={classes.stepIcon} />,
        description: 'Conducting in-depth analysis of potential security vulnerabilities.'
      }
    ];

    return steps;
  };

  // Render loading state
  if (loading) {
    return (
      <Paper className={classes.root}>
        <Box className={classes.loadingContainer}>
          <CircularProgress />
          <Typography variant="h6" style={{ marginTop: 16 }}>
            Loading scan information...
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Render main scan progress view
  return (
    <Paper className={classes.root}>
      {/* Scan Header */}
      <Box className={classes.header}>
        <Typography variant="h5">Security Scan Progress</Typography>
        {scan.targetUrl && (
          <Chip 
            icon={<WifiIcon />} 
            label={scan.targetUrl} 
            className={classes.urlChip} 
            color="primary" 
            variant="outlined"
          />
        )}
      </Box>

      {/* Overall Progress */}
      <Box className={classes.progressContainer}>
        <LinearProgress 
          variant="determinate" 
          value={scan.progress || 0} 
          color={
            scan.status === 'failed' ? 'secondary' : 
            scan.status === 'completed' ? 'primary' : 'primary'
          }
        />
        <Box className={classes.progressText}>
          <Typography variant="body2">
            {`${scan.progress || 0}% Complete`}
          </Typography>
          {scan.status === 'in_progress' && (
            <Typography variant="body2" className={classes.estimatedTime}>
              Estimated Time Remaining: {getEstimatedTimeRemaining() || 'Calculating...'}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Scan Information Grid */}
      <Grid container spacing={2} className={classes.infoGrid}>
        <Grid item xs={12} sm={4} className={classes.infoItem}>
          <Typography className={classes.infoLabel}>Status</Typography>
          <Box display="flex" justifyContent="center" alignItems="center">
            {getStatusIcon(scan.status)}
            <Typography className={classes.infoValue} style={{ marginLeft: 8 }}>
              {scan.status ? scan.status.replace('_', ' ').toUpperCase() : 'N/A'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4} className={classes.infoItem}>
          <Typography className={classes.infoLabel}>Time Elapsed</Typography>
          <Typography className={classes.infoValue}>
            {formatDuration(timeElapsed)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} className={classes.infoItem}>
          <Typography className={classes.infoLabel}>Detected Issues</Typography>
          <Typography 
            className={classes.infoValue} 
            color={scan.issues && scan.issues.length > 0 ? 'error' : 'inherit'}
          >
            {scan.issues ? scan.issues.length : 0}
          </Typography>
        </Grid>
      </Grid>

      {/* Scan Stage Stepper */}
      <Box className={classes.stepperContainer}>
        <Stepper 
          activeStep={activeStep} 
          orientation="vertical" 
          className={classes.stepper}
        >
          {getScanSteps().map((step, index) => (
            <Step key={step.label}>
              <StepLabel 
                icon={step.icon}
                StepIconProps={{
                  classes: {
                    root: classes[
                      index < activeStep ? 'completed' : 
                      index === activeStep ? 'inProgress' : ''
                    ]
                  }
                }}
              >
                {step.label}
              </StepLabel>
              <StepContent className={classes.stepContent}>
                <Typography variant="body2">{step.description}</Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Action Buttons */}
      <Divider className={classes.divider} />
      <Box className={classes.actionsContainer}>
        {/* Cancel Scan Button */}
        {(scan.status === 'pending' || scan.status === 'in_progress') && (
          <Button 
            variant="contained" 
            className={classes.cancelButton}
            onClick={onCancel}
          >
            Cancel Scan
          </Button>
        )}

        {/* View Results Button */}
        {(scan.status === 'completed' || scan.status === 'failed') && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={onViewResults}
          >
            View Results
          </Button>
        )}

        {/* New Scan Button */}
        {(scan.status === 'completed' || scan.status === 'failed' || scan.status === 'cancelled') && (
          <Button 
            variant="outlined" 
            color="primary"
            onClick={onNewScan}
          >
            Start New Scan
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ScanProgress;

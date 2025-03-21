import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Slider,
  Grid,
  Tooltip,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Divider,
  useMediaQuery
} from '@material-ui/core';
import { makeStyles, useTheme } from '@mui/styles';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import { isValidUrl } from '../../utils/validators';
import ScanOptions from './ScanOptions';
import { useLocation } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  formContainer: {
    padding: theme.spacing(3),
  },
  formField: {
    marginBottom: theme.spacing(3),
  },
  submitButton: {
    marginTop: theme.spacing(2),
  },
  slider: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  scanOptions: {
    marginTop: theme.spacing(3),
  },
  tooltip: {
    marginLeft: theme.spacing(1),
    cursor: 'pointer',
    fontSize: '1rem',
    verticalAlign: 'middle',
  },
  urlInput: {
    width: '100%',
  },
  scanDepthContainer: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  scanDepthMarker: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
  },
  scanDepthLabel: {
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  scanDepthDescription: {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  urlError: {
    color: theme.palette.error.main,
    marginTop: theme.spacing(0.5),
  },
  examplesSection: {
    marginTop: theme.spacing(2),
  },
  exampleButton: {
    margin: theme.spacing(0.5),
    textTransform: 'none',
  },
}));

/**
 * Scan form component for initiating security scans
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Function called when form is submitted
 * @param {boolean} props.isLoading - Whether a scan is in progress
 * @param {Object} props.initialValues - Initial form values
 */
const ScanForm = ({ onSubmit, isLoading = false, initialValues = {} }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  
  // Default scan options
  const defaultOptions = {
    sslCheck: true,
    headerAnalysis: true,
    portScan: true,
    vulnDetection: true,
    contentAnalysis: false,
    performanceCheck: false,
  };
  
  // Form state
  const [url, setUrl] = useState('');
  const [scanDepth, setScanDepth] = useState(2);
  const [options, setOptions] = useState(defaultOptions);
  const [urlError, setUrlError] = useState('');
  
  // Check for URL from router state (for re-scanning)
  useEffect(() => {
    if (location.state?.url) {
      setUrl(location.state.url);
    }
  }, [location.state]);
  
  // Set initial values if provided
  useEffect(() => {
    if (initialValues.url) {
      setUrl(initialValues.url);
    }
    if (initialValues.scanDepth) {
      setScanDepth(initialValues.scanDepth);
    }
    if (initialValues.options) {
      setOptions({
        ...defaultOptions,
        ...initialValues.options
      });
    }
  }, [initialValues]);
  
  // Handle URL input change
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    
    // Clear error when input changes
    if (urlError) setUrlError('');
  };
  
  // Handle scan depth change
  const handleScanDepthChange = (event, newValue) => {
    setScanDepth(newValue);
  };
  
  // Handle option changes from child component
  const handleOptionsChange = (newOptions) => {
    setOptions(newOptions);
  };
  
  // Get label for scan depth
  const getScanDepthLabel = (value) => {
    switch (value) {
      case 1:
        return 'Basic';
      case 2:
        return 'Standard';
      case 3:
        return 'Comprehensive';
      default:
        return '';
    }
  };
  
  // Get description for scan depth
  const getScanDepthDescription = (value) => {
    switch (value) {
      case 1:
        return 'Quick scan of essential security elements. Best for routine checks. (~1-2 minutes)';
      case 2:
        return 'Balanced scan covering most security aspects. Recommended for regular security monitoring. (~3-5 minutes)';
      case 3:
        return 'In-depth analysis of all security elements. Best for thorough security audits. (~5-10 minutes)';
      default:
        return '';
    }
  };
  
  // Validate form data
  const validateForm = () => {
    let isValid = true;
    
    if (!url.trim()) {
      setUrlError('URL is required');
      isValid = false;
    } else if (!isValidUrl(url)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      isValid = false;
    }
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare form data
    const formData = {
      url,
      scanDepth,
      options
    };
    
    // Call parent's onSubmit
    onSubmit(formData);
  };
  
  // Set example URL
  const setExampleUrl = (example) => {
    setUrl(example);
    setUrlError('');
  };
  
  // Example URLs
  const exampleUrls = [
    'https://example.com',
    'https://google.com',
    'https://github.com'
  ];
  
  return (
    <div className={classes.root}>
      <form onSubmit={handleSubmit} className={classes.formContainer}>
        <Paper className={classes.paper}>
          <div className={classes.sectionTitle}>
            <SecurityIcon className={classes.sectionIcon} />
            <Typography variant="h6">Website to Analyze</Typography>
          </div>
          
          <TextField
            label="Website URL"
            variant="outlined"
            fullWidth
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com"
            className={classes.urlInput}
            error={!!urlError}
            helperText={urlError}
            disabled={isLoading}
            required
          />
          
          <div className={classes.examplesSection}>
            <Typography variant="caption" color="textSecondary">
              Examples:
            </Typography>
            {exampleUrls.map((example, index) => (
              <Button
                key={index}
                size="small"
                variant="outlined"
                className={classes.exampleButton}
                onClick={() => setExampleUrl(example)}
                disabled={isLoading}
              >
                {example}
              </Button>
            ))}
          </div>
        </Paper>
        
        <Paper className={classes.paper}>
          <div className={classes.sectionTitle}>
            <SecurityIcon className={classes.sectionIcon} />
            <Typography variant="h6">Scan Configuration</Typography>
          </div>
          
          <div className={classes.scanDepthContainer}>
            <Typography id="scan-depth-slider" gutterBottom>
              Scan Depth
              <Tooltip title="Choose the depth of security analysis. Higher depth provides more comprehensive results but takes longer.">
                <InfoIcon className={classes.tooltip} />
              </Tooltip>
            </Typography>
            
            <Slider
              value={scanDepth}
              onChange={handleScanDepthChange}
              aria-labelledby="scan-depth-slider"
              step={1}
              marks
              min={1}
              max={3}
              valueLabelDisplay="auto"
              valueLabelFormat={getScanDepthLabel}
              disabled={isLoading}
            />
            
            <div className={classes.scanDepthMarker}>
              <Typography variant="caption">Basic (Faster)</Typography>
              <Typography variant="caption">Comprehensive (Thorough)</Typography>
            </div>
            
            <Typography variant="body2" className={classes.scanDepthDescription}>
              {getScanDepthDescription(scanDepth)}
            </Typography>
          </div>
          
          <Divider className={classes.divider} />
          
          <ScanOptions 
            options={options} 
            onChange={handleOptionsChange}
            disabled={isLoading}
          />
        </Paper>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          className={classes.submitButton}
          disabled={isLoading || !url}
          startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <SecurityIcon />}
        >
          {isLoading ? 'Scanning...' : 'Start Security Scan'}
        </Button>
      </form>
    </div>
  );
};

export default ScanForm;
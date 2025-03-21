import React, { useState } from 'react';
import {
  Grid,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Tooltip,
  Paper,
  Box,
  Switch,
  Collapse,
  IconButton,
  Button,
  Divider,
  useMediaQuery
} from '@material-ui/core';
import { makeStyles, useTheme } from '@mui/styles';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import LanguageIcon from '@mui/icons-material/Language';
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeIcon from '@mui/icons-material/Code';
import SpeedIcon from '@mui/icons-material/Speed';
import WifiIcon from '@mui/icons-material/Wifi';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  formLabel: {
    fontWeight: 500,
    marginBottom: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
  },
  optionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1),
  },
  tooltip: {
    marginLeft: theme.spacing(1),
    cursor: 'pointer',
    fontSize: '1rem',
    verticalAlign: 'middle',
  },
  optionIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
  },
  optionDescription: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  toggleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: theme.spacing(0.5),
  },
  advanced: {
    marginTop: theme.spacing(2),
  },
  advancedToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing(1),
    cursor: 'pointer',
    color: theme.palette.primary.main,
  },
  advancedIcon: {
    marginLeft: theme.spacing(0.5),
    fontSize: '1.2rem',
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  presetButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  presetButton: {
    textTransform: 'none',
  },
}));

/**
 * Scan options component for configuring security scan parameters
 * 
 * @param {Object} props - Component props
 * @param {Object} props.options - Current options values
 * @param {Function} props.onChange - Function called when options change
 * @param {boolean} props.disabled - Whether the controls are disabled
 */
const ScanOptions = ({ options, onChange, disabled = false }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Toggle visibility of advanced options
  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };
  
  // Handle option change
  const handleOptionChange = (event) => {
    const { name, checked } = event.target;
    const newOptions = {
      ...options,
      [name]: checked
    };
    onChange(newOptions);
  };
  
  // Apply preset configurations
  const applyPreset = (preset) => {
    let newOptions = { ...options };
    
    switch (preset) {
      case 'quick':
        newOptions = {
          sslCheck: true,
          headerAnalysis: true,
          portScan: false,
          vulnDetection: false,
          contentAnalysis: false,
          performanceCheck: false,
        };
        break;
      case 'standard':
        newOptions = {
          sslCheck: true,
          headerAnalysis: true,
          portScan: true,
          vulnDetection: true,
          contentAnalysis: false,
          performanceCheck: false,
        };
        break;
      case 'comprehensive':
        newOptions = {
          sslCheck: true,
          headerAnalysis: true,
          portScan: true,
          vulnDetection: true,
          contentAnalysis: true,
          performanceCheck: true,
        };
        break;
      default:
        break;
    }
    
    onChange(newOptions);
  };
  
  // Get icon for option
  const getOptionIcon = (optionName) => {
    switch (optionName) {
      case 'sslCheck':
        return <LockIcon className={classes.optionIcon} />;
      case 'headerAnalysis':
        return <LanguageIcon className={classes.optionIcon} />;
      case 'portScan':
        return <WifiIcon className={classes.optionIcon} />;
      case 'vulnDetection':
        return <BugReportIcon className={classes.optionIcon} />;
      case 'contentAnalysis':
        return <CodeIcon className={classes.optionIcon} />;
      case 'performanceCheck':
        return <SpeedIcon className={classes.optionIcon} />;
      default:
        return <InfoIcon className={classes.optionIcon} />;
    }
  };
  
  // Get description for option
  const getOptionDescription = (optionName) => {
    switch (optionName) {
      case 'sslCheck':
        return 'Analyze SSL/TLS certificates, protocols, and cipher configurations for security vulnerabilities.';
      case 'headerAnalysis':
        return 'Evaluate HTTP security headers, CSP policies, and CORS configurations.';
      case 'portScan':
        return 'Check for open ports and services running on the server that could be potential security risks.';
      case 'vulnDetection':
        return 'Detect common web vulnerabilities like XSS, CSRF, injection flaws, and other OWASP Top 10 risks.';
      case 'contentAnalysis':
        return 'Inspect JavaScript libraries, frameworks, and other components for known vulnerabilities.';
      case 'performanceCheck':
        return 'Evaluate website performance metrics and identify performance-related security issues.';
      default:
        return '';
    }
  };
  
  // Get tooltip for option
  const getOptionTooltip = (optionName) => {
    switch (optionName) {
      case 'sslCheck':
        return 'Evaluates certificate validity, protocol versions, and cipher strength';
      case 'headerAnalysis':
        return 'Analyzes security headers, CSP, and CORS configuration';
      case 'portScan':
        return 'Identifies open ports and potential service vulnerabilities';
      case 'vulnDetection':
        return 'Detects common web vulnerabilities and security weaknesses';
      case 'contentAnalysis':
        return 'Analyzes JavaScript libraries, CSS frameworks, and website components';
      case 'performanceCheck':
        return 'Evaluates response times, load performance, and resource efficiency';
      default:
        return '';
    }
  };
  
  // Basic scanning options
  const basicOptions = [
    'sslCheck',
    'headerAnalysis',
    'portScan',
    'vulnDetection'
  ];
  
  // Advanced scanning options
  const advancedOptions = [
    'contentAnalysis',
    'performanceCheck'
  ];
  
  // Render option item
  const renderOption = (optionName, label) => (
    <div className={classes.optionItem} key={optionName}>
      <div className={classes.optionContent}>
        <Typography className={classes.optionTitle}>
          {getOptionIcon(optionName)}
          {label}
          <Tooltip title={getOptionTooltip(optionName)}>
            <InfoIcon className={classes.tooltip} fontSize="small" />
          </Tooltip>
        </Typography>
        <Typography variant="body2" className={classes.optionDescription}>
          {getOptionDescription(optionName)}
        </Typography>
      </div>
      <div className={classes.toggleContainer}>
        <Switch
          checked={options[optionName]}
          onChange={handleOptionChange}
          name={optionName}
          color="primary"
          disabled={disabled}
        />
      </div>
    </div>
  );
  
  return (
    <div className={classes.root}>
      <Typography variant="subtitle1" className={classes.formLabel}>
        <SecurityIcon style={{ marginRight: 8 }} />
        Security Scanning Options
        <Tooltip title="Configure which security aspects to analyze during the scan">
          <InfoIcon className={classes.tooltip} fontSize="small" />
        </Tooltip>
      </Typography>
      
      <div className={classes.presetButtons}>
        <Button 
          variant="outlined" 
          size="small"
          className={classes.presetButton}
          onClick={() => applyPreset('quick')}
          disabled={disabled}
        >
          Quick Scan
        </Button>
        <Button 
          variant="outlined" 
          size="small"
          color="primary"
          className={classes.presetButton}
          onClick={() => applyPreset('standard')}
          disabled={disabled}
        >
          Standard Scan
        </Button>
        <Button 
          variant="outlined" 
          size="small"
          className={classes.presetButton}
          onClick={() => applyPreset('comprehensive')}
          disabled={disabled}
        >
          Comprehensive Scan
        </Button>
      </div>
      
      <div>
        {basicOptions.map(option => 
          renderOption(option, option === 'sslCheck' ? 'SSL/TLS Analysis' : 
                              option === 'headerAnalysis' ? 'HTTP Header Analysis' :
                              option === 'portScan' ? 'Port Scanning' :
                              option === 'vulnDetection' ? 'Vulnerability Detection' :
                              option.charAt(0).toUpperCase() + option.slice(1).replace(/([A-Z])/g, ' $1'))
        )}
      </div>
      
      <div className={classes.advanced}>
        <Divider className={classes.divider} />
        
        <div 
          className={classes.advancedToggle}
          onClick={toggleAdvanced}
        >
          <Typography variant="body2" color="primary">
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Typography>
          {showAdvanced ? 
            <ExpandLessIcon className={classes.advancedIcon} /> : 
            <ExpandMoreIcon className={classes.advancedIcon} />
          }
        </div>
        
        <Collapse in={showAdvanced}>
          <Box mt={2}>
            {advancedOptions.map(option => 
              renderOption(option, option === 'contentAnalysis' ? 'Content Analysis' :
                                  option === 'performanceCheck' ? 'Performance Check' :
                                  option.charAt(0).toUpperCase() + option.slice(1).replace(/([A-Z])/g, ' $1'))
            )}
          </Box>
        </Collapse>
      </div>
    </div>
  );
};

export default ScanOptions;
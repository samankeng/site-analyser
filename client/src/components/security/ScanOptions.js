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
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
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

// Using styled API instead of makeStyles
const Root = styled('div')({
  width: '100%',
});

const FormLabelStyled = styled('div')(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
}));

const OptionItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(1),
}));

const TooltipIcon = styled(InfoIcon)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  cursor: 'pointer',
  fontSize: '1rem',
  verticalAlign: 'middle',
}));

const OptionIcon = styled('span')(({ theme }) => ({
  marginRight: theme.spacing(1),
  color: theme.palette.primary.main,
}));

const OptionContent = styled('div')({
  flex: 1,
});

const OptionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
}));

const OptionDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

const ToggleContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: theme.spacing(0.5),
}));

const Advanced = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const AdvancedToggle = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: theme.spacing(1),
  cursor: 'pointer',
  color: theme.palette.primary.main,
}));

const AdvancedIcon = styled('span')(({ theme }) => ({
  marginLeft: theme.spacing(0.5),
  fontSize: '1.2rem',
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(2, 0),
}));

const PresetButtons = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const PresetButton = styled(Button)({
  textTransform: 'none',
});

/**
 * Scan options component for configuring security scan parameters
 *
 * @param {Object} props - Component props
 * @param {Object} props.options - Current options values
 * @param {Function} props.onChange - Function called when options change
 * @param {boolean} props.disabled - Whether the controls are disabled
 */
const ScanOptions = ({ options, onChange, disabled = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Toggle visibility of advanced options
  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  // Handle option change
  const handleOptionChange = event => {
    const { name, checked } = event.target;
    const newOptions = {
      ...options,
      [name]: checked,
    };
    onChange(newOptions);
  };

  // Apply preset configurations
  const applyPreset = preset => {
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
  const getOptionIcon = optionName => {
    switch (optionName) {
      case 'sslCheck':
        return <LockIcon sx={{ mr: 1, color: 'primary.main' }} />;
      case 'headerAnalysis':
        return <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />;
      case 'portScan':
        return <WifiIcon sx={{ mr: 1, color: 'primary.main' }} />;
      case 'vulnDetection':
        return <BugReportIcon sx={{ mr: 1, color: 'primary.main' }} />;
      case 'contentAnalysis':
        return <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />;
      case 'performanceCheck':
        return <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />;
      default:
        return <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />;
    }
  };

  // Get description for option
  const getOptionDescription = optionName => {
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
  const getOptionTooltip = optionName => {
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
  const basicOptions = ['sslCheck', 'headerAnalysis', 'portScan', 'vulnDetection'];

  // Advanced scanning options
  const advancedOptions = ['contentAnalysis', 'performanceCheck'];

  // Render option item
  const renderOption = (optionName, label) => (
    <OptionItem key={optionName}>
      <OptionContent>
        <OptionTitle variant="body1">
          {getOptionIcon(optionName)}
          {label}
          <Tooltip title={getOptionTooltip(optionName)}>
            <TooltipIcon fontSize="small" />
          </Tooltip>
        </OptionTitle>
        <OptionDescription variant="body2">{getOptionDescription(optionName)}</OptionDescription>
      </OptionContent>
      <ToggleContainer>
        <Switch
          checked={options[optionName]}
          onChange={handleOptionChange}
          name={optionName}
          color="primary"
          disabled={disabled}
        />
      </ToggleContainer>
    </OptionItem>
  );

  return (
    <Root>
      <FormLabelStyled>
        <SecurityIcon sx={{ mr: 1 }} />
        <Typography variant="subtitle1">
          Security Scanning Options
          <Tooltip title="Configure which security aspects to analyze during the scan">
            <InfoIcon
              sx={{ ml: 1, cursor: 'pointer', fontSize: '1rem', verticalAlign: 'middle' }}
            />
          </Tooltip>
        </Typography>
      </FormLabelStyled>

      <PresetButtons>
        <PresetButton
          variant="outlined"
          size="small"
          onClick={() => applyPreset('quick')}
          disabled={disabled}
        >
          Quick Scan
        </PresetButton>
        <PresetButton
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => applyPreset('standard')}
          disabled={disabled}
        >
          Standard Scan
        </PresetButton>
        <PresetButton
          variant="outlined"
          size="small"
          onClick={() => applyPreset('comprehensive')}
          disabled={disabled}
        >
          Comprehensive Scan
        </PresetButton>
      </PresetButtons>

      <div>
        {basicOptions.map(option =>
          renderOption(
            option,
            option === 'sslCheck'
              ? 'SSL/TLS Analysis'
              : option === 'headerAnalysis'
              ? 'HTTP Header Analysis'
              : option === 'portScan'
              ? 'Port Scanning'
              : option === 'vulnDetection'
              ? 'Vulnerability Detection'
              : option.charAt(0).toUpperCase() + option.slice(1).replace(/([A-Z])/g, ' $1')
          )
        )}
      </div>

      <Advanced>
        <StyledDivider />

        <AdvancedToggle onClick={toggleAdvanced}>
          <Typography variant="body2" color="primary">
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Typography>
          <AdvancedIcon>{showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}</AdvancedIcon>
        </AdvancedToggle>

        <Collapse in={showAdvanced}>
          <Box sx={{ mt: 2 }}>
            {advancedOptions.map(option =>
              renderOption(
                option,
                option === 'contentAnalysis'
                  ? 'Content Analysis'
                  : option === 'performanceCheck'
                  ? 'Performance Check'
                  : option.charAt(0).toUpperCase() + option.slice(1).replace(/([A-Z])/g, ' $1')
              )
            )}
          </Box>
        </Collapse>
      </Advanced>
    </Root>
  );
};

export default ScanOptions;
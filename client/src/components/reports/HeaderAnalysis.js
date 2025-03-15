import React, { useState } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Box,
  Button,
  CircularProgress,
  TextField,
  InputAdornment
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import WarningIcon from '@material-ui/icons/Warning';
import SearchIcon from '@material-ui/icons/Search';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ContentCopyIcon from '@material-ui/icons/FileCopy';
import CodeIcon from '@material-ui/icons/Code';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  tableContainer: {
    marginTop: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: theme.palette.background.default,
  },
  critical: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  high: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  medium: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  low: {
    backgroundColor: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  },
  info: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  statusSuccess: {
    color: theme.palette.success.main,
  },
  statusWarning: {
    color: theme.palette.warning.main,
  },
  statusError: {
    color: theme.palette.error.main,
  },
  recommendation: {
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(1),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    marginTop: theme.spacing(1),
  },
  collapsible: {
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  rowAlternate: {
    backgroundColor: theme.palette.background.default,
  },
  filterContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  searchField: {
    minWidth: 250,
  },
  chipContainer: {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  },
  chip: {
    marginBottom: theme.spacing(1),
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    textAlign: 'center',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
  },
  statusIcon: {
    verticalAlign: 'middle',
    marginRight: theme.spacing(0.5),
  },
  headerValue: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: '3px 5px',
    borderRadius: 3,
    overflowX: 'auto',
    maxWidth: 300,
    whiteSpace: 'nowrap',
    display: 'inline-block',
  },
  copyButton: {
    padding: 2,
  },
  copyIcon: {
    fontSize: '1rem',
  },
  severityIcon: {
    marginRight: theme.spacing(0.5),
    fontSize: '1rem',
  },
}));

/**
 * Header Analysis component for displaying HTTP security headers findings
 * 
 * @param {Object} props - Component props
 * @param {Array} props.headers - Array of header findings
 * @param {Object} props.rawHeaders - Raw headers response data
 * @param {boolean} props.loading - Loading state
 */
const HeaderAnalysis = ({ 
  headers = [], 
  rawHeaders = {}, 
  loading = false 
}) => {
  const classes = useStyles();
  const [expandedRows, setExpandedRows] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toggle row expansion
  const toggleRowExpanded = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };
  
  // Handle search term change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Copy header value to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Success feedback could be added here
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };
  
  // Get severity icon
  const getSeverityIcon = (severity) => {
    const severityLower = severity.toLowerCase();
    
    switch (severityLower) {
      case 'critical':
      case 'high':
        return <ErrorIcon className={`${classes.severityIcon} ${classes.statusError}`} />;
      case 'medium':
        return <WarningIcon className={`${classes.severityIcon} ${classes.statusWarning}`} />;
      case 'low':
      case 'info':
        return <InfoIcon className={`${classes.severityIcon} ${classes.statusSuccess}`} />;
      default:
        return null;
    }
  };
  
  // Filter headers based on active filter and search term
  const filteredHeaders = headers.filter(header => {
    // Apply severity filter
    if (activeFilter !== 'all' && header.severity.toLowerCase() !== activeFilter.toLowerCase()) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        header.title.toLowerCase().includes(search) ||
        header.description.toLowerCase().includes(search) ||
        (header.recommendation && header.recommendation.toLowerCase().includes(search))
      );
    }
    
    return true;
  });
  
  // Calculate counts by severity
  const severityCounts = {
    critical: headers.filter(h => h.severity.toLowerCase() === 'critical').length,
    high: headers.filter(h => h.severity.toLowerCase() === 'high').length,
    medium: headers.filter(h => h.severity.toLowerCase() === 'medium').length,
    low: headers.filter(h => h.severity.toLowerCase() === 'low').length,
    info: headers.filter(h => h.severity.toLowerCase() === 'info').length,
  };
  
  // If loading, show loading state
  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress size={40} />
      </div>
    );
  }
  
  // If no headers, show empty state
  if (!headers.length) {
    return (
      <div className={classes.emptyState}>
        <InfoIcon style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
        <Typography variant="h6">
          No HTTP Header Issues Found
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Great! Your HTTP security headers appear to be properly configured.
        </Typography>
      </div>
    );
  }
  
  return (
    <div className={classes.root}>
      <div className={classes.filterContainer}>
        <div className={classes.chipContainer}>
          <Chip
            label={`All (${headers.length})`}
            onClick={() => handleFilterChange('all')}
            color={activeFilter === 'all' ? 'primary' : 'default'}
            className={classes.chip}
          />
          {severityCounts.critical > 0 && (
            <Chip
              label={`Critical (${severityCounts.critical})`}
              onClick={() => handleFilterChange('critical')}
              className={`${classes.chip} ${activeFilter === 'critical' ? classes.critical : ''}`}
              icon={<ErrorIcon />}
            />
          )}
          {severityCounts.high > 0 && (
            <Chip
              label={`High (${severityCounts.high})`}
              onClick={() => handleFilterChange('high')}
              className={`${classes.chip} ${activeFilter === 'high' ? classes.high : ''}`}
              icon={<ErrorIcon />}
            />
          )}
          {severityCounts.medium > 0 && (
            <Chip
              label={`Medium (${severityCounts.medium})`}
              onClick={() => handleFilterChange('medium')}
              className={`${classes.chip} ${activeFilter === 'medium' ? classes.medium : ''}`}
              icon={<WarningIcon />}
            />
          )}
          {severityCounts.low > 0 && (
            <Chip
              label={`Low (${severityCounts.low})`}
              onClick={() => handleFilterChange('low')}
              className={`${classes.chip} ${activeFilter === 'low' ? classes.low : ''}`}
              icon={<InfoIcon />}
            />
          )}
          {severityCounts.info > 0 && (
            <Chip
              label={`Info (${severityCounts.info})`}
              onClick={() => handleFilterChange('info')}
              className={`${classes.chip} ${activeFilter === 'info' ? classes.info : ''}`}
              icon={<InfoIcon />}
            />
          )}
        </div>
        
        <TextField
          className={classes.searchField}
          placeholder="Search headers"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </div>
      
      {filteredHeaders.length === 0 ? (
        <div className={classes.emptyState}>
          <Typography variant="body1">
            No HTTP headers match your filters
          </Typography>
          <Button 
            variant="text" 
            color="primary" 
            onClick={() => {
              setActiveFilter('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={classes.headerCell}>Severity</TableCell>
                <TableCell className={classes.headerCell}>Header</TableCell>
                <TableCell className={classes.headerCell}>Issue</TableCell>
                <TableCell className={classes.headerCell}>Current Value</TableCell>
                <TableCell className={classes.headerCell} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHeaders.map((header, index) => {
                const rowId = `header-${index}`;
                const isExpanded = expandedRows[rowId] || false;
                
                return (
                  <React.Fragment key={rowId}>
                    <TableRow className={index % 2 === 1 ? classes.rowAlternate : ''}>
                      <TableCell>
                        <Chip
                          label={header.severity}
                          size="small"
                          className={classes[header.severity.toLowerCase()]}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {header.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {header.description?.length > 100 
                            ? `${header.description.substring(0, 100)}...` 
                            : header.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {header.evidence ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className={classes.headerValue}>{header.evidence}</div>
                            <Tooltip title="Copy to clipboard">
                              <IconButton 
                                className={classes.copyButton}
                                onClick={() => copyToClipboard(header.evidence)}
                              >
                                <ContentCopyIcon className={classes.copyIcon} />
                              </IconButton>
                            </Tooltip>
                          </div>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Not set
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => toggleRowExpanded(rowId)}>
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box className={classes.collapsible}>
                            <Typography variant="subtitle2" gutterBottom>
                              Full Description:
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {header.description}
                            </Typography>
                            
                            {header.recommendation && (
                              <div>
                                <Typography variant="subtitle2" gutterBottom>
                                  Recommendation:
                                </Typography>
                                <div className={classes.recommendation}>
                                  <Typography variant="body2">
                                    {header.recommendation}
                                  </Typography>
                                </div>
                              </div>
                            )}
                            
                            {header.references && header.references.length > 0 && (
                              <div style={{ marginTop: 16 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  References:
                                </Typography>
                                <ul style={{ margin: 0 }}>
                                  {header.references.map((ref, idx) => (
                                    <li key={idx}>
                                      <Typography variant="body2">
                                        <a href={ref} target="_blank" rel="noopener noreferrer">
                                          {ref}
                                        </a>
                                      </Typography>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Show Raw Headers if available */}
      {Object.keys(rawHeaders).length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Raw Headers
          </Typography>
          <Paper>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell className={classes.headerCell}>Header</TableCell>
                    <TableCell className={classes.headerCell}>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(rawHeaders).map(([key, value], index) => (
                    <TableRow key={key} className={index % 2 === 1 ? classes.rowAlternate : ''}>
                      <TableCell>{key}</TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div className={classes.headerValue}>{value}</div>
                          <Tooltip title="Copy to clipboard">
                            <IconButton 
                              className={classes.copyButton}
                              onClick={() => copyToClipboard(value)}
                            >
                              <ContentCopyIcon className={classes.copyIcon} />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </div>
  );
};

export default HeaderAnalysis;
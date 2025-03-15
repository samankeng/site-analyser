import React, { useState } from 'react';
import {
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import WarningIcon from '@material-ui/icons/Warning';
import InfoIcon from '@material-ui/icons/Info';
import LockIcon from '@material-ui/icons/Lock';
import SecurityIcon from '@material-ui/icons/Security';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import SearchIcon from '@material-ui/icons/Search';
import HttpsIcon from '@material-ui/icons/Https';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  cardHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '& .MuiCardHeader-title': {
      fontSize: '1.1rem',
    },
  },
  cardContent: {
    padding: theme.spacing(2),
  },
  certCard: {
    height: '100%',
  },
  protocolsCard: {
    height: '100%',
  },
  cipherCard: {
    height: '100%',
  },
  critical: {
    color: theme.palette.error.main,
  },
  high: {
    color: theme.palette.error.light,
  },
  medium: {
    color: theme.palette.warning.main,
  },
  low: {
    color: theme.palette.info.main,
  },
  info: {
    color: theme.palette.success.main,
  },
  statusIcon: {
    marginRight: theme.spacing(0.5),
    fontSize: '1.2rem',
  },
  severityChip: {
    marginRight: theme.spacing(1),
  },
  severityCritical: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  severityHigh: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  severityMedium: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  severityLow: {
    backgroundColor: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  },
  severityInfo: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: theme.palette.background.default,
  },
  gridContainer: {
    marginBottom: theme.spacing(3),
  },
  certInfo: {
    marginBottom: theme.spacing(2),
  },
  certInfoItem: {
    display: 'flex',
    marginBottom: theme.spacing(1),
  },
  certInfoLabel: {
    fontWeight: 'bold',
    minWidth: 120,
  },
  certInfoValue: {
    wordBreak: 'break-all',
  },
  issuerChip: {
    margin: theme.spacing(0.5),
  },
  validDates: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
  },
  expiringSoon: {
    color: theme.palette.warning.main,
    fontWeight: 'bold',
  },
  expired: {
    color: theme.palette.error.main,
    fontWeight: 'bold',
  },
  secureProtocol: {
    backgroundColor: theme.palette.success.light,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.success.dark,
  },
  insecureProtocol: {
    backgroundColor: theme.palette.error.light,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.error.dark,
  },
  findingsContainer: {
    marginTop: theme.spacing(3),
  },
  findingItem: {
    backgroundColor: theme.palette.background.default,
    marginBottom: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
  },
  findingContent: {
    padding: theme.spacing(2),
  },
  recommendation: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: theme.spacing(1),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    marginTop: theme.spacing(1),
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
  searchField: {
    marginBottom: theme.spacing(2),
    width: '100%',
    maxWidth: 300,
  },
  filterContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  chipContainer: {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  },
  scoreChip: {
    fontWeight: 'bold',
  },
}));

/**
 * SSL/TLS Analysis component for displaying certificate and protocol findings
 * 
 * @param {Object} props - Component props
 * @param {Array} props.findings - Array of SSL/TLS findings
 * @param {Object} props.metadata - SSL/TLS metadata (certificate info, protocols, etc.)
 * @param {boolean} props.loading - Loading state
 */
const SslAnalysis = ({ 
  findings = [], 
  metadata = {}, 
  loading = false 
}) => {
  const classes = useStyles();
  const [expandedFindings, setExpandedFindings] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Certificate data from metadata
  const certificate = metadata?.certificate || {};
  const protocols = metadata?.protocols || [];
  const ciphers = metadata?.ciphers || [];
  
  // Calculate certificate expiration
  const calculateExpirationStatus = () => {
    if (!certificate.validTo) return null;
    
    const now = new Date();
    const expiryDate = new Date(certificate.validTo);
    const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', text: 'Expired', className: classes.expired };
    } else if (daysUntilExpiry < 30) {
      return { status: 'expiring', text: `Expires in ${daysUntilExpiry} days`, className: classes.expiringSoon };
    } else {
      return { status: 'valid', text: `Valid for ${daysUntilExpiry} days`, className: '' };
    }
  };
  
  const expirationStatus = calculateExpirationStatus();
  
  // Toggle finding expansion
  const toggleFindingExpanded = (id) => {
    setExpandedFindings(prev => ({
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
  
  // Get status icon based on severity
  const getStatusIcon = (severity) => {
    const severityLower = severity.toLowerCase();
    
    switch (severityLower) {
      case 'critical':
      case 'high':
        return <ErrorIcon className={`${classes.statusIcon} ${classes[severityLower]}`} />;
      case 'medium':
        return <WarningIcon className={`${classes.statusIcon} ${classes[severityLower]}`} />;
      case 'low':
        return <InfoIcon className={`${classes.statusIcon} ${classes[severityLower]}`} />;
      case 'info':
        return <CheckCircleIcon className={`${classes.statusIcon} ${classes[severityLower]}`} />;
      default:
        return null;
    }
  };
  
  // Filter findings based on active filter and search term
  const filteredFindings = findings.filter(finding => {
    // Apply severity filter
    if (activeFilter !== 'all' && finding.severity.toLowerCase() !== activeFilter.toLowerCase()) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        finding.title.toLowerCase().includes(search) ||
        finding.description.toLowerCase().includes(search) ||
        (finding.recommendation && finding.recommendation.toLowerCase().includes(search))
      );
    }
    
    return true;
  });
  
  // Calculate counts by severity
  const severityCounts = {
    critical: findings.filter(f => f.severity.toLowerCase() === 'critical').length,
    high: findings.filter(f => f.severity.toLowerCase() === 'high').length,
    medium: findings.filter(f => f.severity.toLowerCase() === 'medium').length,
    low: findings.filter(f => f.severity.toLowerCase() === 'low').length,
    info: findings.filter(f => f.severity.toLowerCase() === 'info').length,
  };
  
  // If loading, show loading state
  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress size={40} />
      </div>
    );
  }
  
  return (
    <div className={classes.root}>
      {/* Summary Cards */}
      <Grid container spacing={3} className={classes.gridContainer}>
        {/* Certificate Information */}
        <Grid item xs={12} md={6} lg={4}>
          <Card className={classes.certCard}>
            <CardHeader
              title="Certificate Information"
              className={classes.cardHeader}
              avatar={<VerifiedUserIcon />}
            />
            <CardContent className={classes.cardContent}>
              {Object.keys(certificate).length > 0 ? (
                <>
                  <div className={classes.certInfo}>
                    {certificate.subject && (
                      <div className={classes.certInfoItem}>
                        <div className={classes.certInfoLabel}>Subject:</div>
                        <div className={classes.certInfoValue}>{certificate.subject}</div>
                      </div>
                    )}
                    
                    {certificate.issuer && (
                      <div className={classes.certInfoItem}>
                        <div className={classes.certInfoLabel}>Issuer:</div>
                        <div className={classes.certInfoValue}>
                          {certificate.issuer}
                          {certificate.issuerOrg && (
                            <Chip 
                              size="small" 
                              label={certificate.issuerOrg} 
                              className={classes.issuerChip} 
                            />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(certificate.validFrom || certificate.validTo) && (
                      <div className={classes.certInfoItem}>
                        <div className={classes.certInfoLabel}>Validity:</div>
                        <div className={classes.certInfoValue}>
                          <div>
                            {certificate.validFrom && (
                              <div>From: {new Date(certificate.validFrom).toLocaleDateString()}</div>
                            )}
                            {certificate.validTo && (
                              <div>
                                To: {new Date(certificate.validTo).toLocaleDateString()}
                                {expirationStatus && (
                                  <span className={expirationStatus.className}> ({expirationStatus.text})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Divider />
                  
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>Certificate Properties:</Typography>
                    <List dense>
                      {certificate.keyStrength && (
                        <ListItem>
                          <ListItemIcon>
                            <LockIcon className={classes.statusIcon} />
                          </ListItemIcon>
                          <ListItemText primary={`Key Strength: ${certificate.keyStrength} bits`} />
                        </ListItem>
                      )}
                      {certificate.signatureAlgorithm && (
                        <ListItem>
                          <ListItemIcon>
                            <SecurityIcon className={classes.statusIcon} />
                          </ListItemIcon>
                          <ListItemText primary={`Signature Algorithm: ${certificate.signatureAlgorithm}`} />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Certificate information not available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* SSL/TLS Protocols */}
        <Grid item xs={12} md={6} lg={4}>
          <Card className={classes.protocolsCard}>
            <CardHeader
              title="SSL/TLS Protocols"
              className={classes.cardHeader}
              avatar={<HttpsIcon />}
            />
            <CardContent className={classes.cardContent}>
              {protocols.length > 0 ? (
                <List dense>
                  {protocols.map((protocol, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {protocol.secure ? (
                          <CheckCircleIcon className={classes.info} />
                        ) : (
                          <ErrorIcon className={classes.critical} />
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <span className={protocol.secure ? classes.secureProtocol : classes.insecureProtocol}>
                            {protocol.name}
                          </span>
                        } 
                        secondary={protocol.description}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Protocol information not available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Cipher Suites */}
        <Grid item xs={12} md={12} lg={4}>
          <Card className={classes.cipherCard}>
            <CardHeader
              title="Cipher Suites"
              className={classes.cardHeader}
              avatar={<SecurityIcon />}
            />
            <CardContent className={classes.cardContent}>
              {ciphers.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell className={classes.headerCell}>Cipher</TableCell>
                        <TableCell className={classes.headerCell}>Strength</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ciphers.slice(0, 5).map((cipher, index) => (
                        <TableRow key={index}>
                          <TableCell>{cipher.name}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={cipher.strength || 'Unknown'}
                              className={
                                cipher.secure ? classes.severityInfo : classes.severityHigh
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Cipher information not available
                </Typography>
              )}
              
              {ciphers.length > 5 && (
                <Box textAlign="center" mt={1}>
                  <Typography variant="caption" color="textSecondary">
                    Showing 5 of {ciphers.length} ciphers
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Findings Section */}
      <div className={classes.findingsContainer}>
        <Typography variant="h6" gutterBottom>
          SSL/TLS Findings ({findings.length})
        </Typography>
        
        {/* Filters */}
        {findings.length > 0 && (
          <div className={classes.filterContainer}>
            <div className={classes.chipContainer}>
              <Chip
                label={`All (${findings.length})`}
                onClick={() => handleFilterChange('all')}
                color={activeFilter === 'all' ? 'primary' : 'default'}
              />
              {severityCounts.critical > 0 && (
                <Chip
                  label={`Critical (${severityCounts.critical})`}
                  onClick={() => handleFilterChange('critical')}
                  className={activeFilter === 'critical' ? classes.severityCritical : ''}
                  icon={<ErrorIcon />}
                />
              )}
              {severityCounts.high > 0 && (
                <Chip
                  label={`High (${severityCounts.high})`}
                  onClick={() => handleFilterChange('high')}
                  className={activeFilter === 'high' ? classes.severityHigh : ''}
                  icon={<ErrorIcon />}
                />
              )}
              {severityCounts.medium > 0 && (
                <Chip
                  label={`Medium (${severityCounts.medium})`}
                  onClick={() => handleFilterChange('medium')}
                  className={activeFilter === 'medium' ? classes.severityMedium : ''}
                  icon={<WarningIcon />}
                />
              )}
              {severityCounts.low > 0 && (
                <Chip
                  label={`Low (${severityCounts.low})`}
                  onClick={() => handleFilterChange('low')}
                  className={activeFilter === 'low' ? classes.severityLow : ''}
                  icon={<InfoIcon />}
                />
              )}
              {severityCounts.info > 0 && (
                <Chip
                  label={`Info (${severityCounts.info})`}
                  onClick={() => handleFilterChange('info')}
                  className={activeFilter === 'info' ? classes.severityInfo : ''}
                  icon={<InfoIcon />}
                />
              )}
            </div>
            
            <TextField
              className={classes.searchField}
              placeholder="Search findings"
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
        )}
        
        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <div className={classes.emptyState}>
            {findings.length === 0 ? (
              <>
                <CheckCircleIcon style={{ fontSize: 48, color: '#4caf50', marginBottom: 16 }} />
                <Typography variant="h6">
                  No SSL/TLS Issues Found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Great! Your SSL/TLS configuration appears to be properly configured.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1">
                  No findings match your filters
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
              </>
            )}
          </div>
        ) : (
          <div>
            {filteredFindings.map((finding, index) => {
              const id = `finding-${index}`;
              const isExpanded = expandedFindings[id] || false;
              
              return (
                <Paper key={id} className={classes.findingItem}>
                  <ListItem button onClick={() => toggleFindingExpanded(id)}>
                    <ListItemIcon>
                      {getStatusIcon(finding.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={finding.severity} 
                            size="small" 
                            className={`${classes.severityChip} ${classes[`severity${finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1).toLowerCase()}`]}`}
                          />
                          <Typography variant="body1">
                            {finding.title}
                          </Typography>
                        </div>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          {finding.description?.substring(0, 120)}
                          {finding.description?.length > 120 ? '...' : ''}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => toggleFindingExpanded(id)}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <div className={classes.findingContent}>
                      <Typography variant="body1" paragraph>
                        {finding.description}
                      </Typography>
                      
                      {finding.evidence && (
                        <Box mb={2}>
                          <Typography variant="subtitle2">Evidence:</Typography>
                          <Paper variant="outlined" style={{ padding: 8, backgroundColor: 'rgba(0,0,0,0.03)' }}>
                            <Typography variant="body2" component="pre" style={{ margin: 0, overflow: 'auto' }}>
                              {finding.evidence}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                      
                      {finding.recommendation && (
                        <Box mb={2}>
                          <Typography variant="subtitle2">Recommendation:</Typography>
                          <div className={classes.recommendation}>
                            <Typography variant="body2">
                              {finding.recommendation}
                            </Typography>
                          </div>
                        </Box>
                      )}
                      
                      {finding.references && finding.references.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2">References:</Typography>
                          <ul style={{ margin: '8px 0', paddingLeft: 16 }}>
                            {finding.references.map((ref, idx) => (
                              <li key={idx}>
                                <Typography variant="body2">
                                  <a href={ref} target="_blank" rel="noopener noreferrer">
                                    {ref}
                                  </a>
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </div>
                  </Collapse>
                </Paper>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SslAnalysis;
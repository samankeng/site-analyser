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
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import HttpsIcon from '@mui/icons-material/Https';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

// Using styled API instead of makeStyles
const Root = styled('div')({
  width: '100%',
});

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '& .MuiCardHeader-title': {
    fontSize: '1.1rem',
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const CertCard = styled(Card)({
  height: '100%',
});

const ProtocolsCard = styled(Card)({
  height: '100%',
});

const CipherCard = styled(Card)({
  height: '100%',
});

const StatusIcon = styled('span')(({ theme, severity }) => {
  let color;

  switch (severity) {
    case 'critical':
    case 'high':
      color = theme.palette.error.main;
      break;
    case 'medium':
      color = theme.palette.warning.main;
      break;
    case 'low':
      color = theme.palette.info.main;
      break;
    case 'info':
      color = theme.palette.success.main;
      break;
    default:
      color = 'inherit';
  }

  return {
    color,
    marginRight: theme.spacing(0.5),
    fontSize: '1.2rem',
  };
});

const SeverityChip = styled(Chip)(({ theme, severity }) => {
  const commonStyles = {
    marginRight: theme.spacing(1),
  };

  if (!severity) return commonStyles;

  switch (severity.toLowerCase()) {
    case 'critical':
      return {
        ...commonStyles,
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
      };
    case 'high':
      return {
        ...commonStyles,
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.contrastText,
      };
    case 'medium':
      return {
        ...commonStyles,
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.warning.contrastText,
      };
    case 'low':
      return {
        ...commonStyles,
        backgroundColor: theme.palette.info.main,
        color: theme.palette.info.contrastText,
      };
    case 'info':
      return {
        ...commonStyles,
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
      };
    default:
      return commonStyles;
  }
});

const HeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.background.default,
}));

const GridContainer = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const CertInfo = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const CertInfoItem = styled('div')(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1),
}));

const CertInfoLabel = styled('div')(({ theme }) => ({
  fontWeight: 'bold',
  minWidth: 120,
}));

const CertInfoValue = styled('div')({
  wordBreak: 'break-all',
});

const IssuerChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const ValidDates = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(1),
}));

const ExpiringSoon = styled('span')(({ theme }) => ({
  color: theme.palette.warning.main,
  fontWeight: 'bold',
}));

const Expired = styled('span')(({ theme }) => ({
  color: theme.palette.error.main,
  fontWeight: 'bold',
}));

const SecureProtocol = styled('span')(({ theme }) => ({
  backgroundColor: theme.palette.success.light,
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.success.dark,
}));

const InsecureProtocol = styled('span')(({ theme }) => ({
  backgroundColor: theme.palette.error.light,
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.error.dark,
}));

const FindingsContainer = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const FindingItem = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
}));

const FindingContent = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
}));

const Recommendation = styled('div')(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  padding: theme.spacing(1),
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  marginTop: theme.spacing(1),
}));

const EmptyState = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  textAlign: 'center',
}));

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const SearchField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  width: '100%',
  maxWidth: 300,
}));

const FilterContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const ChipContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
}));

const ScoreChip = styled(Chip)({
  fontWeight: 'bold',
});

const Evidence = styled(Paper)(({ theme }) => ({
  padding: 8,
  backgroundColor: 'rgba(0,0,0,0.03)',
}));

const PreCode = styled('pre')({
  margin: 0,
  overflow: 'auto',
});

const ReferencesList = styled('ul')(({ theme }) => ({
  margin: '8px 0',
  paddingLeft: 16,
}));

/**
 * SSL/TLS Analysis component for displaying certificate and protocol findings
 *
 * @param {Object} props - Component props
 * @param {Array} props.findings - Array of SSL/TLS findings
 * @param {Object} props.metadata - SSL/TLS metadata (certificate info, protocols, etc.)
 * @param {boolean} props.loading - Loading state
 */
const SslAnalysis = ({ findings = [], metadata = {}, loading = false }) => {
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
      return { status: 'expired', text: 'Expired', component: Expired };
    } else if (daysUntilExpiry < 30) {
      return {
        status: 'expiring',
        text: `Expires in ${daysUntilExpiry} days`,
        component: ExpiringSoon,
      };
    } else {
      return { status: 'valid', text: `Valid for ${daysUntilExpiry} days`, component: 'span' };
    }
  };

  const expirationStatus = calculateExpirationStatus();

  // Toggle finding expansion
  const toggleFindingExpanded = id => {
    setExpandedFindings(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle filter change
  const handleFilterChange = filter => {
    setActiveFilter(filter);
  };

  // Handle search term change
  const handleSearchChange = event => {
    setSearchTerm(event.target.value);
  };

  // Get status icon based on severity
  const getStatusIcon = severity => {
    const severityLower = severity.toLowerCase();

    switch (severityLower) {
      case 'critical':
      case 'high':
        return (
          <ErrorIcon
            sx={theme => ({
              color: theme.palette.error.main,
              marginRight: 0.5,
              fontSize: '1.2rem',
            })}
          />
        );
      case 'medium':
        return (
          <WarningIcon
            sx={theme => ({
              color: theme.palette.warning.main,
              marginRight: 0.5,
              fontSize: '1.2rem',
            })}
          />
        );
      case 'low':
        return (
          <InfoIcon
            sx={theme => ({
              color: theme.palette.info.main,
              marginRight: 0.5,
              fontSize: '1.2rem',
            })}
          />
        );
      case 'info':
        return (
          <CheckCircleIcon
            sx={theme => ({
              color: theme.palette.success.main,
              marginRight: 0.5,
              fontSize: '1.2rem',
            })}
          />
        );
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
      <LoadingContainer>
        <CircularProgress size={40} />
      </LoadingContainer>
    );
  }

  return (
    <Root>
      {/* Summary Cards */}
      <GridContainer container spacing={3}>
        {/* Certificate Information */}
        <Grid item xs={12} md={6} lg={4}>
          <CertCard>
            <StyledCardHeader title="Certificate Information" avatar={<VerifiedUserIcon />} />
            <StyledCardContent>
              {Object.keys(certificate).length > 0 ? (
                <>
                  <CertInfo>
                    {certificate.subject && (
                      <CertInfoItem>
                        <CertInfoLabel>Subject:</CertInfoLabel>
                        <CertInfoValue>{certificate.subject}</CertInfoValue>
                      </CertInfoItem>
                    )}

                    {certificate.issuer && (
                      <CertInfoItem>
                        <CertInfoLabel>Issuer:</CertInfoLabel>
                        <CertInfoValue>
                          {certificate.issuer}
                          {certificate.issuerOrg && (
                            <IssuerChip size="small" label={certificate.issuerOrg} />
                          )}
                        </CertInfoValue>
                      </CertInfoItem>
                    )}

                    {(certificate.validFrom || certificate.validTo) && (
                      <CertInfoItem>
                        <CertInfoLabel>Validity:</CertInfoLabel>
                        <CertInfoValue>
                          <div>
                            {certificate.validFrom && (
                              <div>
                                From: {new Date(certificate.validFrom).toLocaleDateString()}
                              </div>
                            )}
                            {certificate.validTo && (
                              <div>
                                To: {new Date(certificate.validTo).toLocaleDateString()}
                                {expirationStatus &&
                                  (expirationStatus.component === 'span' ? (
                                    <span> ({expirationStatus.text})</span>
                                  ) : (
                                    React.createElement(
                                      expirationStatus.component,
                                      null,
                                      ` (${expirationStatus.text})`
                                    )
                                  ))}
                              </div>
                            )}
                          </div>
                        </CertInfoValue>
                      </CertInfoItem>
                    )}
                  </CertInfo>

                  <Divider />

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Certificate Properties:
                    </Typography>
                    <List dense>
                      {certificate.keyStrength && (
                        <ListItem>
                          <ListItemIcon>
                            <LockIcon sx={{ fontSize: '1.2rem' }} />
                          </ListItemIcon>
                          <ListItemText primary={`Key Strength: ${certificate.keyStrength} bits`} />
                        </ListItem>
                      )}
                      {certificate.signatureAlgorithm && (
                        <ListItem>
                          <ListItemIcon>
                            <SecurityIcon sx={{ fontSize: '1.2rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Signature Algorithm: ${certificate.signatureAlgorithm}`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Certificate information not available
                </Typography>
              )}
            </StyledCardContent>
          </CertCard>
        </Grid>

        {/* SSL/TLS Protocols */}
        <Grid item xs={12} md={6} lg={4}>
          <ProtocolsCard>
            <StyledCardHeader title="SSL/TLS Protocols" avatar={<HttpsIcon />} />
            <StyledCardContent>
              {protocols.length > 0 ? (
                <List dense>
                  {protocols.map((protocol, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {protocol.secure ? (
                          <CheckCircleIcon sx={theme => ({ color: theme.palette.success.main })} />
                        ) : (
                          <ErrorIcon sx={theme => ({ color: theme.palette.error.main })} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          protocol.secure ? (
                            <SecureProtocol>{protocol.name}</SecureProtocol>
                          ) : (
                            <InsecureProtocol>{protocol.name}</InsecureProtocol>
                          )
                        }
                        secondary={protocol.description}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Protocol information not available
                </Typography>
              )}
            </StyledCardContent>
          </ProtocolsCard>
        </Grid>

        {/* Cipher Suites */}
        <Grid item xs={12} md={12} lg={4}>
          <CipherCard>
            <StyledCardHeader title="Cipher Suites" avatar={<SecurityIcon />} />
            <StyledCardContent>
              {ciphers.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <HeaderCell>Cipher</HeaderCell>
                        <HeaderCell>Strength</HeaderCell>
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
                              sx={
                                cipher.secure
                                  ? theme => ({
                                      backgroundColor: theme.palette.success.main,
                                      color: theme.palette.success.contrastText,
                                    })
                                  : theme => ({
                                      backgroundColor: theme.palette.error.light,
                                      color: theme.palette.error.contrastText,
                                    })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Cipher information not available
                </Typography>
              )}

              {ciphers.length > 5 && (
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Showing 5 of {ciphers.length} ciphers
                  </Typography>
                </Box>
              )}
            </StyledCardContent>
          </CipherCard>
        </Grid>
      </GridContainer>

      {/* Findings Section */}
      <FindingsContainer>
        <Typography variant="h6" gutterBottom>
          SSL/TLS Findings ({findings.length})
        </Typography>

        {/* Filters */}
        {findings.length > 0 && (
          <FilterContainer>
            <ChipContainer>
              <Chip
                label={`All (${findings.length})`}
                onClick={() => handleFilterChange('all')}
                color={activeFilter === 'all' ? 'primary' : 'default'}
              />
              {severityCounts.critical > 0 && (
                <Chip
                  label={`Critical (${severityCounts.critical})`}
                  onClick={() => handleFilterChange('critical')}
                  icon={<ErrorIcon />}
                  sx={
                    activeFilter === 'critical'
                      ? theme => ({
                          backgroundColor: theme.palette.error.main,
                          color: theme.palette.error.contrastText,
                        })
                      : {}
                  }
                />
              )}
              {severityCounts.high > 0 && (
                <Chip
                  label={`High (${severityCounts.high})`}
                  onClick={() => handleFilterChange('high')}
                  icon={<ErrorIcon />}
                  sx={
                    activeFilter === 'high'
                      ? theme => ({
                          backgroundColor: theme.palette.error.light,
                          color: theme.palette.error.contrastText,
                        })
                      : {}
                  }
                />
              )}
              {severityCounts.medium > 0 && (
                <Chip
                  label={`Medium (${severityCounts.medium})`}
                  onClick={() => handleFilterChange('medium')}
                  icon={<WarningIcon />}
                  sx={
                    activeFilter === 'medium'
                      ? theme => ({
                          backgroundColor: theme.palette.warning.main,
                          color: theme.palette.warning.contrastText,
                        })
                      : {}
                  }
                />
              )}
              {severityCounts.low > 0 && (
                <Chip
                  label={`Low (${severityCounts.low})`}
                  onClick={() => handleFilterChange('low')}
                  icon={<InfoIcon />}
                  sx={
                    activeFilter === 'low'
                      ? theme => ({
                          backgroundColor: theme.palette.info.main,
                          color: theme.palette.info.contrastText,
                        })
                      : {}
                  }
                />
              )}
              {severityCounts.info > 0 && (
                <Chip
                  label={`Info (${severityCounts.info})`}
                  onClick={() => handleFilterChange('info')}
                  icon={<InfoIcon />}
                  sx={
                    activeFilter === 'info'
                      ? theme => ({
                          backgroundColor: theme.palette.success.main,
                          color: theme.palette.success.contrastText,
                        })
                      : {}
                  }
                />
              )}
            </ChipContainer>

            <SearchField
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
          </FilterContainer>
        )}

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <EmptyState>
            {findings.length === 0 ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 48, color: '#4caf50', marginBottom: 2 }} />
                <Typography variant="h6">No SSL/TLS Issues Found</Typography>
                <Typography variant="body2" color="text.secondary">
                  Great! Your SSL/TLS configuration appears to be properly configured.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1">No findings match your filters</Typography>
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
          </EmptyState>
        ) : (
          <div>
            {filteredFindings.map((finding, index) => {
              const id = `finding-${index}`;
              const isExpanded = expandedFindings[id] || false;

              return (
                <FindingItem key={id} elevation={1}>
                  <ListItem button onClick={() => toggleFindingExpanded(id)}>
                    <ListItemIcon>{getStatusIcon(finding.severity)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip
                            label={finding.severity}
                            size="small"
                            sx={theme => SeverityChip({ theme, severity: finding.severity })}
                          />
                          <Typography variant="body1">{finding.title}</Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
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
                    <FindingContent>
                      <Typography variant="body1" paragraph>
                        {finding.description}
                      </Typography>

                      {finding.evidence && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">Evidence:</Typography>
                          <Evidence variant="outlined">
                            <Typography variant="body2" component="div">
                              <PreCode>{finding.evidence}</PreCode>
                            </Typography>
                          </Evidence>
                        </Box>
                      )}

                      {finding.recommendation && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2">Recommendation:</Typography>
                          <Recommendation>
                            <Typography variant="body2">{finding.recommendation}</Typography>
                          </Recommendation>
                        </Box>
                      )}

                      {finding.references && finding.references.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2">References:</Typography>
                          <ReferencesList>
                            {finding.references.map((ref, idx) => (
                              <li key={idx}>
                                <Typography variant="body2">
                                  <a href={ref} target="_blank" rel="noopener noreferrer">
                                    {ref}
                                  </a>
                                </Typography>
                              </li>
                            ))}
                          </ReferencesList>
                        </Box>
                      )}
                    </FindingContent>
                  </Collapse>
                </FindingItem>
              );
            })}
          </div>
        )}
      </FindingsContainer>
    </Root>
  );
};

export default SslAnalysis;

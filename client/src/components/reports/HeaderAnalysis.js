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
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/FileCopy';
import CodeIcon from '@mui/icons-material/Code';

// Using styled API instead of makeStyles
const Root = styled('div')({
  width: '100%',
});

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

const HeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.background.default,
}));

const SeverityChip = styled(Chip)(({ theme, severity }) => {
  let styles = {};

  switch (severity) {
    case 'critical':
      styles = {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
      };
      break;
    case 'high':
      styles = {
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.contrastText,
      };
      break;
    case 'medium':
      styles = {
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.warning.contrastText,
      };
      break;
    case 'low':
      styles = {
        backgroundColor: theme.palette.info.main,
        color: theme.palette.info.contrastText,
      };
      break;
    case 'info':
      styles = {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
      };
      break;
    default:
      styles = {};
  }

  return styles;
});

const StatusIcon = styled('span')(({ theme, status }) => {
  let color;

  switch (status) {
    case 'success':
      color = theme.palette.success.main;
      break;
    case 'warning':
      color = theme.palette.warning.main;
      break;
    case 'error':
      color = theme.palette.error.main;
      break;
    default:
      color = 'inherit';
  }

  return {
    color,
    verticalAlign: 'middle',
    marginRight: theme.spacing(0.5),
  };
});

const Recommendation = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(1),
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  marginTop: theme.spacing(1),
}));

const Collapsible = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const RowAlternate = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
}));

const FilterContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const SearchField = styled(TextField)(({ theme }) => ({
  minWidth: 250,
}));

const ChipContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  marginBottom: theme.spacing(1),
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

const SeverityIconWrapper = styled('span')(({ theme, severity }) => {
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
    case 'info':
      color = theme.palette.success.main;
      break;
    default:
      color = 'inherit';
  }

  return {
    color,
    marginRight: theme.spacing(0.5),
    fontSize: '1rem',
  };
});

const HeaderValue = styled('div')(({ theme }) => ({
  fontFamily: 'monospace',
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  padding: '3px 5px',
  borderRadius: 3,
  overflowX: 'auto',
  maxWidth: 300,
  whiteSpace: 'nowrap',
  display: 'inline-block',
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  padding: 2,
}));

const CopyIcon = styled(ContentCopyIcon)(({ theme }) => ({
  fontSize: '1rem',
}));

const ReferencesList = styled('ul')({
  margin: 0,
});

/**
 * Header Analysis component for displaying HTTP security headers findings
 *
 * @param {Object} props - Component props
 * @param {Array} props.headers - Array of header findings
 * @param {Object} props.rawHeaders - Raw headers response data
 * @param {boolean} props.loading - Loading state
 */
const HeaderAnalysis = ({ headers = [], rawHeaders = {}, loading = false }) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Toggle row expansion
  const toggleRowExpanded = id => {
    setExpandedRows(prev => ({
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

  // Copy header value to clipboard
  const copyToClipboard = text => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Success feedback could be added here
      },
      err => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Get severity icon
  const getSeverityIcon = severity => {
    const severityLower = severity.toLowerCase();

    switch (severityLower) {
      case 'critical':
      case 'high':
        return (
          <SeverityIconWrapper severity={severityLower}>
            <ErrorIcon fontSize="small" />
          </SeverityIconWrapper>
        );
      case 'medium':
        return (
          <SeverityIconWrapper severity={severityLower}>
            <WarningIcon fontSize="small" />
          </SeverityIconWrapper>
        );
      case 'low':
      case 'info':
        return (
          <SeverityIconWrapper severity={severityLower}>
            <InfoIcon fontSize="small" />
          </SeverityIconWrapper>
        );
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
      <LoadingContainer>
        <CircularProgress size={40} />
      </LoadingContainer>
    );
  }

  // If no headers, show empty state
  if (!headers.length) {
    return (
      <EmptyState>
        <InfoIcon sx={{ fontSize: 48, color: '#ccc', marginBottom: 2 }} />
        <Typography variant="h6">No HTTP Header Issues Found</Typography>
        <Typography variant="body2" color="text.secondary">
          Great! Your HTTP security headers appear to be properly configured.
        </Typography>
      </EmptyState>
    );
  }

  return (
    <Root>
      <FilterContainer>
        <ChipContainer>
          <StyledChip
            label={`All (${headers.length})`}
            onClick={() => handleFilterChange('all')}
            color={activeFilter === 'all' ? 'primary' : 'default'}
          />
          {severityCounts.critical > 0 && (
            <StyledChip
              label={`Critical (${severityCounts.critical})`}
              onClick={() => handleFilterChange('critical')}
              sx={
                activeFilter === 'critical'
                  ? theme => ({
                      backgroundColor: theme.palette.error.main,
                      color: theme.palette.error.contrastText,
                    })
                  : {}
              }
              icon={<ErrorIcon />}
            />
          )}
          {severityCounts.high > 0 && (
            <StyledChip
              label={`High (${severityCounts.high})`}
              onClick={() => handleFilterChange('high')}
              sx={
                activeFilter === 'high'
                  ? theme => ({
                      backgroundColor: theme.palette.error.light,
                      color: theme.palette.error.contrastText,
                    })
                  : {}
              }
              icon={<ErrorIcon />}
            />
          )}
          {severityCounts.medium > 0 && (
            <StyledChip
              label={`Medium (${severityCounts.medium})`}
              onClick={() => handleFilterChange('medium')}
              sx={
                activeFilter === 'medium'
                  ? theme => ({
                      backgroundColor: theme.palette.warning.main,
                      color: theme.palette.warning.contrastText,
                    })
                  : {}
              }
              icon={<WarningIcon />}
            />
          )}
          {severityCounts.low > 0 && (
            <StyledChip
              label={`Low (${severityCounts.low})`}
              onClick={() => handleFilterChange('low')}
              sx={
                activeFilter === 'low'
                  ? theme => ({
                      backgroundColor: theme.palette.info.main,
                      color: theme.palette.info.contrastText,
                    })
                  : {}
              }
              icon={<InfoIcon />}
            />
          )}
          {severityCounts.info > 0 && (
            <StyledChip
              label={`Info (${severityCounts.info})`}
              onClick={() => handleFilterChange('info')}
              sx={
                activeFilter === 'info'
                  ? theme => ({
                      backgroundColor: theme.palette.success.main,
                      color: theme.palette.success.contrastText,
                    })
                  : {}
              }
              icon={<InfoIcon />}
            />
          )}
        </ChipContainer>

        <SearchField
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
      </FilterContainer>

      {filteredHeaders.length === 0 ? (
        <EmptyState>
          <Typography variant="body1">No HTTP headers match your filters</Typography>
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
        </EmptyState>
      ) : (
        <StyledTableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <HeaderCell>Severity</HeaderCell>
                <HeaderCell>Header</HeaderCell>
                <HeaderCell>Issue</HeaderCell>
                <HeaderCell>Current Value</HeaderCell>
                <HeaderCell align="right">Actions</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHeaders.map((header, index) => {
                const rowId = `header-${index}`;
                const isExpanded = expandedRows[rowId] || false;
                const severityLower = header.severity.toLowerCase();

                return (
                  <React.Fragment key={rowId}>
                    {index % 2 === 1 ? (
                      <RowAlternate>
                        <TableCell>
                          <Chip
                            label={header.severity}
                            size="small"
                            sx={theme => SeverityChip({ theme, severity: severityLower })}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{header.title}</Typography>
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
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <HeaderValue>{header.evidence}</HeaderValue>
                              <Tooltip title="Copy to clipboard">
                                <CopyButton onClick={() => copyToClipboard(header.evidence)}>
                                  <CopyIcon />
                                </CopyButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not set
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => toggleRowExpanded(rowId)}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </RowAlternate>
                    ) : (
                      <TableRow>
                        <TableCell>
                          <Chip
                            label={header.severity}
                            size="small"
                            sx={theme => SeverityChip({ theme, severity: severityLower })}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{header.title}</Typography>
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
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <HeaderValue>{header.evidence}</HeaderValue>
                              <Tooltip title="Copy to clipboard">
                                <CopyButton onClick={() => copyToClipboard(header.evidence)}>
                                  <CopyIcon />
                                </CopyButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
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
                    )}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Collapsible>
                            <Typography variant="subtitle2" gutterBottom>
                              Full Description:
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {header.description}
                            </Typography>

                            {header.recommendation && (
                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  Recommendation:
                                </Typography>
                                <Recommendation>
                                  <Typography variant="body2">{header.recommendation}</Typography>
                                </Recommendation>
                              </Box>
                            )}

                            {header.references && header.references.length > 0 && (
                              <Box sx={{ marginTop: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  References:
                                </Typography>
                                <ReferencesList>
                                  {header.references.map((ref, idx) => (
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
                          </Collapsible>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </StyledTableContainer>
      )}

      {/* Show Raw Headers if available */}
      {Object.keys(rawHeaders).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Raw Headers
          </Typography>
          <Paper>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <HeaderCell>Header</HeaderCell>
                    <HeaderCell>Value</HeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(rawHeaders).map(([key, value], index) =>
                    index % 2 === 1 ? (
                      <RowAlternate key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <HeaderValue>{value}</HeaderValue>
                            <Tooltip title="Copy to clipboard">
                              <CopyButton onClick={() => copyToClipboard(value)}>
                                <CopyIcon />
                              </CopyButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </RowAlternate>
                    ) : (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <HeaderValue>{value}</HeaderValue>
                            <Tooltip title="Copy to clipboard">
                              <CopyButton onClick={() => copyToClipboard(value)}>
                                <CopyIcon />
                              </CopyButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Root>
  );
};

export default HeaderAnalysis;

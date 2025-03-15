import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Box,
  Tooltip,
  CircularProgress,
  Button,
  useMediaQuery
} from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import VisibilityIcon from '@material-ui/icons/Visibility';
import ErrorIcon from '@material-ui/icons/Error';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import CancelIcon from '@material-ui/icons/Cancel';
import RefreshIcon from '@material-ui/icons/Refresh';
import { useNavigate } from 'react-router-dom';
import { formatDate, getDomainAndPath } from '../../utils/formatters';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    minWidth: 650,
  },
  successChip: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  warningChip: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  errorChip: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  pendingChip: {
    backgroundColor: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  },
  urlCell: {
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusIcon: {
    marginRight: theme.spacing(1),
    fontSize: '1rem',
    verticalAlign: 'middle',
  },
  viewButton: {
    color: theme.palette.primary.main,
  },
  domain: {
    fontWeight: 500,
  },
  path: {
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
  },
  scoreCell: {
    minWidth: 80,
  },
  score: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  excellent: {
    color: theme.palette.success.main,
  },
  good: {
    color: theme.palette.info.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  critical: {
    color: theme.palette.error.main,
  },
  emptyState: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
  },
  tableHead: {
    backgroundColor: theme.palette.background.default,
  },
  tableRow: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  mobileCardContainer: {
    marginBottom: theme.spacing(2),
  },
  mobileCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  mobileCardContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1),
  },
  viewAllButton: {
    marginTop: theme.spacing(1),
    textAlign: 'center',
  },
}));

/**
 * Status chip component
 */
const StatusChip = ({ status }) => {
  const classes = useStyles();
  
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return { 
          label: 'Completed', 
          icon: <CheckCircleIcon className={classes.statusIcon} />, 
          className: classes.successChip 
        };
      case 'in_progress':
        return { 
          label: 'In Progress', 
          icon: <CircularProgress size={14} className={classes.statusIcon} />, 
          className: classes.pendingChip 
        };
      case 'pending':
        return { 
          label: 'Pending', 
          icon: <HourglassEmptyIcon className={classes.statusIcon} />, 
          className: classes.pendingChip 
        };
      case 'failed':
        return { 
          label: 'Failed', 
          icon: <ErrorIcon className={classes.statusIcon} />, 
          className: classes.errorChip 
        };
      case 'cancelled':
        return { 
          label: 'Cancelled', 
          icon: <CancelIcon className={classes.statusIcon} />, 
          className: classes.warningChip 
        };
      default:
        return { 
          label: 'Unknown', 
          icon: null, 
          className: '' 
        };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <Chip 
      size="small" 
      label={
        <span>
          {config.icon}
          {config.label}
        </span>
      } 
      className={config.className}
    />
  );
};

/**
 * Score component with color based on value
 */
const Score = ({ value }) => {
  const classes = useStyles();
  
  if (!value && value !== 0) {
    return <span>-</span>;
  }
  
  const getScoreClass = () => {
    if (value >= 90) return classes.excellent;
    if (value >= 70) return classes.good;
    if (value >= 50) return classes.warning;
    return classes.critical;
  };
  
  return (
    <span className={`${classes.score} ${getScoreClass()}`}>
      {value}
    </span>
  );
};

/**
 * Scan history table component for displaying recent scans
 * 
 * @param {Object} props - Component props
 * @param {Array} props.scans - Array of scan objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onViewScan - Function to call when view button is clicked
 * @param {Function} props.onRerunScan - Function to call when rerun button is clicked
 * @param {boolean} props.showViewAll - Whether to show view all button
 * @param {Function} props.onViewAll - Function to call when view all button is clicked
 */
const ScanHistoryTable = ({ 
  scans = [], 
  loading = false,
  onViewScan,
  onRerunScan,
  showViewAll = false,
  onViewAll
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Handle view scan button click
  const handleViewScan = (scanId) => {
    if (onViewScan) {
      onViewScan(scanId);
    } else {
      navigate(`/reports/${scanId}`);
    }
  };
  
  // Handle rerun scan button click
  const handleRerunScan = (scanId, url) => {
    if (onRerunScan) {
      onRerunScan(scanId, url);
    } else {
      navigate('/scan', { state: { url } });
    }
  };
  
  // Handle view all button click
  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/reports');
    }
  };
  
  // If loading, show loading spinner
  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress size={30} />
      </div>
    );
  }
  
  // If no scans, show empty state
  if (!scans.length) {
    return (
      <div className={classes.emptyState}>
        <Typography variant="body1">
          No scan history available
        </Typography>
        <Typography variant="body2">
          Run your first security scan to see results here
        </Typography>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => navigate('/scan')}
          style={{ marginTop: 16 }}
        >
          Start New Scan
        </Button>
      </div>
    );
  }
  
  // Mobile view with cards
  if (isMobile) {
    return (
      <div>
        <div className={classes.mobileCardContainer}>
          {scans.map((scan, index) => {
            const { domain, path } = getDomainAndPath(scan.url);
            
            return (
              <Paper key={scan.id || index} className={classes.mobileCard}>
                <div className={classes.mobileCardHeader}>
                  <div>
                    <Typography variant="subtitle1" className={classes.domain}>
                      {domain}
                    </Typography>
                    {path && (
                      <Typography variant="body2" className={classes.path}>
                        {path}
                      </Typography>
                    )}
                  </div>
                  <StatusChip status={scan.status} />
                </div>
                
                <div className={classes.mobileCardContent}>
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Date: {formatDate(scan.createdAt)}
                    </Typography>
                    {scan.status === 'completed' && scan.summary && (
                      <Typography variant="body2">
                        Score: <Score value={scan.summary.overall} />
                      </Typography>
                    )}
                  </div>
                  
                  <div>
                    {scan.status === 'completed' && (
                      <IconButton 
                        size="small" 
                        className={classes.viewButton}
                        onClick={() => handleViewScan(scan.id || scan._id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    )}
                    <IconButton 
                      size="small"
                      onClick={() => handleRerunScan(scan.id || scan._id, scan.url)}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </div>
                </div>
              </Paper>
            );
          })}
        </div>
        
        {showViewAll && (
          <Box className={classes.viewAllButton}>
            <Button 
              variant="text" 
              color="primary" 
              onClick={handleViewAll}
            >
              View All Scans
            </Button>
          </Box>
        )}
      </div>
    );
  }
  
  // Desktop view with table
  return (
    <div className={classes.root}>
      <TableContainer>
        <Table className={classes.table} size="medium">
          <TableHead className={classes.tableHead}>
            <TableRow>
              <TableCell>URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Score</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scans.map((scan, index) => {
              const { domain, path } = getDomainAndPath(scan.url);
              
              return (
                <TableRow key={scan.id || index} className={classes.tableRow}>
                  <TableCell className={classes.urlCell}>
                    <Tooltip title={scan.url}>
                      <div>
                        <Typography variant="body2" className={classes.domain}>
                          {domain}
                        </Typography>
                        {path && (
                          <Typography variant="caption" className={classes.path}>
                            {path}
                          </Typography>
                        )}
                      </div>
                    </Tooltip>
                  </TableCell>
                  
                  <TableCell>
                    <StatusChip status={scan.status} />
                  </TableCell>
                  
                  <TableCell>
                    {formatDate(scan.createdAt)}
                  </TableCell>
                  
                  <TableCell className={classes.scoreCell}>
                    {scan.status === 'completed' && scan.summary ? (
                      <Score value={scan.summary.overall} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  
                  <TableCell align="right">
                    {scan.status === 'completed' && (
                      <Tooltip title="View Report">
                        <IconButton 
                          size="small" 
                          className={classes.viewButton}
                          onClick={() => handleViewScan(scan.id || scan._id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Rerun Scan">
                      <IconButton 
                        size="small"
                        onClick={() => handleRerunScan(scan.id || scan._id, scan.url)}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {showViewAll && (
        <Box className={classes.viewAllButton}>
          <Button 
            variant="text" 
            color="primary" 
            onClick={handleViewAll}
          >
            View All Scans
          </Button>
        </Box>
      )}
    </div>
  );
};

export default ScanHistoryTable;
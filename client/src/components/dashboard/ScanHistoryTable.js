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
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { formatDate, getDomainAndPath } from '../../utils/formatters';

// Using styled API instead of makeStyles
const Root = styled('div')(({ theme }) => ({
  width: '100%',
  overflowX: 'auto',
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 650,
}));

const SuccessChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
}));

const WarningChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.warning.contrastText,
}));

const ErrorChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
}));

const PendingChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.info.main,
  color: theme.palette.info.contrastText,
}));

const UrlCell = styled(TableCell)(({ theme }) => ({
  maxWidth: 200,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const StatusIcon = styled('span')(({ theme }) => ({
  marginRight: theme.spacing(1),
  fontSize: '1rem',
  verticalAlign: 'middle',
}));

const ViewButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const Domain = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

const Path = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
}));

const ScoreCell = styled(TableCell)(({ theme }) => ({
  minWidth: 80,
}));

const ScoreText = styled('span')(({ theme, scoreValue }) => {
  let color = theme.palette.error.main; // default critical

  if (scoreValue >= 90) color = theme.palette.success.main;
  else if (scoreValue >= 70) color = theme.palette.info.main;
  else if (scoreValue >= 50) color = theme.palette.warning.main;

  return {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
    color: color,
  };
});

const EmptyState = styled('div')(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const TableHeadStyled = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
}));

const TableRowStyled = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const MobileCardContainer = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const MobileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const MobileCardHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const MobileCardContent = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(1),
}));

const ViewAllButton = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  textAlign: 'center',
}));

/**
 * Status chip component
 */
const StatusChip = ({ status }) => {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          icon: (
            <CheckCircleIcon sx={{ marginRight: 1, fontSize: '1rem', verticalAlign: 'middle' }} />
          ),
          component: SuccessChip,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          icon: <CircularProgress size={14} sx={{ marginRight: 1, verticalAlign: 'middle' }} />,
          component: PendingChip,
        };
      case 'pending':
        return {
          label: 'Pending',
          icon: (
            <HourglassEmptyIcon
              sx={{ marginRight: 1, fontSize: '1rem', verticalAlign: 'middle' }}
            />
          ),
          component: PendingChip,
        };
      case 'failed':
        return {
          label: 'Failed',
          icon: <ErrorIcon sx={{ marginRight: 1, fontSize: '1rem', verticalAlign: 'middle' }} />,
          component: ErrorChip,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: <CancelIcon sx={{ marginRight: 1, fontSize: '1rem', verticalAlign: 'middle' }} />,
          component: WarningChip,
        };
      default:
        return {
          label: 'Unknown',
          icon: null,
          component: Chip,
        };
    }
  };

  const config = getStatusConfig();
  const ChipComponent = config.component;

  return (
    <ChipComponent
      size="small"
      label={
        <span>
          {config.icon}
          {config.label}
        </span>
      }
    />
  );
};

/**
 * Score component with color based on value
 */
const Score = ({ value }) => {
  if (!value && value !== 0) {
    return <span>-</span>;
  }

  return <ScoreText scoreValue={value}>{value}</ScoreText>;
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
  onViewAll,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle view scan button click
  const handleViewScan = scanId => {
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
      <LoadingContainer>
        <CircularProgress size={30} />
      </LoadingContainer>
    );
  }

  // If no scans, show empty state
  if (!scans.length) {
    return (
      <EmptyState>
        <Typography variant="body1">No scan history available</Typography>
        <Typography variant="body2">Run your first security scan to see results here</Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/scan')}
          sx={{ marginTop: 2 }}
        >
          Start New Scan
        </Button>
      </EmptyState>
    );
  }

  // Mobile view with cards
  if (isMobile) {
    return (
      <div>
        <MobileCardContainer>
          {scans.map((scan, index) => {
            const { domain, path } = getDomainAndPath(scan.url);

            return (
              <MobileCard key={scan.id || index} elevation={2}>
                <MobileCardHeader>
                  <div>
                    <Domain variant="subtitle1">{domain}</Domain>
                    {path && <Path variant="body2">{path}</Path>}
                  </div>
                  <StatusChip status={scan.status} />
                </MobileCardHeader>

                <MobileCardContent>
                  <div>
                    <Typography variant="body2" color="text.secondary">
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
                        color="primary"
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
                </MobileCardContent>
              </MobileCard>
            );
          })}
        </MobileCardContainer>

        {showViewAll && (
          <ViewAllButton>
            <Button variant="text" color="primary" onClick={handleViewAll}>
              View All Scans
            </Button>
          </ViewAllButton>
        )}
      </div>
    );
  }

  // Desktop view with table
  return (
    <Root>
      <TableContainer>
        <StyledTable size="medium">
          <TableHeadStyled>
            <TableRow>
              <TableCell>URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Score</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHeadStyled>
          <TableBody>
            {scans.map((scan, index) => {
              const { domain, path } = getDomainAndPath(scan.url);

              return (
                <TableRowStyled key={scan.id || index}>
                  <UrlCell>
                    <Tooltip title={scan.url}>
                      <div>
                        <Domain variant="body2">{domain}</Domain>
                        {path && <Path variant="caption">{path}</Path>}
                      </div>
                    </Tooltip>
                  </UrlCell>

                  <TableCell>
                    <StatusChip status={scan.status} />
                  </TableCell>

                  <TableCell>{formatDate(scan.createdAt)}</TableCell>

                  <ScoreCell>
                    {scan.status === 'completed' && scan.summary ? (
                      <Score value={scan.summary.overall} />
                    ) : (
                      '-'
                    )}
                  </ScoreCell>

                  <TableCell align="right">
                    {scan.status === 'completed' && (
                      <Tooltip title="View Report">
                        <IconButton
                          size="small"
                          color="primary"
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
                </TableRowStyled>
              );
            })}
          </TableBody>
        </StyledTable>
      </TableContainer>

      {showViewAll && (
        <ViewAllButton>
          <Button variant="text" color="primary" onClick={handleViewAll}>
            View All Scans
          </Button>
        </ViewAllButton>
      )}
    </Root>
  );
};

export default ScanHistoryTable;

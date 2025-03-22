import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  CircularProgress,
  styled,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

// Styled components
const Root = styled('div')({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const ListContainer = styled('div')({
  flexGrow: 1,
  overflow: 'auto',
  maxHeight: 300,
});

const IconContainer = styled(ListItemIcon)({
  minWidth: '40px',
});

const CriticalIcon = styled(ErrorIcon)(({ theme }) => ({
  color: theme.palette.error.main,
}));

const HighIcon = styled(ErrorIcon)(({ theme }) => ({
  color: theme.palette.error.light,
}));

const MediumIcon = styled(WarningIcon)(({ theme }) => ({
  color: theme.palette.warning.main,
}));

const LowIcon = styled(WarningIcon)(({ theme }) => ({
  color: theme.palette.info.main,
}));

const StyledInfoIcon = styled(InfoIcon)(({ theme }) => ({
  color: theme.palette.success.main,
}));

const SystemIcon = styled(SystemUpdateIcon)(({ theme }) => ({
  color: theme.palette.grey[700],
}));

const UnreadDot = styled(FiberManualRecordIcon)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 12,
  marginRight: theme.spacing(1),
}));

const AlertTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(0.5),
}));

const AlertMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

const AlertTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

const ViewAllButton = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  textAlign: 'center',
}));

const EmptyState = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  color: theme.palette.text.secondary,
  textAlign: 'center',
  '& svg': {
    fontSize: 40,
    marginBottom: theme.spacing(1),
    opacity: 0.5,
  },
}));

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const ChipContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const FlexContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
});

/**
 * Alerts widget component for displaying security alerts on dashboard
 *
 * @param {Object} props - Component props
 * @param {Array} props.alerts - Array of alert objects
 * @param {boolean} props.loading - Loading state
 */
const AlertsWidget = ({ alerts = [], loading = false }) => {
  const navigate = useNavigate();

  // Navigate to alerts page
  const handleViewAllAlerts = () => {
    navigate('/alerts');
  };

  // Navigate to alert detail
  const handleViewAlert = alertId => {
    navigate(`/alerts/${alertId}`);
  };

  // Get icon for alert type and severity
  const getAlertIcon = (type, severity) => {
    if (type === 'security') {
      switch (severity) {
        case 'critical':
          return <CriticalIcon />;
        case 'high':
          return <HighIcon />;
        case 'medium':
          return <MediumIcon />;
        case 'low':
          return <LowIcon />;
        default:
          return <StyledInfoIcon />;
      }
    } else if (type === 'system') {
      return <SystemIcon />;
    } else {
      return <StyledInfoIcon />;
    }
  };

  // Calculate alert counts by type
  const securityAlerts = alerts.filter(alert => alert.type === 'security').length;
  const systemAlerts = alerts.filter(alert => alert.type === 'system').length;
  const infoAlerts = alerts.filter(alert => alert.type === 'info').length;

  // If loading, show loading spinner
  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress size={30} />
      </LoadingContainer>
    );
  }

  // If no alerts, show empty state
  if (!alerts.length) {
    return (
      <EmptyState>
        <InfoIcon />
        <Typography variant="body1">No alerts at this time</Typography>
        <Typography variant="body2">You're all caught up! New alerts will appear here.</Typography>
      </EmptyState>
    );
  }

  return (
    <Root>
      <ChipContainer>
        {securityAlerts > 0 && (
          <StyledChip label={`${securityAlerts} Security`} color="secondary" size="small" />
        )}
        {systemAlerts > 0 && (
          <StyledChip label={`${systemAlerts} System`} color="default" size="small" />
        )}
        {infoAlerts > 0 && <StyledChip label={`${infoAlerts} Info`} color="primary" size="small" />}
      </ChipContainer>

      <Divider />

      <ListContainer>
        <List disablePadding>
          {alerts.slice(0, 5).map((alert, index) => (
            <React.Fragment key={alert.id || index}>
              {index > 0 && <Divider variant="inset" component="li" />}
              <ListItem alignItems="flex-start" button onClick={() => handleViewAlert(alert.id)}>
                <IconContainer>{getAlertIcon(alert.type, alert.severity)}</IconContainer>
                <ListItemText
                  primary={
                    <FlexContainer>
                      {!alert.read && <UnreadDot />}
                      <AlertTitle variant="body1">{alert.title}</AlertTitle>
                    </FlexContainer>
                  }
                  secondary={
                    <>
                      <AlertMessage variant="body2">{alert.message}</AlertMessage>
                      <AlertTime variant="caption">{formatDate(alert.createdAt)}</AlertTime>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="navigate"
                    onClick={() => handleViewAlert(alert.id)}
                  >
                    <NavigateNextIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </ListContainer>

      {alerts.length > 5 && (
        <ViewAllButton>
          <Button variant="text" color="primary" onClick={handleViewAllAlerts}>
            View All Alerts ({alerts.length})
          </Button>
        </ViewAllButton>
      )}
    </Root>
  );
};

export default AlertsWidget;

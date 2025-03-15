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
  CircularProgress
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ErrorIcon from '@material-ui/icons/Error';
import WarningIcon from '@material-ui/icons/Warning';
import InfoIcon from '@material-ui/icons/Info';
import SystemUpdateIcon from '@material-ui/icons/SystemUpdate';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  listContainer: {
    flexGrow: 1,
    overflow: 'auto',
    maxHeight: 300,
  },
  iconContainer: {
    minWidth: '40px',
  },
  criticalIcon: {
    color: theme.palette.error.main,
  },
  highIcon: {
    color: theme.palette.error.light,
  },
  mediumIcon: {
    color: theme.palette.warning.main,
  },
  lowIcon: {
    color: theme.palette.info.main,
  },
  infoIcon: {
    color: theme.palette.success.main,
  },
  systemIcon: {
    color: theme.palette.grey[700],
  },
  unreadDot: {
    color: theme.palette.primary.main,
    fontSize: 12,
    marginRight: theme.spacing(1),
  },
  alertTitle: {
    fontWeight: 500,
    marginBottom: theme.spacing(0.5),
  },
  alertMessage: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  alertTime: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  viewAllButton: {
    marginTop: theme.spacing(2),
    textAlign: 'center',
  },
  emptyState: {
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
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
  },
  chipContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
}));

/**
 * Alerts widget component for displaying security alerts on dashboard
 * 
 * @param {Object} props - Component props
 * @param {Array} props.alerts - Array of alert objects
 * @param {boolean} props.loading - Loading state
 */
const AlertsWidget = ({ alerts = [], loading = false }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  
  // Navigate to alerts page
  const handleViewAllAlerts = () => {
    navigate('/alerts');
  };
  
  // Navigate to alert detail
  const handleViewAlert = (alertId) => {
    navigate(`/alerts/${alertId}`);
  };
  
  // Get icon for alert type and severity
  const getAlertIcon = (type, severity) => {
    if (type === 'security') {
      switch (severity) {
        case 'critical':
          return <ErrorIcon className={classes.criticalIcon} />;
        case 'high':
          return <ErrorIcon className={classes.highIcon} />;
        case 'medium':
          return <WarningIcon className={classes.mediumIcon} />;
        case 'low':
          return <WarningIcon className={classes.lowIcon} />;
        default:
          return <InfoIcon className={classes.infoIcon} />;
      }
    } else if (type === 'system') {
      return <SystemUpdateIcon className={classes.systemIcon} />;
    } else {
      return <InfoIcon className={classes.infoIcon} />;
    }
  };
  
  // Calculate alert counts by type
  const securityAlerts = alerts.filter(alert => alert.type === 'security').length;
  const systemAlerts = alerts.filter(alert => alert.type === 'system').length;
  const infoAlerts = alerts.filter(alert => alert.type === 'info').length;
  
  // If loading, show loading spinner
  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress size={30} />
      </div>
    );
  }
  
  // If no alerts, show empty state
  if (!alerts.length) {
    return (
      <div className={classes.emptyState}>
        <InfoIcon />
        <Typography variant="body1">
          No alerts at this time
        </Typography>
        <Typography variant="body2">
          You're all caught up! New alerts will appear here.
        </Typography>
      </div>
    );
  }
  
  return (
    <div className={classes.root}>
      <div className={classes.chipContainer}>
        {securityAlerts > 0 && (
          <Chip 
            label={`${securityAlerts} Security`} 
            color="secondary" 
            size="small" 
            className={classes.chip} 
          />
        )}
        {systemAlerts > 0 && (
          <Chip 
            label={`${systemAlerts} System`} 
            color="default" 
            size="small" 
            className={classes.chip} 
          />
        )}
        {infoAlerts > 0 && (
          <Chip 
            label={`${infoAlerts} Info`} 
            color="primary" 
            size="small" 
            className={classes.chip} 
          />
        )}
      </div>
      
      <Divider />
      
      <div className={classes.listContainer}>
        <List disablePadding>
          {alerts.slice(0, 5).map((alert, index) => (
            <React.Fragment key={alert.id || index}>
              {index > 0 && <Divider variant="inset" component="li" />}
              <ListItem alignItems="flex-start" button onClick={() => handleViewAlert(alert.id)}>
                <ListItemIcon className={classes.iconContainer}>
                  {getAlertIcon(alert.type, alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {!alert.read && <FiberManualRecordIcon className={classes.unreadDot} />}
                      <Typography variant="body1" className={classes.alertTitle}>
                        {alert.title}
                      </Typography>
                    </div>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" className={classes.alertMessage}>
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" className={classes.alertTime}>
                        {formatDate(alert.createdAt)}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="navigate" onClick={() => handleViewAlert(alert.id)}>
                    <NavigateNextIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </div>
      
      {alerts.length > 5 && (
        <Box className={classes.viewAllButton}>
          <Button 
            variant="text" 
            color="primary" 
            onClick={handleViewAllAlerts}
          >
            View All Alerts ({alerts.length})
          </Button>
        </Box>
      )}
    </div>
  );
};

export default AlertsWidget;
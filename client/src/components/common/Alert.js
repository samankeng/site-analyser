import React, { useState, useEffect } from 'react';
import { Snackbar, IconButton, SnackbarContent } from '@mui/material';
import { makeStyles } from '@mui/styles';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const useStyles = makeStyles((theme) => ({
  success: {
    backgroundColor: theme.palette.success.main,
  },
  error: {
    backgroundColor: theme.palette.error.main,
  },
  info: {
    backgroundColor: theme.palette.info.main,
  },
  warning: {
    backgroundColor: theme.palette.warning.main,
  },
  icon: {
    fontSize: 20,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
  closeButton: {
    padding: theme.spacing(0.5),
  },
}));

/**
 * Alert component for displaying notifications
 * @param {Object} props - Component props
 * @param {string} props.message - Alert message
 * @param {string} props.type - Alert type (success, error, info, warning)
 * @param {boolean} props.open - Whether the alert is visible
 * @param {Function} props.onClose - Function to call when alert is closed
 * @param {number} props.autoHideDuration - Duration in ms before alert auto-hides
 */
const Alert = ({ 
  message, 
  type = 'info', 
  open, 
  onClose, 
  autoHideDuration = 6000 
}) => {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const getAlertIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={classes.icon} />;
      case 'error':
        return <ErrorIcon className={classes.icon} />;
      case 'warning':
        return <WarningIcon className={classes.icon} />;
      case 'info':
      default:
        return <InfoIcon className={classes.icon} />;
    }
  };

  const getAlertClass = () => {
    switch (type) {
      case 'success':
        return classes.success;
      case 'error':
        return classes.error;
      case 'warning':
        return classes.warning;
      case 'info':
      default:
        return classes.info;
    }
  };

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
    >
      <SnackbarContent
        className={getAlertClass()}
        message={
          <span className={classes.message}>
            {getAlertIcon()}
            {message}
          </span>
        }
        action={[
          <IconButton
            key="close"
            aria-label="close"
            color="inherit"
            className={classes.closeButton}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>,
        ]}
      />
    </Snackbar>
  );
};

export default Alert;
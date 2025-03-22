import React, { useState, useEffect } from 'react';
import { Snackbar, IconButton, SnackbarContent, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Styled components approach (emotion-based) instead of makeStyles
const StyledSnackbarContent = styled(SnackbarContent)(({ theme, type }) => ({
  backgroundColor:
    type === 'success'
      ? theme.palette.success.main
      : type === 'error'
      ? theme.palette.error.main
      : type === 'warning'
      ? theme.palette.warning.main
      : theme.palette.info.main,
}));

const StyledIcon = styled('span')(({ theme }) => ({
  fontSize: 20,
  marginRight: theme.spacing(1),
}));

const MessageWrapper = styled('span')({
  display: 'flex',
  alignItems: 'center',
});

const CloseButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
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
const Alert = ({ message, type = 'info', open, onClose, autoHideDuration = 6000 }) => {
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
        return <CheckCircleIcon sx={{ fontSize: 20, mr: 1 }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 20, mr: 1 }} />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 20, mr: 1 }} />;
      case 'info':
      default:
        return <InfoIcon sx={{ fontSize: 20, mr: 1 }} />;
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
      <StyledSnackbarContent
        type={type}
        message={
          <MessageWrapper>
            {getAlertIcon()}
            {message}
          </MessageWrapper>
        }
        action={
          <CloseButton aria-label="close" color="inherit" onClick={handleClose}>
            <CloseIcon />
          </CloseButton>
        }
      />
    </Snackbar>
  );
};

export default Alert;

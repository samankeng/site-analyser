import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Snackbar, 
  Alert, 
  AlertTitle,
  Slide 
} from '@mui/material';
import { selectAlerts } from '../../store/selectors/alertSelectors';

/**
 * Global Snackbar component for displaying application-wide alerts
 * Compatible with React 19 and MUI v6
 */
const GlobalSnackbar = () => {
  const dispatch = useDispatch();
  const alerts = useSelector(selectAlerts);
  const [open, setOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  // Handle alert queue
  useEffect(() => {
    if (alerts && alerts.length > 0 && !currentAlert) {
      // Get the latest alert
      setCurrentAlert(alerts[alerts.length - 1]);
      setOpen(true);
    } else if (alerts.length === 0) {
      setCurrentAlert(null);
      setOpen(false);
    }
  }, [alerts, currentAlert]);

  // Handle snackbar close
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
    
    // Remove alert after animation completes
    setTimeout(() => {
      if (currentAlert && currentAlert.id) {
        // Dispatch action to remove alert from store
        dispatch({
          type: 'REMOVE_ALERT',
          payload: currentAlert.id
        });
        setCurrentAlert(null);
      }
    }, 300);
  };

  // If no current alert, don't render anything
  if (!currentAlert) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={currentAlert?.duration || 6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionComponent={Slide}
    >
      <Alert
        onClose={handleClose}
        severity={currentAlert?.severity || 'info'}
        variant={currentAlert?.variant || 'filled'}
        sx={{
          width: '100%',
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        {currentAlert?.title && (
          <AlertTitle>{currentAlert.title}</AlertTitle>
        )}
        {currentAlert?.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;

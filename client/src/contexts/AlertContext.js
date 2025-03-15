import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Alert from '../components/common/Alert';

// Initial state
const initialState = {
  alerts: []
};

// Create context
const AlertContext = createContext(initialState);

// Reducer function
const alertReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ALERTS':
      return {
        ...state,
        alerts: action.payload
      };
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [action.payload, ...state.alerts]
      };
    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload)
      };
    case 'CLEAR_ALERTS':
      return {
        ...state,
        alerts: []
      };
    default:
      return state;
  }
};

// Provider component
export const AlertProvider = ({ children }) => {
  const [state, dispatch] = useReducer(alertReducer, initialState);
  const reduxAlerts = useSelector(state => state.alert);
  
  // Current visible alert state
  const [currentAlert, setCurrentAlert] = React.useState(null);
  
  // Sync context state with Redux alert state
  useEffect(() => {
    if (reduxAlerts && reduxAlerts.alerts) {
      dispatch({
        type: 'SET_ALERTS',
        payload: reduxAlerts.alerts
      });
    }
  }, [reduxAlerts]);
  
  // Show the most recent alert
  useEffect(() => {
    if (state.alerts.length > 0 && !currentAlert) {
      // Find the first alert that hasn't been shown
      const nextAlert = state.alerts.find(alert => !alert.shown);
      if (nextAlert) {
        setCurrentAlert({ ...nextAlert, shown: true });
        
        // Mark as shown
        const updatedAlerts = state.alerts.map(alert => 
          alert.id === nextAlert.id ? { ...alert, shown: true } : alert
        );
        dispatch({
          type: 'SET_ALERTS',
          payload: updatedAlerts
        });
      }
    }
  }, [state.alerts, currentAlert]);
  
  // Function to add a new alert
  const addAlert = (message, type = 'info', timeout = 6000) => {
    const id = Date.now().toString();
    const newAlert = {
      id,
      message,
      type,
      timestamp: new Date(),
      shown: false
    };
    
    dispatch({
      type: 'ADD_ALERT',
      payload: newAlert
    });
    
    // Auto-remove alert after timeout
    if (timeout) {
      setTimeout(() => {
        removeAlert(id);
      }, timeout);
    }
    
    return id;
  };
  
  // Function to remove an alert
  const removeAlert = (id) => {
    dispatch({
      type: 'REMOVE_ALERT',
      payload: id
    });
    
    // If we're removing the current alert, clear it
    if (currentAlert && currentAlert.id === id) {
      setCurrentAlert(null);
    }
  };
  
  // Function to clear all alerts
  const clearAlerts = () => {
    dispatch({
      type: 'CLEAR_ALERTS'
    });
    setCurrentAlert(null);
  };
  
  // Handle alert close
  const handleAlertClose = () => {
    if (currentAlert) {
      removeAlert(currentAlert.id);
    }
  };
  
  // Expose the context value
  const value = {
    alerts: state.alerts,
    addAlert,
    removeAlert,
    clearAlerts
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {currentAlert && (
        <Alert
          message={currentAlert.message}
          type={currentAlert.type}
          open={Boolean(currentAlert)}
          onClose={handleAlertClose}
        />
      )}
    </AlertContext.Provider>
  );
};

// Custom hook to use the alert context
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default AlertContext;
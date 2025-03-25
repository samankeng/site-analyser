// AlertContext.js
import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Alert from '../components/common/Alert';

// Initial state
const initialState = {
  alerts: [],
};

// Create context
const AlertContext = createContext({
  alerts: [],
  addAlert: () => {}, // Provide a default no-op function
  removeAlert: () => {},
  clearAlerts: () => {},
});

// Reducer function
const alertReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ALERTS':
      return {
        ...state,
        alerts: action.payload,
      };
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [action.payload, ...state.alerts],
      };
    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload),
      };
    case 'CLEAR_ALERTS':
      return {
        ...state,
        alerts: [],
      };
    default:
      return state;
  }
};

// Provider component
export const AlertProvider = ({ children }) => {
  const reduxDispatch = useDispatch();
  const [state, dispatch] = useReducer(alertReducer, initialState);
  const reduxAlerts = useSelector(state => {
    console.log('Redux state in AlertContext:', state);
    return state.alert?.alerts || [];
  });

  // Current visible alert state
  const [currentAlert, setCurrentAlert] = useState(null);

  // Sync context state with Redux alert state
  useEffect(() => {
    dispatch({
      type: 'SET_ALERTS',
      payload: reduxAlerts,
    });
  }, [reduxAlerts]);

  // Function to add a new alert
  const addAlert = (message, type = 'info', timeout = 6000) => {
    const id = Date.now().toString();
    const newAlert = {
      id,
      message,
      type,
      timestamp: new Date(),
      shown: false,
    };

    // Dispatch to Redux store
    reduxDispatch({
      type: 'ADD_ALERT',
      payload: newAlert,
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
  const removeAlert = id => {
    reduxDispatch({
      type: 'REMOVE_ALERT',
      payload: id,
    });

    // If we're removing the current alert, clear it
    if (currentAlert && currentAlert.id === id) {
      setCurrentAlert(null);
    }
  };

  // Function to clear all alerts
  const clearAlerts = () => {
    reduxDispatch({
      type: 'CLEAR_ALERTS',
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
    clearAlerts,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {currentAlert && (
        <Alert
          message={currentAlert.message}
          severity={currentAlert.type}
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

export const addAlert = alertData => ({
  type: 'ADD_ALERT',
  payload: {
    ...alertData,
    id: Date.now().toString(),
    read: false,
    timestamp: new Date(),
  },
});

export const removeAlert = alertId => ({
  type: 'REMOVE_ALERT',
  payload: alertId,
});

export default AlertContext;

// src/store/reducers/alertReducer.js
const initialState = {
  alerts: [],
};

const alertReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [
          {
            id: Date.now().toString(),
            read: false,
            timestamp: new Date(),
            ...action.payload
          },
          ...state.alerts
        ],
      };
    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload),
      };
    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map(alert => 
          alert.id === action.payload 
            ? { ...alert, read: true } 
            : alert
        ),
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

export default alertReducer;

// Alert Action Creators
export const addAlert = (alertData) => ({
  type: 'ADD_ALERT',
  payload: alertData,
});

export const removeAlert = (alertId) => ({
  type: 'REMOVE_ALERT',
  payload: alertId,
});

export const markAlertRead = (alertId) => ({
  type: 'MARK_ALERT_READ',
  payload: alertId,
});

export const clearAlerts = () => ({
  type: 'CLEAR_ALERTS',
});
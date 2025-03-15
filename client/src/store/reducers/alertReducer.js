import {
  SET_ALERT,
  REMOVE_ALERT,
  CLEAR_ALL_ALERTS
} from '../actions/types';

const initialState = [];

const alertReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_ALERT:
      return [
        ...state, 
        {
          id: action.payload.id,
          msg: action.payload.msg,
          alertType: action.payload.alertType
        }
      ];
    
    case REMOVE_ALERT:
      return state.filter(alert => alert.id !== action.payload);
    
    case CLEAR_ALL_ALERTS:
      return [];
    
    default:
      return state;
  }
};

export default alertReducer;

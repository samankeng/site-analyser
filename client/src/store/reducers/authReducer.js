import {
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_ERROR,
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_ERROR,
  LOGOUT,
  USER_LOADED,
  AUTH_ERROR,
  UPDATE_PROFILE_REQUEST,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PROFILE_ERROR,
} from '../actions/types';

const initialState = {
  token: localStorage.getItem('token'),
  // Change null to false for initial authentication state
  isAuthenticated: false,
  // Set loading to true initially to handle initial auth check
  loading: true,
  user: null,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
      };

    case REGISTER_REQUEST:
    case LOGIN_REQUEST:
    case UPDATE_PROFILE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case REGISTER_SUCCESS:
    case LOGIN_SUCCESS:
      // Store token in localStorage
      if (action.payload && action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }

      return {
        ...state,
        token: action.payload.token || null,
        isAuthenticated: true,
        loading: false,
        user: action.payload?.user || action.payload,
      };

    case UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload,
        error: null,
      };

    case REGISTER_ERROR:
    case LOGIN_ERROR:
    case AUTH_ERROR:
      // Remove token from localStorage
      localStorage.removeItem('token');

      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload,
      };

    case UPDATE_PROFILE_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case LOGOUT:
      // Remove token from localStorage
      localStorage.removeItem('token');

      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: null,
      };

    default:
      return state;
  }
};

export default authReducer;

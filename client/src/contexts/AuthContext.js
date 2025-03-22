import { createContext, useContext, useReducer, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
};

// Create context
const AuthContext = createContext(initialState);

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const reduxAuthState = useSelector(state => state.auth);

  // Sync context state with Redux state
  useEffect(() => {
    if (reduxAuthState.isAuthenticated && reduxAuthState.user) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: reduxAuthState.user,
      });
    } else if (!reduxAuthState.isAuthenticated && reduxAuthState.loading === false) {
      dispatch({ type: 'LOGOUT' });
    }

    dispatch({
      type: 'SET_LOADING',
      payload: reduxAuthState.loading,
    });
  }, [reduxAuthState]);

  // Expose the context value
  const value = {
    ...state,
    dispatch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

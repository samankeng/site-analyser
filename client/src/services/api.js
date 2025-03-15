import axios from 'axios';
import { getStoredToken, removeToken } from '../utils/storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add token to request headers
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If we're not trying to refresh the token, log the user out
      if (originalRequest.url !== '/auth/refresh-token') {
        removeToken();
        window.location.href = '/login';
      }
    }
    
    // Handle forbidden errors (403)
    if (error.response && error.response.status === 403) {
      // Redirect to unauthorized page or show permission error
      console.error('Permission denied:', error.response.data);
    }
    
    // Handle server errors (500)
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;
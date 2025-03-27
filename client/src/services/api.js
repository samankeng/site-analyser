import axios from 'axios';
import { getStoredToken, removeToken } from '../utils/storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials to properly handle CORS with credentials
  withCredentials: true,
  // Add timeout to prevent infinite loading states
  timeout: 30000, // 30 seconds
});

// Request interceptor
api.interceptors.request.use(
  config => {
    // Add token to request headers
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to prevent caching issues (optional)

    if (config.method.toLowerCase() === 'get') {
      // Only add timestamp to GET requests to prevent caching
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Log outgoing requests for debugging
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config);
    console.log('Full request body:', config.data);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => {
    // Log successful responses for debugging
    console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    const originalRequest = error.config;

    // Add detailed logging for debugging
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: error.response?.data,
      error: error.message,
    });

    // Handle no response from server (network errors)
    if (!error.response) {
      console.error('Network error: No response from server');

      // Check for CORS errors specifically
      if (error.message.includes('Network Error')) {
        console.warn('This may be a CORS issue. Check server CORS configuration.');
      }

      // Could dispatch to a global error state in your app
      return Promise.reject(new Error('Network error: Unable to connect to server'));
    }

    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If we're not trying to refresh the token, log the user out
      if (originalRequest.url !== '/auth/refresh-token') {
        console.warn('Authentication error: Redirecting to login');
        removeToken();
        window.location.href = '/login';
      }
    }

    // Handle forbidden errors (403)
    if (error.response && error.response.status === 403) {
      // Redirect to unauthorized page or show permission error
      console.error('Permission denied:', error.response.data);
      // Could redirect to a dedicated 403 page
      // window.location.href = '/forbidden';
    }

    // Handle not found errors (404)
    if (error.response && error.response.status === 404) {
      console.error('Resource not found:', originalRequest.url);
    }

    // Handle server errors (500)
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
      // Could redirect to a server error page for 5xx errors
      // window.location.href = '/server-error';
    }

    // Add response data to the error for easier debugging
    if (error.response && error.response.data) {
      error.message = `${error.message}: ${JSON.stringify(error.response.data)}`;
    }

    return Promise.reject(error);
  }
);

// Create a test function to verify API connectivity
api.testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('API connection test successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Helper methods for common API calls
api.fetchWithCachedReturn = async (url, cacheTime = 5 * 60 * 1000) => {
  const cacheKey = `api_cache_${url}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    if (Date.now() - timestamp < cacheTime) {
      return data;
    }
  }

  const response = await api.get(url);
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data: response.data,
      timestamp: Date.now(),
    })
  );

  return response.data;
};

export default api;

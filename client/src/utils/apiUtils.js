import axios from 'axios';
import { getStoredToken, removeToken } from './storage';

/**
 * Create an axios instance with default configuration
 * @param {Object} [config] - Additional axios configuration
 * @returns {axios.AxiosInstance} - Configured axios instance
 */
export const createApiClient = (config = {}) => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    },
    ...config
  });

  // Request interceptor
  instance.interceptors.request.use(
    (requestConfig) => {
      const token = getStoredToken();
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      return requestConfig;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Handle unauthorized errors (401)
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Prevent infinite loops
        originalRequest._retry = true;

        try {
          // Attempt to refresh token or redirect to login
          removeToken();
          window.location.href = '/login';
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Handle API errors consistently
 * @param {Error} error - Axios error object
 * @returns {Object} - Standardized error response
 */
export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    return {
      status: error.response.status,
      message: error.response.data.message || 'An error occurred',
      errors: error.response.data.errors || []
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      status: 0,
      message: 'No response received from server',
      errors: []
    };
  } else {
    // Something happened in setting up the request
    return {
      status: 500,
      message: error.message || 'An unexpected error occurred',
      errors: []
    };
  }
};

/**
 * Retry an API call with exponential backoff
 * @param {Function} apiCall - Function that returns a promise
 * @param {Object} [options] - Retry configuration
 * @returns {Promise} - Result of the API call
 */
export const retryApiCall = async (
  apiCall, 
  {
    maxRetries = 3,
    baseDelay = 1000,
    exponentialFactor = 2
  } = {}
) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      retries++;

      // If it's the last retry, throw the error
      if (retries >= maxRetries) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(exponentialFactor, retries);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Cancel ongoing API requests
 * @returns {Function} - Cancel token source
 */
export const createCancelToken = () => {
  const source = axios.CancelToken.source();
  return source;
};

/**
 * Upload file to server
 * @param {string} url - Upload endpoint
 * @param {File} file - File to upload
 * @param {Object} [options] - Additional upload options
 * @returns {Promise} - Upload progress and result
 */
export const uploadFile = (url, file, options = {}) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    // Add token to request
    const token = getStoredToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        options.onProgress?.(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));

    xhr.send(formData);
  });
};

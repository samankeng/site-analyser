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
    timeout: 15000, // Increased timeout for improved reliability with React 19's concurrent features
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config.headers,
    },
    ...config,
  });

  // Request interceptor
  instance.interceptors.request.use(
    requestConfig => {
      const token = getStoredToken();
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      // Add request id for better tracking in React 19 development tools
      requestConfig.headers['X-Request-ID'] = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
      return requestConfig;
    },
    error => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      // Handle unauthorized errors (401)
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Prevent infinite loops
        originalRequest._retry = true;

        try {
          // Attempt to refresh token or redirect to login
          removeToken();
          // Use history API if available for better integration with React Router v6+
          if (window.history && window.history.pushState) {
            window.history.pushState({}, '', '/login');
            // Dispatch a navigation event for React Router to detect
            window.dispatchEvent(new PopStateEvent('popstate'));
          } else {
            window.location.href = '/login';
          }
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
 * Handle API errors consistently with MUI v6 alert structure
 * @param {Error} error - Axios error object
 * @returns {Object} - Standardized error response compatible with MUI v6 alerts
 */
export const handleApiError = error => {
  if (error.response) {
    // The request was made and the server responded with a status code
    return {
      status: error.response.status,
      message: error.response.data.message || 'An error occurred',
      errors: error.response.data.errors || [],
      severity: 'error', // MUI v6 uses severity instead of variant
      variant: 'filled', // MUI v6 supports filled, outlined, and standard variants
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      status: 0,
      message: 'No response received from server',
      errors: [],
      severity: 'warning',
      variant: 'filled',
    };
  } else {
    // Something happened in setting up the request
    return {
      status: 500,
      message: error.message || 'An unexpected error occurred',
      errors: [],
      severity: 'error',
      variant: 'filled',
    };
  }
};

/**
 * Retry an API call with exponential backoff
 * Enhanced for React 19's concurrent rendering and MUI v6
 * @param {Function} apiCall - Function that returns a promise
 * @param {Object} [options] - Retry configuration
 * @returns {Promise} - Result of the API call
 */
export const retryApiCall = async (
  apiCall,
  {
    maxRetries = 3,
    baseDelay = 1000,
    exponentialFactor = 2,
    onRetry = null, // Callback for retry attempts
    abortSignal = null, // Support for AbortController
  } = {}
) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Support for AbortController
      if (abortSignal && abortSignal.aborted) {
        throw new Error('Request aborted');
      }

      return await apiCall();
    } catch (error) {
      // Check if request was aborted
      if (abortSignal && abortSignal.aborted) {
        throw error;
      }

      retries++;

      // Callback for retry attempts
      if (onRetry) {
        onRetry(retries, maxRetries, error);
      }

      // If it's the last retry, throw the error
      if (retries >= maxRetries) {
        throw error;
      }

      // Calculate exponential backoff delay with jitter for better performance
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 jitter factor
      const delay = baseDelay * Math.pow(exponentialFactor, retries) * jitter;

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Create an AbortController to cancel requests
 * Using modern AbortController API instead of axios-specific CancelToken
 * @returns {AbortController} - AbortController instance
 */
export const createAbortController = () => {
  return new AbortController();
};

/**
 * Upload file to server with progress tracking for MUI v6 LinearProgress
 * @param {string} url - Upload endpoint
 * @param {File} file - File to upload
 * @param {Object} [options] - Additional upload options
 * @returns {Promise} - Upload progress and result
 */
export const uploadFile = (url, file, options = {}) => {
  const abortController = options.abortController || new AbortController();

  return new Promise((resolve, reject) => {
    const formData = new FormData();

    // Add file with custom filename if provided
    formData.append('file', file, options.fileName || file.name);

    // Add additional form data if provided
    if (options.additionalData) {
      Object.entries(options.additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    // Add token to request
    const token = getStoredToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Add custom headers if provided
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    // Track upload progress
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        options.onProgress?.(percentComplete, {
          loaded: event.loaded,
          total: event.total,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve({ success: true, message: 'Upload successful' });
        }
      } else {
        let errorMessage;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          errorMessage = errorResponse.message || `Upload failed with status ${xhr.status}`;
        } catch (e) {
          errorMessage = `Upload failed with status ${xhr.status}`;
        }
        reject(new Error(errorMessage));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    // Handle abort
    xhr.onabort = () => reject(new Error('Upload canceled'));
    abortController.signal.addEventListener('abort', () => xhr.abort());

    xhr.send(formData);
  });
};

/**
 * Download file from server with progress tracking
 * New utility for React 19 and MUI v6 integration
 * @param {string} url - Download endpoint
 * @param {Object} [options] - Additional download options
 * @returns {Promise} - Download progress and result
 */
export const downloadFile = (url, options = {}) => {
  const abortController = options.abortController || new AbortController();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    // Add token to request
    const token = getStoredToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Add custom headers if provided
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    // Track download progress
    xhr.onprogress = event => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        options.onProgress?.(percentComplete, {
          loaded: event.loaded,
          total: event.total,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const contentDisposition = xhr.getResponseHeader('Content-Disposition');
        let filename = options.filename || 'downloaded_file';

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }

        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);

        // Auto download if requested
        if (options.autoDownload !== false) {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }

        resolve({
          blob,
          url,
          filename,
          contentType: xhr.getResponseHeader('Content-Type'),
        });
      } else {
        reject(new Error(`Download failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during download'));
    xhr.ontimeout = () => reject(new Error('Download timed out'));

    // Handle abort
    xhr.onabort = () => reject(new Error('Download canceled'));
    abortController.signal.addEventListener('abort', () => xhr.abort());

    xhr.send();
  });
};

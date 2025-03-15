/**
 * Storage utility functions for handling local storage operations
 */

// Token storage key
const TOKEN_KEY = 'site_analyser_token';
const USER_KEY = 'site_analyser_user';
const THEME_KEY = 'site_analyser_theme';

/**
 * Store authentication token in local storage
 * @param {string} token - JWT token
 */
export const storeToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Retrieve token from local storage
 * @returns {string|null} - JWT token or null if not found
 */
export const getStoredToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove token from local storage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Store user data in local storage
 * @param {Object} user - User data object
 */
export const storeUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Retrieve user data from local storage
 * @returns {Object|null} - User data object or null if not found
 */
export const getStoredUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data from storage', error);
      return null;
    }
  }
  
  return null;
};

/**
 * Remove user data from local storage
 */
export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

/**
 * Store theme preference in local storage
 * @param {string} theme - Theme preference ('light', 'dark', 'system')
 */
export const storeTheme = (theme) => {
  if (theme) {
    localStorage.setItem(THEME_KEY, theme);
  }
};

/**
 * Retrieve theme preference from local storage
 * @returns {string|null} - Theme preference or null if not found
 */
export const getStoredTheme = () => {
  return localStorage.getItem(THEME_KEY) || 'system';
};

/**
 * Clear all application storage data
 */
export const clearStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Keep theme preference
};

/**
 * Store data with expiration
 * @param {string} key - Storage key
 * @param {any} value - Data to store
 * @param {number} expirationMinutes - Expiration time in minutes
 */
export const storeWithExpiration = (key, value, expirationMinutes) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);
  
  const data = {
    value,
    expiresAt: expiresAt.toISOString()
  };
  
  localStorage.setItem(key, JSON.stringify(data));
};

/**
 * Get data with expiration check
 * @param {string} key - Storage key
 * @returns {any|null} - Stored data or null if expired/not found
 */
export const getWithExpiration = (key) => {
  const dataString = localStorage.getItem(key);
  
  if (!dataString) {
    return null;
  }
  
  try {
    const data = JSON.parse(dataString);
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);
    
    if (now >= expiresAt) {
      // Data has expired
      localStorage.removeItem(key);
      return null;
    }
    
    return data.value;
  } catch (error) {
    console.error('Error parsing stored data', error);
    return null;
  }
};
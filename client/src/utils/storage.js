/**
 * Enhanced storage utility functions for React 19 and MUI v6
 */

// Application namespace for storage keys
const APP_NAMESPACE = 'site_analyser';

// Storage keys with namespace to prevent conflicts
const TOKEN_KEY = `${APP_NAMESPACE}_token`;
const USER_KEY = `${APP_NAMESPACE}_user`;
const THEME_KEY = `${APP_NAMESPACE}_theme`;
const SETTINGS_KEY = `${APP_NAMESPACE}_settings`;
const COLOR_MODE_KEY = `${APP_NAMESPACE}_color_mode`; // For MUI v6 color mode

/**
 * Check if storage is available
 * @param {string} type - Storage type ('localStorage' or 'sessionStorage')
 * @returns {boolean} - Whether storage is available
 */
const isStorageAvailable = type => {
  try {
    const storage = window[type];
    const testKey = `${APP_NAMESPACE}_test`;
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Determine available storage methods
const hasLocalStorage = isStorageAvailable('localStorage');
const hasSessionStorage = isStorageAvailable('sessionStorage');

/**
 * Fallback storage for environments without localStorage
 */
const memoryStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.get(key) || null;
  },
  setItem(key, value) {
    this.store.set(key, value);
  },
  removeItem(key) {
    this.store.delete(key);
  },
  clear() {
    this.store.clear();
  },
};

/**
 * Get storage instance based on availability
 * @param {boolean} persistent - Whether to use persistent storage
 * @returns {Storage} - Storage instance
 */
const getStorage = (persistent = true) => {
  if (persistent && hasLocalStorage) {
    return window.localStorage;
  } else if (!persistent && hasSessionStorage) {
    return window.sessionStorage;
  }

  console.warn('Using in-memory storage fallback - data will not persist');
  return memoryStorage;
};

/**
 * Store authentication token
 * @param {string} token - JWT token
 * @param {boolean} remember - Whether to persist token across sessions
 */
export const storeToken = (token, remember = true) => {
  if (token) {
    //localStorage.setItem('token', token);
    getStorage(remember).setItem(TOKEN_KEY, token);
  }
};

/**
 * Retrieve token from storage
 * @returns {string|null} - JWT token or null if not found
 */
export const getStoredToken = () => {
  // Try local storage first, then session storage
  //return localStorage.getItem('token');
  return getStorage(true).getItem(TOKEN_KEY) || getStorage(false).getItem(TOKEN_KEY);
};

/**
 * Remove token from all storage locations
 */
export const removeToken = () => {
  //localStorage.removeItem('token');
  getStorage(true).removeItem(TOKEN_KEY);
  getStorage(false).removeItem(TOKEN_KEY);
};

/**
 * Store user data
 * @param {Object} user - User data object
 * @param {boolean} remember - Whether to persist user data across sessions
 */
export const storeUser = (user, remember = true) => {
  if (user) {
    getStorage(remember).setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Retrieve user data from storage
 * @returns {Object|null} - User data object or null if not found
 */
export const getStoredUser = () => {
  // Try local storage first, then session storage
  const userData = getStorage(true).getItem(USER_KEY) || getStorage(false).getItem(USER_KEY);

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
 * Remove user data from all storage locations
 */
export const removeUser = () => {
  getStorage(true).removeItem(USER_KEY);
  getStorage(false).removeItem(USER_KEY);
};

/**
 * Store theme preference for MUI v6
 * @param {string} theme - Theme preference ('light', 'dark', 'system')
 */
export const storeTheme = theme => {
  if (theme) {
    getStorage(true).setItem(THEME_KEY, theme);
  }
};

/**
 * Retrieve theme preference from storage
 * @returns {string} - Theme preference
 */
export const getStoredTheme = () => {
  return getStorage(true).getItem(THEME_KEY) || 'system';
};

/**
 * Store MUI v6 color mode
 * @param {string} mode - Color mode ('light' or 'dark')
 */
export const storeColorMode = mode => {
  if (mode && (mode === 'light' || mode === 'dark')) {
    getStorage(true).setItem(COLOR_MODE_KEY, mode);
  }
};

/**
 * Retrieve MUI v6 color mode from storage
 * @returns {string} - Color mode ('light' or 'dark')
 */
export const getStoredColorMode = () => {
  return getStorage(true).getItem(COLOR_MODE_KEY) || 'light';
};

/**
 * Store application settings
 * @param {Object} settings - Settings object
 */
export const storeSettings = settings => {
  if (settings) {
    getStorage(true).setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};

/**
 * Retrieve application settings from storage
 * @returns {Object} - Settings object or default settings
 */
export const getStoredSettings = () => {
  const settingsData = getStorage(true).getItem(SETTINGS_KEY);

  const defaultSettings = {
    notifications: true,
    compactView: false,
    autoRefresh: false,
    refreshInterval: 5,
    defaultView: 'dashboard',
  };

  if (settingsData) {
    try {
      return { ...defaultSettings, ...JSON.parse(settingsData) };
    } catch (error) {
      console.error('Error parsing settings from storage', error);
      return defaultSettings;
    }
  }

  return defaultSettings;
};

/**
 * Reset settings to defaults
 */
export const resetSettings = () => {
  getStorage(true).removeItem(SETTINGS_KEY);
};

/**
 * Clear all application storage data
 * @param {boolean} keepTheme - Whether to keep theme preferences
 */
export const clearStorage = (keepTheme = true) => {
  const themePreference = keepTheme ? getStoredTheme() : null;
  const colorMode = keepTheme ? getStoredColorMode() : null;

  // Clear from all storage types
  [getStorage(true), getStorage(false)].forEach(storage => {
    const keys = [TOKEN_KEY, USER_KEY, SETTINGS_KEY];
    if (!keepTheme) {
      keys.push(THEME_KEY, COLOR_MODE_KEY);
    }

    keys.forEach(key => storage.removeItem(key));
  });

  // Restore theme preferences if needed
  if (keepTheme) {
    if (themePreference) storeTheme(themePreference);
    if (colorMode) storeColorMode(colorMode);
  }
};

/**
 * Store data with expiration
 * @param {string} key - Storage key
 * @param {any} value - Data to store
 * @param {number} expirationMinutes - Expiration time in minutes
 * @param {boolean} persistent - Whether to use persistent storage
 */
export const storeWithExpiration = (key, value, expirationMinutes, persistent = true) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);

  const data = {
    value,
    expiresAt: expiresAt.toISOString(),
  };

  getStorage(persistent).setItem(`${APP_NAMESPACE}_${key}`, JSON.stringify(data));
};

/**
 * Get data with expiration check
 * @param {string} key - Storage key
 * @returns {any|null} - Stored data or null if expired/not found
 */
export const getWithExpiration = key => {
  const fullKey = `${APP_NAMESPACE}_${key}`;

  // Try both storage types
  const dataString = getStorage(true).getItem(fullKey) || getStorage(false).getItem(fullKey);

  if (!dataString) {
    return null;
  }

  try {
    const data = JSON.parse(dataString);
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);

    if (now >= expiresAt) {
      // Data has expired
      getStorage(true).removeItem(fullKey);
      getStorage(false).removeItem(fullKey);
      return null;
    }

    return data.value;
  } catch (error) {
    console.error('Error parsing stored data', error);
    return null;
  }
};

/**
 * Get time remaining until expiration
 * @param {string} key - Storage key
 * @returns {number|null} - Minutes remaining or null if not found/expired
 */
export const getExpirationRemaining = key => {
  const fullKey = `${APP_NAMESPACE}_${key}`;

  // Try both storage types
  const dataString = getStorage(true).getItem(fullKey) || getStorage(false).getItem(fullKey);

  if (!dataString) {
    return null;
  }

  try {
    const data = JSON.parse(dataString);
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);

    if (now >= expiresAt) {
      return 0;
    }

    // Return minutes remaining
    return Math.floor((expiresAt - now) / (60 * 1000));
  } catch (error) {
    console.error('Error calculating expiration time', error);
    return null;
  }
};

/**
 * Create storage hook factory for React 19
 * This will be available for components that need it
 */
export const createStorageHook = () => {
  // This function returns a hook that can be used in React components
  // Implementation would depend on whether you're using Redux or React context
  // and would be defined elsewhere

  // Example usage in a component:
  // const { getItem, setItem } = useStorage();
  // setItem('myKey', 'myValue');
  // const value = getItem('myKey');

  console.info('Storage hooks available for React 19 components');
};

/**
 * Formatter utility functions
 */

/**
 * Format date to localized string
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date without time
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string (without time)
 */
export const formatDateOnly = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: undefined,
    minute: undefined
  });
};

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted number string
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '';
  
  try {
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  } catch (error) {
    console.error('Error formatting number:', error);
    return '';
  }
};

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '';
  
  try {
    return Number(value).toLocaleString('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '';
  }
};

/**
 * Format duration in seconds to human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

/**
 * Format security severity level with consistent color
 * @param {string} severity - Severity level (Critical, High, Medium, Low, Info)
 * @returns {object} - Severity object with label and color
 */
export const formatSeverity = (severity) => {
  const severityMap = {
    critical: { label: 'Critical', color: '#d32f2f' },
    high: { label: 'High', color: '#f57c00' },
    medium: { label: 'Medium', color: '#ffc107' },
    low: { label: 'Low', color: '#2196f3' },
    info: { label: 'Info', color: '#4caf50' }
  };
  
  const normalizedSeverity = (severity || '').toLowerCase();
  return severityMap[normalizedSeverity] || { label: severity, color: '#757575' };
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Format URL for display (remove protocol, trailing slash)
 * @param {string} url - URL to format
 * @returns {string} - Formatted URL
 */
export const formatUrl = (url) => {
  if (!url) return '';
  
  try {
    // Remove protocol (http://, https://)
    let formatted = url.replace(/^(https?:\/\/)/, '');
    
    // Remove trailing slash
    formatted = formatted.replace(/\/$/, '');
    
    return formatted;
  } catch (error) {
    return url;
  }
};

/**
 * Get domain and path from URL
 * @param {string} url - URL to process
 * @returns {object} - Object with domain and path
 */
export const getDomainAndPath = (url) => {
  if (!url) return { domain: '', path: '' };
  
  try {
    const parsedUrl = new URL(url);
    return {
      domain: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search + parsedUrl.hash
    };
  } catch (error) {
    return { domain: url, path: '' };
  }
};
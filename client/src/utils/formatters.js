/**
 * Enhanced formatter utility functions for React 19 and MUI v6
 */

/**
 * Format date to localized string
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @param {string} [locale] - Locale for formatting
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options = {}, locale = 'en-US') => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided:', date);
      return '';
    }

    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date without time
 * @param {string|Date} date - Date to format
 * @param {string} [locale] - Locale for formatting
 * @returns {string} - Formatted date string (without time)
 */
export const formatDateOnly = (date, locale = 'en-US') => {
  return formatDate(
    date,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: undefined,
      minute: undefined,
    },
    locale
  );
};

/**
 * Format date for MUI v6 date components
 * @param {string|Date} date - Date to format
 * @returns {string} - ISO formatted date string
 */
export const formatDateForMUI = date => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for MUI:', error);
    return '';
  }
};

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @param {string} [locale] - Locale for formatting
 * @returns {string} - Formatted number string
 */
export const formatNumber = (num, decimals = 0, locale = 'en-US') => {
  if (num === null || num === undefined) return '';

  try {
    return Number(num).toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
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
 * @param {boolean} useIEC - Use IEC standard (KiB, MiB) instead of SI (KB, MB)
 * @returns {string} - Formatted file size string
 */
export const formatFileSize = (bytes, decimals = 2, useIEC = false) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '';

  const k = useIEC ? 1024 : 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = useIEC
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @param {string} [locale] - Locale for formatting
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1, locale = 'en-US') => {
  if (value === null || value === undefined) return '';

  try {
    return Number(value / 100).toLocaleString(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '';
  }
};

/**
 * Format duration in seconds to human-readable format
 * @param {number} seconds - Duration in seconds
 * @param {boolean} compact - Use compact format
 * @returns {string} - Formatted duration string
 */
export const formatDuration = (seconds, compact = false) => {
  if (seconds === null || seconds === undefined) return '';

  const totalSeconds = Math.abs(Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (compact) {
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);
    return parts.join(' ');
  }

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(', ');
};

/**
 * Format security severity level with MUI v6 color system
 * @param {string} severity - Severity level (Critical, High, Medium, Low, Info)
 * @returns {object} - Severity object with label, color, and MUI props
 */
export const formatSeverity = severity => {
  // MUI v6 uses a new color system
  const severityMap = {
    critical: {
      label: 'Critical',
      color: 'error',
      bgcolor: 'error.lighter',
      textColor: 'error.darker',
      icon: 'ErrorOutline',
      severity: 'error', // For MUI Alert component
    },
    high: {
      label: 'High',
      color: 'warning',
      bgcolor: 'warning.lighter',
      textColor: 'warning.darker',
      icon: 'WarningAmberOutlined',
      severity: 'warning',
    },
    medium: {
      label: 'Medium',
      color: 'warning',
      bgcolor: 'warning.lighter',
      textColor: 'warning.darker',
      icon: 'InfoOutlined',
      severity: 'warning',
    },
    low: {
      label: 'Low',
      color: 'info',
      bgcolor: 'info.lighter',
      textColor: 'info.darker',
      icon: 'InfoOutlined',
      severity: 'info',
    },
    info: {
      label: 'Info',
      color: 'success',
      bgcolor: 'success.lighter',
      textColor: 'success.darker',
      icon: 'CheckCircleOutline',
      severity: 'success',
    },
  };

  const normalizedSeverity = (severity || '').toLowerCase();
  return (
    severityMap[normalizedSeverity] || {
      label: severity || 'Unknown',
      color: 'grey',
      bgcolor: 'grey.100',
      textColor: 'text.secondary',
      icon: 'HelpOutline',
      severity: 'info',
    }
  );
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @param {string} [ellipsis='...'] - Ellipsis string
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100, ellipsis = '...') => {
  if (!text) return '';

  const string = String(text);

  if (string.length <= maxLength) {
    return string;
  }

  return string.substring(0, maxLength) + ellipsis;
};

/**
 * Format URL for display (remove protocol, trailing slash)
 * @param {string} url - URL to format
 * @param {boolean} keepProtocol - Whether to keep the protocol
 * @returns {string} - Formatted URL
 */
export const formatUrl = (url, keepProtocol = false) => {
  if (!url) return '';

  try {
    let formatted = url;

    // Add protocol if missing (for URL parsing)
    if (!formatted.match(/^[a-zA-Z]+:\/\//)) {
      formatted = 'https://' + formatted;
    }

    const urlObject = new URL(formatted);

    // Format the URL
    if (!keepProtocol) {
      formatted = formatted.replace(/^(https?:\/\/)/, '');
    }

    // Remove trailing slash
    formatted = formatted.replace(/\/$/, '');

    return formatted;
  } catch (error) {
    // Return original URL if parsing fails
    return url;
  }
};

/**
 * Get domain and path from URL
 * @param {string} url - URL to process
 * @returns {object} - Object with domain and path
 */
export const getDomainAndPath = url => {
  if (!url) return { domain: '', path: '' };

  try {
    // Add protocol if missing (for URL parsing)
    let formattedUrl = url;
    if (!formattedUrl.match(/^[a-zA-Z]+:\/\//)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const parsedUrl = new URL(formattedUrl);
    return {
      domain: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search + parsedUrl.hash,
    };
  } catch (error) {
    return { domain: url, path: '' };
  }
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (e.g., USD, EUR)
 * @param {string} [locale] - Locale for formatting
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined) return '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @param {string} [locale] - Locale for formatting
 * @returns {string} - Formatted relative time string
 */
export const formatRelativeTime = (date, locale = 'en-US') => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now - dateObj;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    // Use Intl.RelativeTimeFormat if available
    if (typeof Intl.RelativeTimeFormat === 'function') {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      if (diffSec < 60) {
        return rtf.format(-diffSec, 'second');
      } else if (diffMin < 60) {
        return rtf.format(-diffMin, 'minute');
      } else if (diffHour < 24) {
        return rtf.format(-diffHour, 'hour');
      } else if (diffDay < 30) {
        return rtf.format(-diffDay, 'day');
      } else {
        // Fall back to date format for older dates
        return formatDate(
          dateObj,
          {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          },
          locale
        );
      }
    } else {
      // Fallback for browsers without RelativeTimeFormat support
      if (diffSec < 60) {
        return `${diffSec} seconds ago`;
      } else if (diffMin < 60) {
        return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffHour < 24) {
        return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffDay < 30) {
        return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
      } else {
        return formatDate(
          dateObj,
          {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          },
          locale
        );
      }
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Convert hex color to RGBA
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} - RGBA color string
 */
export const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return '';

  try {
    // Remove the hash
    const cleanHex = hex.replace('#', '');

    // Parse the hex values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Return the rgba string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    console.error('Error converting hex to rgba:', error);
    return hex;
  }
};

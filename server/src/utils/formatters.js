/**
 * Utility functions for data formatting
 */
const formatters = {
  /**
   * Format date to ISO string
   * @param {Date} [date=new Date()] - Date to format
   * @returns {string} Formatted date string
   */
  formatISODate(date = new Date()) {
    return date.toISOString();
  },

  /**
   * Format timestamp to human-readable string
   * @param {Date} [date=new Date()] - Date to format
   * @returns {string} Formatted date string
   */
  formatHumanReadableDate(date = new Date()) {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  },

  /**
   * Sanitize input string
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return input
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  /**
   * Mask sensitive information (e.g., email, phone)
   * @param {string} input - Input string to mask
   * @param {Object} [options] - Masking options
   * @param {number} [options.visibleStart=2] - Number of characters to keep at the start
   * @param {number} [options.visibleEnd=2] - Number of characters to keep at the end
   * @returns {string} Masked string
   */
  maskSensitiveInfo(input, options = {}) {
    if (typeof input !== 'string') return input;

    const { visibleStart = 2, visibleEnd = 2 } = options;

    if (input.length <= visibleStart + visibleEnd) return input;

    const start = input.slice(0, visibleStart);
    const end = input.slice(-visibleEnd);
    const maskedLength = input.length - visibleStart - visibleEnd;
    const masked = '*'.repeat(maskedLength);

    return `${start}${masked}${end}`;
  },

  /**
   * Format file size to human-readable format
   * @param {number} bytes - File size in bytes
   * @param {number} [decimals=2] - Number of decimal places
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Convert camelCase to Title Case
   * @param {string} str - Input string in camelCase
   * @returns {string} Converted string in Title Case
   */
  camelCaseToTitleCase(str) {
    if (typeof str !== 'string') return str;

    return str.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
      return str.toUpperCase();
    });
  },
};

module.exports = formatters;

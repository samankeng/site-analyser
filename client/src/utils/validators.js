/**
 * Validator functions for form validation
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with error message and strength score
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    errors: [],
    strength: 0
  };

  // Check minimum length
  if (!password || password.length < 8) {
    result.errors.push('Password must be at least 8 characters long');
  } else {
    result.strength += 1;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter');
  } else {
    result.strength += 1;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    result.errors.push('Password must contain at least one lowercase letter');
  } else {
    result.strength += 1;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    result.errors.push('Password must contain at least one number');
  } else {
    result.strength += 1;
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password must contain at least one special character');
  } else {
    result.strength += 1;
  }

  result.isValid = result.errors.length === 0;
  
  return result;
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validate that passwords match
 * @param {string} password - Password
 * @param {string} confirmPassword - Confirmation password
 * @returns {boolean} - True if passwords match
 */
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * Validate required field
 * @param {any} value - Field value
 * @returns {boolean} - True if field is not empty
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  
  return true;
};

/**
 * Validate minimum length
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum required length
 * @returns {boolean} - True if string meets minimum length
 */
export const minLength = (value, minLength) => {
  if (!value) {
    return false;
  }
  
  return value.length >= minLength;
};

/**
 * Validate maximum length
 * @param {string} value - String to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} - True if string does not exceed maximum length
 */
export const maxLength = (value, maxLength) => {
  if (!value) {
    return true;
  }
  
  return value.length <= maxLength;
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} - True if number is within range
 */
export const numberInRange = (value, min, max) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return false;
  }
  
  return num >= min && num <= max;
};

/**
 * Validate if a value is a number
 * @param {any} value - Value to validate
 * @returns {boolean} - True if value is a number
 */
export const isNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate domain name format
 * @param {string} domain - Domain to validate
 * @returns {boolean} - True if domain is valid
 */
export const isValidDomain = (domain) => {
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
};

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string|null} - Domain or null if invalid URL
 */
export const extractDomain = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (e) {
    return null;
  }
};
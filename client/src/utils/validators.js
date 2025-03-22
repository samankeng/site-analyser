/**
 * Enhanced validator functions for form validation
 * Compatible with React 19 and MUI v6
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const isValidEmail = (email, returnObject = false) => {
  // More comprehensive email regex that follows RFC 5322 standards
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const isValid = email && emailRegex.test(email);

  return returnObject
    ? {
        isValid,
        message: isValid ? '' : 'Please enter a valid email address',
      }
    : isValid;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {object} - Validation result with error message and strength score
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    // New options for MUI v6 compatibility
    returnHelperText = false,
  } = options;

  const result = {
    isValid: false,
    errors: [],
    strength: 0, // 0-5 scale, used for MUI v6 LinearProgress
    color: 'error', // MUI v6 color system: 'error', 'warning', 'info', 'success'
    helperText: '',
  };

  // Check minimum length
  if (!password || password.length < minLength) {
    result.errors.push(`Password must be at least ${minLength} characters long`);
  } else {
    result.strength += 1;
  }

  // Check for uppercase letters
  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter');
  } else if (requireUppercase) {
    result.strength += 1;
  }

  // Check for lowercase letters
  if (requireLowercase && !/[a-z]/.test(password)) {
    result.errors.push('Password must contain at least one lowercase letter');
  } else if (requireLowercase) {
    result.strength += 1;
  }

  // Check for numbers
  if (requireNumbers && !/[0-9]/.test(password)) {
    result.errors.push('Password must contain at least one number');
  } else if (requireNumbers) {
    result.strength += 1;
  }

  // Check for special characters
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password must contain at least one special character');
  } else if (requireSpecialChars) {
    result.strength += 1;
  }

  // Set password strength indicators for MUI v6
  if (result.strength === 0) {
    result.color = 'error';
    result.helperText = 'Very weak';
  } else if (result.strength === 1) {
    result.color = 'error';
    result.helperText = 'Weak';
  } else if (result.strength === 2) {
    result.color = 'warning';
    result.helperText = 'Fair';
  } else if (result.strength === 3) {
    result.color = 'warning';
    result.helperText = 'Good';
  } else if (result.strength === 4) {
    result.color = 'success';
    result.helperText = 'Strong';
  } else {
    result.color = 'success';
    result.helperText = 'Very strong';
  }

  result.isValid = result.errors.length === 0;

  if (returnHelperText) {
    // For MUI v6's helperText prop on TextField
    result.helperText = result.isValid ? result.helperText : result.errors[0];
  }

  return result;
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const isValidUrl = (url, options = {}) => {
  const {
    requireHttps = false,
    allowedProtocols = ['http:', 'https:'],
    returnObject = false,
  } = options;

  if (!url) {
    return returnObject ? { isValid: false, message: 'URL is required' } : false;
  }

  try {
    // Add protocol if missing for validation purposes
    let urlToCheck = url;
    if (!urlToCheck.match(/^[a-zA-Z]+:\/\//)) {
      urlToCheck = 'https://' + urlToCheck;
    }

    const parsedUrl = new URL(urlToCheck);

    // Check protocol requirements
    const hasValidProtocol = allowedProtocols.includes(parsedUrl.protocol);
    const meetsHttpsRequirement = !requireHttps || parsedUrl.protocol === 'https:';

    const isValid = hasValidProtocol && meetsHttpsRequirement;

    if (returnObject) {
      let message = '';
      if (!isValid) {
        if (!hasValidProtocol) {
          message = `URL must use one of these protocols: ${allowedProtocols.join(', ')}`;
        } else if (!meetsHttpsRequirement) {
          message = 'URL must use HTTPS protocol';
        }
      }
      return { isValid, message };
    }

    return isValid;
  } catch (e) {
    return returnObject
      ? {
          isValid: false,
          message: 'Please enter a valid URL',
        }
      : false;
  }
};

/**
 * Validate that passwords match
 * @param {string} password - Password
 * @param {string} confirmPassword - Confirmation password
 * @param {boolean} returnObject - Whether to return an object with validation details
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const passwordsMatch = (password, confirmPassword, returnObject = false) => {
  const isValid = password === confirmPassword;

  return returnObject
    ? {
        isValid,
        message: isValid ? '' : 'Passwords do not match',
      }
    : isValid;
};

/**
 * Validate required field
 * @param {any} value - Field value
 * @param {Object} options - Validation options
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const isRequired = (value, options = {}) => {
  const { returnObject = false, fieldName = 'This field', allowEmptyStrings = false } = options;

  let isValid = true;

  if (value === null || value === undefined) {
    isValid = false;
  } else if (typeof value === 'string' && !allowEmptyStrings) {
    isValid = value.trim() !== '';
  } else if (Array.isArray(value)) {
    isValid = value.length > 0;
  }

  return returnObject
    ? {
        isValid,
        message: isValid ? '' : `${fieldName} is required`,
      }
    : isValid;
};

/**
 * Validate minimum length
 * @param {string} value - String to validate
 * @param {number} minLen - Minimum required length
 * @param {Object} options - Validation options
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const minLength = (value, minLen, options = {}) => {
  const { returnObject = false, fieldName = 'This field' } = options;

  const isValid = value && value.length >= minLen;

  return returnObject
    ? {
        isValid,
        message: isValid ? '' : `${fieldName} must be at least ${minLen} characters`,
      }
    : isValid;
};

/**
 * Validate maximum length
 * @param {string} value - String to validate
 * @param {number} maxLen - Maximum allowed length
 * @param {Object} options - Validation options
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const maxLength = (value, maxLen, options = {}) => {
  const { returnObject = false, fieldName = 'This field' } = options;

  // Empty values are considered valid for max length checks
  if (!value) {
    return returnObject ? { isValid: true, message: '' } : true;
  }

  const isValid = value.length <= maxLen;

  return returnObject
    ? {
        isValid,
        message: isValid ? '' : `${fieldName} must not exceed ${maxLen} characters`,
      }
    : isValid;
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Object} options - Validation options
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const numberInRange = (value, min, max, options = {}) => {
  const {
    returnObject = false,
    fieldName = 'This value',
    includeMin = true,
    includeMax = true,
  } = options;

  const num = parseFloat(value);

  if (isNaN(num)) {
    return returnObject
      ? {
          isValid: false,
          message: `${fieldName} must be a number`,
        }
      : false;
  }

  const minValid = includeMin ? num >= min : num > min;
  const maxValid = includeMax ? num <= max : num < max;
  const isValid = minValid && maxValid;

  if (returnObject) {
    let message = '';
    if (!isValid) {
      const minSymbol = includeMin ? '>=' : '>';
      const maxSymbol = includeMax ? '<=' : '<';
      message = `${fieldName} must be ${minSymbol} ${min} and ${maxSymbol} ${max}`;
    }
    return { isValid, message };
  }

  return isValid;
};

/**
 * Validate if a value is a number
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const isNumber = (value, options = {}) => {
  const {
    returnObject = false,
    fieldName = 'This field',
    allowEmpty = false,
    allowDecimals = true,
    allowNegative = true,
  } = options;

  // Check if empty is allowed
  if ((value === null || value === undefined || value === '') && allowEmpty) {
    return returnObject ? { isValid: true, message: '' } : true;
  }

  const num = parseFloat(value);
  let isValid = !isNaN(num) && isFinite(value);

  // Check if decimals are allowed
  if (isValid && !allowDecimals && num % 1 !== 0) {
    isValid = false;
  }

  // Check if negative values are allowed
  if (isValid && !allowNegative && num < 0) {
    isValid = false;
  }

  return returnObject
    ? {
        isValid,
        message: isValid
          ? ''
          : `${fieldName} must be a${allowDecimals ? '' : 'n integer'} ${
              allowNegative ? '' : 'positive '
            }number`,
      }
    : isValid;
};

/**
 * Validate domain name format
 * @param {string} domain - Domain to validate
 * @param {Object} options - Validation options
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const isValidDomain = (domain, options = {}) => {
  const { returnObject = false, allowSubdomains = true, allowIpAddress = false } = options;

  if (!domain) {
    return returnObject ? { isValid: false, message: 'Domain is required' } : false;
  }

  // Basic domain regex
  const domainRegex = allowSubdomains
    ? /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    : /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;

  // IPv4 regex if allowed
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  const isDomainValid = domainRegex.test(domain);
  const isIpValid = allowIpAddress && ipv4Regex.test(domain);
  const isValid = isDomainValid || isIpValid;

  return returnObject
    ? {
        isValid,
        message: isValid ? '' : 'Please enter a valid domain name',
      }
    : isValid;
};

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string|null} - Domain or null if invalid URL
 */
export const extractDomain = url => {
  if (!url) return null;

  try {
    // Add protocol if missing for URL parsing
    let urlToCheck = url;
    if (!urlToCheck.match(/^[a-zA-Z]+:\/\//)) {
      urlToCheck = 'https://' + urlToCheck;
    }

    const parsedUrl = new URL(urlToCheck);
    return parsedUrl.hostname;
  } catch (e) {
    return null;
  }
};

/**
 * Validate date is within a specific range
 * @param {Date|string} date - Date to validate
 * @param {Object} options - Validation options
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const isDateInRange = (date, options = {}) => {
  const { minDate = null, maxDate = null, returnObject = false, fieldName = 'Date' } = options;

  if (!date) {
    return returnObject ? { isValid: false, message: `${fieldName} is required` } : false;
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return returnObject ? { isValid: false, message: 'Invalid date format' } : false;
    }

    let isValid = true;
    let message = '';

    // Check minimum date
    if (minDate && dateObj < new Date(minDate)) {
      isValid = false;
      message = `${fieldName} must be on or after ${new Date(minDate).toLocaleDateString()}`;
    }

    // Check maximum date
    if (isValid && maxDate && dateObj > new Date(maxDate)) {
      isValid = false;
      message = `${fieldName} must be on or before ${new Date(maxDate).toLocaleDateString()}`;
    }

    return returnObject ? { isValid, message } : isValid;
  } catch (e) {
    return returnObject ? { isValid: false, message: 'Invalid date' } : false;
  }
};

/**
 * Validate file type based on extension or MIME type
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {boolean|{isValid: boolean, message: string}} - Validation result
 */
export const isValidFileType = (file, options = {}) => {
  const { allowedExtensions = [], allowedMimeTypes = [], returnObject = false } = options;

  if (!file) {
    return returnObject ? { isValid: false, message: 'No file selected' } : false;
  }

  let isValid = true;
  let message = '';

  // Check file extension if specified
  if (allowedExtensions.length > 0) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isExtensionValid = allowedExtensions.includes(fileExtension);

    if (!isExtensionValid) {
      isValid = false;
      message = `File type not allowed. Accepted types: ${allowedExtensions.join(', ')}`;
    }
  }

  // Check MIME type if specified
  if (isValid && allowedMimeTypes.length > 0) {
    const isMimeValid = allowedMimeTypes.includes(file.type);

    if (!isMimeValid) {
      isValid = false;
      message = `File type not allowed. Accepted types: ${allowedMimeTypes.join(', ')}`;
    }
  }

  return returnObject ? { isValid, message } : isValid;
};

/**
 * Composable validator for MUI v6 form libraries
 * @param {Array} validators - Array of validator functions to apply
 * @returns {Function} - Combined validator function
 */
export const composeValidators = validators => {
  return value => {
    for (const validator of validators) {
      const result = validator(value);

      // Handle both boolean and object returns
      if (typeof result === 'object' && !result.isValid) {
        return result.message;
      } else if (result === false) {
        return 'Validation failed';
      }
    }

    return '';
  };
};

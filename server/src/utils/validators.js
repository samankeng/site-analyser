import validator from 'validator';

/**
 * Utility functions for input validation
 */
const validators = {
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} Whether the email is valid
   */
  isValidEmail(email) {
    if (typeof email !== 'string') return false;
    return validator.isEmail(email.trim());
  },

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @param {Object} [options] - Validation options
   * @returns {boolean} Whether the URL is valid
   */
  isValidURL(url, options = {}) {
    if (typeof url !== 'string') return false;
    
    const defaultOptions = {
      protocols: ['http', 'https', 'ftp'],
      require_tld: true,
      require_protocol: false,
      require_host: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false
    };

    return validator.isURL(url.trim(), { ...defaultOptions, ...options });
  },

  /**
   * Validate strong password
   * @param {string} password - Password to validate
   * @param {Object} [options] - Password validation options
   * @returns {boolean} Whether the password is strong
   */
  isStrongPassword(password, options = {}) {
    if (typeof password !== 'string') return false;
    
    const defaultOptions = {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      returnScore: false,
      pointsPerUnique: 1,
      pointsPerRepeat: 0.5,
      pointsForContainingLower: 10,
      pointsForContainingUpper: 10,
      pointsForContainingNumber: 10,
      pointsForContainingSymbol: 10
    };

    return validator.isStrongPassword(password, { ...defaultOptions, ...options });
  },

  /**
   * Validate IP address
   * @param {string} ip - IP address to validate
   * @param {string} [version] - IP version ('4' or '6')
   * @returns {boolean} Whether the IP is valid
   */
  isValidIP(ip, version) {
    if (typeof ip !== 'string') return false;
    
    if (version) {
      return validator.isIP(ip.trim(), version);
    }
    
    return validator.isIP(ip.trim());
  },

  /**
   * Sanitize input string
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Trim whitespace
    let sanitized = input.trim();
    
    // Escape HTML
    sanitized = validator.escape(sanitized);
    
    // Remove any potential script tags or other potential XSS vectors
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    return sanitized;
  },

  /**
   * Validate that input is not empty
   * @param {*} input - Input to check
   * @returns {boolean} Whether the input is not empty
   */
  isNotEmpty(input) {
    if (input === undefined || input === null) return false;
    
    if (typeof input === 'string') {
      return input.trim().length > 0;
    }
    
    if (Array.isArray(input)) {
      return input.length > 0;
    }
    
    if (typeof input === 'object') {
      return Object.keys(input).length > 0;
    }
    
    return true;
  },

  /**
   * Validate MongoDB ObjectId
   * @param {string} id - ID to validate
   * @returns {boolean} Whether the ID is a valid MongoDB ObjectId
   */
  isValidMongoId(id) {
    if (typeof id !== 'string') return false;
    
    // MongoDB ObjectId is a 24-character hex string
    const objectIdRegex = /^[0-9A-Fa-f]{24}$/;
    return objectIdRegex.test(id);
  },

  /**
   * Validate phone number
   * @param {string} phoneNumber - Phone number to validate
   * @param {string} [locale='any'] - Locale for phone number validation
   * @returns {boolean} Whether the phone number is valid
   */
  isValidPhoneNumber(phoneNumber, locale = 'any') {
    if (typeof phoneNumber !== 'string') return false;
    
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    return validator.isMobilePhone(cleaned, locale);
  },

  /**
   * Validate credit card number
   * @param {string} cardNumber - Credit card number to validate
   * @returns {boolean} Whether the credit card number is valid
   */
  isValidCreditCard(cardNumber) {
    if (typeof cardNumber !== 'string') return false;
    
    // Remove any spaces or dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    return validator.isCreditCard(cleaned);
  },

  /**
   * Validate JSON string
   * @param {string} jsonString - JSON string to validate
   * @returns {boolean} Whether the string is valid JSON
   */
  isValidJSON(jsonString) {
    if (typeof jsonString !== 'string') return false;
    
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Validate alphanumeric string
   * @param {string} input - Input to validate
   * @param {Object} [options] - Validation options
   * @param {boolean} [options.allowSpaces=false] - Allow spaces in the string
   * @returns {boolean} Whether the input is alphanumeric
   */
  isAlphanumeric(input, options = {}) {
    if (typeof input !== 'string') return false;
    
    const { allowSpaces = false } = options;
    
    if (allowSpaces) {
      return /^[a-zA-Z0-9\s]+$/.test(input);
    }
    
    return validator.isAlphanumeric(input);
  }
};

export default validators;

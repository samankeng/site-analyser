const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Express validator middleware
 * Checks for validation errors and returns appropriate response
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} Express middleware function
 */
const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    // Get validation errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const extractedErrors = {};
    errors.array().forEach(err => {
      const { param, msg } = err;
      if (!extractedErrors[param]) {
        extractedErrors[param] = msg;
      }
    });

    // Return error response
    const error = new ApiError(400, 'Validation Error');
    error.errors = extractedErrors;
    
    return next(error);
  };
};

/**
 * Sanitizes request body to prevent MongoDB NoSQL injection
 * Converts specific MongoDB operators to safe alternatives
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    // Convert keys that start with $ to safe alternatives
    // This prevents NoSQL injection
    const sanitize = (obj) => {
      const result = {};
      
      Object.keys(obj).forEach(key => {
        // Replace MongoDB operators with safe alternatives
        const safeKey = key.replace(/^\$/, '_$');
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          result[safeKey] = sanitize(obj[key]);
        } else {
          result[safeKey] = obj[key];
        }
      });
      
      return result;
    };
    
    req.body = sanitize(req.body);
  }
  
  next();
};

module.exports = {
  validateRequest,
  sanitizeRequest
};

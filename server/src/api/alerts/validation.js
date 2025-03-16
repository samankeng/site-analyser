const { body, query, param } = require('express-validator');

/**
 * Validation schemas for alert routes
 */
const validation = {
  /**
   * Validation for alert list query parameters
   */
  getAlertList: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('severity')
      .optional()
      .isIn(['critical', 'high', 'medium', 'low', 'info'])
      .withMessage('Invalid severity level'),
    
    query('status')
      .optional()
      .isIn(['new', 'read', 'resolved', 'ignored'])
      .withMessage('Invalid status value'),
    
    query('type')
      .optional()
      .isString()
      .withMessage('Type must be a string'),
    
    query('url')
      .optional()
      .isString()
      .withMessage('URL filter must be a string'),
    
    query('fromDate')
      .optional()
      .isISO8601()
      .withMessage('From date must be a valid ISO 8601 date'),
    
    query('toDate')
      .optional()
      .isISO8601()
      .withMessage('To date must be a valid ISO 8601 date')
      .custom((value, { req }) => {
        if (req.query.fromDate && new Date(value) < new Date(req.query.fromDate)) {
          throw new Error('To date must be greater than or equal to from date');
        }
        return true;
      }),
    
    query('sortBy')
      .optional()
      .matches(/^[a-zA-Z0-9_.]+:(asc|desc)$/)
      .withMessage('Invalid sort format. Use field:asc or field:desc')
  ],
  
  /**
   * Validation for creating a new alert
   */
  createAlert: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required'),
    
    body('severity')
      .notEmpty()
      .withMessage('Severity is required')
      .isIn(['critical', 'high', 'medium', 'low', 'info'])
      .withMessage('Invalid severity level'),
    
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isString()
      .withMessage('Type must be a string'),
    
    body('url')
      .optional()
      .isURL()
      .withMessage('URL must be a valid URL'),
    
    body('scanId')
      .optional()
      .isMongoId()
      .withMessage('Invalid scan ID format'),
    
    body('data')
      .optional()
      .isObject()
      .withMessage('Data must be an object')
  ],
  
  /**
   * Validation for alert ID parameter
   */
  validateAlertId: [
    param('alertId')
      .notEmpty()
      .withMessage('Alert ID is required')
      .isMongoId()
      .withMessage('Invalid alert ID format')
  ],
  
  /**
   * Validation for updating alert status
   */
  updateAlertStatus: [
    param('alertId')
      .notEmpty()
      .withMessage('Alert ID is required')
      .isMongoId()
      .withMessage('Invalid alert ID format'),
    
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['new', 'read', 'resolved', 'ignored'])
      .withMessage('Invalid status value')
  ],
  
  /**
   * Validation for batch updating alerts
   */
  batchUpdateAlerts: [
    body('alertIds')
      .isArray()
      .withMessage('Alert IDs must be an array')
      .notEmpty()
      .withMessage('Alert IDs array cannot be empty'),
    
    body('alertIds.*')
      .isMongoId()
      .withMessage('Each alert ID must be a valid MongoDB ID'),
    
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['new', 'read', 'resolved', 'ignored'])
      .withMessage('Invalid status value')
  ]
};

module.exports = validation;
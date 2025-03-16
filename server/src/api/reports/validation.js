const { query, param } = require('express-validator');

/**
 * Validation schemas for report routes
 */
const validation = {
  /**
   * Validation for report list query parameters
   */
  getReportList: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('url')
      .optional()
      .isString()
      .withMessage('URL filter must be a string'),
    
    query('severity')
      .optional()
      .isIn(['critical', 'high', 'medium', 'low', 'info'])
      .withMessage('Invalid severity level'),
    
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
   * Validation for scan ID parameter
   */
  validateScanId: [
    param('scanId')
      .notEmpty()
      .withMessage('Scan ID is required')
      .isMongoId()
      .withMessage('Invalid scan ID format')
  ],
  
  /**
   * Validation for report comparison
   */
  compareReports: [
    query('firstScanId')
      .notEmpty()
      .withMessage('First scan ID is required')
      .isMongoId()
      .withMessage('Invalid first scan ID format'),
    
    query('secondScanId')
      .notEmpty()
      .withMessage('Second scan ID is required')
      .isMongoId()
      .withMessage('Invalid second scan ID format')
      .custom((value, { req }) => {
        if (value === req.query.firstScanId) {
          throw new Error('Cannot compare a scan with itself');
        }
        return true;
      })
  ],
  
  /**
   * Validation for report statistics
   */
  getReportStats: [
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
      })
  ]
};

module.exports = validation;
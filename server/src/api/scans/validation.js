const { body, query, param } = require('express-validator');
const { validateUrl } = require('../../utils/validators');

/**
 * Validation schemas for scan routes
 */
const validation = {
  /**
   * Validation for initiating a new scan
   */
  initiateNewScan: [
    body('url')
      .notEmpty()
      .withMessage('URL is required')
      .custom((value) => {
        if (!validateUrl(value)) {
          throw new Error('Invalid URL format');
        }
        return true;
      })
      .withMessage('Please provide a valid URL'),
    
    body('scanDepth')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Scan depth must be between 1 and 5'),
    
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object'),
    
    body('options.checkSsl')
      .optional()
      .isBoolean()
      .withMessage('checkSsl option must be a boolean'),
    
    body('options.checkHeaders')
      .optional()
      .isBoolean()
      .withMessage('checkHeaders option must be a boolean'),
    
    body('options.checkVulnerabilities')
      .optional()
      .isBoolean()
      .withMessage('checkVulnerabilities option must be a boolean'),
    
    body('options.checkPerformance')
      .optional()
      .isBoolean()
      .withMessage('checkPerformance option must be a boolean'),
    
    body('options.checkPorts')
      .optional()
      .isBoolean()
      .withMessage('checkPorts option must be a boolean'),
    
    body('options.customPorts')
      .optional()
      .isArray()
      .withMessage('customPorts must be an array'),
    
    body('options.customPorts.*')
      .optional()
      .isInt({ min: 1, max: 65535 })
      .withMessage('Port numbers must be between 1 and 65535'),
    
    body('options.useAI')
      .optional()
      .isBoolean()
      .withMessage('useAI option must be a boolean')
  ],

  /**
   * Validation for scan list query parameters
   */
  getScanList: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid status value'),
    
    query('sortBy')
      .optional()
      .matches(/^[a-zA-Z0-9_]+(:(asc|desc))?$/)
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
   * Validation for scan recent query parameter
   */
  getRecentScans: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1 and 20')
  ]
};

module.exports = validation;
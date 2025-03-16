const { body, param } = require('express-validator');

/**
 * Validation schemas for auth routes
 */
const validation = {
  /**
   * Validation for user registration
   */
  register: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],

  /**
   * Validation for user login
   */
  login: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    body('mfaToken')
      .optional()
      .isLength({ min: 6, max: 6 })
      .withMessage('MFA token must be 6 digits')
      .isNumeric()
      .withMessage('MFA token must contain only numbers')
  ],

  /**
   * Validation for updating user details
   */
  updateDetails: [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Email cannot be empty')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
  ],

  /**
   * Validation for updating password
   */
  updatePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password cannot be the same as current password');
        }
        return true;
      })
  ],

  /**
   * Validation for forgot password
   */
  forgotPassword: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
  ],

  /**
   * Validation for reset password
   */
  resetPassword: [
    param('token')
      .notEmpty()
      .withMessage('Token is required'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],

  /**
   * Validation for enabling MFA
   */
  enableMfa: [
    body('token')
      .notEmpty()
      .withMessage('MFA token is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('MFA token must be 6 digits')
      .isNumeric()
      .withMessage('MFA token must contain only numbers')
  ],

  /**
   * Validation for disabling MFA
   */
  disableMfa: [
    body('token')
      .notEmpty()
      .withMessage('MFA token is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('MFA token must be 6 digits')
      .isNumeric()
      .withMessage('MFA token must contain only numbers'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  /**
   * Validation for updating user preferences
   */
  updatePreferences: [
    body('preferences')
      .notEmpty()
      .withMessage('Preferences are required')
      .isObject()
      .withMessage('Preferences must be an object')
  ],

  /**
   * Validation for deactivating account
   */
  deactivateAccount: [
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]
};

module.exports = validation;
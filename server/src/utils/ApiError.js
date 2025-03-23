/**
 * Custom API Error class for standardized error handling
 */
class ApiError extends Error {
  /**
   * Create a new API error
   * @param {number} statusCode - HTTP status code for the error
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   */
  constructor(statusCode, message, details = {}) {
    super(message);
    
    // Ensure the name of this error is the same as the class
    this.name = this.constructor.name;

    // HTTP status code associated with the error
    this.statusCode = statusCode;

    // Additional error details
    this.details = details;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a bad request error (400)
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   * @returns {ApiError} Bad request error
   */
  static badRequest(message, details = {}) {
    return new ApiError(400, message, details);
  }

  /**
   * Create an unauthorized error (401)
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   * @returns {ApiError} Unauthorized error
   */
  static unauthorized(message, details = {}) {
    return new ApiError(401, message, details);
  }

  /**
   * Create a forbidden error (403)
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   * @returns {ApiError} Forbidden error
   */
  static forbidden(message, details = {}) {
    return new ApiError(403, message, details);
  }

  /**
   * Create a not found error (404)
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   * @returns {ApiError} Not found error
   */
  static notFound(message, details = {}) {
    return new ApiError(404, message, details);
  }

  /**
   * Create an internal server error (500)
   * @param {string} message - Error message
   * @param {Object} [details={}] - Additional error details
   * @returns {ApiError} Internal server error
   */
  static internalServerError(message, details = {}) {
    return new ApiError(500, message, details);
  }
}

module.exports = ApiError;

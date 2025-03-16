/**
 * Async handler middleware to eliminate try-catch blocks in controllers
 * Automatically catches errors and passes them to the error handling middleware
 * @param {Function} fn - The async controller function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };

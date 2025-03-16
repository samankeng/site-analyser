const jwt = require('jsonwebtoken');
const { asyncHandler } = require('./asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const config = require('../config');

/**
 * Middleware to protect routes that require authentication
 * Verifies JWT token and attaches user to request object
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from Authorization header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Or use token from cookie
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return next(new ApiError(401, 'Not authorized to access this route'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ApiError(401, 'User not found'));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new ApiError(401, 'This account has been deactivated'));
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, 'Not authorized to access this route'));
  }
});

/**
 * Middleware to restrict access to certain roles
 * Must be used after the protect middleware
 * @param {...String} roles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(500, 'User not found in request. Protect middleware must be used before authorize.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `User role ${req.user.role} is not authorized to access this route`)
      );
    }
    next();
  };
};

module.exports = { protect, authorize };

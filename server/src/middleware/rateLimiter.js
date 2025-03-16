const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');
const ApiError = require('../utils/ApiError');
const config = require('../config');

/**
 * Creates a rate limiter middleware with specified options
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable the X-RateLimit headers
    message: 'Too many requests from this IP, please try again later',
    handler: (req, res, next, options) => {
      next(new ApiError(429, options.message));
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Use Redis store in production
  if (config.env === 'production' && redis.isConnected) {
    mergedOptions.store = new RedisStore({
      sendCommand: (...args) => redis.getClient().sendCommand(args),
      prefix: `${config.redis.prefix}rate-limit:`
    });
  }

  return rateLimit(mergedOptions);
};

/**
 * Global rate limiter for all routes
 */
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // 500 requests per windowMs
});

/**
 * Rate limiter for authentication routes
 */
const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many login attempts, please try again after an hour'
});

/**
 * Rate limiter for scan routes
 */
const scanLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 scan requests per hour
  message: 'Scan limit reached. Please try again later.'
});

/**
 * Rate limiter for API routes that could be expensive
 */
const apiLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50 // 50 requests per 10 minutes
});

module.exports = {
  globalLimiter,
  authLimiter,
  scanLimiter,
  apiLimiter,
  createRateLimiter
};

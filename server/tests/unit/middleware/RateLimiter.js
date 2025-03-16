import { jest } from '@jest/globals';
import rateLimiter from '../../src/middleware/rateLimiter';
import Redis from 'ioredis';
import ApiError from '../../src/utils/ApiError';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn()
  }));
});

describe('Rate Limiter Middleware', () => {
  let mockReq, mockRes, mockNext;
  let mockRedisClient;

  beforeEach(() => {
    // Create mock request, response, and next function
    mockReq = {
      ip: '127.0.0.1',
      path: '/api/test',
      method: 'GET'
    };
    mockRes = {};
    mockNext = jest.fn();

    // Create a mock Redis client
    mockRedisClient = new Redis();

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should allow request when rate limit is not exceeded', async () => {
    // Mock Redis incr to return a low request count
    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(null);

    // Create rate limiter middleware with a high limit
    const limitMiddleware = rateLimiter({
      redisClient: mockRedisClient,
      max: 100,
      windowMs: 60000
    });

    // Call the middleware
    await limitMiddleware(mockReq, mockRes, mockNext);

    // Verify next was called without an error
    expect(mockNext).toHaveBeenCalledWith();

    // Verify Redis methods were called
    expect(mockRedisClient.incr).toHaveBeenCalledWith(expect.stringContaining('127.0.0.1:GET:/api/test'));
    expect(mockRedisClient.expire).toHaveBeenCalledWith(
      expect.stringContaining('127.0.0.1:GET:/api/test'),
      60
    );
  });

  it('should block request when rate limit is exceeded', async () => {
    // Mock Redis incr to return a high request count
    mockRedisClient.incr.mockResolvedValue(101);

    // Create rate limiter middleware with a low limit
    const limitMiddleware = rateLimiter({
      redisClient: mockRedisClient,
      max: 100,
      windowMs: 60000
    });

    // Call the middleware
    await limitMiddleware(mockReq, mockRes, mockNext);

    // Verify next was called with an ApiError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));

    // Verify the ApiError has the correct status and message
    const passedError = mockNext.mock.calls[0][0];
    expect(passedError.statusCode).toBe(429);
    expect(passedError.message).toContain('Too many requests');
  });

  it('should handle different request paths separately', async () => {
    // Mock Redis incr to return a low request count
    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(null);

    const limitMiddleware = rateLimiter({
      redisClient: mockRedisClient,
      max: 100,
      windowMs: 60000
    });

    // Modify request path
    mockReq.path = '/api/different-path';

    // Call the middleware
    await limitMiddleware(mockReq, mockRes, mockNext);

    // Verify Redis methods were called with the correct key
    expect(mockRedisClient.incr).toHaveBeenCalledWith(
      expect.stringContaining('127.0.0.1:GET:/api/different-path')
    );
  });

  it('should handle Redis errors gracefully', async () => {
    // Mock Redis incr to throw an error
    mockRedisClient.incr.mockRejectedValue(new Error('Redis connection error'));

    const limitMiddleware = rateLimiter({
      redisClient: mockRedisClient,
      max: 100,
      windowMs: 60000
    });

    // Call the middleware
    await limitMiddleware(mockReq, mockRes, mockNext);

    // Verify next was called with an ApiError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));

    // Verify the ApiError has the correct status and message
    const passedError = mockNext.mock.calls[0][0];
    expect(passedError.statusCode).toBe(500);
    expect(passedError.message).toContain('Rate limit error');
  });

  it('should use default options when not provided', async () => {
    // Mock Redis incr to return a low request count
    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(null);

    // Create rate limiter middleware with default options
    const limitMiddleware = rateLimiter({
      redisClient: mockRedisClient
    });

    // Call the middleware
    await limitMiddleware(mockReq, mockRes, mockNext);

    // Verify next was called without an error
    expect(mockNext).toHaveBeenCalledWith();

    // Verify Redis methods were called with default values
    expect(mockRedisClient.expire).toHaveBeenCalledWith(
      expect.any(String),
      60 // Default window of 1 minute
    );
  });
});

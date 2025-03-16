import { jest } from '@jest/globals';
import authMiddleware from '../../src/middleware/auth';
import User from '../../src/models/User';
import { verifyToken } from '../../src/utils/authUtils';
import ApiError from '../../src/utils/ApiError';

// Mock the authUtils module
jest.mock('../../src/utils/authUtils', () => ({
  verifyToken: jest.fn()
}));

describe('Authentication Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset mocks before each test
    mockReq = {
      headers: {
        authorization: 'Bearer validToken123'
      }
    };
    mockRes = {};
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should authenticate a valid token and attach user to request', async () => {
    // Mock user data
    const mockUser = {
      _id: 'userId123',
      email: 'test@example.com',
      username: 'testuser'
    };

    // Mock token verification to return user ID
    verifyToken.mockReturnValue({ id: mockUser._id });

    // Mock User.findById to return user
    jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

    // Call auth middleware
    await authMiddleware(mockReq, mockRes, mockNext);

    // Verify token was verified
    expect(verifyToken).toHaveBeenCalledWith('validToken123');

    // Verify user was found
    expect(User.findById).toHaveBeenCalledWith(mockUser._id);

    // Verify user was attached to request
    expect(mockReq.user).toEqual(mockUser);

    // Verify next was called without an error
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should throw an error if no authorization header is present', async () => {
    // Remove authorization header
    mockReq.headers = {};

    // Call auth middleware
    await authMiddleware(mockReq, mockRes, mockNext);

    // Verify next was called with an ApiError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it('should throw an error if token is invalid', async () => {
    // Mock token verification to throw an error
    verifyToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Call auth middleware
    await authMiddleware(mockReq, mockRes, mockNext);

    // Verify next was called with an ApiError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it('should throw an error if user is not found', async () => {
    // Mock token verification to return user ID
    verifyToken.mockReturnValue({ id: 'userId123' });

    // Mock User.findById to return null
    jest.spyOn(User, 'findById').mockResolvedValue(null);

    // Call auth middleware
    await authMiddleware(mockReq, mockRes, mockNext);

    // Verify next was called with an ApiError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it('should handle malformed authorization header', async () => {
    // Set malformed authorization header
    mockReq.headers.authorization = 'InvalidHeader';

    // Call auth middleware
    await authMiddleware(mockReq, mockRes, mockNext);

    // Verify next was called with an ApiError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
  });
});

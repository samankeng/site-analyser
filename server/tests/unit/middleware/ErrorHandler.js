import { jest } from '@jest/globals';
import errorHandler from '../../src/middleware/errorHandler';
import ApiError from '../../src/utils/ApiError';
import logger from '../../src/utils/logger';

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock request object
    mockReq = {
      method: 'GET',
      url: '/test-url'
    };

    // Create mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    // Create mock next function
    mockNext = jest.fn();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('ApiError handling', () => {
    it('should handle standard ApiError correctly', () => {
      const apiError = new ApiError(400, 'Bad Request', { 
        details: 'Invalid input' 
      });

      errorHandler(apiError, mockReq, mockRes, mockNext);

      // Verify status was set correctly
      expect(mockRes.status).toHaveBeenCalledWith(400);

      // Verify response body
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Bad Request',
        details: { details: 'Invalid input' }
      });

      // Verify logger was called
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Bad Request'),
        expect.objectContaining({ details: 'Invalid input' })
      );
    });

    it('should handle ApiError with default values', () => {
      const apiError = new ApiError(500);

      errorHandler(apiError, mockReq, mockRes, mockNext);

      // Verify status was set correctly
      expect(mockRes.status).toHaveBeenCalledWith(500);

      // Verify response body
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 500,
        message: 'Internal Server Error',
        details: {}
      });
    });
  });

  describe('Mongoose Validation Error handling', () => {
    it('should handle mongoose validation errors', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          email: { 
            message: 'Invalid email format',
            path: 'email'
          },
          password: { 
            message: 'Password is too short',
            path: 'password'
          }
        }
      };

      errorHandler(validationError, mockReq, mockRes, mockNext);

      // Verify status was set to 400
      expect(mockRes.status).toHaveBeenCalledWith(400);

      // Verify response body
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Validation Error',
        details: {
          email: 'Invalid email format',
          password: 'Password is too short'
        }
      });

      // Verify logger was called
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Validation Error'),
        expect.objectContaining({
          email: 'Invalid email format',
          password: 'Password is too short'
        })
      );
    });
  });

  describe('Mongoose Duplicate Key Error handling', () => {
    it('should handle mongoose duplicate key errors', () => {
      const duplicateKeyError = {
        name: 'MongoError',
        code: 11000,
        keyValue: {
          email: 'test@example.com'
        }
      };

      errorHandler(duplicateKeyError, mockReq, mockRes, mockNext);

      // Verify status was set to 400
      expect(mockRes.status).toHaveBeenCalledWith(400);

      // Verify response body
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Duplicate Key Error',
        details: {
          duplicateField: 'email',
          value: 'test@example.com'
        }
      });

      // Verify logger was called
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate Key Error'),
        expect.objectContaining({
          duplicateField: 'email',
          value: 'test@example.com'
        })
      );
    });
  });

  describe('Mongoose Cast Error handling', () => {
    it('should handle mongoose cast errors', () => {
      const castError = {
        name: 'CastError',
        path: 'userId',
        value: 'invalidId',
        kind: 'ObjectId'
      };

      errorHandler(castError, mockReq, mockRes, mockNext);

      // Verify status was set to 400
      expect(mockRes.status).toHaveBeenCalledWith(400);

      // Verify response body
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 400,
        message: 'Invalid Input',
        details: {
          field: 'userId',
          value: 'invalidId',
          type: 'ObjectId'
        }
      });

      // Verify logger was called
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid Input'),
        expect.objectContaining({
          field: 'userId',
          value: 'invalidId',
          type: 'ObjectId'
        })
      );
    });
  });

  describe('Standard Error handling', () => {
    it('should handle standard JavaScript errors', () => {
      const standardError = new Error('Unexpected error occurred');

      errorHandler(standardError, mockReq, mockRes, mockNext);

      // Verify status was set to 500
      expect(mockRes.status).toHaveBeenCalledWith(500);

      // Verify response body
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 500,
        message: 'Unexpected error occurred',
        details: {}
      });

      // Verify logger was called
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error occurred'),
        expect.any(Object)
      );
    });
  });

  describe('Default Error handling', () => {
    it('should handle completely unknown error types', () => {
      const unknownError = {
        someRandomProperty: 'Custom error'
      };

      errorHandler(unknownError, mockReq, mockRes, mockNext);

      // Verify status was set to 500
      expect(mockRes.status).toHaveBeenCalledWith(500);

      // Verify response body
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 500,
        message: 'An unexpected error occurred',
        details: {}
      });

      // Verify logger was called
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('An unexpected error occurred'),
        expect.any(Object)
      );
    });
  });
});

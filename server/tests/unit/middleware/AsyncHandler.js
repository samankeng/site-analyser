import { jest } from '@jest/globals';
import asyncHandler from '../../src/middleware/asyncHandler';

describe('Async Handler Middleware', () => {
  it('should call the handler function and pass arguments', async () => {
    // Create mock request, response, and next function
    const mockReq = { body: { test: 'data' } };
    const mockRes = {};
    const mockNext = jest.fn();

    // Create a mock handler function that returns a value
    const mockHandler = jest.fn().mockResolvedValue('result');

    // Wrap the mock handler with asyncHandler
    const wrappedHandler = asyncHandler(mockHandler);

    // Call the wrapped handler
    await wrappedHandler(mockReq, mockRes, mockNext);

    // Verify the original handler was called with correct arguments
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass errors to next middleware', async () => {
    // Create mock request, response, and next function
    const mockReq = { body: { test: 'data' } };
    const mockRes = {};
    const mockNext = jest.fn();

    // Create a mock handler function that throws an error
    const mockError = new Error('Test error');
    const mockHandler = jest.fn().mockRejectedValue(mockError);

    // Wrap the mock handler with asyncHandler
    const wrappedHandler = asyncHandler(mockHandler);

    // Call the wrapped handler
    await wrappedHandler(mockReq, mockRes, mockNext);

    // Verify the original handler was called with correct arguments
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    
    // Verify the error was passed to next middleware
    expect(mockNext).toHaveBeenCalledWith(mockError);
  });

  it('should handle synchronous errors', async () => {
    // Create mock request, response, and next function
    const mockReq = { body: { test: 'data' } };
    const mockRes = {};
    const mockNext = jest.fn();

    // Create a mock handler function that throws a synchronous error
    const mockError = new Error('Sync error');
    const mockHandler = jest.fn().mockImplementation(() => {
      throw mockError;
    });

    // Wrap the mock handler with asyncHandler
    const wrappedHandler = asyncHandler(mockHandler);

    // Call the wrapped handler
    await wrappedHandler(mockReq, mockRes, mockNext);

    // Verify the original handler was called with correct arguments
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    
    // Verify the error was passed to next middleware
    expect(mockNext).toHaveBeenCalledWith(mockError);
  });
});

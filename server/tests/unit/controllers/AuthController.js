import { jest } from '@jest/globals';
import AuthController from '../../src/api/auth/controller';
import User from '../../src/models/User';
import ApiError from '../../src/utils/ApiError';

describe('AuthController', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'ValidPassword123!'
      };
      mockReq.body = userData;

      // Mock User.findOne to return null (no existing user)
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      // Mock User.create to return a user object
      const createdUser = {
        _id: 'mockUserId',
        email: userData.email,
        username: userData.username
      };
      jest.spyOn(User, 'create').mockResolvedValue(createdUser);

      await AuthController.register(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ 
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });
      expect(User.create).toHaveBeenCalledWith({
        email: userData.email,
        username: userData.username,
        password: expect.any(String) // Hashed password
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({
          email: userData.email,
          username: userData.username
        }),
        token: expect.any(String)
      }));
    });

    it('should throw an error for existing email or username', async () => {
      const userData = {
        email: 'existinguser@example.com',
        username: 'existinguser',
        password: 'ValidPassword123!'
      };
      mockReq.body = userData;

      // Mock User.findOne to return an existing user
      jest.spyOn(User, 'findOne').mockResolvedValue({
        email: userData.email,
        username: userData.username
      });

      await AuthController.register(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'validuser@example.com',
        password: 'ValidPassword123!'
      };
      mockReq.body = loginData;

      // Mock user with a valid password check method
      const mockUser = {
        _id: 'mockUserId',
        email: loginData.email,
        checkPassword: jest.fn().mockResolvedValue(true)
      };

      // Mock User.findOne to return the user
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      await AuthController.login(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.checkPassword).toHaveBeenCalledWith(loginData.password);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({
          email: loginData.email
        }),
        token: expect.any(String)
      }));
    });

    it('should throw an error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!'
      };
      mockReq.body = loginData;

      // Mock User.findOne to return null
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await AuthController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should throw an error for incorrect password', async () => {
      const loginData = {
        email: 'validuser@example.com',
        password: 'WrongPassword123!'
      };
      mockReq.body = loginData;

      // Mock user with an invalid password check method
      const mockUser = {
        _id: 'mockUserId',
        email: loginData.email,
        checkPassword: jest.fn().mockResolvedValue(false)
      };

      // Mock User.findOne to return the user
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      await AuthController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('profile', () => {
    it('should retrieve user profile for authenticated user', async () => {
      const mockUser = {
        _id: 'mockUserId',
        email: 'user@example.com',
        username: 'testuser',
        toJSON: jest.fn().mockReturnValue({
          _id: 'mockUserId',
          email: 'user@example.com',
          username: 'testuser'
        })
      };
      mockReq.user = mockUser;

      await AuthController.profile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        email: 'user@example.com',
        username: 'testuser'
      }));
    });

    it('should throw an error if no authenticated user', async () => {
      mockReq.user = null;

      await AuthController.profile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('resetPassword', () => {
    it('should initiate password reset for existing user', async () => {
      const resetData = {
        email: 'user@example.com'
      };
      mockReq.body = resetData;

      // Mock user exists
      const mockUser = {
        _id: 'mockUserId',
        email: resetData.email,
        generatePasswordResetToken: jest.fn().mockReturnValue('resetToken')
      };
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      // Mock email service
      const mockEmailService = {
        sendPasswordResetEmail: jest.fn()
      };

      // Replace the email service in the controller
      const originalEmailService = AuthController.emailService;
      AuthController.emailService = mockEmailService;

      await AuthController.resetPassword(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: resetData.email });
      expect(mockUser.generatePasswordResetToken).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email, 
        'resetToken'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );

      // Restore original email service
      AuthController.emailService = originalEmailService;
    });

    it('should throw an error for non-existent user', async () => {
      const resetData = {
        email: 'nonexistent@example.com'
      };
      mockReq.body = resetData;

      // Mock user not found
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await AuthController.resetPassword(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });
});

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import { generateToken } from '../src/utils/authUtils';

describe('Authentication API Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Connect to a test database
    await mongoose.connect(process.env.MONGO_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Disconnect from the test database
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear the users collection before each test
    await User.deleteMany({});

    // Create a test user
    testUser = new User({
      email: 'testuser@example.com',
      username: 'testuser',
      password: 'TestPassword123!',
      isVerified: true
    });
    await testUser.save();

    // Generate an auth token for the test user
    authToken = generateToken(testUser);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'NewPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(newUser.email);
    });

    it('should reject registration with existing email', async () => {
      const duplicateUser = {
        email: 'testuser@example.com',
        username: 'differentuser',
        password: 'AnotherPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginCredentials = {
        email: 'testuser@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject login with incorrect password', async () => {
      const incorrectCredentials = {
        email: 'testuser@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(incorrectCredentials);

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should retrieve user profile for authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.username).toBe(testUser.username);
    });

    it('should reject profile retrieval without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should initiate password reset for existing email', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'testuser@example.com' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject password reset for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import Scan from '../src/models/Scan';
import User from '../src/models/User';
import { generateToken } from '../src/utils/authUtils';

describe('Scan API Integration Tests', () => {
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
    // Clear the scans and users collections before each test
    await Scan.deleteMany({});
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

  describe('POST /api/scans', () => {
    it('should create a new scan for an authenticated user', async () => {
      const scanData = {
        url: 'https://example.com',
        scanType: ['headers', 'ssl', 'performance']
      };

      const response = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.url).toBe(scanData.url);
      expect(response.body.user).toBe(testUser._id.toString());
    });

    it('should reject scan creation without authentication', async () => {
      const scanData = {
        url: 'https://example.com',
        scanType: ['headers', 'ssl', 'performance']
      };

      const response = await request(app)
        .post('/api/scans')
        .send(scanData);

      expect(response.statusCode).toBe(401);
    });

    it('should reject scan with invalid URL', async () => {
      const scanData = {
        url: 'not-a-valid-url',
        scanType: ['headers', 'ssl', 'performance']
      };

      const response = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanData);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/scans', () => {
    it('should retrieve scans for an authenticated user', async () => {
      // Create some test scans
      const scans = [
        new Scan({
          url: 'https://example1.com',
          user: testUser._id,
          scanType: ['headers']
        }),
        new Scan({
          url: 'https://example2.com',
          user: testUser._id,
          scanType: ['ssl']
        })
      ];
      await Scan.insertMany(scans);

      const response = await request(app)
        .get('/api/scans')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0].url).toBe('https://example1.com');
      expect(response.body[1].url).toBe('https://example2.com');
    });

    it('should reject scan retrieval without authentication', async () => {
      const response = await request(app)
        .get('/api/scans');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/scans/:id', () => {
    it('should retrieve a specific scan for an authenticated user', async () => {
      const scan = new Scan({
        url: 'https://example.com',
        user: testUser._id,
        scanType: ['headers', 'ssl']
      });
      await scan.save();

      const response = await request(app)
        .get(`/api/scans/${scan._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.url).toBe('https://example.com');
      expect(response.body._id).toBe(scan._id.toString());
    });

    it('should reject retrieving a scan that does not belong to the user', async () => {
      const otherUser = new User({
        email: 'otheruser@example.com',
        username: 'otheruser',
        password: 'OtherPassword123!'
      });
      await otherUser.save();

      const scan = new Scan({
        url: 'https://example.com',
        user: otherUser._id,
        scanType: ['headers', 'ssl']
      });
      await scan.save();

      const response = await request(app)
        .get(`/api/scans/${scan._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(403);
    });
  });
});

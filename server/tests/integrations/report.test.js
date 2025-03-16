import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import Report from '../src/models/Report';
import User from '../src/models/User';
import Scan from '../src/models/Scan';
import { generateToken } from '../src/utils/authUtils';

describe('Report API Integration Tests', () => {
  let testUser;
  let authToken;
  let testScan;

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
    // Clear the reports, scans, and users collections before each test
    await Report.deleteMany({});
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

    // Create a test scan
    testScan = new Scan({
      url: 'https://example.com',
      user: testUser._id,
      scanType: ['headers', 'ssl']
    });
    await testScan.save();

    // Generate an auth token for the test user
    authToken = generateToken(testUser);
  });

  describe('POST /api/reports', () => {
    it('should create a new report for an authenticated user', async () => {
      const reportData = {
        scan: testScan._id,
        title: 'Security Assessment Report',
        summary: 'Detailed security analysis of the website',
        severity: 'medium'
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(reportData.title);
      expect(response.body.user).toBe(testUser._id.toString());
    });

    it('should reject report creation without authentication', async () => {
      const reportData = {
        scan: testScan._id,
        title: 'Security Assessment Report',
        summary: 'Detailed security analysis of the website',
        severity: 'medium'
      };

      const response = await request(app)
        .post('/api/reports')
        .send(reportData);

      expect(response.statusCode).toBe(401);
    });

    it('should reject report creation with invalid scan ID', async () => {
      const reportData = {
        scan: new mongoose.Types.ObjectId(), // Invalid scan ID
        title: 'Security Assessment Report',
        summary: 'Detailed security analysis of the website',
        severity: 'medium'
      };

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/reports', () => {
    it('should retrieve reports for an authenticated user', async () => {
      // Create some test reports
      const reports = [
        new Report({
          scan: testScan._id,
          user: testUser._id,
          title: 'Report 1',
          summary: 'First security report',
          severity: 'low'
        }),
        new Report({
          scan: testScan._id,
          user: testUser._id,
          title: 'Report 2',
          summary: 'Second security report',
          severity: 'high'
        })
      ];
      await Report.insertMany(reports);

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0].title).toBe('Report 1');
      expect(response.body[1].title).toBe('Report 2');
    });

    it('should reject report retrieval without authentication', async () => {
      const response = await request(app)
        .get('/api/reports');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/reports/:id', () => {
    it('should retrieve a specific report for an authenticated user', async () => {
      const report = new Report({
        scan: testScan._id,
        user: testUser._id,
        title: 'Detailed Security Report',
        summary: 'Comprehensive security analysis',
        severity: 'high',
        findings: [
          { type: 'SSL', description: 'Weak SSL configuration' },
          { type: 'Headers', description: 'Missing security headers' }
        ]
      });
      await report.save();

      const response = await request(app)
        .get(`/api/reports/${report._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe('Detailed Security Report');
      expect(response.body._id).toBe(report._id.toString());
      expect(response.body.findings).toHaveLength(2);
    });

    it('should reject retrieving a report that does not belong to the user', async () => {
      const otherUser = new User({
        email: 'otheruser@example.com',
        username: 'otheruser',
        password: 'OtherPassword123!'
      });
      await otherUser.save();

      const otherScan = new Scan({
        url: 'https://otherexample.com',
        user: otherUser._id,
        scanType: ['headers']
      });
      await otherScan.save();

      const report = new Report({
        scan: otherScan._id,
        user: otherUser._id,
        title: 'Other User Report',
        summary: 'Security report for another user',
        severity: 'medium'
      });
      await report.save();

      const response = await request(app)
        .get(`/api/reports/${report._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /api/reports/:id', () => {
    it('should update a report for an authenticated user', async () => {
      const report = new Report({
        scan: testScan._id,
        user: testUser._id,
        title: 'Initial Report',
        summary: 'Initial security assessment',
        severity: 'low'
      });
      await report.save();

      const updateData = {
        title: 'Updated Security Report',
        summary: 'Updated security assessment',
        severity: 'high'
      };

      const response = await request(app)
        .put(`/api/reports/${report._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe('Updated Security Report');
      expect(response.body.severity).toBe('high');
    });

    it('should reject report update without authentication', async () => {
      const report = new Report({
        scan: testScan._id,
        user: testUser._id,
        title: 'Initial Report',
        summary: 'Initial security assessment',
        severity: 'low'
      });
      await report.save();

      const updateData = {
        title: 'Updated Security Report',
        severity: 'high'
      };

      const response = await request(app)
        .put(`/api/reports/${report._id}`)
        .send(updateData);

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('should delete a report for an authenticated user', async () => {
      const report = new Report({
        scan: testScan._id,
        user: testUser._id,
        title: 'Report to Delete',
        summary: 'Temporary security report',
        severity: 'low'
      });
      await report.save();

      const response = await request(app)
        .delete(`/api/reports/${report._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      
      // Verify the report was deleted
      const deletedReport = await Report.findById(report._id);
      expect(deletedReport).toBeNull();
    });

    it('should reject report deletion without authentication', async () => {
      const report = new Report({
        scan: testScan._id,
        user: testUser._id,
        title: 'Report to Delete',
        summary: 'Temporary security report',
        severity: 'low'
      });
      await report.save();

      const response = await request(app)
        .delete(`/api/reports/${report._id}`);

      expect(response.statusCode).toBe(401);
      
      // Verify the report was not deleted
      const existingReport = await Report.findById(report._id);
      expect(existingReport).not.toBeNull();
    });
  });
});

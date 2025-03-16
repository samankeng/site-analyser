import mongoose from 'mongoose';
import Report from '../../src/models/Report';
import User from '../../src/models/User';
import Scan from '../../src/models/Scan';

describe('Report Model Test', () => {
  let testUser;
  let testScan;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create a test user
    testUser = await User.create({
      email: 'reportuser@example.com',
      username: 'reportuser',
      password: 'ValidPassword123!'
    });

    // Create a test scan
    testScan = await Scan.create({
      url: 'https://example.com',
      user: testUser._id,
      scanType: ['headers', 'ssl']
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Scan.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Report.deleteMany({});
  });

  describe('Report Model Validation', () => {
    it('should create a valid report', async () => {
      const reportData = {
        scan: testScan._id,
        user: testUser._id,
        title: 'Security Assessment Report',
        summary: 'Comprehensive security analysis',
        severity: 'high',
        findings: [
          { type: 'SSL', description: 'Weak SSL configuration' }
        ]
      };

      const report = new Report(reportData);
      const savedReport = await report.save();

      expect(savedReport.title).toBe(reportData.title);
      expect(savedReport.summary).toBe(reportData.summary);
      expect(savedReport.severity).toBe(reportData.severity);
      expect(savedReport.findings).toHaveLength(1);
    });

    it('should require scan and user', async () => {
      const invalidReportData = {
        title: 'Incomplete Report'
      };

      const report = new Report(invalidReportData);

      await expect(report.validate()).rejects.toThrow();
    });

    it('should validate severity', async () => {
      const invalidSeverityReport = {
        scan: testScan._id,
        user: testUser._id,
        title: 'Invalid Severity Report',
        severity: 'invalid-severity'
      };

      const report = new Report(invalidSeverityReport);

      await expect(report.validate()).rejects.toThrow();
    });

    it('should set default severity to low', async () => {
      const reportData = {
        scan: testScan._id,
        user: testUser._id,
        title: 'Default Severity Report'
      };

      const report = new Report(reportData);
      const savedReport = await report.save();

      expect(savedReport.severity).toBe('low');
    });
  });

  describe('Report Model Methods', () => {
    it('should calculate risk score', async () => {
      const reportData = {
        scan: testScan._id,
        user: testUser._id,
        title: 'Risk Score Report',
        severity: 'high',
        findings: [
          { type: 'SSL', description: 'Critical SSL vulnerability', score: 8.5 },
          { type: 'Headers', description: 'Missing security headers', score: 6.2 }
        ]
      };

      const report = new Report(reportData);
      const savedReport = await report.save();

      const expectedRiskScore = (8.5 + 6.2) / 2;
      expect(savedReport.calculateRiskScore()).toBeCloseTo(expectedRiskScore);
    });

    it('should add and validate findings', async () => {
      const reportData = {
        scan: testScan._id,
        user: testUser._id,
        title: 'Findings Report'
      };

      const report = new Report(reportData);

      // Add findings
      report.findings.push({
        type: 'Performance',
        description: 'Slow page load',
        score: 5.0
      });

      const savedReport = await report.save();

      expect(savedReport.findings).toHaveLength(1);
      expect(savedReport.findings[0].type).toBe('Performance');
    });
  });

  describe('Report Model Timestamps', () => {
    it('should automatically add timestamps', async () => {
      const reportData = {
        scan: testScan._id,
        user: testUser._id,
        title: 'Timestamp Report'
      };

      const report = new Report(reportData);
      const savedReport = await report.save();

      expect(savedReport.createdAt).toBeDefined();
      expect(savedReport.updatedAt).toBeDefined();
    });
  });

  describe('Report Model Populate', () => {
    it('should populate scan and user references', async () => {
      const reportData = {
        scan: testScan._id,
        user: testUser._id,
        title: 'Populated Report'
      };

      const report = new Report(reportData);
      const savedReport = await report.save();

      const populatedReport = await Report.findById(savedReport._id)
        .populate('scan')
        .populate('user');

      expect(populatedReport.scan.url).toBe(testScan.url);
      expect(populatedReport.user.email).toBe(testUser.email);
    });
  });
});

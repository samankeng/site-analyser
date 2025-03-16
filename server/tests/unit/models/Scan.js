import mongoose from 'mongoose';
import Scan from '../../src/models/Scan';
import User from '../../src/models/User';

describe('Scan Model Test', () => {
  let testUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create a test user
    testUser = new User({
      email: 'scanuser@example.com',
      username: 'scanuser',
      password: 'TestPassword123!'
    });
    await testUser.save();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Scan.deleteMany({});
  });

  describe('Scan Model Validation', () => {
    it('should create & save scan successfully', async () => {
      const scanData = {
        url: 'https://example.com',
        user: testUser._id,
        scanType: ['headers', 'ssl'],
        status: 'pending'
      };

      const validScan = new Scan(scanData);
      const savedScan = await validScan.save();

      // Assert
      expect(savedScan._id).toBeDefined();
      expect(savedScan.url).toBe(scanData.url);
      expect(savedScan.user.toString()).toBe(testUser._id.toString());
      expect(savedScan.scanType).toEqual(expect.arrayContaining(scanData.scanType));
    });

    it('should fail to save scan without required fields', async () => {
      const scanWithoutRequiredField = new Scan({
        url: 'https://example.com'
      });

      let err;
      try {
        await scanWithoutRequiredField.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should validate URL format', async () => {
      const invalidUrls = [
        'not-a-url',
        'httpsinvalid',
        'http:/incomplete'
      ];

      for (const invalidUrl of invalidUrls) {
        const scanData = {
          url: invalidUrl,
          user: testUser._id,
          scanType: ['headers']
        };

        const invalidScan = new Scan(scanData);

        let err;
        try {
          await invalidScan.save();
        } catch (error) {
          err = error;
        }

        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      }
    });
  });

  describe('Scan Model Methods', () => {
    it('should update scan status', async () => {
      const scanData = {
        url: 'https://example.com',
        user: testUser._id,
        scanType: ['headers', 'ssl'],
        status: 'pending'
      };

      const scan = new Scan(scanData);
      await scan.save();

      // Update status
      scan.status = 'completed';
      const updatedScan = await scan.save();

      expect(updatedScan.status).toBe('completed');
    });

    it('should generate unique scan identifier', async () => {
      const scanData = {
        url: 'https://example.com',
        user: testUser._id,
        scanType: ['headers', 'ssl']
      };

      const scan = new Scan(scanData);
      await scan.save();

      expect(scan.scanIdentifier).toBeDefined();
      expect(typeof scan.scanIdentifier).toBe('string');
      expect(scan.scanIdentifier.length).toBeGreaterThan(0);
    });

    it('should set default values correctly', async () => {
      const scanData = {
        url: 'https://example.com',
        user: testUser._id,
        scanType: ['headers']
      };

      const scan = new Scan(scanData);
      await scan.save();

      // Check default status
      expect(scan.status).toBe('pending');

      // Check createdAt is set
      expect(scan.createdAt).toBeDefined();
    });
  });

  describe('Scan Model Relationships', () => {
    it('should reference user correctly', async () => {
      const scanData = {
        url: 'https://example.com',
        user: testUser._id,
        scanType: ['headers', 'ssl']
      };

      const scan = new Scan(scanData);
      await scan.save();

      // Populate user
      const populatedScan = await Scan.findById(scan._id).populate('user');

      expect(populatedScan.user).toBeTruthy();
      expect(populatedScan.user.email).toBe(testUser.email);
    });
  });
});

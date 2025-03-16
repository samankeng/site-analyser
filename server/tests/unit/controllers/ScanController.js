import { jest } from '@jest/globals';
import ScanController from '../../src/api/scans/controller';
import Scan from '../../src/models/Scan';
import ApiError from '../../src/utils/ApiError';
import validators from '../../src/utils/validators';

describe('Scan Controller Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: { _id: 'mockUserId' },
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    mockNext = jest.fn();

    // Spy on URL validation
    jest.spyOn(validators, 'isValidURL').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createScan', () => {
    it('should create a new scan successfully', async () => {
      const scanData = {
        url: 'https://example.com',
        scanType: ['headers', 'ssl', 'performance']
      };
      mockReq.body = scanData;

      // Mock scan service
      const mockScanService = {
        initiateScan: jest.fn().mockResolvedValue({
          _id: 'mockScanId',
          ...scanData,
          user: mockReq.user._id,
          status: 'pending',
          createdAt: new Date()
        })
      };
      const originalScanService = ScanController.scanService;
      ScanController.scanService = mockScanService;

      // Mock Scan.create
      jest.spyOn(Scan, 'create').mockResolvedValue({
        _id: 'mockScanId',
        ...scanData,
        user: mockReq.user._id,
        status: 'pending',
        createdAt: new Date()
      });

      await ScanController.createScan(mockReq, mockRes, mockNext);

      // Verify URL validation
      expect(validators.isValidURL).toHaveBeenCalledWith(scanData.url);

      // Verify Scan.create was called
      expect(Scan.create).toHaveBeenCalledWith({
        ...scanData,
        user: mockReq.user._id
      });

      // Verify scan service was called
      expect(mockScanService.initiateScan).toHaveBeenCalled();

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        url: scanData.url,
        scanType: scanData.scanType
      }));

      // Restore original scan service
      ScanController.scanService = originalScanService;
    });

    it('should throw an error for invalid URL', async () => {
      const scanData = {
        url: 'invalid-url',
        scanType: ['headers']
      };
      mockReq.body = scanData;

      // Mock URL validation to return false
      validators.isValidURL.mockReturnValue(false);

      await ScanController.createScan(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should throw an error if no scan types are provided', async () => {
      const scanData = {
        url: 'https://example.com',
        scanType: []
      };
      mockReq.body = scanData;

      await ScanController.createScan(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('getScanById', () => {
    it('should retrieve a specific scan for the authenticated user', async () => {
      const mockScan = {
        _id: 'mockScanId',
        url: 'https://example.com',
        user: mockReq.user._id,
        scanType: ['headers', 'ssl'],
        status: 'completed',
        results: {}
      };
      mockReq.params.id = mockScan._id;

      // Mock Scan.findById to return the scan
      jest.spyOn(Scan, 'findById').mockResolvedValue(mockScan);

      await ScanController.getScanById(mockReq, mockRes, mockNext);

      // Verify Scan.findById was called
      expect(Scan.findById).toHaveBeenCalledWith(mockScan._id);

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockScan);
    });

    it('should throw an error if scan is not found', async () => {
      mockReq.params.id = 'nonexistentScanId';

      // Mock Scan.findById to return null
      jest.spyOn(Scan, 'findById').mockResolvedValue(null);

      await ScanController.getScanById(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should throw an error if scan does not belong to the user', async () => {
      const mockScan = {
        _id: 'mockScanId',
        url: 'https://example.com',
        user: 'differentUserId',
        scanType: ['headers', 'ssl']
      };
      mockReq.params.id = mockScan._id;

      // Mock Scan.findById to return the scan
      jest.spyOn(Scan, 'findById').mockResolvedValue(mockScan);

      await ScanController.getScanById(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('getAllScans', () => {
    it('should retrieve all scans for the authenticated user', async () => {
      const mockScans = [
        {
          _id: 'scan1',
          url: 'https://example1.com',
          user: mockReq.user._id,
          scanType: ['headers'],
          status: 'completed'
        },
        {
          _id: 'scan2',
          url: 'https://example2.com',
          user: mockReq.user._id,
          scanType: ['ssl'],
          status: 'pending'
        }
      ];

      // Mock query parameters
      mockReq.query = {
        status: 'completed',
        limit: '10',
        page: '1'
      };

      // Mock Scan.find and paginate
      jest.spyOn(Scan, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockScans)
      });

      // Mock total count
      jest.spyOn(Scan, 'countDocuments').mockResolvedValue(mockScans.length);

      await ScanController.getAllScans(mockReq, mockRes, mockNext);

      // Verify Scan.find was called with correct filters
      expect(Scan.find).toHaveBeenCalledWith({
        user: mockReq.user._id,
        status: 'completed'
      });

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        scans: mockScans,
        total: mockScans.length,
        page: 1,
        limit: 10
      });
    });

    it('should handle default query parameters', async () => {
      const mockScans = [];

      // No query parameters
      mockReq.query = {};

      // Mock Scan.find and paginate
      jest.spyOn(Scan, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockScans)
      });

      // Mock total count
      jest.spyOn(Scan, 'countDocuments').mockResolvedValue(0);

      await ScanController.getAllScans(mockReq, mockRes, mockNext);

      // Verify Scan.find was called with default filters
      expect(Scan.find).toHaveBeenCalledWith({
        user: mockReq.user._id
      });

      // Verify response with default values
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        scans: [],
        total: 0,
        page: 1,
        limit: 10
      });
    });
  });

  describe('deleteScan', () => {
    it('should delete a scan successfully', async () => {
      const mockScan = {
        _id: 'mockScanId',
        url: 'https://example.com',
        user: mockReq.user._id,
        scanType: ['headers', 'ssl']
      };
      mockReq.params.id = mockScan._id;

      // Mock Scan.findById to return the scan
      jest.spyOn(Scan, 'findById').mockResolvedValue(mockScan);

      // Mock Scan.findByIdAndDelete to return the deleted scan
      jest.spyOn(Scan, 'findByIdAndDelete').mockResolvedValue(mockScan);

      // Mock scan service cleanup
      const mockScanService = {
        cleanupScanResources: jest.fn().mockResolvedValue(true)
      };
      const originalScanService = ScanController.scanService;
      ScanController.scanService = mockScanService;

      await ScanController.deleteScan(mockReq, mockRes, mockNext);

      // Verify Scan.findById was called
      expect(Scan.findById).toHaveBeenCalledWith(mockScan._id);

      // Verify Scan.findByIdAndDelete was called
      expect(Scan.findByIdAndDelete).toHaveBeenCalledWith(mockScan._id);

      // Verify scan service cleanup was called
      expect(mockScanService.cleanupScanResources).toHaveBeenCalledWith(mockScan);

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockScan);

      // Restore original scan service
      ScanController.scanService = originalScanService;
    });

    it('should throw an error if scan is not found', async () => {
      mockReq.params.id = 'nonexistentScanId';

      // Mock Scan.findById to return null
      jest.spyOn(Scan, 'findById').mockResolvedValue(null);

      await ScanController.deleteScan(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it('should throw an error if scan does not belong to the user', async () => {
      const mockScan = {
        _id: 'mockScanId',
        url: 'https://example.com',
        user: 'differentUserId',
        scanType: ['headers', 'ssl']
      };
      mockReq.params.id = mockScan._id;

      // Mock Scan.findById to return the scan
      jest.spyOn(Scan, 'findById').mockResolvedValue(mockScan);

      await ScanController.deleteScan(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });
});

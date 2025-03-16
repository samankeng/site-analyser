import { jest } from '@jest/globals';
import ScanService from '../../../src/services/scanners/ScanService';
import HeaderScanner from '../../../src/services/scanners/HeaderScanner';
import SslScanner from '../../../src/services/scanners/SslScanner';
import PerformanceScanner from '../../../src/services/scanners/PerformanceScanner';
import Scan from '../../../src/models/Scan';
import Result from '../../../src/models/Result';

describe('Scan Service', () => {
  let mockScan;
  let scanService;

  beforeEach(() => {
    // Create a mock scan
    mockScan = {
      _id: 'mockScanId',
      url: 'https://example.com',
      scanType: ['headers', 'ssl', 'performance'],
      status: 'pending'
    };

    // Create a new instance of ScanService for each test
    scanService = new ScanService();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('initiateScan', () => {
    it('should initiate scan with multiple scan types', async () => {
      // Mock individual scanner methods
      jest.spyOn(HeaderScanner, 'scan').mockResolvedValue({
        type: 'headers',
        findings: [{ description: 'Missing security header' }]
      });

      jest.spyOn(SslScanner, 'scan').mockResolvedValue({
        type: 'ssl',
        findings: [{ description: 'Weak SSL configuration' }]
      });

      jest.spyOn(PerformanceScanner, 'scan').mockResolvedValue({
        type: 'performance',
        findings: [{ description: 'Slow page load' }]
      });

      // Mock Result.create
      jest.spyOn(Result, 'create').mockResolvedValue({});

      // Mock Scan.findByIdAndUpdate
      jest.spyOn(Scan, 'findByIdAndUpdate').mockResolvedValue({
        ...mockScan,
        status: 'completed'
      });

      const result = await scanService.initiateScan(mockScan);

      // Verify individual scanners were called
      expect(HeaderScanner.scan).toHaveBeenCalledWith(mockScan.url);
      expect(SslScanner.scan).toHaveBeenCalledWith(mockScan.url);
      expect(PerformanceScanner.scan).toHaveBeenCalledWith(mockScan.url);

      // Verify Result.create was called for each scan type
      expect(Result.create).toHaveBeenCalledTimes(3);

      // Verify Scan was updated
      expect(Scan.findByIdAndUpdate).toHaveBeenCalledWith(
        mockScan._id, 
        { status: 'completed' }, 
        { new: true }
      );

      // Verify result contains scan details
      expect(result.status).toBe('completed');
    });

    it('should handle partial scan type failures', async () => {
      // Mock scanner methods with mixed results
      jest.spyOn(HeaderScanner, 'scan').mockResolvedValue({
        type: 'headers',
        findings: [{ description: 'Missing security header' }]
      });

      jest.spyOn(SslScanner, 'scan').mockRejectedValue(new Error('SSL scan failed'));

      jest.spyOn(PerformanceScanner, 'scan').mockResolvedValue({
        type: 'performance',
        findings: [{ description: 'Slow page load' }]
      });

      // Mock Result.create
      jest.spyOn(Result, 'create').mockResolvedValue({});

      // Mock Scan.findByIdAndUpdate
      jest.spyOn(Scan, 'findByIdAndUpdate').mockResolvedValue({
        ...mockScan,
        status: 'partial'
      });

      const result = await scanService.initiateScan(mockScan);

      // Verify some scanners were processed
      expect(HeaderScanner.scan).toHaveBeenCalledWith(mockScan.url);
      expect(SslScanner.scan).toHaveBeenCalledWith(mockScan.url);

      // Verify Result.create was called for successful scans
      expect(Result.create).toHaveBeenCalledTimes(2);

      // Verify Scan was updated with partial status
      expect(Scan.findByIdAndUpdate).toHaveBeenCalledWith(
        mockScan._id, 
        { status: 'partial' }, 
        { new: true }
      );

      // Verify result contains partial status
      expect(result.status).toBe('partial');
    });

    it('should handle complete scan failure', async () => {
      // Mock all scanner methods to fail
      jest.spyOn(HeaderScanner, 'scan').mockRejectedValue(new Error('Header scan failed'));
      jest.spyOn(SslScanner, 'scan').mockRejectedValue(new Error('SSL scan failed'));
      jest.spyOn(PerformanceScanner, 'scan').mockRejectedValue(new Error('Performance scan failed'));

      // Mock Scan.findByIdAndUpdate
      jest.spyOn(Scan, 'findByIdAndUpdate').mockResolvedValue({
        ...mockScan,
        status: 'failed'
      });

      const result = await scanService.initiateScan(mockScan);

      // Verify all scanners were attempted
      expect(HeaderScanner.scan).toHaveBeenCalledWith(mockScan.url);
      expect(SslScanner.scan).toHaveBeenCalledWith(mockScan.url);
      expect(PerformanceScanner.scan).toHaveBeenCalledWith(mockScan.url);

      // Verify Scan was updated with failed status
      expect(Scan.findByIdAndUpdate).toHaveBeenCalledWith(
        mockScan._id, 
        { status: 'failed' }, 
        { new: true }
      );

      // Verify result contains failed status
      expect(result.status).toBe('failed');
    });
  });

  describe('cleanupScanResources', () => {
    it('should delete associated scan results', async () => {
      // Mock Result.deleteMany
      jest.spyOn(Result, 'deleteMany').mockResolvedValue({
        deletedCount: 2
      });

      const deletedCount = await scanService.cleanupScanResources(mockScan);

      // Verify Result.deleteMany was called with correct scan ID
      expect(Result.deleteMany).toHaveBeenCalledWith({ scan: mockScan._id });

      // Verify correct number of results were deleted
      expect(deletedCount).toBe(2);
    });

    it('should handle errors during resource cleanup', async () => {
      // Mock Result.deleteMany to throw an error
      jest.spyOn(Result, 'deleteMany').mockRejectedValue(new Error('Deletion failed'));

      await expect(scanService.cleanupScanResources(mockScan)).rejects.toThrow('Deletion failed');
    });
  });
});

import { jest } from '@jest/globals';
import NotificationService from '../../../src/services/notifications/NotificationService';
import EmailService from '../../../src/services/notifications/EmailService';
import Alert from '../../../src/models/Alert';
import User from '../../../src/models/User';

describe('Notification Service', () => {
  let notificationService;
  let mockUser;
  let mockScan;

  beforeEach(() => {
    // Create a new instance of NotificationService for each test
    notificationService = new NotificationService();

    // Create mock user and scan
    mockUser = {
      _id: 'mockUserId',
      email: 'user@example.com',
      notificationPreferences: {
        email: true,
        sms: false
      }
    };

    mockScan = {
      _id: 'mockScanId',
      url: 'https://example.com',
      user: mockUser._id
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createScanAlert', () => {
    it('should create an alert for high severity scan', async () => {
      const scanResult = {
        type: 'headers',
        severity: 'high',
        findings: [
          { description: 'Missing security headers' }
        ]
      };

      // Mock User.findById
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      // Mock Alert.create
      jest.spyOn(Alert, 'create').mockResolvedValue({
        _id: 'mockAlertId',
        scan: mockScan._id,
        user: mockUser._id,
        severity: 'high',
        message: 'Security vulnerabilities detected'
      });

      // Mock EmailService
      jest.spyOn(EmailService, 'sendAlertEmail').mockResolvedValue(true);

      const alert = await notificationService.createScanAlert(mockScan, scanResult);

      // Verify User.findById was called
      expect(User.findById).toHaveBeenCalledWith(mockScan.user);

      // Verify Alert.create was called
      expect(Alert.create).toHaveBeenCalledWith({
        scan: mockScan._id,
        user: mockUser._id,
        type: 'headers',
        severity: 'high',
        message: expect.any(String),
        details: scanResult.findings
      });

      // Verify email was sent for high severity alert
      expect(EmailService.sendAlertEmail).toHaveBeenCalledWith({
        user: mockUser,
        alert: expect.objectContaining({
          severity: 'high'
        })
      });

      // Verify returned alert
      expect(alert).toEqual(expect.objectContaining({
        severity: 'high',
        scan: mockScan._id
      }));
    });

    it('should not send email for low severity scan', async () => {
      const scanResult = {
        type: 'performance',
        severity: 'low',
        findings: [
          { description: 'Minor performance issue' }
        ]
      };

      // Mock User.findById
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      // Mock Alert.create
      jest.spyOn(Alert, 'create').mockResolvedValue({
        _id: 'mockAlertId',
        scan: mockScan._id,
        user: mockUser._id,
        severity: 'low',
        message: 'Minor performance observations'
      });

      // Mock EmailService
      jest.spyOn(EmailService, 'sendAlertEmail').mockResolvedValue(true);

      const alert = await notificationService.createScanAlert(mockScan, scanResult);

      // Verify Alert.create was called
      expect(Alert.create).toHaveBeenCalledWith({
        scan: mockScan._id,
        user: mockUser._id,
        type: 'performance',
        severity: 'low',
        message: expect.any(String),
        details: scanResult.findings
      });

      // Verify email was NOT sent for low severity alert
      expect(EmailService.sendAlertEmail).not.toHaveBeenCalled();

      // Verify returned alert
      expect(alert).toEqual(expect.objectContaining({
        severity: 'low',
        scan: mockScan._id
      }));
    });

    it('should handle errors during alert creation', async () => {
      const scanResult = {
        type: 'ssl',
        severity: 'high',
        findings: [
          { description: 'Critical SSL vulnerability' }
        ]
      };

      // Mock User.findById to throw an error
      jest.spyOn(User, 'findById').mockRejectedValue(new Error('User not found'));

      await expect(notificationService.createScanAlert(mockScan, scanResult)).rejects.toThrow('User not found');
    });
  });

  describe('removeReportNotifications', () => {
    it('should remove alerts associated with a report', async () => {
      const mockReportId = 'mockReportId';

      // Mock Alert.deleteMany
      jest.spyOn(Alert, 'deleteMany').mockResolvedValue({
        deletedCount: 2
      });

      const deletedCount = await notificationService.removeReportNotifications(mockReportId);

      // Verify Alert.deleteMany was called with correct report ID
      expect(Alert.deleteMany).toHaveBeenCalledWith({ report: mockReportId });

      // Verify correct number of alerts were deleted
      expect(deletedCount).toBe(2);
    });

    it('should handle errors during notification removal', async () => {
      const mockReportId = 'mockReportId';

      // Mock Alert.deleteMany to throw an error
      jest.spyOn(Alert, 'deleteMany').mockRejectedValue(new Error('Deletion failed'));

      await expect(notificationService.removeReportNotifications(mockReportId)).rejects.toThrow('Deletion failed');
    });
  });
});

import { jest } from "@jest/globals";
import ReportController from "../../src/api/reports/controller";
import Report from "../../src/models/Report";
import Scan from "../../src/models/Scan";
import ApiError from "../../src/utils/ApiError";

describe("Report Controller Unit Tests", () => {
  let mockReq, mockRes, mockNext;
  let mockScan;

  beforeEach(() => {
    // Setup mock scan for common use across tests
    mockScan = {
      _id: "mockScanId",
      url: "https://example.com",
      user: "mockUserId",
      scanType: ["headers", "ssl"],
    };

    // Create mock request object
    mockReq = {
      body: {},
      user: { _id: "mockUserId" },
      params: {},
    };

    // Create mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    // Create mock next function
    mockNext = jest.fn();

    // Mock Scan.findById to return a scan for most tests
    jest.spyOn(Scan, "findById").mockResolvedValue(mockScan);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createReport", () => {
    it("should create a new report successfully", async () => {
      const reportData = {
        scan: mockScan._id,
        title: "Security Assessment Report",
        summary: "Detailed security analysis",
        severity: "medium",
        findings: [{ type: "SSL", description: "Weak SSL configuration" }],
      };
      mockReq.body = reportData;

      // Mock Report.create to return a report object
      const createdReport = {
        _id: "mockReportId",
        ...reportData,
        user: mockReq.user._id,
        createdAt: new Date(),
      };
      jest.spyOn(Report, "create").mockResolvedValue(createdReport);

      // Mock AI service for report generation
      const mockAIService = {
        generateReportInsights: jest.fn().mockResolvedValue({
          additionalFindings: [],
          summary: "AI-enhanced summary",
        }),
      };
      const originalAIService = ReportController.aiService;
      ReportController.aiService = mockAIService;

      await ReportController.createReport(mockReq, mockRes, mockNext);

      // Verify Scan.findById was called
      expect(Scan.findById).toHaveBeenCalledWith(mockScan._id);

      // Verify Report.create was called with correct data
      expect(Report.create).toHaveBeenCalledWith({
        ...reportData,
        user: mockReq.user._id,
      });

      // Verify AI service was called
      expect(mockAIService.generateReportInsights).toHaveBeenCalledWith(
        expect.objectContaining({
          scan: mockScan,
          findings: reportData.findings,
        })
      );

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdReport);

      // Restore original AI service
      ReportController.aiService = originalAIService;
    });

    it("should throw an error if scan does not exist", async () => {
      const reportData = {
        scan: "nonexistentScanId",
        title: "Security Assessment Report",
        summary: "Detailed security analysis",
        severity: "medium",
      };
      mockReq.body = reportData;

      // Mock Scan.findById to return null
      Scan.findById.mockResolvedValue(null);

      await ReportController.createReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should throw an error if scan does not belong to the user", async () => {
      const reportData = {
        scan: "mockScanId",
        title: "Security Assessment Report",
        summary: "Detailed security analysis",
        severity: "medium",
      };
      mockReq.body = reportData;

      // Mock Scan.findById to return a scan with different user
      Scan.findById.mockResolvedValue({
        ...mockScan,
        user: "differentUserId",
      });

      await ReportController.createReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should handle report creation with missing optional fields", async () => {
      const reportData = {
        scan: mockScan._id,
        title: "Minimal Report",
      };
      mockReq.body = reportData;

      // Mock Report.create to return a report object
      const createdReport = {
        _id: "mockReportId",
        ...reportData,
        user: mockReq.user._id,
        severity: "low", // Default severity
        summary: "",
        findings: [],
        createdAt: new Date(),
      };
      jest.spyOn(Report, "create").mockResolvedValue(createdReport);

      await ReportController.createReport(mockReq, mockRes, mockNext);

      // Verify Report.create was called with default values
      expect(Report.create).toHaveBeenCalledWith({
        ...reportData,
        user: mockReq.user._id,
        severity: "low",
        summary: "",
        findings: [],
      });

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdReport);
    });
  });

  describe("getReportById", () => {
    it("should retrieve a specific report for the authenticated user", async () => {
      const mockReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: mockReq.user._id,
        title: "Detailed Security Report",
        summary: "Comprehensive security analysis",
        severity: "high",
        findings: [{ type: "SSL", description: "Weak SSL configuration" }],
      };
      mockReq.params.id = mockReport._id;

      // Mock Report.findById to return the report
      jest.spyOn(Report, "findById").mockResolvedValue(mockReport);

      await ReportController.getReportById(mockReq, mockRes, mockNext);

      // Verify Report.findById was called
      expect(Report.findById).toHaveBeenCalledWith(mockReport._id);

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockReport);
    });

    it("should throw an error if report is not found", async () => {
      mockReq.params.id = "nonexistentReportId";

      // Mock Report.findById to return null
      jest.spyOn(Report, "findById").mockResolvedValue(null);

      await ReportController.getReportById(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should throw an error if report does not belong to the user", async () => {
      const mockReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: "differentUserId",
        title: "Another Security Report",
        severity: "medium",
      };
      mockReq.params.id = mockReport._id;

      // Mock Report.findById to return the report
      jest.spyOn(Report, "findById").mockResolvedValue(mockReport);

      await ReportController.getReportById(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe("getAllReports", () => {
    it("should retrieve all reports for the authenticated user with filters", async () => {
      const mockReports = [
        {
          _id: "report1",
          scan: "scan1",
          user: mockReq.user._id,
          title: "High Severity Report",
          severity: "high",
        },
        {
          _id: "report2",
          scan: "scan2",
          user: mockReq.user._id,
          title: "Medium Severity Report",
          severity: "medium",
        },
      ];

      // Mock query parameters
      mockReq.query = {
        severity: "high",
        limit: "10",
        page: "1",
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      // Mock Report.find and paginate
      jest.spyOn(Report, "find").mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockReports),
      });

      // Mock total count
      jest
        .spyOn(Report, "countDocuments")
        .mockResolvedValue(mockReports.length);

      await ReportController.getAllReports(mockReq, mockRes, mockNext);

      // Verify Report.find was called with correct filters
      expect(Report.find).toHaveBeenCalledWith({
        user: mockReq.user._id,
        severity: "high",
      });

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        reports: mockReports,
        total: mockReports.length,
        page: 1,
        limit: 10,
      });
    });

    it("should handle default query parameters", async () => {
      const mockReports = [];

      // No query parameters
      mockReq.query = {};

      // Mock Report.find and paginate
      jest.spyOn(Report, "find").mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockReports),
      });

      // Mock total count
      jest.spyOn(Report, "countDocuments").mockResolvedValue(0);

      await ReportController.getAllReports(mockReq, mockRes, mockNext);

      // Verify Report.find was called with default filters
      expect(Report.find).toHaveBeenCalledWith({
        user: mockReq.user._id,
      });

      // Verify response with default values
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        reports: [],
        total: 0,
        page: 1,
        limit: 10,
      });
    });
  });

  describe("updateReport", () => {
    it("should update a report successfully", async () => {
      const existingReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: mockReq.user._id,
        title: "Original Report",
        summary: "Original summary",
        severity: "low",
        findings: [],
      };
      const updateData = {
        title: "Updated Report",
        summary: "Updated comprehensive summary",
        severity: "high",
        findings: [
          { type: "Headers", description: "Missing security headers" },
        ],
      };
      mockReq.params.id = existingReport._id;
      mockReq.body = updateData;

      // Mock Report.findById to return the existing report
      jest.spyOn(Report, "findById").mockResolvedValue(existingReport);

      // Mock Report.findByIdAndUpdate to return the updated report
      const updatedReport = {
        ...existingReport,
        ...updateData,
      };
      jest.spyOn(Report, "findByIdAndUpdate").mockResolvedValue(updatedReport);

      await ReportController.updateReport(mockReq, mockRes, mockNext);

      // Verify Report.findById was called
      expect(Report.findById).toHaveBeenCalledWith(existingReport._id);

      // Verify Report.findByIdAndUpdate was called with correct parameters
      expect(Report.findByIdAndUpdate).toHaveBeenCalledWith(
        existingReport._id,
        updateData,
        { new: true }
      );

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedReport);
    });

    it("should throw an error if report is not found", async () => {
      mockReq.params.id = "nonexistentReportId";
      mockReq.body = { title: "Updated Report" };

      // Mock Report.findById to return null
      jest.spyOn(Report, "findById").mockResolvedValue(null);

      await ReportController.updateReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should throw an error if report does not belong to the user", async () => {
      const existingReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: "differentUserId",
        title: "Original Report",
        severity: "low",
      };
      const updateData = {
        title: "Updated Report",
      };
      mockReq.params.id = existingReport._id;
      mockReq.body = updateData;

      // Mock Report.findById to return the existing report
      jest.spyOn(Report, "findById").mockResolvedValue(existingReport);

      await ReportController.updateReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe("deleteReport", () => {
    it("should delete a report successfully", async () => {
      const mockReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: mockReq.user._id,
        title: "Report to Delete",
        severity: "low",
      };
      mockReq.params.id = mockReport._id;

      // Mock Report.findById to return the report
      jest.spyOn(Report, "findById").mockResolvedValue(mockReport);

      // Mock Report.findByIdAndDelete to return the deleted report
      jest.spyOn(Report, "findByIdAndDelete").mockResolvedValue(mockReport);

      await ReportController.deleteReport(mockReq, mockRes, mockNext);

      // Verify Report.findById was called
      expect(Report.findById).toHaveBeenCalledWith(mockReport._id);

      // Verify Report.findByIdAndDelete was called
      expect(Report.findByIdAndDelete).toHaveBeenCalledWith(mockReport._id);

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockReport);

      // Verify next was not called
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw an error if report is not found", async () => {
      mockReq.params.id = "nonexistentReportId";

      // Mock Report.findById to return null
      jest.spyOn(Report, "findById").mockResolvedValue(null);

      await ReportController.deleteReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should throw an error if report does not belong to the user", async () => {
      const mockReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: "differentUserId",
        title: "Report to Delete",
        severity: "low",
      };
      mockReq.params.id = mockReport._id;

      // Mock Report.findById to return the report
      jest.spyOn(Report, "findById").mockResolvedValue(mockReport);

      await ReportController.deleteReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should handle deletion failure", async () => {
      const mockReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: mockReq.user._id,
        title: "Report to Delete",
        severity: "low",
      };
      mockReq.params.id = mockReport._id;

      // Mock Report.findById to return the report
      jest.spyOn(Report, "findById").mockResolvedValue(mockReport);

      // Mock Report.findByIdAndDelete to throw an error
      jest
        .spyOn(Report, "findByIdAndDelete")
        .mockRejectedValue(new Error("Deletion failed"));

      await ReportController.deleteReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });
  describe("shareReport", () => {
    it("should share a report successfully with an email", async () => {
      const mockReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: mockReq.user._id,
        title: "Security Assessment Report",
        severity: "high",
      };
      mockReq.params.id = mockReport._id;
      mockReq.body = {
        email: "recipient@example.com",
        message: "Optional sharing message",
      };

      // Mock Report.findById to return the report
      jest.spyOn(Report, "findById").mockResolvedValue(mockReport);

      // Mock email service
      const mockEmailService = {
        sendReportShareEmail: jest.fn().mockResolvedValue(true),
      };
      const originalEmailService = ReportController.emailService;
      ReportController.emailService = mockEmailService;

      await ReportController.shareReport(mockReq, mockRes, mockNext);

      // Verify Report.findById was called
      expect(Report.findById).toHaveBeenCalledWith(mockReport._id);

      // Verify email service was called
      expect(mockEmailService.sendReportShareEmail).toHaveBeenCalledWith({
        report: mockReport,
        recipientEmail: "recipient@example.com",
        message: "Optional sharing message",
      });

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Report shared successfully",
      });

      // Restore original email service
      ReportController.emailService = originalEmailService;
    });

    it("should throw an error if report is not found for sharing", async () => {
      mockReq.params.id = "nonexistentReportId";
      mockReq.body = {
        email: "recipient@example.com",
      };

      // Mock Report.findById to return null
      jest.spyOn(Report, "findById").mockResolvedValue(null);

      await ReportController.shareReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should throw an error if report does not belong to the user for sharing", async () => {
      const mockReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: "differentUserId",
        title: "Security Report",
        severity: "medium",
      };
      mockReq.params.id = mockReport._id;
      mockReq.body = {
        email: "recipient@example.com",
      };

      // Mock Report.findById to return the report
      jest.spyOn(Report, "findById").mockResolvedValue(mockReport);

      await ReportController.shareReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should throw an error for invalid email", async () => {
      const mockReport = {
        _id: "mockReportId",
        scan: mockScan._id,
        user: mockReq.user._id,
        title: "Security Assessment Report",
        severity: "high",
      };
      mockReq.params.id = mockReport._id;
      mockReq.body = {
        email: "invalid-email",
      };

      // Mock Report.findById to return the report
      jest.spyOn(Report, "findById").mockResolvedValue(mockReport);

      await ReportController.shareReport(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe("getReportAnalytics", () => {
    it("should retrieve report analytics for the authenticated user", async () => {
      const mockAnalytics = {
        totalReports: 10,
        reportsBySeverity: {
          low: 3,
          medium: 4,
          high: 3,
        },
        mostFrequentVulnerabilities: [
          { type: "SSL", count: 5 },
          { type: "Headers", count: 3 },
        ],
      };

      // Mock aggregation service
      const mockAnalyticsService = {
        generateReportAnalytics: jest.fn().mockResolvedValue(mockAnalytics),
      };
      const originalAnalyticsService = ReportController.analyticsService;
      ReportController.analyticsService = mockAnalyticsService;

      await ReportController.getReportAnalytics(mockReq, mockRes, mockNext);

      // Verify analytics service was called
      expect(mockAnalyticsService.generateReportAnalytics).toHaveBeenCalledWith(
        mockReq.user._id
      );

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockAnalytics);

      // Restore original analytics service
      ReportController.analyticsService = originalAnalyticsService;
    });

    it("should handle errors in report analytics generation", async () => {
      // Mock aggregation service to throw an error
      const mockAnalyticsService = {
        generateReportAnalytics: jest
          .fn()
          .mockRejectedValue(new Error("Analytics generation failed")),
      };
      const originalAnalyticsService = ReportController.analyticsService;
      ReportController.analyticsService = mockAnalyticsService;

      await ReportController.getReportAnalytics(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));

      // Restore original analytics service
      ReportController.analyticsService = originalAnalyticsService;
    });
  });

  describe("exportReports", () => {
    it("should export reports successfully", async () => {
      const mockReports = [
        {
          _id: "report1",
          title: "Report 1",
          severity: "high",
          createdAt: new Date(),
        },
        {
          _id: "report2",
          title: "Report 2",
          severity: "medium",
          createdAt: new Date(),
        },
      ];

      // Mock query parameters
      mockReq.query = {
        format: "csv",
        severity: "high",
      };

      // Mock Report.find
      jest.spyOn(Report, "find").mockResolvedValue(mockReports);

      // Mock export service
      const mockExportService = {
        exportReports: jest.fn().mockResolvedValue({
          filename: "reports_export.csv",
          path: "/path/to/exported/reports.csv",
        }),
      };
      const originalExportService = ReportController.exportService;
      ReportController.exportService = mockExportService;

      await ReportController.exportReports(mockReq, mockRes, mockNext);

      // Verify Report.find was called with correct filters
      expect(Report.find).toHaveBeenCalledWith({
        user: mockReq.user._id,
        severity: "high",
      });

      // Verify export service was called
      expect(mockExportService.exportReports).toHaveBeenCalledWith({
        reports: mockReports,
        format: "csv",
        user: mockReq.user,
      });

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        filename: "reports_export.csv",
        path: "/path/to/exported/reports.csv",
      });

      // Restore original export service
      ReportController.exportService = originalExportService;
    });

    it("should throw an error for invalid export format", async () => {
      mockReq.query = {
        format: "invalidFormat",
      };

      await ReportController.exportReports(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe("bulkDeleteReports", () => {
    it("should bulk delete reports successfully", async () => {
      const reportIds = ["report1", "report2", "report3"];
      mockReq.body = { reportIds };

      // Mock Report.find to return reports belonging to the user
      jest.spyOn(Report, "find").mockResolvedValue(
        reportIds.map((id) => ({
          _id: id,
          user: mockReq.user._id,
        }))
      );

      // Mock bulk delete operation
      jest.spyOn(Report, "deleteMany").mockResolvedValue({
        deletedCount: reportIds.length,
      });

      await ReportController.bulkDeleteReports(mockReq, mockRes, mockNext);

      // Verify Report.find was called to validate ownership
      expect(Report.find).toHaveBeenCalledWith({
        _id: { $in: reportIds },
        user: mockReq.user._id,
      });

      // Verify bulk delete was called
      expect(Report.deleteMany).toHaveBeenCalledWith({
        _id: { $in: reportIds },
        user: mockReq.user._id,
      });

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Reports deleted successfully",
        deletedCount: reportIds.length,
      });
    });

    it("should throw an error if no report IDs are provided", async () => {
      mockReq.body = { reportIds: [] };

      await ReportController.bulkDeleteReports(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should throw an error if some reports do not belong to the user", async () => {
      const reportIds = ["report1", "report2", "report3"];
      mockReq.body = { reportIds };

      // Mock Report.find to return only some reports belonging to the user
      jest.spyOn(Report, "find").mockResolvedValue([
        { _id: "report1", user: mockReq.user._id },
        { _id: "report2", user: "differentUserId" },
      ]);

      await ReportController.bulkDeleteReports(mockReq, mockRes, mockNext);

      // Verify next was called with an ApiError
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });
});

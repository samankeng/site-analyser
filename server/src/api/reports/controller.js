const ScanModel = require('../../models/Scan');
const ResultModel = require('../../models/Result');
const ApiError = require('../../utils/ApiError');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { formatReportData } = require('../../utils/formatters');

/**
 * Report Controller
 * Handles API requests for security reports
 */
class ReportController {
  /**
   * Get all reports for current user
   * @route GET /api/reports
   * @access Private
   */
  getAllReports = asyncHandler(async (req, res) => {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filtering
    const filter = { userId: req.user._id, status: 'completed' };
    
    if (req.query.url) {
      filter.url = { $regex: req.query.url, $options: 'i' };
    }
    
    if (req.query.severity) {
      filter['summary.severity'] = req.query.severity;
    }
    
    if (req.query.fromDate) {
      filter.completedAt = { $gte: new Date(req.query.fromDate) };
    }
    
    if (req.query.toDate) {
      if (!filter.completedAt) filter.completedAt = {};
      filter.completedAt.$lte = new Date(req.query.toDate);
    }
    
    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.completedAt = -1; // Default: newest first
    }
    
    // Execute query
    const total = await ScanModel.countDocuments(filter);
    const reports = await ScanModel.find(filter)
      .sort(sort)
      .skip(startIndex)
      .limit(limit)
      .select('url completedAt summary results')
      .populate('results', 'securityScore vulnerabilities sslGrade headerAnalysis');
    
    // Pagination result
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    res.status(200).json({
      success: true,
      pagination,
      data: reports
    });
  });
  
  /**
   * Get report details by scan ID
   * @route GET /api/reports/:scanId
   * @access Private
   */
  getReportById = asyncHandler(async (req, res) => {
    const { scanId } = req.params;
    
    // Find scan with populated results
    const scan = await ScanModel.findById(scanId).populate('results');
    
    if (!scan) {
      throw new ApiError(404, 'Report not found');
    }
    
    // Check user authorization
    if (scan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to access this report');
    }
    
    // Check if scan is completed
    if (scan.status !== 'completed') {
      throw new ApiError(400, `Cannot retrieve report for a scan with status: ${scan.status}`);
    }
    
    // Format report data
    const report = formatReportData(scan);
    
    res.status(200).json({
      success: true,
      data: report
    });
  });
  
  /**
   * Generate PDF report
   * @route GET /api/reports/:scanId/pdf
   * @access Private
   */
  generatePdfReport = asyncHandler(async (req, res) => {
    const { scanId } = req.params;
    
    // Find scan with populated results
    const scan = await ScanModel.findById(scanId).populate('results');
    
    if (!scan) {
      throw new ApiError(404, 'Report not found');
    }
    
    // Check user authorization
    if (scan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to access this report');
    }
    
    // Check if scan is completed
    if (scan.status !== 'completed') {
      throw new ApiError(400, `Cannot generate PDF for a scan with status: ${scan.status}`);
    }
    
    // Format and generate PDF
    const pdfBuffer = await require('../../services/reports/PdfService').generatePdf(scan);
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=security-report-${scanId}.pdf`);
    
    // Send PDF
    res.send(pdfBuffer);
  });
  
  /**
   * Compare two reports
   * @route GET /api/reports/compare
   * @access Private
   */
  compareReports = asyncHandler(async (req, res) => {
    const { firstScanId, secondScanId } = req.query;
    
    if (!firstScanId || !secondScanId) {
      throw new ApiError(400, 'Please provide two scan IDs to compare');
    }
    
    // Find both scans with populated results
    const firstScan = await ScanModel.findById(firstScanId).populate('results');
    const secondScan = await ScanModel.findById(secondScanId).populate('results');
    
    if (!firstScan || !secondScan) {
      throw new ApiError(404, 'One or both reports not found');
    }
    
    // Check user authorization for both scans
    if (
      (firstScan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') ||
      (secondScan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    ) {
      throw new ApiError(403, 'You are not authorized to access one or both reports');
    }
    
    // Check if scans are completed
    if (firstScan.status !== 'completed' || secondScan.status !== 'completed') {
      throw new ApiError(400, 'Cannot compare reports for scans that are not completed');
    }
    
    // Generate comparison data
    const comparison = {
      firstScan: {
        scanId: firstScan._id,
        url: firstScan.url,
        completedAt: firstScan.completedAt,
        summary: firstScan.summary
      },
      secondScan: {
        scanId: secondScan._id,
        url: secondScan.url,
        completedAt: secondScan.completedAt,
        summary: secondScan.summary
      },
      differences: {
        securityScore: secondScan.results.securityScore - firstScan.results.securityScore,
        vulnerabilities: {
          added: secondScan.results.vulnerabilities.filter(
            v => !firstScan.results.vulnerabilities.some(fv => fv.id === v.id)
          ),
          removed: firstScan.results.vulnerabilities.filter(
            v => !secondScan.results.vulnerabilities.some(sv => sv.id === v.id)
          ),
          changed: secondScan.results.vulnerabilities
            .filter(v => 
              firstScan.results.vulnerabilities.some(
                fv => fv.id === v.id && fv.severity !== v.severity
              )
            )
            .map(v => ({
              id: v.id,
              name: v.name,
              oldSeverity: firstScan.results.vulnerabilities.find(fv => fv.id === v.id).severity,
              newSeverity: v.severity
            }))
        },
        headers: {
          added: Object.keys(secondScan.results.headerAnalysis).filter(
            h => !Object.keys(firstScan.results.headerAnalysis).includes(h)
          ),
          removed: Object.keys(firstScan.results.headerAnalysis).filter(
            h => !Object.keys(secondScan.results.headerAnalysis).includes(h)
          ),
          changed: Object.keys(secondScan.results.headerAnalysis)
            .filter(h => 
              Object.keys(firstScan.results.headerAnalysis).includes(h) && 
              firstScan.results.headerAnalysis[h].score !== secondScan.results.headerAnalysis[h].score
            )
            .map(h => ({
              header: h,
              oldScore: firstScan.results.headerAnalysis[h].score,
              newScore: secondScan.results.headerAnalysis[h].score
            }))
        },
        sslGrade: firstScan.results.sslGrade !== secondScan.results.sslGrade
          ? {
              oldGrade: firstScan.results.sslGrade,
              newGrade: secondScan.results.sslGrade
            }
          : null
      }
    };
    
    res.status(200).json({
      success: true,
      data: comparison
    });
  });
  
  /**
   * Get report summary statistics
   * @route GET /api/reports/stats
   * @access Private
   */
  getReportStats = asyncHandler(async (req, res) => {
    // Time range
    const fromDate = req.query.fromDate 
      ? new Date(req.query.fromDate) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days by default
    
    const toDate = req.query.toDate
      ? new Date(req.query.toDate)
      : new Date();
    
    // Get completed scans in date range
    const scans = await ScanModel.find({
      userId: req.user._id,
      status: 'completed',
      completedAt: { $gte: fromDate, $lte: toDate }
    }).populate('results', 'securityScore vulnerabilities sslGrade');
    
    // Generate statistics
    const stats = {
      totalScans: scans.length,
      averageSecurityScore: scans.reduce((sum, scan) => 
        sum + (scan.results ? scan.results.securityScore : 0), 0) / (scans.length || 1),
      vulnerabilitiesBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      sslGradeDistribution: {
        'A+': 0, 'A': 0, 'A-': 0,
        'B+': 0, 'B': 0, 'B-': 0,
        'C+': 0, 'C': 0, 'C-': 0,
        'D+': 0, 'D': 0, 'D-': 0,
        'F': 0, 'T': 0, 'M': 0
      },
      mostCommonVulnerabilities: {},
      trend: []
    };
    
    // Process scans
    scans.forEach(scan => {
      if (!scan.results) return;
      
      // Count vulnerabilities by severity
      scan.results.vulnerabilities.forEach(vuln => {
        stats.vulnerabilitiesBySeverity[vuln.severity.toLowerCase()] += 1;
        
        // Track most common vulnerabilities
        if (!stats.mostCommonVulnerabilities[vuln.id]) {
          stats.mostCommonVulnerabilities[vuln.id] = {
            name: vuln.name,
            count: 0
          };
        }
        stats.mostCommonVulnerabilities[vuln.id].count += 1;
      });
      
      // Count SSL grades
      if (scan.results.sslGrade) {
        stats.sslGradeDistribution[scan.results.sslGrade] += 1;
      }
      
      // Add to trend data
      stats.trend.push({
        date: scan.completedAt,
        securityScore: scan.results.securityScore,
        url: scan.url
      });
    });
    
    // Sort trend data by date
    stats.trend.sort((a, b) => a.date - b.date);
    
    // Convert most common vulnerabilities to array and sort
    stats.mostCommonVulnerabilities = Object.entries(stats.mostCommonVulnerabilities)
      .map(([id, data]) => ({ id, name: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Get top 10
    
    res.status(200).json({
      success: true,
      data: stats,
      meta: {
        fromDate,
        toDate
      }
    });
  });
  
  /**
   * Export report as CSV
   * @route GET /api/reports/:scanId/csv
   * @access Private
   */
  exportReportCsv = asyncHandler(async (req, res) => {
    const { scanId } = req.params;
    
    // Find scan with populated results
    const scan = await ScanModel.findById(scanId).populate('results');
    
    if (!scan) {
      throw new ApiError(404, 'Report not found');
    }
    
    // Check user authorization
    if (scan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to access this report');
    }
    
    // Check if scan is completed
    if (scan.status !== 'completed') {
      throw new ApiError(400, `Cannot export CSV for a scan with status: ${scan.status}`);
    }
    
    // Generate CSV
    const csvData = await require('../../services/reports/CsvService').generateCsv(scan);
    
    // Set headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=security-report-${scanId}.csv`);
    
    // Send CSV
    res.send(csvData);
  });
}

module.exports = new ReportController();
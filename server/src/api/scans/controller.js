const ScanService = require('../../services/scanners/ScanService');
const ScanModel = require('../../models/Scan');
const ApiError = require('../../utils/ApiError');
const { isValidURL: validateUrl } = require('../../utils/validators');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { SCAN_STATUS } = require('../../constants/scan-constants');
const mongoose = require('mongoose');

/**
 * Security Scan Controller
 * Handles API requests for security scanning functionality
 */
class ScanController {
  /**
   * Get all scans for current user
   * @route GET /api/scans
   * @access Private
   */
  getAllScans = asyncHandler(async (req, res) => {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Filtering
    const filter = { userId: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.url) {
      filter.url = { $regex: req.query.url, $options: 'i' };
    }

    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    // Execute query
    const total = await ScanModel.countDocuments(filter);
    const scans = await ScanModel.find(filter)
      .sort(sort)
      .skip(startIndex)
      .limit(limit)
      .select('url status progress createdAt completedAt summary');

    // Pagination result
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    res.status(200).json({
      success: true,
      pagination,
      data: scans,
    });
  });

  /**
   * Initiate a new security scan
   * @route POST /api/scans
   * @access Private
   */
  initiateNewScan = asyncHandler(async (req, res) => {
    console.log('==== SCAN REQUEST RECEIVED ====');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body:', JSON.stringify(req.body));
    console.log('URL from body:', req.body.url);
    console.log('scanDepth from body:', req.body.scanDepth);
    console.log('options from body:', JSON.stringify(req.body.options));

    const { url, scanDepth = 2, options = {} } = req.body;

    // Validate URL
    if (!url || !validateUrl(url)) {
      throw new ApiError(400, 'Invalid URL provided');
    }

    // Create new scan record
    const scan = await ScanModel.create({
      url,
      scanDepth,
      options,
      userId: req.user._id,
      status: SCAN_STATUS.PENDING,
      createdAt: new Date(),
    });

    try {
      console.log(`Attempting to queue scan: ${scan._id}`);
      await ScanService.queueScan(scan._id);
      console.log(`Scan queued successfully: ${scan._id}`);
    } catch (error) {
      console.error(`Failed to queue scan: ${error.message}`);
      // You may want to set the scan status to failed here
    }

    // Queue scan job
    await ScanService.queueScan(scan._id);

    res.status(201).json({
      success: true,
      message: 'Scan initiated successfully',
      data: {
        scanId: scan._id,
        status: scan.status,
        estimatedTime: scan.getEstimatedTime(),
      },
    });
  });

  /**
   * Get scan status by ID
   * @route GET /api/scans/:scanId
   * @access Private
   */
  getScanStatus = asyncHandler(async (req, res) => {
    const { scanId } = req.params;

    const scan = await ScanModel.findById(scanId);

    if (!scan) {
      throw new ApiError(404, 'Scan not found');
    }

    // Check user authorization
    if (scan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to access this scan');
    }

    res.status(200).json({
      success: true,
      data: {
        scanId: scan._id,
        url: scan.url,
        status: scan.status,
        progress: scan.progress || 0,
        createdAt: scan.createdAt,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        estimatedCompletionTime: scan.estimatedCompletionTime,
        summary: scan.summary,
      },
    });
  });

  /**
   * Get scan results by ID
   * @route GET /api/scans/:scanId/results
   * @access Private
   */
  getScanResults = asyncHandler(async (req, res) => {
    const { scanId } = req.params;

    // Find scan with populated results
    const scan = await ScanModel.findById(scanId).populate('results');

    if (!scan) {
      throw new ApiError(404, 'Scan not found');
    }

    // Check user authorization
    if (scan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to access this scan');
    }

    // Check if scan is completed
    if (scan.status !== SCAN_STATUS.COMPLETED) {
      throw new ApiError(400, `Cannot retrieve results for a scan with status: ${scan.status}`);
    }

    // Check if results exist
    if (!scan.results) {
      throw new ApiError(404, 'Scan results not found');
    }

    res.status(200).json({
      success: true,
      data: {
        scanId: scan._id,
        url: scan.url,
        createdAt: scan.createdAt,
        completedAt: scan.completedAt,
        results: scan.results,
        summary: scan.summary,
        aiAnalysis: scan.aiAnalysis,
      },
    });
  });

  /**
   * Get recent scans for the current user
   * @route GET /api/scans/recent
   * @access Private
   */
  getRecentScans = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 5;

    const scans = await ScanModel.find({ userId: req.user._id })
      .select('url status createdAt completedAt summary')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans,
    });
  });

  /**
 * Cancel an ongoing scan
 * @route DELETE /api/scans/:scanId
 * @access Private
 */
cancelScan = asyncHandler(async (req, res) => {
  const { scanId } = req.params;
  const { force } = req.query; // Add a force query parameter

  const scan = await ScanModel.findById(scanId);

  if (!scan) {
    throw new ApiError(404, 'Scan not found');
  }

  // Check user authorization
  if (scan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not authorized to cancel this scan');
  }

  // Check if scan can be cancelled, unless force=true
  if (!force && scan.status !== SCAN_STATUS.PENDING && scan.status !== SCAN_STATUS.IN_PROGRESS) {
    throw new ApiError(400, `Cannot cancel scan with status: ${scan.status}`);
  }

  // Cancel the scan job
  await ScanService.cancelScan(scanId);

  // Update scan status - if forced and already complete/failed, mark as FAILED instead of CANCELLED
  if (force && (scan.status === SCAN_STATUS.COMPLETED || scan.status === SCAN_STATUS.FAILED)) {
    scan.status = SCAN_STATUS.FAILED;
    scan.error = 'Manually reset due to stuck scan';
  } else {
    scan.status = SCAN_STATUS.CANCELLED;
  }
  
  scan.progress = 100;
  scan.completedAt = new Date();
  await scan.save();

  res.status(200).json({
    success: true,
    message: force ? 'Scan force reset successfully' : 'Scan cancelled successfully',
  });
});

  /**
   * Delete a scan
   * @route DELETE /api/scans/:scanId/delete
   * @access Private
   */
  deleteScan = asyncHandler(async (req, res) => {
    const { scanId } = req.params;

    const scan = await ScanModel.findById(scanId);

    if (!scan) {
      throw new ApiError(404, 'Scan not found');
    }

    // Check user authorization
    if (scan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to delete this scan');
    }

    // Cancel if in progress
    if (scan.status === SCAN_STATUS.PENDING || scan.status === SCAN_STATUS.IN_PROGRESS) {
      await ScanService.cancelScan(scanId);
    }

    // Delete scan and related results
    await ScanModel.deleteOne({ _id: scanId });

    // Delete results if exists
    if (scan.results) {
      await mongoose.model('Result').deleteOne({ _id: scan.results });
    }

    res.status(200).json({
      success: true,
      message: 'Scan deleted successfully',
    });
  });

  

  /**
   * Re-run a previous scan
   * @route POST /api/scans/:scanId/rerun
   * @access Private
   */
  rerunScan = asyncHandler(async (req, res) => {
    const { scanId } = req.params;

    const scan = await ScanModel.findById(scanId);

    if (!scan) {
      throw new ApiError(404, 'Scan not found');
    }

    // Check user authorization
    if (scan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to rerun this scan');
    }

    // Create new scan with same parameters
    const newScan = await ScanModel.create({
      url: scan.url,
      scanDepth: scan.scanDepth,
      options: scan.options,
      userId: req.user._id,
      status: SCAN_STATUS.PENDING,
      createdAt: new Date(),
    });

    // Queue new scan
    await ScanService.queueScan(newScan._id);

    res.status(201).json({
      success: true,
      message: 'Scan rerun initiated successfully',
      data: {
        scanId: newScan._id,
        status: newScan.status,
        estimatedTime: newScan.getEstimatedTime(),
      },
    });
  });
}

module.exports = new ScanController();

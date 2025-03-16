const AlertModel = require('../../models/Alert');
const ApiError = require('../../utils/ApiError');
const { asyncHandler } = require('../../middleware/asyncHandler');
const NotificationService = require('../../services/notifications/NotificationService');

/**
 * Alert Controller
 * Handles API requests for security alerts
 */
class AlertController {
  /**
   * Get all alerts for current user
   * @route GET /api/alerts
   * @access Private
   */
  getAllAlerts = asyncHandler(async (req, res) => {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filtering
    const filter = { userId: req.user._id };
    
    if (req.query.severity) {
      filter.severity = req.query.severity;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.url) {
      filter.url = { $regex: req.query.url, $options: 'i' };
    }
    
    if (req.query.fromDate) {
      filter.createdAt = { $gte: new Date(req.query.fromDate) };
    }
    
    if (req.query.toDate) {
      if (!filter.createdAt) filter.createdAt = {};
      filter.createdAt.$lte = new Date(req.query.toDate);
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
    const total = await AlertModel.countDocuments(filter);
    const alerts = await AlertModel.find(filter)
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
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
      data: alerts
    });
  });
  
  /**
   * Create a new alert
   * @route POST /api/alerts
   * @access Private
   */
  createAlert = asyncHandler(async (req, res) => {
    const { title, message, severity, type, url, scanId, data } = req.body;
    
    // Create alert
    const alert = await AlertModel.create({
      userId: req.user._id,
      title,
      message,
      severity,
      type,
      url,
      scanId,
      data,
      status: 'new',
      createdAt: Date.now()
    });
    
    // Send notification based on user preferences
    const user = await require('../../models/User').findById(req.user._id);
    if (user.preferences && user.preferences.alertNotifications) {
      await NotificationService.sendAlertNotification(user, alert);
    }
    
    res.status(201).json({
      success: true,
      data: alert
    });
  });
  
  /**
   * Get alert by ID
   * @route GET /api/alerts/:alertId
   * @access Private
   */
  getAlertById = asyncHandler(async (req, res) => {
    const { alertId } = req.params;
    
    const alert = await AlertModel.findById(alertId);
    
    if (!alert) {
      throw new ApiError(404, 'Alert not found');
    }
    
    // Check user authorization
    if (alert.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to access this alert');
    }
    
    res.status(200).json({
      success: true,
      data: alert
    });
  });
  
  /**
   * Update alert status
   * @route PUT /api/alerts/:alertId/status
   * @access Private
   */
  updateAlertStatus = asyncHandler(async (req, res) => {
    const { alertId } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['new', 'read', 'resolved', 'ignored'].includes(status)) {
      throw new ApiError(400, 'Invalid status value');
    }
    
    const alert = await AlertModel.findById(alertId);
    
    if (!alert) {
      throw new ApiError(404, 'Alert not found');
    }
    
    // Check user authorization
    if (alert.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to update this alert');
    }
    
    // Update status
    alert.status = status;
    if (status === 'resolved') {
      alert.resolvedAt = Date.now();
    }
    
    await alert.save();
    
    res.status(200).json({
      success: true,
      data: alert
    });
  });
  
  /**
   * Delete an alert
   * @route DELETE /api/alerts/:alertId
   * @access Private
   */
  deleteAlert = asyncHandler(async (req, res) => {
    const { alertId } = req.params;
    
    const alert = await AlertModel.findById(alertId);
    
    if (!alert) {
      throw new ApiError(404, 'Alert not found');
    }
    
    // Check user authorization
    if (alert.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to delete this alert');
    }
    
    await AlertModel.deleteOne({ _id: alertId });
    
    res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    });
  });
  
  /**
   * Batch update alerts
   * @route PUT /api/alerts/batch
   * @access Private
   */
  batchUpdateAlerts = asyncHandler(async (req, res) => {
    const { alertIds, status } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      throw new ApiError(400, 'Alert IDs array is required');
    }
    
    // Validate status
    if (!['new', 'read', 'resolved', 'ignored'].includes(status)) {
      throw new ApiError(400, 'Invalid status value');
    }
    
    // Find alerts and check ownership
    const alerts = await AlertModel.find({
      _id: { $in: alertIds },
      userId: req.user._id
    });
    
    if (alerts.length !== alertIds.length) {
      throw new ApiError(403, 'You are not authorized to update one or more of these alerts');
    }
    
    // Update all matching alerts
    const updateData = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = Date.now();
    }
    
    await AlertModel.updateMany(
      { _id: { $in: alertIds } },
      updateData
    );
    
    res.status(200).json({
      success: true,
      message: `${alerts.length} alerts updated successfully`,
      count: alerts.length
    });
  });
  
  /**
   * Get alert summary and counts
   * @route GET /api/alerts/summary
   * @access Private
   */
  getAlertSummary = asyncHandler(async (req, res) => {
    // Count alerts by status
    const statusCounts = await AlertModel.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Count alerts by severity
    const severityCounts = await AlertModel.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    
    // Get recent alerts
    const recentAlerts = await AlertModel.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Format results
    const summary = {
      totalAlerts: await AlertModel.countDocuments({ userId: req.user._id }),
      byStatus: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, { new: 0, read: 0, resolved: 0, ignored: 0 }),
      bySeverity: severityCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, { critical: 0, high: 0, medium: 0, low: 0, info: 0 }),
      recentAlerts
    };
    
    res.status(200).json({
      success: true,
      data: summary
    });
  });
}

module.exports = new AlertController();
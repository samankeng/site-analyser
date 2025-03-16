const express = require('express');
const controller = require('./controller');
const { protect } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validators');
const validation = require('./validation');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes for all reports and statistics
router.get('/', validateRequest(validation.getReportList), controller.getAllReports);
router.get('/stats', validateRequest(validation.getReportStats), controller.getReportStats);
router.get('/compare', validateRequest(validation.compareReports), controller.compareReports);

// Routes for specific reports
router.get('/:scanId', validateRequest(validation.validateScanId), controller.getReportById);
router.get('/:scanId/pdf', validateRequest(validation.validateScanId), controller.generatePdfReport);
router.get('/:scanId/csv', validateRequest(validation.validateScanId), controller.exportReportCsv);

module.exports = router;
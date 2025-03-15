const express = require('express');
const controller = require('./controller');
const { protect } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validators');
const validation = require('./validation');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Note: Order matters for routes with the same path patterns
// The most specific routes should come first

// Routes that don't need scanId
router.get('/', controller.getAllScans);
router.post('/', validateRequest(validation.initiateNewScan), controller.initiateNewScan);
router.get('/recent', controller.getRecentScans);

// Routes that need scanId
router.get('/:scanId', controller.getScanStatus);
router.get('/:scanId/results', controller.getScanResults);
router.post('/:scanId/rerun', controller.rerunScan);
router.delete('/:scanId', controller.cancelScan);
router.delete('/:scanId/delete', controller.deleteScan);

module.exports = router;
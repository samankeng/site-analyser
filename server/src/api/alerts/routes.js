const express = require('express');
const controller = require('./controller');
const { protect } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validators');
const validation = require('./validation');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes for all alerts and batch operations
router.get('/', validateRequest(validation.getAlertList), controller.getAllAlerts);
router.post('/', validateRequest(validation.createAlert), controller.createAlert);
router.put('/batch', validateRequest(validation.batchUpdateAlerts), controller.batchUpdateAlerts);
router.get('/summary', controller.getAlertSummary);

// Routes for specific alerts
router.get('/:alertId', validateRequest(validation.validateAlertId), controller.getAlertById);
router.put(
  '/:alertId/status',
  validateRequest(validation.updateAlertStatus),
  controller.updateAlertStatus
);
router.delete('/:alertId', validateRequest(validation.validateAlertId), controller.deleteAlert);

// In server/src/api/auth/routes.js, add this line:
console.log('Auth routes loaded');


module.exports = router;

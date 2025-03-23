const express = require('express');
const controller = require('./controller');
const { protect } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validators');
const validation = require('./validation');

const router = express.Router();

// Public routes
//router.post('/register', validateRequest(validation.register), controller.register);

router.use('/register', (req, res, next) => {
  console.log('Processing registration without auth check');
  next();
});

router.post(
  '/register',
  (req, res, next) => {
    console.log('Registration route hit without auth middleware');
    next();
  },
  validateRequest(validation.register),
  controller.register
);

router.post('/login', validateRequest(validation.login), controller.login);
router.post(
  '/forgotpassword',
  validateRequest(validation.forgotPassword),
  controller.forgotPassword
);
router.put(
  '/resetpassword/:token',
  validateRequest(validation.resetPassword),
  controller.resetPassword
);
router.get('/verifyemail/:token', controller.verifyEmail);

// Protected routes
router.use(protect); // Apply authentication middleware

router.get('/me', controller.getMe);
router.post('/logout', controller.logout);
router.put('/updatedetails', validateRequest(validation.updateDetails), controller.updateDetails);
router.put(
  '/updatepassword',
  validateRequest(validation.updatePassword),
  controller.updatePassword
);
router.put(
  '/preferences',
  validateRequest(validation.updatePreferences),
  controller.updatePreferences
);
router.delete(
  '/deactivate',
  validateRequest(validation.deactivateAccount),
  controller.deactivateAccount
);

// MFA routes
router.post('/mfa/setup', controller.setupMfa);
router.post('/mfa/enable', validateRequest(validation.enableMfa), controller.enableMfa);
router.post('/mfa/disable', validateRequest(validation.disableMfa), controller.disableMfa);

router.get('/test', (req, res) => {
  console.log('Auth test route hit');
  res.json({ message: 'Auth routes loaded successfully' });
});

module.exports = router;

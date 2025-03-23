// Simplified Email Service for development
const logger = require('../../utils/logger');

const EmailService = {
  sendEmail: async (to, subject, templateName, data) => {
    logger.info(
      `[DEV MODE] Email would be sent to ${to} with subject "${subject}" using template "${templateName}"`
    );
    logger.debug('Email data:', data);

    // Return success response for development
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  },

  sendPasswordReset: async (user, resetToken) => {
    logger.info(`[DEV MODE] Password reset email would be sent to ${user.email}`);
    return {
      success: true,
      messageId: `dev-reset-${Date.now()}`,
    };
  },

  sendVerificationEmail: async (user, verificationToken) => {
    logger.info(`[DEV MODE] Verification email would be sent to ${user.email}`);
    return {
      success: true,
      messageId: `dev-verify-${Date.now()}`,
    };
  },
};

module.exports = EmailService;

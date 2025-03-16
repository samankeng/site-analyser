const EmailService = require('./EmailService');
const logger = require('../../utils/logger');
const User = require('../../models/User');
const Alert = require('../../models/Alert');

/**
 * Service for managing notifications across different channels
 */
class NotificationService {
  constructor() {
    // Initialize channels
    this.channels = {
      email: {
        service: EmailService,
        enabled: EmailService.enabled
      }
      // Add more channels here (e.g., SMS, push notifications, Slack, etc.)
    };
    
    logger.info('NotificationService initialized');
  }

  /**
   * Send a notification to a user through their preferred channels
   * @param {Object} user - User object
   * @param {Object} notification - Notification data
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {string} notification.type - Notification type
   * @param {string} [notification.severity] - Notification severity
   * @param {Object} [notification.data] - Additional notification data
   * @returns {Promise<Object>} Notification results
   */
  async sendNotification(user, notification) {
    logger.info(`Sending notification to user ${user._id}: ${notification.title}`);
    
    // Get user preferences
    const userPreferences = user.preferences || {};
    
    // Track results for each channel
    const results = {};
    
    // Try to get full user if only ID is provided
    let fullUser = user;
    if (!user.email && user._id) {
      try {
        fullUser = await User.findById(user._id);
        if (!fullUser) {
          throw new Error(`User not found: ${user._id}`);
        }
      } catch (error) {
        logger.error(`Error fetching user for notification: ${error.message}`);
        return { success: false, error: `User not found: ${user._id}` };
      }
    }
    
    // Send notifications through each enabled channel based on user preferences
    for (const [channelName, channel] of Object.entries(this.channels)) {
      // Skip disabled channels
      if (!channel.enabled) {
        logger.debug(`Skipping notification via ${channelName} (channel disabled)`);
        continue;
      }
      
      // Check user preference for this channel and notification type
      const channelPreference = userPreferences[channelName];
      if (channelPreference === false) {
        logger.debug(`Skipping notification via ${channelName} (user preference)`);
        continue;
      }
      
      // Send through this channel
      try {
        logger.debug(`Sending notification via ${channelName}`);
        results[channelName] = await this.sendThroughChannel(channelName, fullUser, notification);
      } catch (error) {
        logger.error(`Error sending notification via ${channelName}: ${error.message}`);
        results[channelName] = { success: false, error: error.message };
      }
    }
    
    return { success: true, results };
  }

  /**
   * Send notification through a specific channel
   * @param {string} channelName - Channel name
   * @param {Object} user - User object
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Channel-specific result
   */
  async sendThroughChannel(channelName, user, notification) {
    const channel = this.channels[channelName];
    
    if (!channel || !channel.enabled) {
      throw new Error(`Channel ${channelName} not available`);
    }
    
    switch (channelName) {
      case 'email':
        // For email notifications, use the appropriate template based on notification type
        switch (notification.type) {
          case 'alert':
            return await EmailService.sendAlertEmail(user, notification);
          case 'scan_completed':
            return await EmailService.sendScanCompletionEmail(user, notification.data.scan);
          case 'welcome':
            return await EmailService.sendWelcomeEmail(user);
          case 'password_reset':
            return await EmailService.sendPasswordResetEmail(
              user, 
              notification.data.resetToken, 
              notification.data.resetUrl
            );
          case 'email_verification':
            return await EmailService.sendVerificationEmail(
              user, 
              notification.data.verificationUrl
            );
          default:
            // For other types, send a generic email
            return await EmailService.sendEmail({
              to: user.email,
              subject: notification.title,
              text: notification.message,
              data: notification.data
            });
        }
      
      // Add cases for other channels here
      
      default:
        throw new Error(`Channel ${channelName} not implemented`);
    }
  }

  /**
   * Send an alert notification
   * @param {Object} user - User object
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Notification results
   */
  async sendAlertNotification(user, alert) {
    // Convert alert to notification format
    const notification = {
      title: alert.title,
      message: alert.message,
      type: 'alert',
      severity: alert.severity,
      data: { alert }
    };
    
    // Record notification attempt in alert
    try {
      await Alert.findByIdAndUpdate(alert._id, {
        $push: {
          notificationHistory: {
            timestamp: new Date(),
            channels: Object.keys(this.channels).filter(c => this.channels[c].enabled)
          }
        }
      });
    } catch (error) {
      logger.error(`Error updating alert notification history: ${error.message}`);
    }
    
    // Send notification
    return this.sendNotification(user, notification);
  }

  /**
   * Send a scan completion notification
   * @param {Object} user - User object
   * @param {Object} scan - Completed scan
   * @returns {Promise<Object>} Notification results
   */
  async sendScanCompletionNotification(user, scan) {
    // Calculate critical/high findings count
    let criticalCount = 0;
    let highCount = 0;
    
    if (scan.summary && scan.summary.findings) {
      criticalCount = scan.summary.findings.critical || 0;
      highCount = scan.summary.findings.high || 0;
    }
    
    // Build notification message
    let message = `Your security scan for ${scan.url} has completed.`;
    
    if (criticalCount > 0 || highCount > 0) {
      message += ` Found ${criticalCount} critical and ${highCount} high severity issues.`;
    }
    
    const notification = {
      title: `Scan Completed: ${scan.url}`,
      message,
      type: 'scan_completed',
      severity: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'info',
      data: { scan }
    };
    
    // Send notification
    return this.sendNotification(user, notification);
  }

  /**
   * Send a welcome notification to a new user
   * @param {Object} user - User object
   * @returns {Promise<Object>} Notification results
   */
  async sendWelcomeNotification(user) {
    const notification = {
      title: 'Welcome to Site Analyser',
      message: `Welcome to Site Analyser, ${user.name}! We're excited to help you secure your websites.`,
      type: 'welcome',
      severity: 'info'
    };
    
    return this.sendNotification(user, notification);
  }

  /**
   * Send a password reset notification
   * @param {Object} user - User object
   * @param {string} resetToken - Password reset token
   * @param {string} resetUrl - Password reset URL
   * @returns {Promise<Object>} Notification results
   */
  async sendPasswordResetNotification(user, resetToken, resetUrl) {
    const notification = {
      title: 'Password Reset Request',
      message: 'We received a request to reset your password. If you did not make this request, please ignore this message.',
      type: 'password_reset',
      severity: 'info',
      data: { resetToken, resetUrl }
    };
    
    return this.sendNotification(user, notification);
  }

  /**
   * Send an email verification notification
   * @param {Object} user - User object
   * @param {string} verificationUrl - Email verification URL
   * @returns {Promise<Object>} Notification results
   */
  async sendEmailVerificationNotification(user, verificationUrl) {
    const notification = {
      title: 'Verify Your Email Address',
      message: 'Please verify your email address to complete your registration.',
      type: 'email_verification',
      severity: 'info',
      data: { verificationUrl }
    };
    
    return this.sendNotification(user, notification);
  }

  /**
   * Check if a notification channel is enabled
   * @param {string} channelName - Channel name
   * @returns {boolean} Whether the channel is enabled
   */
  isChannelEnabled(channelName) {
    return this.channels[channelName]?.enabled || false;
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
module.exports = notificationService;
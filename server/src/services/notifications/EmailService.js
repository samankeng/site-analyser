const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Service for sending email notifications
 */
class EmailService {
  constructor() {
    this.from = config.email.from;
    this.enabled = !!config.email.smtp.host && config.features.emailNotifications;
    this.templateCache = new Map();
    
    // Create transporter if SMTP is configured
    if (this.enabled) {
      this.transporter = nodemailer.createTransport(config.email.smtp);
      
      // Verify connection
      this.verifyConnection();
    } else {
      logger.warn('Email service disabled: SMTP not configured or feature disabled');
    }
    
    logger.info(`EmailService initialized, service ${this.enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Verify email connection
   * @returns {Promise<boolean>} Connection status
   */
  async verifyConnection() {
    if (!this.enabled || !this.transporter) {
      return false;
    }
    
    try {
      const result = await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return result;
    } catch (error) {
      logger.error(`SMTP connection error: ${error.message}`);
      this.enabled = false;
      return false;
    }
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} [options.text] - Plain text email body
   * @param {string} [options.html] - HTML email body
   * @param {string} [options.template] - Email template name
   * @param {Object} [options.data] - Data for template
   * @returns {Promise<Object>} Delivery info
   */
  async sendEmail(options) {
    if (!this.enabled) {
      logger.warn(`Email sending skipped (service disabled): ${options.subject} to ${options.to}`);
      return null;
    }
    
    try {
      // Use template if specified
      if (options.template) {
        const rendered = await this.renderTemplate(options.template, options.data || {});
        options.html = rendered.html;
        
        // Use template subject if not provided
        if (!options.subject && rendered.subject) {
          options.subject = rendered.subject;
        }
      }
      
      // Set sender
      options.from = options.from || this.from;
      
      // Send email
      logger.info(`Sending email: ${options.subject} to ${options.to}`);
      const info = await this.transporter.sendMail(options);
      
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Email sending error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Render an email template
   * @param {string} templateName - Template name
   * @param {Object} data - Template data
   * @returns {Promise<Object>} Rendered template
   */
  async renderTemplate(templateName, data) {
    try {
      // Check cache first
      if (this.templateCache.has(templateName)) {
        const templates = this.templateCache.get(templateName);
        return {
          html: templates.html(data),
          subject: templates.subject ? templates.subject(data) : null
        };
      }
      
      // Load template files
      const templatesDir = path.join(process.cwd(), 'src', 'templates', 'emails');
      
      // Load HTML template
      const htmlPath = path.join(templatesDir, `${templateName}.html`);
      const htmlSource = await fs.readFile(htmlPath, 'utf8');
      const htmlTemplate = handlebars.compile(htmlSource);
      
      // Load subject template if exists
      let subjectTemplate = null;
      try {
        const subjectPath = path.join(templatesDir, `${templateName}.subject.txt`);
        const subjectSource = await fs.readFile(subjectPath, 'utf8');
        subjectTemplate = handlebars.compile(subjectSource);
      } catch (error) {
        // Subject template is optional
      }
      
      // Cache templates
      this.templateCache.set(templateName, {
        html: htmlTemplate,
        subject: subjectTemplate
      });
      
      // Render templates
      return {
        html: htmlTemplate(data),
        subject: subjectTemplate ? subjectTemplate(data) : null
      };
    } catch (error) {
      logger.error(`Template rendering error: ${error.message}`);
      throw new Error(`Failed to render email template "${templateName}": ${error.message}`);
    }
  }

  /**
   * Send a welcome email
   * @param {Object} user - User object
   * @returns {Promise<Object>} Delivery info
   */
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to Site Analyser',
      template: 'welcome',
      data: {
        name: user.name,
        email: user.email
      }
    });
  }

  /**
   * Send a password reset email
   * @param {Object} user - User object
   * @param {string} resetToken - Password reset token
   * @param {string} resetUrl - Password reset URL
   * @returns {Promise<Object>} Delivery info
   */
  async sendPasswordResetEmail(user, resetToken, resetUrl) {
    return this.sendEmail({
      to: user.email,
      template: 'passwordReset',
      data: {
        name: user.name,
        resetToken,
        resetUrl
      }
    });
  }

  /**
   * Send an email verification email
   * @param {Object} user - User object
   * @param {string} verificationUrl - Email verification URL
   * @returns {Promise<Object>} Delivery info
   */
  async sendVerificationEmail(user, verificationUrl) {
    return this.sendEmail({
      to: user.email,
      template: 'emailVerification',
      data: {
        name: user.name,
        verificationUrl
      }
    });
  }

  /**
   * Send a security alert email
   * @param {Object} user - User object
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Delivery info
   */
  async sendAlertEmail(user, alert) {
    return this.sendEmail({
      to: user.email,
      template: 'securityAlert',
      data: {
        name: user.name,
        alertTitle: alert.title,
        alertMessage: alert.message,
        alertSeverity: alert.severity,
        alertDate: new Date(alert.createdAt).toLocaleString(),
        alertUrl: alert.url,
        dashboardUrl: `${config.baseUrl}/dashboard`
      }
    });
  }

  /**
   * Send a scan completion email
   * @param {Object} user - User object
   * @param {Object} scan - Scan object with results
   * @returns {Promise<Object>} Delivery info
   */
  async sendScanCompletionEmail(user, scan) {
    // Get severity counts
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };
    
    if (scan.summary && scan.summary.findings) {
      Object.assign(severityCounts, scan.summary.findings);
    }
    
    return this.sendEmail({
      to: user.email,
      template: 'scanCompleted',
      data: {
        name: user.name,
        scanUrl: scan.url,
        scanDate: new Date(scan.completedAt).toLocaleString(),
        securityScore: scan.summary ? scan.summary.overall : null,
        severityCounts,
        reportUrl: `${config.baseUrl}/reports/${scan._id}`
      }
    });
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;
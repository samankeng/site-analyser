import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

/**
 * Create a custom logger with multiple transports
 */
class Logger {
  constructor() {
    // Ensure logs directory exists
    const logDir = path.join(process.cwd(), 'logs');

    // Configure transports
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => {
          const { timestamp, level, message, ...metadata } = info;
          let msg = `${timestamp} [${level}]: ${message} `;
          
          if (Object.keys(metadata).length > 0) {
            msg += JSON.stringify(metadata);
          }
          
          return msg;
        })
      )
    });

    const fileTransport = new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    });

    // Create logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      levels: winston.config.npm.levels,
      transports: [
        consoleTransport,
        fileTransport
      ],
      exitOnError: false
    });
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Object} [metadata] - Additional error metadata
   */
  error(message, metadata = {}) {
    this.logger.error(message, metadata);
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object} [metadata] - Additional warning metadata
   */
  warn(message, metadata = {}) {
    this.logger.warn(message, metadata);
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} [metadata] - Additional info metadata
   */
  info(message, metadata = {}) {
    this.logger.info(message, metadata);
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object} [metadata] - Additional debug metadata
   */
  debug(message, metadata = {}) {
    this.logger.debug(message, metadata);
  }

  /**
   * Log a verbose message
   * @param {string} message - Verbose message
   * @param {Object} [metadata] - Additional verbose metadata
   */
  verbose(message, metadata = {}) {
    this.logger.verbose(message, metadata);
  }

  /**
   * Create a child logger with additional context
   * @param {Object} metadata - Metadata to add to child logger
   * @returns {Object} Child logger
   */
  child(metadata) {
    return this.logger.child(metadata);
  }
}

// Export a singleton logger instance
export default new Logger();

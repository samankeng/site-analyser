const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const config = require('./index');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define level based on environment
const level = () => {
  const env = config.env || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define custom format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Create console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    format
  )
});

// Create file transports for different log levels
const logDir = path.join(process.cwd(), 'logs');

const fileTransportOptions = {
  dirname: logDir,
  maxSize: '20m',
  maxFiles: '14d',
  format
};

const errorFileTransport = new winston.transports.DailyRotateFile({
  ...fileTransportOptions,
  filename: 'error-%DATE%.log',
  level: 'error'
});

const combinedFileTransport = new winston.transports.DailyRotateFile({
  ...fileTransportOptions,
  filename: 'combined-%DATE%.log'
});

// Define transports based on environment
const transports = [consoleTransport];

// Add file transports in production
if (config.env === 'production') {
  transports.push(errorFileTransport, combinedFileTransport);
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports
});

module.exports = logger;

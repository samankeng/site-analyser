const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

// Get MongoDB URI from environment variables with a fallback
const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI || // Add this line to check both environment variables
  'mongodb://admin:secure_password@mongodb:27017/site-analyser?authSource=admin&directConnection=true';

/**
 * Database configuration and connection setup with retry logic
 */
const connectDB = async (retryCount = 0, maxRetries = 5) => {
  try {
    logger.info(`MongoDB connection attempt ${retryCount + 1}/${maxRetries + 1}`);
    logger.debug(`Connecting to: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')}`); // Hide credentials in logs

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 2000,
      retryWrites: true,
      family: 4,
      directConnection: true,
    };

    const conn = await mongoose.connect(MONGODB_URI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', err => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected, attempting to reconnect...');
      setTimeout(() => connectDB(0, maxRetries), 5000);
    });

    // Handle process termination and close DB connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (err) {
    logger.error(`Error connecting to MongoDB: ${err.message}`);

    // Implement retry logic
    if (retryCount < maxRetries) {
      logger.info(`Retrying connection in 5 seconds... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount + 1, maxRetries);
    } else {
      logger.error(`Failed to connect to MongoDB after ${maxRetries + 1} attempts`);
      process.exit(1);
    }
  }
};

module.exports = { connectDB };

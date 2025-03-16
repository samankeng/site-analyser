const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

/**
 * Redis client configuration and connection setup
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.prefix = config.redis.prefix || 'site-analyser:';
  }

  /**
   * Connect to Redis server
   */
  connect() {
    if (this.client) {
      return this.client;
    }

    const options = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    };

    this.client = new Redis(options);

    // Handle connection events
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info(`Redis client connected to ${config.redis.host}:${config.redis.port}`);
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    return this.client;
  }

  /**
   * Get Redis client
   */
  getClient() {
    if (!this.client) {
      this.connect();
    }
    return this.client;
  }

  /**
   * Get a value from Redis
   * @param {string} key 
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const client = this.getClient();
      const value = await client.get(`${this.prefix}${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Set a value in Redis
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = null) {
    try {
      const client = this.getClient();
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await client.set(`${this.prefix}${key}`, serializedValue, 'EX', ttl);
      } else {
        await client.set(`${this.prefix}${key}`, serializedValue);
      }
      
      return true;
    } catch (error) {
      logger.error(`Redis set error: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   * @param {string} key 
   * @returns {Promise<boolean>}
   */
  async del(key) {
    try {
      const client = this.getClient();
      await client.del(`${this.prefix}${key}`);
      return true;
    } catch (error) {
      logger.error(`Redis delete error: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      const client = this.getClient();
      const result = await client.exists(`${this.prefix}${key}`);
      return result === 1;
    } catch (error) {
      logger.error(`Redis exists error: ${error.message}`);
      return false;
    }
  }

  /**
   * Close the Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// Create and export a singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;

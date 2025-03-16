const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Service for integrating with the SSL Labs API
 * SSL Labs provides detailed SSL/TLS analysis
 */
class SslLabsService {
  constructor() {
    this.baseUrl = 'https://api.ssllabs.com/api/v3';
    
    // Cache to store results (to minimize API calls and respect rate limits)
    this.cache = new Map();
    this.cacheTtl = 24 * 60 * 60 * 1000; // 24 hours
    
    logger.info('SslLabsService initialized');
  }

  /**
   * Analyze a domain's SSL/TLS configuration
   * @param {string} hostname - Domain to analyze
   * @param {boolean} fromCache - Whether to use cached data if available
   * @returns {Promise<Object>} SSL Labs analysis data
   */
  async analyzeDomain(hostname, fromCache = true) {
    // Check cache first if allowed
    if (fromCache) {
      const cacheKey = `analysis_${hostname}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug(`Using cached SSL Labs data for ${hostname}`);
        return cachedResult;
      }
    }

    try {
      // Start new analysis
      logger.info(`Starting SSL Labs analysis for ${hostname}`);
      
      const startResponse = await axios({
        method: 'GET',
        url: `${this.baseUrl}/analyze`,
        params: {
          host: hostname,
          all: 'on', // Get all endpoints
          startNew: 'on', // Force new scan
          ignoreMismatch: 'on' // Continue even if names don't match
        },
        timeout: 10000
      });
      
      if (startResponse.data.status !== 'READY' && startResponse.data.status !== 'ERROR') {
        // Poll until analysis is complete
        return this.pollAnalysisStatus(hostname, startResponse.data);
      } else if (startResponse.data.status === 'ERROR') {
        throw new Error(`SSL Labs analysis error: ${startResponse.data.statusMessage}`);
      } else {
        // Cache the result
        this.addToCache(`analysis_${hostname}`, startResponse.data);
        
        logger.info(`SSL Labs analysis completed immediately for ${hostname}`);
        return startResponse.data;
      }
    } catch (error) {
      this.handleApiError(error, hostname);
      return null;
    }
  }

  /**
   * Poll SSL Labs API until analysis is complete
   * @param {string} hostname - Domain being analyzed
   * @param {Object} initialData - Initial analysis data
   * @returns {Promise<Object>} SSL Labs analysis data
   */
  async pollAnalysisStatus(hostname, initialData) {
    logger.info(`Polling SSL Labs analysis status for ${hostname}`);
    
    let analysisData = initialData;
    let maxAttempts = 15; // Max polling attempts
    let attempt = 0;
    
    // Max wait time: 5 minutes (with exponential backoff)
    const initialWait = 10000; // 10 seconds
    
    while (analysisData.status !== 'READY' && analysisData.status !== 'ERROR' && attempt < maxAttempts) {
      // Wait before polling again (exponential backoff)
      const waitTime = initialWait * Math.pow(1.5, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      attempt++;
      
      try {
        logger.debug(`Polling SSL Labs analysis status for ${hostname} (attempt ${attempt}/${maxAttempts})`);
        
        const response = await axios({
          method: 'GET',
          url: `${this.baseUrl}/analyze`,
          params: {
            host: hostname,
            all: 'on'
          },
          timeout: 20000
        });
        
        analysisData = response.data;
        
        if (analysisData.status === 'READY') {
          // Cache the result
          this.addToCache(`analysis_${hostname}`, analysisData);
          
          logger.info(`SSL Labs analysis completed for ${hostname} after ${attempt} polls`);
          return analysisData;
        } else if (analysisData.status === 'ERROR') {
          throw new Error(`SSL Labs analysis error: ${analysisData.statusMessage}`);
        }
      } catch (error) {
        this.handleApiError(error, hostname);
        throw error;
      }
    }
    
    if (attempt >= maxAttempts) {
      logger.error(`SSL Labs analysis timed out for ${hostname} after ${attempt} attempts`);
      throw new Error('SSL Labs analysis timed out');
    }
    
    return analysisData;
  }

  /**
   * Get cached analysis if available
   * @param {string} hostname - Domain to check
   * @returns {Promise<Object>} Cached SSL Labs analysis data
   */
  async getCachedAnalysis(hostname) {
    const cacheKey = `analysis_${hostname}`;
    const cachedResult = this.getFromCache(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    // Try to get from API cache
    try {
      logger.debug(`Checking SSL Labs API cache for ${hostname}`);
      
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/analyze`,
        params: {
          host: hostname,
          all: 'on',
          fromCache: 'on'
        },
        timeout: 10000
      });
      
      if (response.data.status === 'READY') {
        // Cache the result
        this.addToCache(cacheKey, response.data);
        
        logger.info(`Retrieved SSL Labs cached analysis for ${hostname}`);
        return response.data;
      }
    } catch (error) {
      this.handleApiError(error, hostname);
    }
    
    return null;
  }

  /**
   * Get info about SSL Labs API
   * @returns {Promise<Object>} API information
   */
  async getApiInfo() {
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/info`,
        timeout: 5000
      });
      
      return response.data;
    } catch (error) {
      logger.error(`SSL Labs API info error: ${error.message}`);
      return null;
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @param {string} hostname - Domain being analyzed
   */
  handleApiError(error, hostname) {
    if (error.response) {
      logger.error(`SSL Labs API error for ${hostname}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      
      // Handle rate limit error
      if (error.response.status === 429) {
        logger.warn('SSL Labs API rate limit reached');
      }
    } else if (error.request) {
      logger.error(`SSL Labs API no response for ${hostname}: ${error.message}`);
    } else {
      logger.error(`SSL Labs API error for ${hostname}: ${error.message}`);
    }
  }

  /**
   * Add data to cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  addToCache(key, value) {
    const item = {
      value,
      expires: Date.now() + this.cacheTtl
    };
    
    this.cache.set(key, item);
  }

  /**
   * Get data from cache if not expired
   * @param {string} key - Cache key
   * @returns {any} Cached value or null if expired/not found
   */
  getFromCache(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Clear expired items from cache
   */
  cleanupCache() {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get SSL grade from SSL Labs rating
   * @param {string} grade - SSL Labs grade
   * @returns {number} Numeric score (0-100)
   */
  getScoreFromGrade(grade) {
    const gradeMap = {
      'A+': 100,
      'A': 90,
      'A-': 85,
      'B+': 80,
      'B': 75,
      'B-': 70,
      'C+': 65,
      'C': 60,
      'C-': 55,
      'D+': 50,
      'D': 45,
      'D-': 40,
      'E+': 35,
      'E': 30,
      'E-': 25,
      'F': 20,
      'T': 10,
      'M': 5
    };
    
    return gradeMap[grade] || 0;
  }
}

// Create and export singleton instance
const sslLabsService = new SslLabsService();

// Set up periodic cache cleanup
setInterval(() => {
  sslLabsService.cleanupCache();
}, 60 * 60 * 1000); // Once per hour

module.exports = sslLabsService;
const axios = require('axios');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Service for integrating with the Shodan API
 * Shodan is a search engine for Internet-connected devices
 */
class ShodanService {
  constructor() {
    this.apiKey = config.apiKeys.shodan;
    this.baseUrl = 'https://api.shodan.io';
    this.enabled = !!this.apiKey;
    
    // Cache to store results (to minimize API calls)
    this.cache = new Map();
    this.cacheTtl = 24 * 60 * 60 * 1000; // 24 hours
    
    logger.info(`ShodanService initialized, service ${this.enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get host information from Shodan
   * @param {string} ip - IP address to lookup
   * @returns {Promise<Object>} Host information
   */
  async getHostInfo(ip) {
    if (!this.enabled) {
      logger.warn(`Shodan lookup requested for ${ip} but service is disabled (no API key)`);
      return null;
    }

    // Check cache first
    const cacheKey = `host_${ip}`;
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      logger.debug(`Using cached Shodan data for ${ip}`);
      return cachedResult;
    }

    try {
      logger.info(`Querying Shodan for IP: ${ip}`);
      
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/shodan/host/${ip}`,
        params: { key: this.apiKey },
        timeout: 10000
      });
      
      // Cache the result
      this.addToCache(cacheKey, response.data);
      
      logger.info(`Successfully retrieved Shodan data for ${ip}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        logger.error(`Shodan API error for ${ip}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        
        // Handle rate limit error
        if (error.response.status === 429) {
          logger.warn('Shodan API rate limit reached');
        }
      } else {
        logger.error(`Shodan API error for ${ip}: ${error.message}`);
      }
      
      return null;
    }
  }

  /**
   * Search Shodan by domain name
   * @param {string} domain - Domain to search for
   * @returns {Promise<Array>} Search results
   */
  async searchByDomain(domain) {
    if (!this.enabled) {
      logger.warn(`Shodan domain search requested for ${domain} but service is disabled (no API key)`);
      return null;
    }

    // Check cache first
    const cacheKey = `domain_${domain}`;
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      logger.debug(`Using cached Shodan data for domain ${domain}`);
      return cachedResult;
    }

    try {
      logger.info(`Searching Shodan for domain: ${domain}`);
      
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/shodan/host/search`,
        params: { 
          key: this.apiKey,
          query: `hostname:${domain}`
        },
        timeout: 10000
      });
      
      // Cache the result
      this.addToCache(cacheKey, response.data);
      
      logger.info(`Successfully retrieved Shodan data for domain ${domain}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        logger.error(`Shodan API error for domain ${domain}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        
        // Handle rate limit error
        if (error.response.status === 429) {
          logger.warn('Shodan API rate limit reached');
        }
      } else {
        logger.error(`Shodan API error for domain ${domain}: ${error.message}`);
      }
      
      return null;
    }
  }

  /**
   * Get domain information from Shodan
   * @param {string} domain - Domain to lookup
   * @returns {Promise<Object>} Domain information
   */
  async getDomainInfo(domain) {
    if (!this.enabled) {
      logger.warn(`Shodan domain info requested for ${domain} but service is disabled (no API key)`);
      return null;
    }

    // Check cache first
    const cacheKey = `domain_info_${domain}`;
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      logger.debug(`Using cached Shodan domain info for ${domain}`);
      return cachedResult;
    }

    try {
      logger.info(`Querying Shodan for domain info: ${domain}`);
      
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/dns/domain/${domain}`,
        params: { key: this.apiKey },
        timeout: 10000
      });
      
      // Cache the result
      this.addToCache(cacheKey, response.data);
      
      logger.info(`Successfully retrieved Shodan domain info for ${domain}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        logger.error(`Shodan API error for domain info ${domain}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        logger.error(`Shodan API error for domain info ${domain}: ${error.message}`);
      }
      
      return null;
    }
  }

  /**
   * Get SSL/TLS information for a host from Shodan
   * @param {string} ip - IP address to lookup
   * @returns {Promise<Object>} SSL information
   */
  async getSSLInfo(ip) {
    const hostInfo = await this.getHostInfo(ip);
    
    if (!hostInfo || !hostInfo.data) {
      return null;
    }
    
    // Extract SSL information from host data
    const sslData = hostInfo.data
      .filter(item => item.ssl && item.ssl.cert)
      .map(item => ({
        port: item.port,
        ssl: item.ssl
      }));
    
    return sslData.length > 0 ? sslData : null;
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
}

// Create and export singleton instance
const shodanService = new ShodanService();

// Set up periodic cache cleanup
setInterval(() => {
  shodanService.cleanupCache();
}, 60 * 60 * 1000); // Once per hour

module.exports = shodanService;
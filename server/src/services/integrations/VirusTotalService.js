const axios = require('axios');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Service for integrating with the VirusTotal API
 * VirusTotal analyzes suspicious files and URLs
 */
class VirusTotalService {
  constructor() {
    this.apiKey = config.apiKeys.virusTotal;
    this.baseUrl = 'https://www.virustotal.com/api/v3';
    this.enabled = !!this.apiKey;
    
    // Cache to store results (to minimize API calls and respect rate limits)
    this.cache = new Map();
    this.cacheTtl = 24 * 60 * 60 * 1000; // 24 hours
    
    logger.info(`VirusTotalService initialized, service ${this.enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get domain report from VirusTotal
   * @param {string} domain - Domain to lookup
   * @returns {Promise<Object>} Domain report
   */
  async getDomainReport(domain) {
    if (!this.enabled) {
      logger.warn(`VirusTotal domain report requested for ${domain} but service is disabled (no API key)`);
      return null;
    }

    // Check cache first
    const cacheKey = `domain_${domain}`;
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      logger.debug(`Using cached VirusTotal data for ${domain}`);
      return cachedResult;
    }

    try {
      logger.info(`Querying VirusTotal for domain: ${domain}`);
      
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/domains/${domain}`,
        headers: {
          'x-apikey': this.apiKey
        },
        timeout: 10000
      });
      
      // Process the data to extract relevant information
      const processedData = this.processDomainData(response.data.data);
      
      // Cache the result
      this.addToCache(cacheKey, processedData);
      
      logger.info(`Successfully retrieved VirusTotal data for ${domain}`);
      return processedData;
    } catch (error) {
      this.handleApiError(error, `domain report for ${domain}`);
      return null;
    }
  }

  /**
   * Get URL report from VirusTotal
   * @param {string} url - URL to scan
   * @param {boolean} scan - Whether to submit URL for scanning if not already analyzed
   * @returns {Promise<Object>} URL report
   */
  async getUrlReport(url, scan = false) {
    if (!this.enabled) {
      logger.warn(`VirusTotal URL report requested for ${url} but service is disabled (no API key)`);
      return null;
    }

    // Check cache first (not for scan requests)
    if (!scan) {
      const cacheKey = `url_${url}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        logger.debug(`Using cached VirusTotal data for ${url}`);
        return cachedResult;
      }
    }

    // Encode URL for VirusTotal API
    const encodedUrl = encodeURIComponent(url);
    const urlIdentifier = Buffer.from(url).toString('base64');
    
    try {
      // First, check if URL has been analyzed before
      logger.info(`Querying VirusTotal for URL: ${url}`);
      
      try {
        const response = await axios({
          method: 'GET',
          url: `${this.baseUrl}/urls/${urlIdentifier}`,
          headers: {
            'x-apikey': this.apiKey
          },
          timeout: 10000
        });
        
        // Process the data
        const processedData = this.processUrlData(response.data.data);
        
        // Cache the result
        this.addToCache(`url_${url}`, processedData);
        
        logger.info(`Successfully retrieved VirusTotal data for URL ${url}`);
        return processedData;
      } catch (error) {
        // If URL not found and scan requested, submit it for scanning
        if (error.response && error.response.status === 404 && scan) {
          return this.scanUrl(url);
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.handleApiError(error, `URL report for ${url}`);
      return null;
    }
  }

  /**
   * Submit a URL for scanning
   * @param {string} url - URL to scan
   * @returns {Promise<Object>} Scan results or analysis ID
   */
  async scanUrl(url) {
    if (!this.enabled) {
      logger.warn(`VirusTotal URL scan requested for ${url} but service is disabled (no API key)`);
      return null;
    }

    try {
      logger.info(`Submitting URL to VirusTotal for scanning: ${url}`);
      
      const formData = new URLSearchParams();
      formData.append('url', url);
      
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/urls`,
        headers: {
          'x-apikey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: formData,
        timeout: 15000
      });
      
      // Extract analysis ID
      const analysisId = response.data.data.id;
      
      logger.info(`URL ${url} submitted to VirusTotal, analysis ID: ${analysisId}`);
      
      // Wait a few seconds for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get analysis results
      return this.getAnalysisReport(analysisId);
    } catch (error) {
      this.handleApiError(error, `URL scan for ${url}`);
      return null;
    }
  }

  /**
   * Get an analysis report by ID
   * @param {string} analysisId - VirusTotal analysis ID
   * @returns {Promise<Object>} Analysis report
   */
  async getAnalysisReport(analysisId) {
    if (!this.enabled) {
      logger.warn(`VirusTotal analysis report requested for ${analysisId} but service is disabled (no API key)`);
      return null;
    }

    try {
      logger.info(`Getting VirusTotal analysis report: ${analysisId}`);
      
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/analyses/${analysisId}`,
        headers: {
          'x-apikey': this.apiKey
        },
        timeout: 10000
      });
      
      // Process the data
      const processedData = this.processAnalysisData(response.data.data);
      
      logger.info(`Successfully retrieved VirusTotal analysis ${analysisId}`);
      return processedData;
    } catch (error) {
      this.handleApiError(error, `analysis report ${analysisId}`);
      return null;
    }
  }

  /**
   * Process domain data from VirusTotal API
   * @param {Object} data - Raw API data
   * @returns {Object} Processed data
   */
  processDomainData(data) {
    if (!data || !data.attributes) {
      return null;
    }
    
    const attributes = data.attributes;
    
    return {
      domain: data.id,
      lastAnalysisStats: attributes.last_analysis_stats,
      reputation: attributes.reputation,
      positives: attributes.last_analysis_stats ? 
        Object.values(attributes.last_analysis_stats).reduce((a, b) => a + b, 0) - 
        (attributes.last_analysis_stats.harmless || 0) - 
        (attributes.last_analysis_stats.undetected || 0) : 
        0,
      total: attributes.last_analysis_stats ? 
        Object.values(attributes.last_analysis_stats).reduce((a, b) => a + b, 0) : 
        0,
      categories: attributes.categories || {},
      creationDate: attributes.creation_date,
      whois: attributes.whois,
      detected_urls: attributes.detected_urls || []
    };
  }

  /**
   * Process URL data from VirusTotal API
   * @param {Object} data - Raw API data
   * @returns {Object} Processed data
   */
  processUrlData(data) {
    if (!data || !data.attributes) {
      return null;
    }
    
    const attributes = data.attributes;
    
    return {
      url: attributes.url,
      lastAnalysisStats: attributes.last_analysis_stats,
      positives: attributes.last_analysis_stats ? 
        Object.values(attributes.last_analysis_stats).reduce((a, b) => a + b, 0) - 
        (attributes.last_analysis_stats.harmless || 0) - 
        (attributes.last_analysis_stats.undetected || 0) : 
        0,
      total: attributes.last_analysis_stats ? 
        Object.values(attributes.last_analysis_stats).reduce((a, b) => a + b, 0) : 
        0,
      threat_names: attributes.threat_names || [],
      last_analysis_date: attributes.last_analysis_date,
      last_http_response_content_length: attributes.last_http_response_content_length,
      last_http_response_code: attributes.last_http_response_code,
      last_http_response_headers: attributes.last_http_response_headers
    };
  }

  /**
   * Process analysis data from VirusTotal API
   * @param {Object} data - Raw API data
   * @returns {Object} Processed data
   */
  processAnalysisData(data) {
    if (!data || !data.attributes) {
      return null;
    }
    
    const attributes = data.attributes;
    
    return {
      status: attributes.status,
      stats: attributes.stats,
      positives: attributes.stats ? 
        Object.values(attributes.stats).reduce((a, b) => a + b, 0) - 
        (attributes.stats.harmless || 0) - 
        (attributes.stats.undetected || 0) : 
        0,
      total: attributes.stats ? 
        Object.values(attributes.stats).reduce((a, b) => a + b, 0) : 
        0,
      date: attributes.date,
      results: attributes.results || {}
    };
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @param {string} request - Description of the request
   */
  handleApiError(error, request) {
    if (error.response) {
      logger.error(`VirusTotal API error for ${request}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      
      // Handle rate limit error
      if (error.response.status === 429) {
        logger.warn('VirusTotal API rate limit reached');
      }
    } else if (error.request) {
      logger.error(`VirusTotal API no response for ${request}: ${error.message}`);
    } else {
      logger.error(`VirusTotal API error for ${request}: ${error.message}`);
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
}

// Create and export singleton instance
const virusTotalService = new VirusTotalService();

// Set up periodic cache cleanup
setInterval(() => {
  virusTotalService.cleanupCache();
}, 60 * 60 * 1000); // Once per hour

module.exports = virusTotalService;
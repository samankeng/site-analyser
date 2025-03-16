const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const logger = require('../../utils/logger');

/**
 * Scanner for web performance analysis
 */
class PerformanceScanner {
  /**
   * Initialize performance scanner
   */
  constructor() {
    this.userAgent = 'SiteAnalyzer/1.0';
    
    logger.info('PerformanceScanner initialized');
  }

  /**
   * Perform performance scan
   * @param {string} url - URL to scan
   * @param {number} depthFactor - Scan depth factor (1.0 is standard)
   * @returns {Promise<Object>} Scan results
   */
  async scan(url, depthFactor = 1.0) {
    logger.info(`Starting performance scan for ${url}`);
    
    try {
      // Parse URL
      const parsedUrl = new URL(url);
      
      // Set up result structure
      const perfResult = {
        score: 0,
        findings: [],
        metadata: new Map(),
        rawData: {}
      };
      
      // Measure initial load time
      const loadTimeData = await this.measureLoadTime(url);
      perfResult.rawData.loadTime = loadTimeData;
      perfResult.metadata.set('loadTime', loadTimeData.time);
      
      // Analyze page resources
      const resourceData = await this.analyzeResources(url);
      perfResult.rawData.resources = resourceData;
      perfResult.metadata.set('resourceStats', {
        totalSize: resourceData.totalSize,
        totalResources: resourceData.totalResources,
        resourcesByType: resourceData.resourcesByType
      });
      
      // Check for performance issues
      this.checkPerformanceIssues(loadTimeData, resourceData, perfResult);
      
      // If depth factor is high, do more detailed analysis
      if (depthFactor >= 1.5) {
        // Analyze page for lazy loading
        const lazyLoadingData = await this.analyzeLazyLoading(url);
        perfResult.rawData.lazyLoading = lazyLoadingData;
        
        if (!lazyLoadingData.usesLazyLoading) {
          perfResult.findings.push({
            title: 'No Image Lazy Loading',
            description: 'The page does not use lazy loading for images, which can delay initial page load.',
            severity: 'Medium',
            recommendation: 'Implement lazy loading for images below the fold using loading="lazy" attribute or JavaScript.'
          });
        }
        
        // Analyze caching headers
        const cachingData = await this.analyzeCachingHeaders(url);
        perfResult.rawData.caching = cachingData;
        
        if (!cachingData.properCaching) {
          perfResult.findings.push({
            title: 'Insufficient Cache Headers',
            description: 'The page does not set proper caching headers, which can reduce load times for returning visitors.',
            severity: 'Medium',
            evidence: `Cache-Control: ${cachingData.cacheControl || 'Not set'}`,
            recommendation: 'Set appropriate Cache-Control and Expires headers for static resources.'
          });
        }
      }
      
      // Calculate score
      perfResult.score = this.calculateScore(perfResult);
      
      logger.info(`Performance scan completed for ${url}`);
      return perfResult;
    } catch (error) {
      logger.error(`Performance scan error for ${url}: ${error.message}`);
      
      // Return partial results if possible
      return {
        score: 0,
        findings: [{
          title: 'Performance Scan Failed',
          description: `Could not complete performance scan: ${error.message}`,
          severity: 'Medium',
          recommendation: 'Verify that the server is accessible and properly configured.'
        }],
        metadata: new Map(),
        rawData: { error: error.message }
      };
    }
  }

  /**
   * Measure page load time
   * @param {string} url - URL to measure
   * @returns {Promise<Object>} Load time data
   */
  async measureLoadTime(url) {
    const start = Date.now();
    
    try {
      const response = await axios({
        method: 'GET',
        url,
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 30000,
        maxRedirects: 5
      });
      
      const end = Date.now();
      const time = end - start;
      
      return {
        time,
        status: response.status,
        dataSize: response.data.length || 0,
        headerSize: JSON.stringify(response.headers).length
      };
    } catch (error) {
      logger.error(`Error measuring load time for ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze page resources
   * @param {string} url - URL to analyze
   * @returns {Promise<Object>} Resource data
   */
  async analyzeResources(url) {
    try {
      // Fetch the page
      const response = await axios({
        method: 'GET',
        url,
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000,
        maxRedirects: 5
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extract resource URLs
      const resourceUrls = {
        css: [],
        javascript: [],
        images: [],
        fonts: [],
        other: []
      };
      
      // CSS files
      $('link[rel="stylesheet"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).href;
            resourceUrls.css.push(absoluteUrl);
          } catch (e) {}
        }
      });
      
      // JavaScript files
      $('script[src]').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
          try {
            const absoluteUrl = new URL(src, url).href;
            resourceUrls.javascript.push(absoluteUrl);
          } catch (e) {}
        }
      });
      
      // Images
      $('img[src]').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.startsWith('data:')) {
          try {
            const absoluteUrl = new URL(src, url).href;
            resourceUrls.images.push(absoluteUrl);
          } catch (e) {}
        }
      });
      
      // Fonts
      $('link[rel="preload"][as="font"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).href;
            resourceUrls.fonts.push(absoluteUrl);
          } catch (e) {}
        }
      });
      
      // Background images in inline styles
      $('[style*="background"]').each((i, el) => {
        const style = $(el).attr('style');
        if (style) {
          const match = style.match(/url\(['"]?([^'")]+)['"]?\)/);
          if (match && match[1] && !match[1].startsWith('data:')) {
            try {
              const absoluteUrl = new URL(match[1], url).href;
              resourceUrls.images.push(absoluteUrl);
            } catch (e) {}
          }
        }
      });
      
      // Analyze resource sizes
      const resourceStats = {
        totalSize: 0,
        totalResources: 0,
        resourcesByType: {
          css: { count: resourceUrls.css.length, size: 0 },
          javascript: { count: resourceUrls.javascript.length, size: 0 },
          images: { count: resourceUrls.images.length, size: 0 },
          fonts: { count: resourceUrls.fonts.length, size: 0 },
          other: { count: resourceUrls.other.length, size: 0 }
        },
        largeResources: []
      };
      
      // Function to fetch resource size
      const getResourceSize = async (url) => {
        try {
          const response = await axios({
            method: 'HEAD',
            url,
            timeout: 5000,
            maxRedirects: 3
          });
          
          let size = parseInt(response.headers['content-length'] || '0', 10);
          
          // If HEAD request doesn't return content-length, try a GET request
          if (size === 0) {
            const getResponse = await axios({
              method: 'GET',
              url,
              timeout: 5000,
              maxRedirects: 3,
              responseType: 'arraybuffer'
            });
            
            size = getResponse.data.length || 0;
          }
          
          return {
            url,
            size,
            contentType: response.headers['content-type']
          };
        } catch (error) {
          return {
            url,
            size: 0,
            error: error.message
          };
        }
      };
      
      // Get sizes for a sample of resources (to avoid making too many requests)
      const samplesToCheck = {
        css: resourceUrls.css.slice(0, 3),
        javascript: resourceUrls.javascript.slice(0, 3),
        images: resourceUrls.images.slice(0, 5),
        fonts: resourceUrls.fonts.slice(0, 2),
        other: resourceUrls.other.slice(0, 2)
      };
      
      // Sample and analyze resources
      for (const [type, urls] of Object.entries(samplesToCheck)) {
        for (const url of urls) {
          const resourceData = await getResourceSize(url);
          resourceStats.totalSize += resourceData.size;
          resourceStats.resourcesByType[type].size += resourceData.size;
          
          // Track large resources
          if (resourceData.size > 500000) { // 500KB
            resourceStats.largeResources.push({
              url: resourceData.url,
              size: resourceData.size,
              type
            });
          }
        }
      }
      
      // Estimate total based on samples
      if (resourceUrls.css.length > samplesToCheck.css.length && resourceStats.resourcesByType.css.size > 0) {
        const avgSize = resourceStats.resourcesByType.css.size / samplesToCheck.css.length;
        const estimatedSize = avgSize * resourceUrls.css.length;
        resourceStats.totalSize += estimatedSize - resourceStats.resourcesByType.css.size;
        resourceStats.resourcesByType.css.size = estimatedSize;
      }
      
      if (resourceUrls.javascript.length > samplesToCheck.javascript.length && resourceStats.resourcesByType.javascript.size > 0) {
        const avgSize = resourceStats.resourcesByType.javascript.size / samplesToCheck.javascript.length;
        const estimatedSize = avgSize * resourceUrls.javascript.length;
        resourceStats.totalSize += estimatedSize - resourceStats.resourcesByType.javascript.size;
        resourceStats.resourcesByType.javascript.size = estimatedSize;
      }
      
      if (resourceUrls.images.length > samplesToCheck.images.length && resourceStats.resourcesByType.images.size > 0) {
        const avgSize = resourceStats.resourcesByType.images.size / samplesToCheck.images.length;
        const estimatedSize = avgSize * resourceUrls.images.length;
        resourceStats.totalSize += estimatedSize - resourceStats.resourcesByType.images.size;
        resourceStats.resourcesByType.images.size = estimatedSize;
      }
      
      resourceStats.totalResources = 
        resourceUrls.css.length +
        resourceUrls.javascript.length +
        resourceUrls.images.length +
        resourceUrls.fonts.length +
        resourceUrls.other.length;
      
      return resourceStats;
    } catch (error) {
      logger.error(`Error analyzing resources for ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze page for lazy loading
   * @param {string} url - URL to analyze
   * @returns {Promise<Object>} Lazy loading data
   */
  async analyzeLazyLoading(url) {
    try {
      const response = await axios({
        method: 'GET',
        url,
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000,
        maxRedirects: 5
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Check for native lazy loading
      const nativeLazyLoadedImages = $('img[loading="lazy"]').length;
      
      // Check for common lazy loading libraries
      const hasLazyLoadingScripts = html.includes('lazyload') || 
                                    html.includes('lazy-load') ||
                                    html.includes('lozad');
      
      // Count total images
      const totalImages = $('img').length;
      
      return {
        usesLazyLoading: nativeLazyLoadedImages > 0 || hasLazyLoadingScripts,
        nativeLazyLoadedImages,
        hasLazyLoadingScripts,
        totalImages
      };
    } catch (error) {
      logger.error(`Error analyzing lazy loading for ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze caching headers
   * @param {string} url - URL to analyze
   * @returns {Promise<Object>} Caching data
   */
  async analyzeCachingHeaders(url) {
    try {
      const response = await axios({
        method: 'HEAD',
        url,
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 5000,
        maxRedirects: 3
      });
      
      const headers = response.headers;
      
      const cacheControl = headers['cache-control'];
      const etag = headers['etag'];
      const expires = headers['expires'];
      const lastModified = headers['last-modified'];
      
      const hasEfficientCaching = cacheControl && (
        cacheControl.includes('max-age=') ||
        cacheControl.includes('s-maxage=')
      );
      
      const hasValidation = etag || lastModified;
      
      return {
        properCaching: hasEfficientCaching || (expires && hasValidation),
        cacheControl,
        etag,
        expires,
        lastModified,
        hasEfficientCaching,
        hasValidation
      };
    } catch (error) {
      logger.error(`Error analyzing caching headers for ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check for performance issues
   * @param {Object} loadTimeData - Load time data
   * @param {Object} resourceData - Resource data
   * @param {Object} perfResult - Performance result object to populate
   */
  checkPerformanceIssues(loadTimeData, resourceData, perfResult) {
    // Check load time
    if (loadTimeData.time > 3000) {
      perfResult.findings.push({
        title: 'Slow Page Load Time',
        description: `The page takes ${(loadTimeData.time / 1000).toFixed(2)}s to load, which exceeds the recommended 3 seconds.`,
        severity: loadTimeData.time > 5000 ? 'High' : 'Medium',
        evidence: `Load time: ${(loadTimeData.time / 1000).toFixed(2)}s`,
        recommendation: 'Optimize the page to improve load time. Consider reducing resource size, enabling compression, and implementing caching.'
      });
    }
    
    // Check total page size
    if (resourceData.totalSize > 3000000) { // 3MB
      perfResult.findings.push({
        title: 'Large Page Size',
        description: `The total page size is approximately ${(resourceData.totalSize / 1000000).toFixed(2)}MB, which is larger than the recommended maximum of 3MB.`,
        severity: resourceData.totalSize > 5000000 ? 'High' : 'Medium',
        evidence: `Total size: ${(resourceData.totalSize / 1000000).toFixed(2)}MB`,
        recommendation: 'Reduce the page size by optimizing images, minifying CSS and JavaScript, and removing unnecessary resources.'
      });
    }
    
    // Check number of resources
    if (resourceData.totalResources > 50) {
      perfResult.findings.push({
        title: 'Too Many HTTP Requests',
        description: `The page makes approximately ${resourceData.totalResources} HTTP requests, which is more than the recommended maximum of 50.`,
        severity: resourceData.totalResources > 75 ? 'Medium' : 'Low',
        evidence: `Total requests: ${resourceData.totalResources}`,
        recommendation: 'Reduce the number of HTTP requests by combining CSS and JavaScript files, using CSS sprites for small images, and removing unnecessary resources.'
      });
    }
    
    // Check for large resources
    if (resourceData.largeResources && resourceData.largeResources.length > 0) {
      resourceData.largeResources.forEach(resource => {
        perfResult.findings.push({
          title: `Large ${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} Resource`,
          description: `A large ${resource.type} resource (${(resource.size / 1000).toFixed(2)}KB) was detected.`,
          severity: resource.size > 1000000 ? 'Medium' : 'Low', // 1MB
          location: resource.url,
          recommendation: `Optimize the ${resource.type} file to reduce its size.${resource.type === 'images' ? ' Consider using WebP format and proper image compression.' : ''}`
        });
      });
    }
    
    // Check for excessive JS
    if (resourceData.resourcesByType.javascript.count > 15) {
      perfResult.findings.push({
        title: 'Excessive JavaScript Resources',
        description: `The page loads ${resourceData.resourcesByType.javascript.count} JavaScript files, which may impact performance.`,
        severity: 'Medium',
        evidence: `JavaScript files: ${resourceData.resourcesByType.javascript.count}`,
        recommendation: 'Reduce the number of JavaScript files by bundling them together and removing unnecessary scripts.'
      });
    }
    
    // Check for excessive CSS
    if (resourceData.resourcesByType.css.count > 10) {
      perfResult.findings.push({
        title: 'Excessive CSS Resources',
        description: `The page loads ${resourceData.resourcesByType.css.count} CSS files, which may impact performance.`,
        severity: 'Low',
        evidence: `CSS files: ${resourceData.resourcesByType.css.count}`,
        recommendation: 'Reduce the number of CSS files by combining them into a single file and removing unused styles.'
      });
    }
    
    // Check for excessive images
    if (resourceData.resourcesByType.images.count > 30) {
      perfResult.findings.push({
        title: 'Excessive Image Resources',
        description: `The page loads ${resourceData.resourcesByType.images.count} image files, which may impact performance.`,
        severity: 'Medium',
        evidence: `Image files: ${resourceData.resourcesByType.images.count}`,
        recommendation: 'Reduce the number of images by using CSS for simple graphics, combining small images into sprites, and removing unnecessary images.'
      });
    }
  }

  /**
   * Calculate overall score based on findings
   * @param {Object} perfResult - Result object with findings
   * @returns {number} Score from 0-100
   */
  calculateScore(perfResult) {
    // Start with a perfect score
    let score = 100;
    
    // Deduct points based on finding severity
    const deductions = {
      'Critical': 25,
      'High': 15,
      'Medium': 10,
      'Low': 5,
      'Info': 0
    };
    
    perfResult.findings.forEach(finding => {
      score -= deductions[finding.severity] || 0;
    });
    
    // Additional scoring based on load time (if available)
    const loadTime = perfResult.metadata.get('loadTime');
    if (loadTime) {
      if (loadTime < 1000) {
        // Excellent load time, bonus points if score is not already 100
        score = Math.min(100, score + 5);
      } else if (loadTime > 3000 && loadTime <= 5000) {
        // Slow load time
        score -= 5;
      } else if (loadTime > 5000 && loadTime <= 8000) {
        // Very slow load time
        score -= 10;
      } else if (loadTime > 8000) {
        // Extremely slow load time
        score -= 15;
      }
    }
    
    // Ensure score is within 0-100
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = PerformanceScanner;
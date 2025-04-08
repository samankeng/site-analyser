const SslScanner = require('./SslScanner');
const HeaderScanner = require('./HeaderScanner');
const PortScanner = require('./PortScanner');
const VulnerabilityScanner = require('./VulnerabilityScanner');
const ContentScanner = require('./ContentScanner');
const PerformanceScanner = require('./PerformanceScanner');
const AIService = require('../integrations/AIService');
const Scan = require('../../models/Scan');
const Result = require('../../models/Result');
const redis = require('../../config/redis');
const logger = require('../../utils/logger');
const config = require('../../config');
const Queue = require('bull');

/**
 * Main service for orchestrating security scans
 */
class ScanService {
  constructor() {
    // Initialize scanner modules
    this.sslScanner = new SslScanner();
    this.headerScanner = new HeaderScanner();
    this.portScanner = new PortScanner();
    this.vulnerabilityScanner = new VulnerabilityScanner();
    this.contentScanner = new ContentScanner();
    this.performanceScanner = new PerformanceScanner();
    
    // Initialize queue
    this.scanQueue = new Queue('security-scans', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        maxRetriesPerRequest: null, // Retry indefinitely
        connectTimeout: 30000, // Longer timeout for initial connection
        retryStrategy: function(times) {
          return Math.min(times * 500, 5000); // Exponential backoff
      },
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
        timeout: config.scan.timeout
      }
  }});

    // Process jobs
    this.scanQueue.process(config.scan.concurrentScans, this.processScan.bind(this));
    
    // Handle events
    this.scanQueue.on('completed', this.handleScanComplete.bind(this));
    this.scanQueue.on('failed', this.handleScanFailed.bind(this));
    this.scanQueue.on('stalled', this.handleScanStalled.bind(this));
    
    logger.info('ScanService initialized');
  }

  /**
   * Queue a new scan
   * @param {string} scanId - MongoDB ID of scan document
   * @returns {Promise<Object>} Job object
   */
  async queueScan(scanId) {
    try {
      // Get scan from database
      const scan = await Scan.findById(scanId);
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      // Add job to queue
      const job = await this.scanQueue.add(
        { scanId: scan._id.toString() },
        {
          jobId: scan._id.toString(),
          priority: scan.options.vulnDetection ? 1 : 2 // Vulnerability scans get higher priority
        }
      );
      
      // Update scan with job ID
      scan.jobId = job.id;
      await scan.save();
      
      logger.info(`Scan queued: ${scanId}, Job ID: ${job.id}`);
      return job;
    } catch (error) {
      logger.error(`Error queueing scan: ${error.message}`);
      // Update scan status to indicate queue failure
    try {
      const scan = await Scan.findById(scanId);
      if (scan) {
        scan.status = 'failed';
        scan.error = `Failed to queue scan: ${error.message}`;
        await scan.save();
      }
    } catch (updateError) {
      logger.error(`Error updating scan status: ${updateError.message}`);
    }
      throw error;
    }
  }

  /**
   * Cancel a scan
   * @param {string} scanId - MongoDB ID of scan to cancel
   * @returns {Promise<boolean>} Success status
   */
  async cancelScan(scanId) {
    try {
      // Get scan from database
      const scan = await Scan.findById(scanId);
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      // Remove job from queue if it hasn't started
      if (scan.jobId) {
        await this.scanQueue.removeJobs(scan.jobId);
      }
      
      // Update scan status
      scan.status = 'cancelled';
      await scan.save();
      
      logger.info(`Scan cancelled: ${scanId}`);
      return true;
    } catch (error) {
      logger.error(`Error cancelling scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a scan job
   * @param {Object} job - Bull queue job
   * @returns {Promise<Object>} Scan result
   */
  async processScan(job) {
    const { scanId } = job.data;
    logger.info(`Processing scan: ${scanId}`);
    
    try {
      // Get scan from database
      const scan = await Scan.findById(scanId);
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      // Update scan status to in_progress
      scan.status = 'in_progress';
      scan.startedAt = new Date();
      scan.progress = 0;
      await scan.save();
      
      // Validate URL
      const url = this.normalizeUrl(scan.url);
      logger.info(`Starting scan of ${url}`);
      
      // Initialize results object
      const results = {
        ssl: null,
        headers: null,
        vulnerabilities: null,
        ports: null,
        content: null,
        performance: null
      };
      
      // Get scan depth factor
      const depthFactor = config.scan.depthFactors[scan.scanDepth] || 1.0;
      
      // Run SSL scan if enabled
      if (scan.options.sslCheck) {
        await job.progress(10);
        logger.debug(`Running SSL scan for ${url}`);
        results.ssl = await this.sslScanner.scan(url, depthFactor);
        scan.progress = 20;
        await scan.save();
      }
      
      // Run header analysis if enabled
      if (scan.options.headerAnalysis) {
        await job.progress(20);
        logger.debug(`Running header analysis for ${url}`);
        results.headers = await this.headerScanner.scan(url, depthFactor);
        scan.progress = 40;
        await scan.save();
      }
      
      // Run port scan if enabled
      if (scan.options.portScan) {
        await job.progress(40);
        logger.debug(`Running port scan for ${url}`);
        results.ports = await this.portScanner.scan(url, depthFactor);
        scan.progress = 60;
        await scan.save();
      }
      
      // Run vulnerability detection if enabled
      if (scan.options.vulnDetection) {
        await job.progress(60);
        logger.debug(`Running vulnerability detection for ${url}`);
        results.vulnerabilities = await this.vulnerabilityScanner.scan(url, depthFactor);
        scan.progress = 80;
        await scan.save();
      }
      
      // Run content analysis if enabled
      if (scan.options.contentAnalysis) {
        await job.progress(80);
        logger.debug(`Running content analysis for ${url}`);
        results.content = await this.contentScanner.scan(url, depthFactor);
      }
      
      // Run performance check if enabled
      if (scan.options.performanceCheck) {
        await job.progress(90);
        logger.debug(`Running performance check for ${url}`);
        results.performance = await this.performanceScanner.scan(url, depthFactor);
      }
      
      // Save scan results
      await job.progress(95);
      const result = await this.saveResults(scan, results);
      
      // Generate AI analysis if enabled
      if (config.features.aiAnalysis) {
        try {
          const aiAnalysis = await AIService.analyzeScanResults(result);
          scan.aiAnalysis = aiAnalysis;
        } catch (error) {
          logger.error(`Error generating AI analysis: ${error.message}`);
          // Continue without AI analysis
        }
      }
      
      // Update scan status to completed
      scan.status = 'completed';
      scan.progress = 100;
      scan.completedAt = new Date();
      await scan.save();
      
      logger.info(`Scan completed: ${scanId}`);
      await job.progress(100);
      
      return result;
    } catch (error) {
      // Update scan status to failed
      try {
        const scan = await Scan.findById(scanId);
        if (scan) {
          scan.status = 'failed';
          scan.error = error.message;
          await scan.save();
        }
      } catch (updateError) {
        logger.error(`Error updating failed scan: ${updateError.message}`);
      }
      
      logger.error(`Scan failed: ${scanId}, Error: ${error.message}`);
      throw error;
    }
  }

  sanitizeForMongoDB(obj) {
    if (!obj) return null;
    
    try {
      // Try first with known circular references removed
      const safeObj = JSON.parse(JSON.stringify(obj, (key, value) => {
        // Known circular reference fields
        if (['issuerCertificate', 'parent', '_parent', 'socket', 'connection'].includes(key)) {
          return undefined;
        }
        // Handle potential circular reference for objects that aren't primitives
        if (typeof value === 'object' && value !== null && key !== '') {
          return { ...value }; // Return a shallow copy
        }
        return value;
      }));
      return safeObj;
    } catch (error) {
      logger.error(`Error sanitizing object for MongoDB: ${error.message}`);
      
      // Fall back to a manual approach
      // For objects, create a new clean object with just primitive values
      if (typeof obj === 'object' && obj !== null) {
        const cleanObj = {};
        
        // Only copy primitive values and arrays of primitives
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          
          // Handle primitives
          if (value === null || 
              typeof value === 'string' || 
              typeof value === 'number' || 
              typeof value === 'boolean') {
            cleanObj[key] = value;
          }
          // Handle arrays of primitives
          else if (Array.isArray(value)) {
            cleanObj[key] = value.map(item => {
              if (item === null || 
                  typeof item === 'string' || 
                  typeof item === 'number' || 
                  typeof item === 'boolean') {
                return item;
              }
              // For objects in arrays, just keep their string representation or key properties
              if (typeof item === 'object') {
                return { 
                  type: item.constructor.name,
                  id: item.id || item._id || '',
                  name: item.name || item.title || ''
                };
              }
              return String(item);
            });
          }
          // For nested objects, include a simplified version
          else if (typeof value === 'object') {
            // Just include key identification properties
            cleanObj[key] = {
              type: value.constructor.name,
              id: value.id || value._id || '',
              name: value.name || value.title || ''
            };
          }
        });
        
        return cleanObj;
      }
      
      // For non-objects, return as is
      return obj;
    }
  }

  /**
   * Save scan results to database
   * @param {Object} scan - Scan document
   * @param {Object} scanResults - Results from various scanners
   * @returns {Promise<Object>} Saved result document
   */
  // async saveResults(scan, scanResults) {
  //   logger.debug(`Saving results for scan: ${scan._id}`);

  //   // Create a sanitized copy of the results to remove circular references
  // const sanitizedResults = {};
  
  // // Process each scanner result separately
  // if (scanResults.ssl) {
  //   sanitizedResults.ssl = this.sanitizeForMongoDB(scanResults.ssl);
  // }
  // if (scanResults.headers) {
  //   sanitizedResults.headers = this.sanitizeForMongoDB(scanResults.headers);
  // }
  // if (scanResults.vulnerabilities) {
  //   sanitizedResults.vulnerabilities = this.sanitizeForMongoDB(scanResults.vulnerabilities);
  // }
  // if (scanResults.ports) {
  //   sanitizedResults.ports = this.sanitizeForMongoDB(scanResults.ports);
  // }
  // if (scanResults.content) {
  //   sanitizedResults.content = this.sanitizeForMongoDB(scanResults.content);
  // }
  // if (scanResults.performance) {
  //   sanitizedResults.performance = this.sanitizeForMongoDB(scanResults.performance);
  // }
    
  //   // Calculate overall scores
  //   const summary = this.calculateSummary(scanResults);
    
  //   // Create result document
  //   const result = new Result({
  //     scanId: scan._id,
  //     url: scan.url,
  //     results: scanResults,
  //     summary,
  //     createdAt: new Date()
  //   });
    
  //   // Save result
  //   await result.save();
    
  //   // Update scan with result reference and summary
  //   scan.results = result._id;
  //   scan.summary = summary;
  //   await scan.save();
    
  //   return result;
  // }


  async saveResults(scan, scanResults) {
    logger.debug(`Saving results for scan: ${scan._id}`);
    
    // Create a brand new object with only the essential data
    const sanitizedResults = {};
    
    // Process SSL results
    if (scanResults.ssl) {
      try {
        // For SSL, create a completely new simplified object
        sanitizedResults.ssl = {
          score: scanResults.ssl.score,
          findings: Array.isArray(scanResults.ssl.findings) ? 
            scanResults.ssl.findings.map(f => ({
              title: f.title || '',
              description: f.description || '',
              severity: f.severity || 'info'
            })) : [],
          // Only include essential endpoint data
          endpoints: Array.isArray(scanResults.ssl.endpoints) ?
            scanResults.ssl.endpoints.map(ep => ({
              ipAddress: ep.ipAddress,
              grade: ep.grade,
              hasWarnings: ep.hasWarnings
            })) : []
        };
      } catch (error) {
        logger.error(`Error sanitizing SSL results: ${error.message}`);
        sanitizedResults.ssl = { score: 0, error: "Could not process SSL data" };
      }
    }
    
    // Process other results similarly
    if (scanResults.headers) {
      try {
        sanitizedResults.headers = {
          score: scanResults.headers.score,
          findings: Array.isArray(scanResults.headers.findings) ? 
            scanResults.headers.findings.map(f => ({
              title: f.title || '',
              description: f.description || '',
              severity: f.severity || 'info',
              header: f.header
            })) : []
        };
      } catch (error) {
        logger.error(`Error sanitizing headers results: ${error.message}`);
        sanitizedResults.headers = { score: 0, error: "Could not process headers data" };
      }
    }
    
    // Process vulnerability results
    if (scanResults.vulnerabilities) {
      try {
        sanitizedResults.vulnerabilities = {
          score: scanResults.vulnerabilities.score,
          findings: Array.isArray(scanResults.vulnerabilities.findings) ? 
            scanResults.vulnerabilities.findings.map(f => ({
              title: f.title || '',
              description: f.description || '',
              severity: f.severity || 'info',
              cve: f.cve
            })) : []
        };
      } catch (error) {
        logger.error(`Error sanitizing vulnerability results: ${error.message}`);
        sanitizedResults.vulnerabilities = { score: 0, error: "Could not process vulnerability data" };
      }
    }
    
    // Process port scan results
    if (scanResults.ports) {
      try {
        sanitizedResults.ports = {
          score: scanResults.ports.score,
          openPorts: Array.isArray(scanResults.ports.openPorts) ? 
            scanResults.ports.openPorts.map(p => ({
              port: p.port,
              service: p.service,
              state: p.state
            })) : [],
          findings: Array.isArray(scanResults.ports.findings) ? 
            scanResults.ports.findings.map(f => ({
              title: f.title || '',
              description: f.description || '',
              severity: f.severity || 'info'
            })) : []
        };
      } catch (error) {
        logger.error(`Error sanitizing port scan results: ${error.message}`);
        sanitizedResults.ports = { score: 0, error: "Could not process port scan data" };
      }
    }
    
    // Process content and performance similarly if needed
    
    // Calculate overall scores from the sanitized results
    const summary = this.calculateSummary(sanitizedResults);
    
    // Create result document
    const result = new Result({
      scanId: scan._id,
      url: scan.url,
      results: sanitizedResults,
      summary,
      createdAt: new Date()
    });
    
    // Save result
    await result.save();
    
    // Update scan with result reference and summary
    scan.results = result._id;
    scan.summary = summary;
    await scan.save();
    
    return result;
  }

  /**
   * Calculate summary statistics from scan results
   * @param {Object} results - Results from various scanners
   * @returns {Object} Summary statistics
   */
  calculateSummary(results) {
    const summary = {
      ssl: results.ssl ? results.ssl.score : null,
      headers: results.headers ? results.headers.score : null,
      vulnerabilities: results.vulnerabilities ? results.vulnerabilities.score : null,
      server: results.ports ? results.ports.score : null,
      findings: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      }
    };
    
    
    // Count findings by severity
    Object.keys(results).forEach(component => {
      if (results[component] && results[component].findings) {
        results[component].findings.forEach(finding => {
          const severity = finding.severity.toLowerCase();
          if (summary.findings[severity] !== undefined) {
            summary.findings[severity]++;
          }
        });
      }
    });
    
    // Calculate overall score based on component scores and findings
    let totalScore = 0;
    let scoreCount = 0;
    
    // Add component scores
    Object.keys(summary).forEach(key => {
      if (typeof summary[key] === 'number' && summary[key] !== null) {
        totalScore += summary[key];
        scoreCount++;
      }
    });
    
    // Apply penalty for critical and high findings
    const criticalPenalty = summary.findings.critical * 10;
    const highPenalty = summary.findings.high * 5;
    
    // Calculate overall score
    let overall = scoreCount > 0 ? totalScore / scoreCount : 0;
    overall = Math.max(0, overall - criticalPenalty - highPenalty);
    
    summary.overall = Math.round(overall);
    return summary;
  }

  /**
   * Normalize URL for scanning
   * @param {string} url - URL to normalize
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  /**
   * Handle completed scan
   * @param {Object} job - Bull queue job
   * @param {Object} result - Job result
   */
  async handleScanComplete(job, result) {
    logger.info(`Scan job completed: ${job.id}`);
  }

  /**
   * Handle failed scan
   * @param {Object} job - Bull queue job
   * @param {Error} error - Error that occurred
   */
  async handleScanFailed(job, error) {
    const { scanId } = job.data;
    logger.error(`Scan job failed: ${job.id}, Scan ID: ${scanId}, Error: ${error.message}`);
    
    try {
      const scan = await Scan.findById(scanId);
      if (scan) {
        scan.status = 'failed';
        scan.error = error.message;
        await scan.save();
      }
    } catch (updateError) {
      logger.error(`Error updating failed scan: ${updateError.message}`);
    }
  }

  /**
   * Handle stalled scan
   * @param {Object} job - Bull queue job
   */
  async handleScanStalled(job) {
    const { scanId } = job.data;
    logger.warn(`Scan job stalled: ${job.id}, Scan ID: ${scanId}`);
    
    try {
      const scan = await Scan.findById(scanId);
      if (scan) {
        scan.status = 'failed';
        scan.error = 'Scan stalled and was automatically restarted';
        await scan.save();
        
        // Re-queue the scan
        await this.queueScan(scanId);
      }
    } catch (error) {
      logger.error(`Error handling stalled scan: ${error.message}`);
    }
  }

  /**
   * Get scan status
   * @param {string} scanId - MongoDB ID of scan
   * @returns {Promise<Object>} Scan status
   */
  async getScanStatus(scanId) {
    // Get scan from database
    const scan = await Scan.findById(scanId);
    if (!scan) {
      throw new Error(`Scan not found: ${scanId}`);
    }
    
    // Get job from queue if still in queue
    if (scan.jobId && (scan.status === 'pending' || scan.status === 'in_progress')) {
      try {
        const job = await this.scanQueue.getJob(scan.jobId);
        if (job) {
          const state = await job.getState();
          const progress = await job.progress();
          
          return {
            scanId,
            status: scan.status,
            progress: progress || scan.progress || 0,
            queueState: state,
            estimatedCompletion: scan.estimatedCompletionTime
          };
        }
      } catch (error) {
        logger.error(`Error getting job status: ${error.message}`);
      }
    }
    
    // Return scan status from database
    return {
      scanId,
      status: scan.status,
      progress: scan.progress || 0,
      estimatedCompletion: scan.estimatedCompletionTime
    };
  }

  /**
   * Check for stalled scans and handle them
   * Called periodically from a cron job
   */
  async checkStalledScans() {
    logger.debug('Checking for stalled scans');
    
    try {
      // Find in-progress scans that haven't been updated in a while
      const stalledScans = await Scan.find({
        status: { $in: ['in_progress', 'pending'] },
        startedAt: { $lt: new Date(Date.now() - 20 * 60 * 1000) } // 20 minutes
      });
      
      if (stalledScans.length > 0) {
        logger.warn(`Found ${stalledScans.length} stalled scans`);
        
        for (const scan of stalledScans) {
          // Mark as failed
          scan.status = 'failed';
          scan.error = 'Scan timed out';
          await scan.save();
          
          logger.info(`Marked stalled scan as failed: ${scan._id}`);
        }
      }
    } catch (error) {
      logger.error(`Error checking stalled scans: ${error.message}`);
    }
  }
}

// Create and export a singleton instance
const scanService = new ScanService();
module.exports = scanService;
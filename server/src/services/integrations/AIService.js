const axios = require('axios');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Service for integrating with the AI analysis service
 */
class AIService {
  constructor() {
    this.baseUrl = config.aiService.url;
    this.timeout = config.aiService.timeout || 30000;
    this.enabled = config.features.aiAnalysis;
    
    logger.info(`AIService initialized, service ${this.enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Analyze scan results using AI
   * @param {Object} scanResult - Scan result object to analyze
   * @returns {Promise<Object>} AI analysis results
   */
  async analyzeScanResults(scanResult) {
    if (!this.enabled) {
      logger.warn('AI analysis requested but service is disabled');
      return null;
    }

    try {
      logger.info(`Sending scan results for AI analysis: ${scanResult._id}`);
      
      // Prepare data for AI service
      const analysisData = this.prepareAnalysisData(scanResult);
      
      // Send request to AI service
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/analyze/security`,
        data: analysisData,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SiteAnalyzer/1.0'
        },
        timeout: this.timeout
      });
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`AI service returned error: ${response.data.error || 'Unknown error'}`);
      }
      
      logger.info(`AI analysis completed for scan: ${scanResult._id}`);
      return response.data.analysis;
    } catch (error) {
      logger.error(`AI analysis error: ${error.message}`);
      
      // Return a basic analysis if the AI service fails
      return this.generateFallbackAnalysis(scanResult);
    }
  }

  /**
   * Prepare scan data for AI analysis
   * @param {Object} scanResult - Scan result object
   * @returns {Object} Data for AI analysis
   */
  prepareAnalysisData(scanResult) {
    // Extract the most relevant information for analysis
    const vulnerabilities = [];
    const findings = [];
    let allFindings = [];
    
    // Extract all findings
    if (scanResult.results) {
      // Extract SSL findings
      if (scanResult.results.ssl && scanResult.results.ssl.findings) {
        allFindings = [...allFindings, ...scanResult.results.ssl.findings.map(f => ({
          ...f,
          category: 'SSL/TLS'
        }))];
      }
      
      // Extract header findings
      if (scanResult.results.headers && scanResult.results.headers.findings) {
        allFindings = [...allFindings, ...scanResult.results.headers.findings.map(f => ({
          ...f,
          category: 'HTTP Headers'
        }))];
      }
      
      // Extract vulnerability findings
      if (scanResult.results.vulnerabilities && scanResult.results.vulnerabilities.findings) {
        allFindings = [...allFindings, ...scanResult.results.vulnerabilities.findings.map(f => ({
          ...f,
          category: 'Vulnerabilities'
        }))];
      }
      
      // Extract port findings
      if (scanResult.results.ports && scanResult.results.ports.findings) {
        allFindings = [...allFindings, ...scanResult.results.ports.findings.map(f => ({
          ...f,
          category: 'Network'
        }))];
      }
    }
    
    // Sort findings by severity
    const severityOrder = {
      'Critical': 0,
      'High': 1,
      'Medium': 2,
      'Low': 3,
      'Info': 4
    };
    
    allFindings.sort((a, b) => 
      (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99)
    );
    
    // Extract most critical vulnerabilities
    vulnerabilities.push(
      ...allFindings
        .filter(f => f.severity === 'Critical' || f.severity === 'High')
        .map(f => ({
          title: f.title,
          description: f.description,
          severity: f.severity,
          category: f.category
        }))
    );
    
    // Extract other findings
    findings.push(
      ...allFindings
        .filter(f => f.severity !== 'Critical' && f.severity !== 'High')
        .map(f => ({
          title: f.title,
          description: f.description,
          severity: f.severity,
          category: f.category
        }))
    );
    
    return {
      scanId: scanResult._id.toString(),
      url: scanResult.url,
      summary: scanResult.summary,
      vulnerabilities,
      findings,
      metadata: {
        scanDate: scanResult.createdAt,
        scanDuration: scanResult.completedAt ? 
          (new Date(scanResult.completedAt) - new Date(scanResult.startedAt)) / 1000 : 
          null
      }
    };
  }

  /**
   * Generate a fallback analysis if the AI service is unavailable
   * @param {Object} scanResult - Scan result object
   * @returns {Object} Basic analysis
   */
  generateFallbackAnalysis(scanResult) {
    logger.info('Generating fallback AI analysis');
    
    // Count findings by severity
    const findingCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };
    
    // Count findings from all scanners
    let allFindings = [];
    
    if (scanResult.results) {
      // Count SSL findings
      if (scanResult.results.ssl && scanResult.results.ssl.findings) {
        allFindings = [...allFindings, ...scanResult.results.ssl.findings];
      }
      
      // Count header findings
      if (scanResult.results.headers && scanResult.results.headers.findings) {
        allFindings = [...allFindings, ...scanResult.results.headers.findings];
      }
      
      // Count vulnerability findings
      if (scanResult.results.vulnerabilities && scanResult.results.vulnerabilities.findings) {
        allFindings = [...allFindings, ...scanResult.results.vulnerabilities.findings];
      }
      
      // Count port findings
      if (scanResult.results.ports && scanResult.results.ports.findings) {
        allFindings = [...allFindings, ...scanResult.results.ports.findings];
      }
    }
    
    // Count findings by severity
    allFindings.forEach(finding => {
      const severity = finding.severity.toLowerCase();
      if (findingCounts[severity] !== undefined) {
        findingCounts[severity]++;
      }
    });
    
    // Generate recommendations based on findings
    const recommendations = [];
    const prioritizedActions = [];
    
    // SSL recommendations
    if (scanResult.summary && scanResult.summary.ssl && scanResult.summary.ssl < 70) {
      recommendations.push('Improve SSL/TLS configuration to modern standards');
      prioritizedActions.push('Update SSL/TLS configuration');
    }
    
    // Headers recommendations
    if (scanResult.summary && scanResult.summary.headers && scanResult.summary.headers < 70) {
      recommendations.push('Implement proper security headers');
      prioritizedActions.push('Add missing security headers');
    }
    
    // Vulnerability recommendations
    if (findingCounts.critical > 0 || findingCounts.high > 0) {
      recommendations.push('Address critical and high severity vulnerabilities immediately');
      prioritizedActions.push('Fix critical security vulnerabilities');
    }
    
    // Server recommendations
    if (scanResult.summary && scanResult.summary.server && scanResult.summary.server < 70) {
      recommendations.push('Secure network services and restrict access to sensitive ports');
      prioritizedActions.push('Close or restrict access to unnecessary services');
    }
    
    // Overall security posture
    let riskLevel;
    if (scanResult.summary && scanResult.summary.overall) {
      if (scanResult.summary.overall < 50) {
        riskLevel = 'high';
      } else if (scanResult.summary.overall < 80) {
        riskLevel = 'moderate';
      } else {
        riskLevel = 'low';
      }
    } else {
      riskLevel = 'unknown';
    }
    
    // Default recommendations if none were generated
    if (recommendations.length === 0) {
      recommendations.push(
        'Implement security headers',
        'Keep software and dependencies up to date',
        'Regularly scan for vulnerabilities'
      );
    }
    
    if (prioritizedActions.length === 0) {
      prioritizedActions.push(
        'Perform regular security assessments',
        'Keep systems updated',
        'Implement a security policy'
      );
    }
    
    return {
      recommendations,
      riskAssessment: `This site has a ${riskLevel} risk level${scanResult.summary && scanResult.summary.overall ? ` with a security score of ${scanResult.summary.overall}/100` : ''}. ${
        riskLevel === 'high' ? 'Immediate action is recommended to address security issues.' :
        riskLevel === 'moderate' ? 'Some security improvements are recommended.' :
        'The site appears to have good security practices in place.'
      }`,
      prioritizedActions
    };
  }

  /**
   * Generate site security improvement suggestions
   * @param {string} domain - Domain to analyze
   * @param {Array} currentFindings - Current findings
   * @returns {Promise<Object>} Security improvement suggestions
   */
  async suggestSecurityImprovements(domain, currentFindings) {
    if (!this.enabled) {
      logger.warn('AI suggestions requested but service is disabled');
      return null;
    }

    try {
      logger.info(`Requesting security improvement suggestions for ${domain}`);
      
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/analyze/suggestions`,
        data: {
          domain,
          findings: currentFindings.map(f => ({
            title: f.title,
            description: f.description,
            severity: f.severity
          }))
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SiteAnalyzer/1.0'
        },
        timeout: this.timeout
      });
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`AI service returned error: ${response.data.error || 'Unknown error'}`);
      }
      
      logger.info(`Security improvement suggestions generated for ${domain}`);
      return response.data.suggestions;
    } catch (error) {
      logger.error(`Error getting security improvement suggestions: ${error.message}`);
      return null;
    }
  }
}

// Create and export singleton instance
const aiService = new AIService();
module.exports = aiService;
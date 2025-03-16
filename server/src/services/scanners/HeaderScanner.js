const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Scanner for analyzing HTTP security headers
 */
class HeaderScanner {
  /**
   * Initialize header scanner
   */
  constructor() {
    this.userAgent = 'SiteAnalyzer/1.0';
    
    // Define security headers and their importance
    this.securityHeaders = {
      'Strict-Transport-Security': {
        description: 'HTTP Strict Transport Security (HSTS)',
        importance: 'high',
        recommendation: 'Implement HSTS with a long max-age directive (e.g., "max-age=31536000; includeSubDomains; preload").',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security']
      },
      'Content-Security-Policy': {
        description: 'Content Security Policy (CSP)',
        importance: 'high',
        recommendation: 'Implement a strong Content Security Policy that restricts sources of content.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP']
      },
      'X-Content-Type-Options': {
        description: 'X-Content-Type-Options',
        importance: 'medium',
        recommendation: 'Set X-Content-Type-Options header to "nosniff".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options']
      },
      'X-Frame-Options': {
        description: 'X-Frame-Options',
        importance: 'medium',
        recommendation: 'Set X-Frame-Options header to "DENY" or "SAMEORIGIN".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options']
      },
      'X-XSS-Protection': {
        description: 'X-XSS-Protection',
        importance: 'medium',
        recommendation: 'Set X-XSS-Protection header to "1; mode=block".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection']
      },
      'Referrer-Policy': {
        description: 'Referrer Policy',
        importance: 'medium',
        recommendation: 'Set Referrer-Policy header to "no-referrer" or "strict-origin-when-cross-origin".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy']
      },
      'Permissions-Policy': {
        description: 'Permissions Policy (formerly Feature Policy)',
        importance: 'medium',
        recommendation: 'Implement a Permissions Policy that restricts powerful features.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy']
      },
      'Cross-Origin-Embedder-Policy': {
        description: 'Cross-Origin Embedder Policy (COEP)',
        importance: 'low',
        recommendation: 'Set Cross-Origin-Embedder-Policy header to "require-corp".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy']
      },
      'Cross-Origin-Opener-Policy': {
        description: 'Cross-Origin Opener Policy (COOP)',
        importance: 'low',
        recommendation: 'Set Cross-Origin-Opener-Policy header to "same-origin".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy']
      },
      'Cross-Origin-Resource-Policy': {
        description: 'Cross-Origin Resource Policy (CORP)',
        importance: 'low',
        recommendation: 'Set Cross-Origin-Resource-Policy header to "same-origin" or "same-site".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy']
      }
    };
    
    // Define problematic headers and their risks
    this.problematicHeaders = {
      'Server': {
        description: 'Server identification',
        risk: 'Information disclosure',
        recommendation: 'Configure the server to minimize information in the Server header.'
      },
      'X-Powered-By': {
        description: 'Technology identification',
        risk: 'Information disclosure',
        recommendation: 'Remove the X-Powered-By header.'
      },
      'X-AspNet-Version': {
        description: 'ASP.NET Version',
        risk: 'Information disclosure',
        recommendation: 'Remove the X-AspNet-Version header.'
      },
      'X-AspNetMvc-Version': {
        description: 'ASP.NET MVC Version',
        risk: 'Information disclosure',
        recommendation: 'Remove the X-AspNetMvc-Version header.'
      }
    };
    
    logger.info('HeaderScanner initialized');
  }

  /**
   * Perform HTTP header security scan
   * @param {string} url - URL to scan
   * @param {number} depthFactor - Scan depth factor (1.0 is standard)
   * @returns {Promise<Object>} Scan results
   */
  async scan(url, depthFactor = 1.0) {
    logger.info(`Starting header scan for ${url}`);
    
    try {
      // Set up result structure
      const headerResult = {
        score: 0,
        findings: [],
        metadata: new Map(),
        rawData: {}
      };
      
      // Fetch headers with a GET request
      const headers = await this.fetchHeaders(url, 'GET');
      headerResult.rawData.getHeaders = headers;
      
      // For more complete scans, also check headers with HEAD and OPTIONS requests
      if (depthFactor >= 1.0) {
        try {
          const headHeaders = await this.fetchHeaders(url, 'HEAD');
          headerResult.rawData.headHeaders = headHeaders;
          
          // Merge headers, giving priority to GET request headers
          Object.keys(headHeaders).forEach(header => {
            if (!headers[header]) {
              headers[header] = headHeaders[header];
            }
          });
        } catch (error) {
          logger.warn(`HEAD request failed for ${url}: ${error.message}`);
        }
        
        // For even deeper scans, check OPTIONS request
        if (depthFactor >= 1.5) {
          try {
            const optionsHeaders = await this.fetchHeaders(url, 'OPTIONS');
            headerResult.rawData.optionsHeaders = optionsHeaders;
            
            // Check for CORS headers in OPTIONS response
            this.analyzeCorsHeaders(optionsHeaders, headerResult);
          } catch (error) {
            logger.warn(`OPTIONS request failed for ${url}: ${error.message}`);
          }
        }
      }
      
      // Store normalized headers in metadata
      headerResult.metadata.set('headers', this.normalizeHeaders(headers));
      
      // Analyze security headers
      this.analyzeSecurityHeaders(headers, headerResult);
      
      // Analyze problematic headers
      this.analyzeProblematicHeaders(headers, headerResult);
      
      // Analyze cookie security
      if (headers['set-cookie']) {
        this.analyzeCookies(headers['set-cookie'], headerResult);
      }
      
      // Calculate score
      headerResult.score = this.calculateScore(headerResult);
      
      logger.info(`Header scan completed for ${url}`);
      return headerResult;
    } catch (error) {
      logger.error(`Header scan error for ${url}: ${error.message}`);
      
      // Return partial results if possible
      return {
        score: 0,
        findings: [{
          title: 'Header Scan Failed',
          description: `Could not complete header scan: ${error.message}`,
          severity: 'High',
          recommendation: 'Verify that the server is accessible and properly configured.'
        }],
        metadata: new Map(),
        rawData: { error: error.message }
      };
    }
  }

  /**
   * Fetch HTTP headers from a URL
   * @param {string} url - URL to fetch headers from
   * @param {string} method - HTTP method to use
   * @returns {Promise<Object>} HTTP headers
   */
  async fetchHeaders(url, method = 'GET') {
    try {
      const response = await axios({
        method,
        url,
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000,
        validateStatus: () => true, // Accept any status code
        maxRedirects: 5,
        // Don't download the whole response body
        responseType: 'stream'
      });
      
      // Get headers and immediately cancel the request
      const headers = response.headers;
      response.data.destroy(); // Close the stream
      
      // Convert headers to lowercase keys for consistent access
      const normalizedHeaders = {};
      Object.keys(headers).forEach(key => {
        normalizedHeaders[key.toLowerCase()] = headers[key];
      });
      
      return normalizedHeaders;
    } catch (error) {
      logger.error(`Error fetching headers from ${url} with ${method}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Normalize headers for consistent processing
   * @param {Object} headers - HTTP headers object
   * @returns {Object} Normalized headers
   */
  normalizeHeaders(headers) {
    const normalized = {};
    
    Object.keys(headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      normalized[lowerKey] = headers[key];
    });
    
    return normalized;
  }

  /**
   * Analyze security headers
   * @param {Object} headers - HTTP headers object
   * @param {Object} headerResult - Result object to populate
   */
  analyzeSecurityHeaders(headers, headerResult) {
    // Normalize headers for case-insensitive comparison
    const normalizedHeaders = this.normalizeHeaders(headers);
    
    // Check for each security header
    Object.keys(this.securityHeaders).forEach(headerName => {
      const normalizedName = headerName.toLowerCase();
      const headerInfo = this.securityHeaders[headerName];
      
      if (!normalizedHeaders[normalizedName]) {
        // Add finding for missing security header
        const severityMap = {
          high: 'High',
          medium: 'Medium',
          low: 'Low'
        };
        
        headerResult.findings.push({
          title: `Missing ${headerInfo.description} Header`,
          description: `The ${headerName} header is not present. This header helps protect against various attacks.`,
          severity: severityMap[headerInfo.importance] || 'Medium',
          evidence: 'Header not present in server response',
          recommendation: headerInfo.recommendation,
          references: headerInfo.references
        });
      } else {
        // Header is present, check if it's properly configured
        const headerValue = normalizedHeaders[normalizedName];
        
        // Add header to analysis metadata
        headerResult.metadata.set(normalizedName, headerValue);
        
        // Perform header-specific validation
        this.validateSecurityHeader(normalizedName, headerValue, headerResult);
      }
    });
  }

  /**
   * Validate specific security headers
   * @param {string} headerName - Header name (lowercase)
   * @param {string} headerValue - Header value
   * @param {Object} headerResult - Result object to populate
   */
  validateSecurityHeader(headerName, headerValue, headerResult) {
    switch (headerName) {
      case 'strict-transport-security':
        this.validateHstsHeader(headerValue, headerResult);
        break;
      case 'content-security-policy':
        this.validateCspHeader(headerValue, headerResult);
        break;
      case 'x-content-type-options':
        this.validateXContentTypeOptions(headerValue, headerResult);
        break;
      case 'x-frame-options':
        this.validateXFrameOptions(headerValue, headerResult);
        break;
      case 'x-xss-protection':
        this.validateXssProtection(headerValue, headerResult);
        break;
      case 'referrer-policy':
        this.validateReferrerPolicy(headerValue, headerResult);
        break;
      // Other headers can be validated similarly
    }
  }

  /**
   * Validate HSTS header
   * @param {string} headerValue - HSTS header value
   * @param {Object} headerResult - Result object to populate
   */
  validateHstsHeader(headerValue, headerResult) {
    // Parse max-age
    const maxAgeMatch = headerValue.match(/max-age=(\d+)/i);
    if (!maxAgeMatch) {
      headerResult.findings.push({
        title: 'Invalid HSTS Header',
        description: 'The Strict-Transport-Security header is present but does not contain a max-age directive.',
        severity: 'Medium',
        evidence: `HSTS header: ${headerValue}`,
        recommendation: 'Ensure the HSTS header contains a valid max-age directive.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security']
      });
      return;
    }
    
    const maxAge = parseInt(maxAgeMatch[1], 10);
    
    // Check if max-age is too short
    if (maxAge < 15768000) { // Less than 6 months
      headerResult.findings.push({
        title: 'Short HSTS Max Age',
        description: `The HSTS max-age is set to ${maxAge} seconds, which is less than the recommended 6 months.`,
        severity: 'Medium',
        evidence: `HSTS max-age: ${maxAge} seconds`,
        recommendation: 'Increase the HSTS max-age to at least 6 months (15768000 seconds).',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security']
      });
    }
    
    // Check for includeSubDomains directive
    if (!headerValue.includes('includeSubDomains')) {
      headerResult.findings.push({
        title: 'HSTS Missing includeSubDomains',
        description: 'The HSTS header does not include the includeSubDomains directive.',
        severity: 'Low',
        evidence: `HSTS header: ${headerValue}`,
        recommendation: 'Add the includeSubDomains directive to the HSTS header.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security']
      });
    }
    
    // Check for preload directive
    if (!headerValue.includes('preload')) {
      headerResult.findings.push({
        title: 'HSTS Missing preload',
        description: 'The HSTS header does not include the preload directive.',
        severity: 'Info',
        evidence: `HSTS header: ${headerValue}`,
        recommendation: 'Consider adding the preload directive to the HSTS header for maximum security.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security']
      });
    }
  }

  /**
   * Validate Content Security Policy header
   * @param {string} headerValue - CSP header value
   * @param {Object} headerResult - Result object to populate
   */
  validateCspHeader(headerValue, headerResult) {
    // Check for unsafe directives
    const unsafeDirectives = [
      "unsafe-inline",
      "unsafe-eval",
      "unsafe-hashes"
    ];
    
    const hasUnsafeDirectives = unsafeDirectives.some(directive => 
      headerValue.includes(directive)
    );
    
    if (hasUnsafeDirectives) {
      headerResult.findings.push({
        title: 'CSP Contains Unsafe Directives',
        description: 'The Content Security Policy contains unsafe directives that weaken security.',
        severity: 'Medium',
        evidence: `CSP header: ${headerValue}`,
        recommendation: 'Avoid using unsafe-inline, unsafe-eval, and unsafe-hashes directives in your CSP.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP']
      });
    }
    
    // Check for wildcard sources
    if (headerValue.includes("*")) {
      headerResult.findings.push({
        title: 'CSP Contains Wildcard Sources',
        description: 'The Content Security Policy contains wildcard sources that weaken security.',
        severity: 'Medium',
        evidence: `CSP header: ${headerValue}`,
        recommendation: 'Avoid using wildcards (*) in your CSP and specify exact sources instead.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP']
      });
    }
    
    // Check for report-uri directive
    if (!headerValue.includes('report-uri') && !headerValue.includes('report-to')) {
      headerResult.findings.push({
        title: 'CSP Missing Reporting',
        description: 'The Content Security Policy does not include reporting directives.',
        severity: 'Info',
        evidence: `CSP header: ${headerValue}`,
        recommendation: 'Consider adding the report-uri or report-to directive to collect violation reports.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP']
      });
    }
  }

  /**
   * Validate X-Content-Type-Options header
   * @param {string} headerValue - Header value
   * @param {Object} headerResult - Result object to populate
   */
  validateXContentTypeOptions(headerValue, headerResult) {
    if (headerValue.toLowerCase() !== 'nosniff') {
      headerResult.findings.push({
        title: 'Invalid X-Content-Type-Options Value',
        description: 'The X-Content-Type-Options header has an invalid value.',
        severity: 'Medium',
        evidence: `X-Content-Type-Options: ${headerValue}`,
        recommendation: 'Set the X-Content-Type-Options header value to "nosniff".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options']
      });
    }
  }

  /**
   * Validate X-Frame-Options header
   * @param {string} headerValue - Header value
   * @param {Object} headerResult - Result object to populate
   */
  validateXFrameOptions(headerValue, headerResult) {
    const validValues = ['deny', 'sameorigin'];
    const value = headerValue.toLowerCase();
    
    if (!validValues.includes(value) && !value.startsWith('allow-from ')) {
      headerResult.findings.push({
        title: 'Invalid X-Frame-Options Value',
        description: 'The X-Frame-Options header has an invalid value.',
        severity: 'Medium',
        evidence: `X-Frame-Options: ${headerValue}`,
        recommendation: 'Set the X-Frame-Options header to "DENY" or "SAMEORIGIN".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options']
      });
    }
    
    // Note: allow-from is deprecated
    if (value.startsWith('allow-from ')) {
      headerResult.findings.push({
        title: 'Deprecated X-Frame-Options Value',
        description: 'The X-Frame-Options header uses the deprecated "ALLOW-FROM" directive.',
        severity: 'Low',
        evidence: `X-Frame-Options: ${headerValue}`,
        recommendation: 'Use Content Security Policy\'s frame-ancestors directive instead.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options']
      });
    }
  }

  /**
   * Validate X-XSS-Protection header
   * @param {string} headerValue - Header value
   * @param {Object} headerResult - Result object to populate
   */
  validateXssProtection(headerValue, headerResult) {
    // Check if it's enabled and in block mode
    if (headerValue !== '1; mode=block') {
      headerResult.findings.push({
        title: 'Suboptimal X-XSS-Protection Value',
        description: 'The X-XSS-Protection header is not set to optimal value.',
        severity: 'Low',
        evidence: `X-XSS-Protection: ${headerValue}`,
        recommendation: 'Set the X-XSS-Protection header to "1; mode=block".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection']
      });
    }
    
    // Note: This header is increasingly less relevant with modern browsers
    headerResult.findings.push({
      title: 'X-XSS-Protection is Deprecated',
      description: 'The X-XSS-Protection header is deprecated in modern browsers in favor of Content Security Policy.',
      severity: 'Info',
      evidence: `X-XSS-Protection header is present`,
      recommendation: 'Use Content Security Policy instead, but keep X-XSS-Protection for older browsers.',
      references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection']
    });
  }

  /**
   * Validate Referrer-Policy header
   * @param {string} headerValue - Header value
   * @param {Object} headerResult - Result object to populate
   */
  validateReferrerPolicy(headerValue, headerResult) {
    const secureValues = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'strict-origin',
      'strict-origin-when-cross-origin'
    ];
    
    const value = headerValue.toLowerCase();
    
    if (!secureValues.includes(value)) {
      let severity = 'Low';
      
      // These are particularly problematic
      if (value === 'unsafe-url' || value === 'origin-when-cross-origin' || value === '') {
        severity = 'Medium';
      }
      
      headerResult.findings.push({
        title: 'Weak Referrer-Policy Value',
        description: 'The Referrer-Policy header uses a value that may leak sensitive information in the Referer header.',
        severity,
        evidence: `Referrer-Policy: ${headerValue}`,
        recommendation: 'Set the Referrer-Policy header to a more restrictive value like "no-referrer" or "strict-origin-when-cross-origin".',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy']
      });
    }
  }

  /**
   * Analyze problematic headers
   * @param {Object} headers - HTTP headers object
   * @param {Object} headerResult - Result object to populate
   */
  analyzeProblematicHeaders(headers, headerResult) {
    const normalizedHeaders = this.normalizeHeaders(headers);
    
    // Check for each problematic header
    Object.keys(this.problematicHeaders).forEach(headerName => {
      const normalizedName = headerName.toLowerCase();
      const headerInfo = this.problematicHeaders[headerName];
      
      if (normalizedHeaders[normalizedName]) {
        const headerValue = normalizedHeaders[normalizedName];
        
        // Add finding for problematic header
        headerResult.findings.push({
          title: `Information Disclosure: ${headerInfo.description}`,
          description: `The ${headerName} header reveals information about the server technology: "${headerValue}".`,
          severity: 'Low',
          evidence: `${headerName}: ${headerValue}`,
          recommendation: headerInfo.recommendation
        });
        
        // Additional checks for specific headers
        if (normalizedName === 'server' && headerValue.includes(' ')) {
          headerResult.findings.push({
            title: 'Detailed Server Banner',
            description: 'The Server header reveals detailed information including version numbers.',
            severity: 'Medium',
            evidence: `Server: ${headerValue}`,
            recommendation: 'Configure the server to provide minimal information in the Server header.'
          });
        }
      }
    });
  }

  /**
   * Analyze cookie security
   * @param {string|Array<string>} cookies - Set-Cookie header value(s)
   * @param {Object} headerResult - Result object to populate
   */
  analyzeCookies(cookies, headerResult) {
    // Ensure cookies is an array
    if (!Array.isArray(cookies)) {
      cookies = [cookies];
    }
    
    // Process each cookie
    cookies.forEach(cookie => {
      // Check for Secure flag
      if (!cookie.includes('Secure')) {
        headerResult.findings.push({
          title: 'Cookie Missing Secure Flag',
          description: 'A cookie is set without the Secure flag, which means it can be transmitted over unencrypted connections.',
          severity: 'Medium',
          evidence: `Cookie: ${cookie.split(';')[0]}`,
          recommendation: 'Set the Secure flag on all cookies to ensure they are only sent over HTTPS.',
          references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies']
        });
      }
      
      // Check for HttpOnly flag
      if (!cookie.includes('HttpOnly')) {
        headerResult.findings.push({
          title: 'Cookie Missing HttpOnly Flag',
          description: 'A cookie is set without the HttpOnly flag, which makes it accessible to JavaScript.',
          severity: 'Medium',
          evidence: `Cookie: ${cookie.split(';')[0]}`,
          recommendation: 'Set the HttpOnly flag on sensitive cookies to prevent access from JavaScript.',
          references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies']
        });
      }
      
      // Check for SameSite attribute
      if (!cookie.includes('SameSite=')) {
        headerResult.findings.push({
          title: 'Cookie Missing SameSite Attribute',
          description: 'A cookie is set without the SameSite attribute, which controls when the cookie is sent in cross-site requests.',
          severity: 'Medium',
          evidence: `Cookie: ${cookie.split(';')[0]}`,
          recommendation: 'Set the SameSite attribute on cookies (Lax or Strict) to prevent CSRF attacks.',
          references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite']
        });
      } else if (cookie.includes('SameSite=None') && !cookie.includes('Secure')) {
        headerResult.findings.push({
          title: 'SameSite=None Without Secure Flag',
          description: 'A cookie with SameSite=None must also have the Secure flag.',
          severity: 'High',
          evidence: `Cookie: ${cookie.split(';')[0]}`,
          recommendation: 'Add the Secure flag to cookies with SameSite=None.',
          references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite']
        });
      }
    });
  }

  /**
   * Analyze CORS headers
   * @param {Object} headers - HTTP headers object from OPTIONS request
   * @param {Object} headerResult - Result object to populate
   */
  analyzeCorsHeaders(headers, headerResult) {
    const normalizedHeaders = this.normalizeHeaders(headers);
    
    // Check Access-Control-Allow-Origin
    if (normalizedHeaders['access-control-allow-origin'] === '*') {
      headerResult.findings.push({
        title: 'CORS Allows Any Origin',
        description: 'The Access-Control-Allow-Origin header is set to "*", which allows any domain to make cross-origin requests.',
        severity: 'Medium',
        evidence: `Access-Control-Allow-Origin: *`,
        recommendation: 'Restrict CORS to specific trusted domains instead of using a wildcard.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS']
      });
    }
    
    // Check Access-Control-Allow-Credentials
    if (normalizedHeaders['access-control-allow-credentials'] === 'true' && 
        normalizedHeaders['access-control-allow-origin'] === '*') {
      headerResult.findings.push({
        title: 'Incompatible CORS Configuration',
        description: 'Access-Control-Allow-Credentials is true, but Access-Control-Allow-Origin is set to "*", which is not allowed by browsers.',
        severity: 'High',
        evidence: `Access-Control-Allow-Credentials: true, Access-Control-Allow-Origin: *`,
        recommendation: 'Specify explicit origins instead of "*" when using Access-Control-Allow-Credentials: true.',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials']
      });
    }
  }

  /**
   * Calculate overall score based on findings
   * @param {Object} headerResult - Result object with findings
   * @returns {number} Score from 0-100
   */
  calculateScore(headerResult) {
    // Start with a perfect score
    let score = 100;
    
    // Count security headers
    const securityHeaderCount = Object.keys(this.securityHeaders).length;
    const presentHeaderCount = [...headerResult.metadata.keys()].filter(key => 
      Object.keys(this.securityHeaders).map(h => h.toLowerCase()).includes(key)
    ).length;
    
    // Base score on percentage of security headers present (60% of total score)
    const headerCoverageScore = (presentHeaderCount / securityHeaderCount) * 60;
    
    // Deduct points for findings (40% of total score)
    const deductions = {
      'Critical': 40,
      'High': 20,
      'Medium': 10,
      'Low': 5,
      'Info': 0
    };
    
    let findingsDeduction = 0;
    headerResult.findings.forEach(finding => {
      findingsDeduction += deductions[finding.severity] || 0;
    });
    
    // Cap findings deduction at 40 points
    findingsDeduction = Math.min(findingsDeduction, 40);
    
    // Calculate final score
    score = Math.round(headerCoverageScore + (40 - findingsDeduction));
    
    // Ensure score is within 0-100
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = HeaderScanner;
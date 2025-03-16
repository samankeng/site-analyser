const axios = require('axios');
const https = require('https');
const { URL } = require('url');
const tls = require('tls');
const crypto = require('crypto');
const SslLabsService = require('../integrations/SslLabsService');
const logger = require('../../utils/logger');

/**
 * Scanner for SSL/TLS security analysis
 */
class SslScanner {
  /**
   * Initialize SSL scanner
   */
  constructor() {
    this.userAgent = 'SiteAnalyzer/1.0';
    
    // Define cipher strength categorization
    this.cipherStrength = {
      STRONG: ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_AES_128_GCM_SHA256', 'ECDHE-RSA-AES256-GCM-SHA384', 'ECDHE-ECDSA-AES256-GCM-SHA384'],
      MEDIUM: ['ECDHE-RSA-AES128-GCM-SHA256', 'ECDHE-ECDSA-AES128-GCM-SHA256', 'DHE-RSA-AES256-GCM-SHA384'],
      WEAK: ['AES256-SHA', 'AES128-SHA', 'DES-CBC3-SHA'],
      INSECURE: ['RC4', 'NULL', 'EXPORT', 'MD5', 'DES', 'ADH', 'AECDH']
    };
    
    // Define protocols security categorization
    this.protocolSecurity = {
      SECURE: ['TLSv1.3', 'TLSv1.2'],
      MEDIUM: ['TLSv1.1'],
      INSECURE: ['TLSv1.0', 'SSLv3', 'SSLv2']
    };
    
    logger.info('SslScanner initialized');
  }

  /**
   * Perform SSL/TLS security scan
   * @param {string} url - URL to scan
   * @param {number} depthFactor - Scan depth factor (1.0 is standard)
   * @returns {Promise<Object>} Scan results
   */
  async scan(url, depthFactor = 1.0) {
    logger.info(`Starting SSL scan for ${url}`);
    
    try {
      // Parse URL
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      const port = parsedUrl.port || 443;
      
      // Set up result structure
      const sslResult = {
        score: 0,
        findings: [],
        metadata: new Map(),
        rawData: {}
      };
      
      // Get SSL information directly
      const directSslInfo = await this.getDirectSslInfo(hostname, port);
      sslResult.rawData.directSsl = directSslInfo;
      
      // Analyze certificate
      await this.analyzeCertificate(directSslInfo, sslResult);
      
      // Use SSL Labs for comprehensive analysis if depth factor warrants it
      if (depthFactor >= 1.0) {
        try {
          const sslLabsResult = await SslLabsService.analyzeDomain(hostname);
          sslResult.rawData.sslLabs = sslLabsResult;
          
          // Analyze SSL Labs results
          await this.analyzeSslLabsResults(sslLabsResult, sslResult);
        } catch (error) {
          logger.warn(`SSL Labs analysis failed, continuing with basic analysis: ${error.message}`);
          // Add a finding about the failure
          sslResult.findings.push({
            title: 'SSL Labs analysis unavailable',
            description: 'Could not perform comprehensive SSL analysis using SSL Labs.',
            severity: 'Info',
            recommendation: 'Consider running a manual SSL Labs test on the domain.'
          });
          
          // Fall back to direct analysis
          await this.analyzeProtocolsAndCiphers(directSslInfo, sslResult);
        }
      } else {
        // For shallow scans, just use direct analysis
        await this.analyzeProtocolsAndCiphers(directSslInfo, sslResult);
      }
      
      // Calculate score
      sslResult.score = this.calculateScore(sslResult);
      
      logger.info(`SSL scan completed for ${url}`);
      return sslResult;
    } catch (error) {
      logger.error(`SSL scan error for ${url}: ${error.message}`);
      
      // Return partial results if possible
      return {
        score: 0,
        findings: [{
          title: 'SSL Scan Failed',
          description: `Could not complete SSL scan: ${error.message}`,
          severity: 'High',
          recommendation: 'Verify that the SSL/TLS configuration is properly set up on the server.'
        }],
        metadata: new Map(),
        rawData: { error: error.message }
      };
    }
  }

  /**
   * Get SSL/TLS information directly
   * @param {string} hostname - Host to check
   * @param {number} port - Port to connect to
   * @returns {Promise<Object>} SSL/TLS information
   */
  async getDirectSslInfo(hostname, port) {
    return new Promise((resolve, reject) => {
      const options = {
        host: hostname,
        port: port,
        servername: hostname,
        rejectUnauthorized: false, // Allow self-signed certificates
        secureOptions: crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3,
        checkServerIdentity: () => undefined // Bypass certificate hostname validation
      };
      
      const socket = tls.connect(options, () => {
        try {
          const result = {
            authorized: socket.authorized,
            authorizationError: socket.authorizationError,
            protocol: socket.getProtocol(),
            cipher: socket.getCipher(),
            cert: socket.getPeerCertificate(true)
          };
          
          socket.end();
          resolve(result);
        } catch (error) {
          socket.end();
          reject(error);
        }
      });
      
      socket.on('error', (error) => {
        reject(error);
      });
      
      // Set timeout
      socket.setTimeout(10000, () => {
        socket.end();
        reject(new Error('Connection timed out'));
      });
    });
  }

  /**
   * Analyze certificate details
   * @param {Object} sslInfo - SSL/TLS information
   * @param {Object} sslResult - Result object to populate
   */
  async analyzeCertificate(sslInfo, sslResult) {
    const cert = sslInfo.cert;
    
    if (!cert) {
      sslResult.findings.push({
        title: 'Certificate Information Unavailable',
        description: 'Could not retrieve certificate information.',
        severity: 'High',
        recommendation: 'Verify that the SSL/TLS certificate is properly installed.'
      });
      return;
    }
    
    // Store certificate metadata
    sslResult.metadata.set('subject', cert.subject);
    sslResult.metadata.set('issuer', cert.issuer);
    sslResult.metadata.set('validFrom', cert.valid_from);
    sslResult.metadata.set('validTo', cert.valid_to);
    sslResult.metadata.set('serialNumber', cert.serialNumber);
    sslResult.metadata.set('fingerprint', cert.fingerprint);
    
    // Check certificate validity
    const now = new Date();
    const validFrom = new Date(cert.valid_from);
    const validTo = new Date(cert.valid_to);
    
    if (now < validFrom) {
      sslResult.findings.push({
        title: 'Certificate Not Yet Valid',
        description: `The SSL certificate is not valid until ${validFrom.toISOString().split('T')[0]}.`,
        severity: 'Critical',
        evidence: `Valid from: ${cert.valid_from}, Current date: ${now.toISOString()}`,
        recommendation: 'Ensure the server\'s time is correctly set or replace the certificate with one that is currently valid.'
      });
    }
    
    if (now > validTo) {
      sslResult.findings.push({
        title: 'Expired Certificate',
        description: `The SSL certificate expired on ${validTo.toISOString().split('T')[0]}.`,
        severity: 'Critical',
        evidence: `Valid to: ${cert.valid_to}, Current date: ${now.toISOString()}`,
        recommendation: 'Renew the SSL certificate immediately.'
      });
    }
    
    // Check if certificate is about to expire
    const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
      sslResult.findings.push({
        title: 'Certificate Expiring Soon',
        description: `The SSL certificate will expire in ${daysUntilExpiry} days.`,
        severity: daysUntilExpiry <= 7 ? 'High' : 'Medium',
        evidence: `Expiration date: ${cert.valid_to}`,
        recommendation: 'Renew the SSL certificate before it expires.'
      });
    }
    
    // Check if certificate is self-signed
    if (cert.issuer && cert.subject && 
        JSON.stringify(cert.issuer) === JSON.stringify(cert.subject)) {
      sslResult.findings.push({
        title: 'Self-Signed Certificate',
        description: 'The server is using a self-signed certificate which will not be trusted by browsers.',
        severity: 'High',
        evidence: `Issuer: ${JSON.stringify(cert.issuer)}, Subject: ${JSON.stringify(cert.subject)}`,
        recommendation: 'Replace the self-signed certificate with one issued by a trusted certificate authority.'
      });
    }
    
    // Check signature algorithm
    if (cert.sigalg && cert.sigalg.includes('SHA1')) {
      sslResult.findings.push({
        title: 'Weak Certificate Signature Algorithm',
        description: 'The certificate is signed with SHA-1, which is considered insecure.',
        severity: 'High',
        evidence: `Signature algorithm: ${cert.sigalg}`,
        recommendation: 'Replace the certificate with one that uses a stronger signature algorithm like SHA-256.'
      });
    }
    
    // Check key length
    if (cert.bits) {
      let keyLength = parseInt(cert.bits, 10);
      
      if (keyLength < 2048) {
        sslResult.findings.push({
          title: 'Weak Certificate Key Length',
          description: `The certificate uses a ${keyLength}-bit key, which is considered insecure.`,
          severity: 'High',
          evidence: `Key length: ${keyLength} bits`,
          recommendation: 'Replace the certificate with one that uses at least a 2048-bit key.'
        });
      }
    }
  }

  /**
   * Analyze protocols and ciphers from direct SSL check
   * @param {Object} sslInfo - SSL/TLS information
   * @param {Object} sslResult - Result object to populate
   */
  async analyzeProtocolsAndCiphers(sslInfo, sslResult) {
    // Check protocol
    const protocol = sslInfo.protocol;
    sslResult.metadata.set('protocol', protocol);
    
    if (this.protocolSecurity.INSECURE.includes(protocol)) {
      sslResult.findings.push({
        title: 'Insecure SSL/TLS Protocol',
        description: `The server is using ${protocol}, which is considered insecure.`,
        severity: 'High',
        evidence: `Detected protocol: ${protocol}`,
        recommendation: 'Disable insecure protocols (SSLv2, SSLv3, TLSv1.0) and only enable TLSv1.2 and TLSv1.3.'
      });
    } else if (this.protocolSecurity.MEDIUM.includes(protocol)) {
      sslResult.findings.push({
        title: 'Outdated SSL/TLS Protocol',
        description: `The server is using ${protocol}, which is outdated.`,
        severity: 'Medium',
        evidence: `Detected protocol: ${protocol}`,
        recommendation: 'Update the server configuration to use TLSv1.2 or TLSv1.3.'
      });
    }
    
    // Check cipher
    const cipher = sslInfo.cipher;
    if (cipher) {
      sslResult.metadata.set('cipher', cipher);
      
      const cipherName = cipher.name;
      
      if (this.cipherStrength.INSECURE.some(weak => cipherName.includes(weak))) {
        sslResult.findings.push({
          title: 'Insecure Cipher Suite',
          description: `The server is using an insecure cipher suite: ${cipherName}.`,
          severity: 'High',
          evidence: `Detected cipher: ${cipherName}`,
          recommendation: 'Disable weak cipher suites and only enable strong modern ciphers.'
        });
      } else if (!this.cipherStrength.STRONG.some(strong => cipherName.includes(strong))) {
        sslResult.findings.push({
          title: 'Suboptimal Cipher Suite',
          description: `The server is using a suboptimal cipher suite: ${cipherName}.`,
          severity: 'Medium',
          evidence: `Detected cipher: ${cipherName}`,
          recommendation: 'Configure the server to prefer stronger cipher suites.'
        });
      }
    }
  }

  /**
   * Analyze SSL Labs results
   * @param {Object} sslLabsResult - Results from SSL Labs
   * @param {Object} sslResult - Result object to populate
   */
  async analyzeSslLabsResults(sslLabsResult, sslResult) {
    if (!sslLabsResult || !sslLabsResult.endpoints || sslLabsResult.endpoints.length === 0) {
      return;
    }
    
    const endpoint = sslLabsResult.endpoints[0];
    
    // Store SSL Labs grade
    if (endpoint.grade) {
      sslResult.metadata.set('sslGrade', endpoint.grade);
    }
    
    // Check overall grade
    if (endpoint.grade) {
      const grade = endpoint.grade;
      
      if (['F', 'T', 'M'].includes(grade)) {
        sslResult.findings.push({
          title: 'Poor SSL/TLS Security Rating',
          description: `The server received a grade of ${grade} from SSL Labs, which indicates serious security issues.`,
          severity: 'Critical',
          evidence: `SSL Labs grade: ${grade}`,
          recommendation: 'Review the detailed SSL Labs report and address all critical issues.',
          references: ['https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide']
        });
      } else if (['C', 'D'].includes(grade[0])) {
        sslResult.findings.push({
          title: 'Below Average SSL/TLS Security Rating',
          description: `The server received a grade of ${grade} from SSL Labs, which indicates configuration issues.`,
          severity: 'High',
          evidence: `SSL Labs grade: ${grade}`,
          recommendation: 'Review the SSL Labs report and improve the SSL/TLS configuration.',
          references: ['https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide']
        });
      } else if (grade[0] === 'B') {
        sslResult.findings.push({
          title: 'Average SSL/TLS Security Rating',
          description: `The server received a grade of ${grade} from SSL Labs, which indicates a satisfactory but improvable configuration.`,
          severity: 'Medium',
          evidence: `SSL Labs grade: ${grade}`,
          recommendation: 'Consider improving the SSL/TLS configuration to achieve an A rating.',
          references: ['https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide']
        });
      }
    }
    
    // Check for protocol support
    if (endpoint.details && endpoint.details.protocols) {
      const protocols = endpoint.details.protocols;
      
      // Check for insecure protocols
      const insecureProtocols = protocols.filter(p => 
        this.protocolSecurity.INSECURE.includes(`${p.name}v${p.version}`)
      );
      
      if (insecureProtocols.length > 0) {
        sslResult.findings.push({
          title: 'Insecure SSL/TLS Protocols Supported',
          description: `The server supports insecure protocols: ${insecureProtocols.map(p => `${p.name}v${p.version}`).join(', ')}.`,
          severity: 'High',
          evidence: `Detected protocols: ${insecureProtocols.map(p => `${p.name}v${p.version}`).join(', ')}`,
          recommendation: 'Disable insecure protocols (SSLv2, SSLv3, TLSv1.0) and only enable TLSv1.2 and TLSv1.3.'
        });
      }
      
      // Check for missing modern protocols
      const hasTLS12 = protocols.some(p => p.name === 'TLS' && p.version === '1.2');
      const hasTLS13 = protocols.some(p => p.name === 'TLS' && p.version === '1.3');
      
      if (!hasTLS12 && !hasTLS13) {
        sslResult.findings.push({
          title: 'No Modern SSL/TLS Protocols Supported',
          description: 'The server does not support any modern SSL/TLS protocols (TLSv1.2 or TLSv1.3).',
          severity: 'Critical',
          evidence: `Supported protocols: ${protocols.map(p => `${p.name}v${p.version}`).join(', ')}`,
          recommendation: 'Enable support for TLSv1.2 and TLSv1.3.'
        });
      } else if (!hasTLS13) {
        sslResult.findings.push({
          title: 'TLSv1.3 Not Supported',
          description: 'The server does not support TLSv1.3, which is the latest and most secure SSL/TLS protocol.',
          severity: 'Low',
          evidence: `Supported protocols: ${protocols.map(p => `${p.name}v${p.version}`).join(', ')}`,
          recommendation: 'Enable support for TLSv1.3 if possible.'
        });
      }
    }
    
    // Check for weak ciphers
    if (endpoint.details && endpoint.details.suites) {
      const allSuites = [];
      endpoint.details.suites.forEach(protocol => {
        if (protocol.list) {
          protocol.list.forEach(suite => {
            allSuites.push(suite);
          });
        }
      });
      
      // Check for weak ciphers
      const weakCiphers = allSuites.filter(suite => 
        this.cipherStrength.INSECURE.some(pattern => suite.name.includes(pattern))
      );
      
      if (weakCiphers.length > 0) {
        sslResult.findings.push({
          title: 'Weak Cipher Suites Supported',
          description: `The server supports weak cipher suites: ${weakCiphers.map(c => c.name).join(', ')}.`,
          severity: 'High',
          evidence: `Detected weak ciphers: ${weakCiphers.map(c => c.name).join(', ')}`,
          recommendation: 'Disable weak cipher suites and only enable strong modern ciphers.'
        });
      }
    }
    
    // Check for certificate issues
    if (endpoint.details && endpoint.details.cert) {
      const cert = endpoint.details.cert;
      
      // Check for SHA-1 certificates
      if (cert.sigAlg && cert.sigAlg.includes('SHA1')) {
        sslResult.findings.push({
          title: 'SHA-1 Certificate Signature',
          description: 'The certificate is signed with SHA-1, which is considered insecure.',
          severity: 'High',
          evidence: `Signature algorithm: ${cert.sigAlg}`,
          recommendation: 'Replace the certificate with one signed using SHA-256 or stronger.'
        });
      }
      
      // Check for weak key
      if (cert.keySize && cert.keySize < 2048) {
        sslResult.findings.push({
          title: 'Weak Certificate Key',
          description: `The certificate uses a ${cert.keySize}-bit key, which is considered insecure.`,
          severity: 'High',
          evidence: `Key size: ${cert.keySize} bits`,
          recommendation: 'Replace the certificate with one that uses at least a 2048-bit key.'
        });
      }
    }
    
    // Check for vulnerability to known attacks
    if (endpoint.details) {
      // Check for Heartbleed
      if (endpoint.details.heartbleed) {
        sslResult.findings.push({
          title: 'Vulnerable to Heartbleed',
          description: 'The server is vulnerable to the Heartbleed attack (CVE-2014-0160).',
          severity: 'Critical',
          recommendation: 'Update OpenSSL to the latest version and regenerate all certificates.',
          references: ['https://heartbleed.com/', 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-0160']
        });
      }
      
      // Check for POODLE
      if (endpoint.details.poodle) {
        sslResult.findings.push({
          title: 'Vulnerable to POODLE',
          description: 'The server is vulnerable to the POODLE attack on SSL 3.0 (CVE-2014-3566).',
          severity: 'High',
          recommendation: 'Disable SSL 3.0 and earlier protocols.',
          references: ['https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-3566']
        });
      }
      
      // Check for FREAK
      if (endpoint.details.freak) {
        sslResult.findings.push({
          title: 'Vulnerable to FREAK',
          description: 'The server is vulnerable to the FREAK attack (CVE-2015-0204).',
          severity: 'High',
          recommendation: 'Disable export-grade cipher suites and update OpenSSL.',
          references: ['https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2015-0204']
        });
      }
      
      // Check for Logjam
      if (endpoint.details.logjam) {
        sslResult.findings.push({
          title: 'Vulnerable to Logjam',
          description: 'The server is vulnerable to the Logjam attack on Diffie-Hellman key exchange.',
          severity: 'High',
          recommendation: 'Disable export-grade cipher suites and generate a strong DH group.',
          references: ['https://weakdh.org/']
        });
      }
      
      // Check for ROBOT
      if (endpoint.details.robot) {
        sslResult.findings.push({
          title: 'Vulnerable to ROBOT',
          description: 'The server is vulnerable to the ROBOT attack (Return Of Bleichenbacher\'s Oracle Threat).',
          severity: 'High',
          recommendation: 'Disable RSA encryption modes or update the server software.',
          references: ['https://robotattack.org/']
        });
      }
    }
    
    // Check HSTS
    if (endpoint.details && endpoint.details.hstsPolicy) {
      const hstsPolicy = endpoint.details.hstsPolicy;
      
      if (hstsPolicy.status !== 'present') {
        sslResult.findings.push({
          title: 'HSTS Not Implemented',
          description: 'HTTP Strict Transport Security (HSTS) is not implemented.',
          severity: 'Medium',
          recommendation: 'Implement HSTS with a long max-age directive.',
          references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security']
        });
      } else if (hstsPolicy.maxAge < 15768000) { // 6 months
        sslResult.findings.push({
          title: 'Short HSTS Max Age',
          description: `HSTS max-age is set to ${hstsPolicy.maxAge} seconds, which is less than 6 months.`,
          severity: 'Low',
          evidence: `HSTS max-age: ${hstsPolicy.maxAge} seconds`,
          recommendation: 'Increase the HSTS max-age to at least 6 months (15768000 seconds).'
        });
      }
      
      if (!hstsPolicy.includeSubDomains) {
        sslResult.findings.push({
          title: 'HSTS Does Not Include Subdomains',
          description: 'HSTS policy does not include the includeSubDomains directive.',
          severity: 'Low',
          recommendation: 'Add the includeSubDomains directive to the HSTS policy.'
        });
      }
      
      if (!hstsPolicy.preload) {
        sslResult.findings.push({
          title: 'HSTS Preload Not Enabled',
          description: 'HSTS preload is not enabled.',
          severity: 'Info',
          recommendation: 'Consider enabling HSTS preload for maximum security.'
        });
      }
    }
  }

  /**
   * Calculate overall score based on findings
   * @param {Object} sslResult - Result object with findings
   * @returns {number} Score from 0-100
   */
  calculateScore(sslResult) {
    // Start with maximum score
    let score = 100;
    
    // Deduct points based on finding severity
    const deductions = {
      'Critical': 25,
      'High': 15,
      'Medium': 10,
      'Low': 5,
      'Info': 0
    };
    
    // Apply deductions
    sslResult.findings.forEach(finding => {
      score -= deductions[finding.severity] || 0;
    });
    
    // If SSL Labs grade is available, factor it in
    const sslGrade = sslResult.metadata.get('sslGrade');
    if (sslGrade) {
      const gradeScores = {
        'A+': 100,
        'A': 95,
        'A-': 90,
        'B': 80,
        'C': 65,
        'D': 50,
        'F': 20,
        'T': 0,
        'M': 0
      };
      
      const gradeScore = gradeScores[sslGrade] || 50;
      
      // Blend score with SSL Labs grade (60% findings, 40% grade)
      score = Math.round((score * 0.6) + (gradeScore * 0.4));
    }
    
    // Ensure score is within 0-100
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = SslScanner;
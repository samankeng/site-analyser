const dns = require('dns');
const net = require('net');
const { URL } = require('url');
const ShodanService = require('../integrations/ShodanService');
const logger = require('../../utils/logger');

/**
 * Scanner for open ports and services
 */
class PortScanner {
  /**
   * Initialize port scanner
   */
  constructor() {
    // Common ports to scan
    this.commonPorts = {
      20: { service: 'FTP Data', risk: 'medium' },
      21: { service: 'FTP Control', risk: 'medium' },
      22: { service: 'SSH', risk: 'low' },
      23: { service: 'Telnet', risk: 'high' },
      25: { service: 'SMTP', risk: 'medium' },
      53: { service: 'DNS', risk: 'low' },
      80: { service: 'HTTP', risk: 'low' },
      110: { service: 'POP3', risk: 'medium' },
      111: { service: 'RPC', risk: 'high' },
      135: { service: 'MS-RPC', risk: 'high' },
      139: { service: 'NetBIOS', risk: 'high' },
      143: { service: 'IMAP', risk: 'medium' },
      443: { service: 'HTTPS', risk: 'low' },
      445: { service: 'SMB', risk: 'high' },
      993: { service: 'IMAPS', risk: 'low' },
      995: { service: 'POP3S', risk: 'low' },
      1433: { service: 'MS-SQL', risk: 'high' },
      1521: { service: 'Oracle', risk: 'high' },
      3306: { service: 'MySQL', risk: 'high' },
      3389: { service: 'RDP', risk: 'high' },
      5432: { service: 'PostgreSQL', risk: 'high' },
      5900: { service: 'VNC', risk: 'high' },
      5901: { service: 'VNC-1', risk: 'high' },
      5902: { service: 'VNC-2', risk: 'high' },
      6379: { service: 'Redis', risk: 'high' },
      8080: { service: 'HTTP-Alt', risk: 'medium' },
      8443: { service: 'HTTPS-Alt', risk: 'medium' },
      27017: { service: 'MongoDB', risk: 'high' }
    };
    
    // High-risk ports that should never be exposed
    this.highRiskPorts = [23, 111, 135, 139, 445, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 27017];
    
    // Connection timeout in milliseconds
    this.timeout = 2000;
    
    logger.info('PortScanner initialized');
  }

  /**
   * Perform port scanning
   * @param {string} url - URL to scan
   * @param {number} depthFactor - Scan depth factor (1.0 is standard)
   * @returns {Promise<Object>} Scan results
   */
  async scan(url, depthFactor = 1.0) {
    logger.info(`Starting port scan for ${url}`);
    
    try {
      // Parse URL and get hostname
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      
      // Set up result structure
      const portResult = {
        score: 0,
        findings: [],
        metadata: new Map(),
        rawData: {}
      };
      
      // Resolve hostname to IP
      const ip = await this.resolveHostname(hostname);
      if (!ip) {
        throw new Error(`Could not resolve hostname: ${hostname}`);
      }
      
      portResult.metadata.set('ip', ip);
      portResult.metadata.set('hostname', hostname);
      
      // Determine which ports to scan based on depth factor
      const portsToScan = this.getPortsToScan(depthFactor);
      
      // For higher depth factor, use Shodan API if available
      let usedShodan = false;
      if (depthFactor >= 1.5) {
        try {
          logger.debug(`Attempting to use Shodan for ${ip}`);
          const shodanData = await ShodanService.getHostInfo(ip);
          
          if (shodanData && shodanData.ports && shodanData.ports.length > 0) {
            usedShodan = true;
            portResult.rawData.shodan = shodanData;
            await this.processShodanResults(shodanData, portResult);
          }
        } catch (error) {
          logger.warn(`Shodan lookup failed for ${ip}: ${error.message}`);
          // Continue with direct scanning
        }
      }
      
      // If we couldn't use Shodan or depth factor is low, do direct scanning
      if (!usedShodan) {
        const openPorts = await this.scanPorts(ip, portsToScan);
        portResult.rawData.directScan = { openPorts };
        
        // Process direct scan results
        await this.processDirectScanResults(ip, openPorts, portResult);
      }
      
      // Calculate score
      portResult.score = this.calculateScore(portResult);
      
      logger.info(`Port scan completed for ${url}`);
      return portResult;
    } catch (error) {
      logger.error(`Port scan error for ${url}: ${error.message}`);
      
      // Return partial results if possible
      return {
        score: 0,
        findings: [{
          title: 'Port Scan Failed',
          description: `Could not complete port scan: ${error.message}`,
          severity: 'Medium',
          recommendation: 'Verify that the server is accessible and properly configured.'
        }],
        metadata: new Map(),
        rawData: { error: error.message }
      };
    }
  }

  /**
   * Resolve hostname to IP address
   * @param {string} hostname - Hostname to resolve
   * @returns {Promise<string>} IP address
   */
  async resolveHostname(hostname) {
    return new Promise((resolve, reject) => {
      dns.lookup(hostname, (err, address) => {
        if (err) {
          reject(err);
        } else {
          resolve(address);
        }
      });
    });
  }

  /**
   * Determine which ports to scan based on depth factor
   * @param {number} depthFactor - Scan depth factor
   * @returns {Array<number>} Ports to scan
   */
  getPortsToScan(depthFactor) {
    if (depthFactor < 1.0) {
      // Basic scan: Just check the most critical high-risk ports
      return this.highRiskPorts;
    } else if (depthFactor < 2.0) {
      // Standard scan: Check all common ports
      return Object.keys(this.commonPorts).map(port => parseInt(port, 10));
    } else {
      // Comprehensive scan: Common ports plus some additional ranges
      const commonPorts = Object.keys(this.commonPorts).map(port => parseInt(port, 10));
      const additionalPorts = [
        ...this.generatePortRange(8000, 8100), // Common web application ports
        ...this.generatePortRange(9000, 9100), // Common web application ports
        ...this.generatePortRange(10000, 10050), // Common backend service ports
      ];
      
      return [...new Set([...commonPorts, ...additionalPorts])];
    }
  }

  /**
   * Generate a range of port numbers
   * @param {number} start - Starting port
   * @param {number} end - Ending port
   * @returns {Array<number>} Range of port numbers
   */
  generatePortRange(start, end) {
    const range = [];
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }

  /**
   * Scan a single port
   * @param {string} ip - IP address to scan
   * @param {number} port - Port to scan
   * @returns {Promise<boolean>} Whether port is open
   */
  scanPort(ip, port) {
    return new Promise(resolve => {
      const socket = new net.Socket();
      let resolved = false;
      
      // Set timeout
      socket.setTimeout(this.timeout);
      
      socket.on('connect', () => {
        resolved = true;
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      });
      
      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      });
      
      socket.connect(port, ip);
    });
  }

  /**
   * Scan multiple ports
   * @param {string} ip - IP address to scan
   * @param {Array<number>} ports - Ports to scan
   * @returns {Promise<Array<number>>} Open ports
   */
  async scanPorts(ip, ports) {
    const openPorts = [];
    const concurrencyLimit = 10; // Limit concurrent scans
    
    // Scan ports in batches to avoid overwhelming the target
    for (let i = 0; i < ports.length; i += concurrencyLimit) {
      const batch = ports.slice(i, i + concurrencyLimit);
      const results = await Promise.all(
        batch.map(port => this.scanPort(ip, port).then(isOpen => ({ port, isOpen })))
      );
      
      results.forEach(result => {
        if (result.isOpen) {
          openPorts.push(result.port);
        }
      });
    }
    
    return openPorts;
  }

  /**
   * Process direct port scan results
   * @param {string} ip - IP address
   * @param {Array<number>} openPorts - Open ports
   * @param {Object} portResult - Result object to populate
   */
  async processDirectScanResults(ip, openPorts, portResult) {
    // Add open ports to metadata
    portResult.metadata.set('openPorts', openPorts);
    
    // No open ports is good
    if (openPorts.length === 0) {
      portResult.findings.push({
        title: 'No Exposed Services',
        description: 'No publicly accessible services were detected on common ports.',
        severity: 'Info',
        recommendation: 'Continue to regularly scan for newly exposed services.'
      });
      return;
    }
    
    // Process each open port
    openPorts.forEach(port => {
      const portInfo = this.commonPorts[port] || { service: 'Unknown', risk: 'medium' };
      const severity = this.getSeverityForRisk(portInfo.risk);
      
      portResult.findings.push({
        title: `Exposed ${portInfo.service} Port`,
        description: `Port ${port} (${portInfo.service}) is open and publicly accessible.`,
        severity: severity,
        location: `${ip}:${port}`,
        recommendation: this.getRecommendationForPort(port, portInfo)
      });
    });
  }

  /**
   * Process Shodan API results
   * @param {Object} shodanData - Data from Shodan API
   * @param {Object} portResult - Result object to populate
   */
  async processShodanResults(shodanData, portResult) {
    // Add Shodan data to metadata
    if (shodanData.ports) {
      portResult.metadata.set('openPorts', shodanData.ports);
    }
    
    if (shodanData.hostnames) {
      portResult.metadata.set('hostnames', shodanData.hostnames);
    }
    
    if (shodanData.os) {
      portResult.metadata.set('os', shodanData.os);
    }
    
    // No open ports is good
    if (!shodanData.ports || shodanData.ports.length === 0) {
      portResult.findings.push({
        title: 'No Exposed Services',
        description: 'No publicly accessible services were detected by Shodan.',
        severity: 'Info',
        recommendation: 'Continue to regularly scan for newly exposed services.'
      });
      return;
    }
    
    // Process ports from Shodan data
    shodanData.ports.forEach(port => {
      const portInfo = this.commonPorts[port] || { service: 'Unknown', risk: 'medium' };
      const severity = this.getSeverityForRisk(portInfo.risk);
      
      // Get service information if available
      let serviceName = portInfo.service;
      let serviceVersion = null;
      
      if (shodanData.data) {
        const portData = shodanData.data.find(item => item.port === port);
        if (portData && portData.product) {
          serviceName = portData.product;
          if (portData.version) {
            serviceVersion = portData.version;
          }
        }
      }
      
      const title = serviceVersion
        ? `Exposed ${serviceName} ${serviceVersion} Port`
        : `Exposed ${serviceName} Port`;
      
      const description = serviceVersion
        ? `Port ${port} is running ${serviceName} version ${serviceVersion} and is publicly accessible.`
        : `Port ${port} (${serviceName}) is open and publicly accessible.`;
      
      portResult.findings.push({
        title: title,
        description: description,
        severity: severity,
        location: `${shodanData.ip_str}:${port}`,
        recommendation: this.getRecommendationForPort(port, portInfo)
      });
    });
    
    // Check for outdated software
    if (shodanData.vulns && shodanData.vulns.length > 0) {
      portResult.findings.push({
        title: 'Known Vulnerabilities Detected',
        description: `Shodan has identified ${shodanData.vulns.length} known vulnerabilities in the exposed services.`,
        severity: 'High',
        evidence: `CVEs: ${shodanData.vulns.join(', ')}`,
        recommendation: 'Update the vulnerable services to the latest patched versions.'
      });
    }
  }

  /**
   * Get severity level based on risk level
   * @param {string} risk - Risk level (low, medium, high)
   * @returns {string} Severity level
   */
  getSeverityForRisk(risk) {
    switch (risk) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
      default:
        return 'Low';
    }
  }

  /**
   * Get recommendation for an open port
   * @param {number} port - Port number
   * @param {Object} portInfo - Port information
   * @returns {string} Recommendation
   */
  getRecommendationForPort(port, portInfo) {
    if (this.highRiskPorts.includes(port)) {
      return `Port ${port} (${portInfo.service}) is considered high-risk and should not be exposed publicly. If possible, close this port or restrict access using a firewall.`;
    }
    
    // Specific recommendations for common services
    switch (port) {
      case 22:
        return 'If SSH access is required, consider using key-based authentication, disabling root login, and implementing IP-based access restrictions.';
      case 80:
        return 'Ensure HTTP traffic is redirected to HTTPS (port 443) for secure communication.';
      case 443:
        return 'Ensure TLS configuration is secure and up to date. Consider implementing HTTP Strict Transport Security (HSTS).';
      case 21:
      case 20:
        return 'FTP transmits data in cleartext. Consider using SFTP (SSH File Transfer Protocol) instead.';
      case 25:
      case 110:
      case 143:
        return 'Email protocols (SMTP/POP3/IMAP) should use encrypted variants on ports 465/587 (SMTPS), 995 (POP3S), or 993 (IMAPS).';
      default:
        return `Verify that port ${port} is necessary for your application and properly secured. If possible, restrict access using a firewall.`;
    }
  }

  /**
   * Calculate overall score based on findings
   * @param {Object} portResult - Result object with findings
   * @returns {number} Score from 0-100
   */
  calculateScore(portResult) {
    // Start with a perfect score
    let score = 100;
    
    // Get open ports from metadata
    const openPorts = portResult.metadata.get('openPorts') || [];
    
    // Deduct points for each open port based on risk
    openPorts.forEach(port => {
      const portInfo = this.commonPorts[port] || { risk: 'medium' };
      
      switch (portInfo.risk) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 1;
          break;
      }
    });
    
    // Additional deductions for findings
    const deductions = {
      'Critical': 25,
      'High': 15,
      'Medium': 10,
      'Low': 5,
      'Info': 0
    };
    
    portResult.findings.forEach(finding => {
      if (finding.title !== 'No Exposed Services') { // Skip the "good" finding
        score -= deductions[finding.severity] || 0;
      }
    });
    
    // Ensure score is within 0-100
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = PortScanner;
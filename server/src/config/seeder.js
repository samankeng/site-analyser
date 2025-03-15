const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Scan = require('../models/Scan');
const Result = require('../models/Result');
const Alert = require('../models/Alert');
const config = require('./index');
const logger = require('../utils/logger');

/**
 * Database seeder for development environment
 * Creates sample data for testing
 */
const seedDatabase = async () => {
  if (config.env !== 'development') {
    logger.warn('Seeder should only be run in development environment');
    return;
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info('MongoDB connected for seeding');

    // Clear existing data
    await clearData();

    // Create users
    const adminUser = await createAdminUser();
    const regularUser = await createRegularUser();

    // Create scans for users
    const adminScans = await createScansForUser(adminUser._id);
    const userScans = await createScansForUser(regularUser._id);

    // Create results for scans
    await createResultsForScans([...adminScans, ...userScans]);

    // Create alerts for users
    await createAlertsForUser(adminUser._id);
    await createAlertsForUser(regularUser._id);

    logger.info('Database seeding completed successfully');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('MongoDB disconnected after seeding');
    
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Clear existing data from database
 */
const clearData = async () => {
  logger.info('Clearing existing data...');
  
  await User.deleteMany({});
  await Scan.deleteMany({});
  await Result.deleteMany({});
  await Alert.deleteMany({});
  
  logger.info('Existing data cleared');
};

/**
 * Create admin user
 */
const createAdminUser = async () => {
  logger.info('Creating admin user...');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);
  
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date()
  });
  
  logger.info(`Admin user created with ID: ${admin._id}`);
  return admin;
};

/**
 * Create regular user
 */
const createRegularUser = async () => {
  logger.info('Creating regular user...');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);
  
  const user = await User.create({
    name: 'Regular User',
    email: 'user@example.com',
    password: hashedPassword,
    role: 'user',
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date()
  });
  
  logger.info(`Regular user created with ID: ${user._id}`);
  return user;
};

/**
 * Create sample scans for a user
 */
const createScansForUser = async (userId) => {
  logger.info(`Creating sample scans for user ${userId}...`);
  
  const sampleUrls = [
    'https://example.com',
    'https://securewebsite.org',
    'https://vulnerable-site.net',
    'https://outdated-ssl.com',
    'https://missing-headers.io'
  ];
  
  const statuses = ['completed', 'completed', 'completed', 'failed', 'pending'];
  const scans = [];
  
  for (let i = 0; i < sampleUrls.length; i++) {
    const now = new Date();
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - i);
    
    const completedAt = new Date(createdAt);
    completedAt.setMinutes(createdAt.getMinutes() + 5);
    
    // Random summary scores
    const ssl = Math.floor(Math.random() * 40) + 60;
    const headers = Math.floor(Math.random() * 40) + 60;
    const vulns = Math.floor(Math.random() * 40) + 60;
    const server = Math.floor(Math.random() * 40) + 60;
    const overall = Math.floor((ssl + headers + vulns + server) / 4);
    
    const scan = await Scan.create({
      url: sampleUrls[i],
      scanDepth: Math.floor(Math.random() * 3) + 1,
      options: {
        sslCheck: true,
        headerAnalysis: true,
        portScan: i % 2 === 0,
        vulnDetection: true,
        contentAnalysis: i % 3 === 0,
        performanceCheck: i % 4 === 0
      },
      userId,
      status: statuses[i],
      progress: statuses[i] === 'completed' ? 100 : statuses[i] === 'pending' ? 0 : 50,
      createdAt,
      startedAt: statuses[i] !== 'pending' ? createdAt : null,
      completedAt: statuses[i] === 'completed' ? completedAt : null,
      summary: statuses[i] === 'completed' ? {
        overall,
        ssl,
        headers,
        vulnerabilities: vulns,
        server,
        findings: {
          critical: Math.floor(Math.random() * 3),
          high: Math.floor(Math.random() * 5),
          medium: Math.floor(Math.random() * 8),
          low: Math.floor(Math.random() * 10),
          info: Math.floor(Math.random() * 15)
        }
      } : null,
      aiAnalysis: statuses[i] === 'completed' ? {
        recommendations: [
          'Update SSL/TLS configuration to modern standards',
          'Implement proper security headers',
          'Address identified vulnerabilities'
        ],
        riskAssessment: `This site has a ${overall < 70 ? 'concerning' : 'moderate'} security posture with a score of ${overall}/100. Some improvements are recommended.`,
        prioritizedActions: [
          'Fix critical vulnerabilities immediately',
          'Implement security headers',
          'Regular security assessments'
        ]
      } : null
    });
    
    scans.push(scan);
  }
  
  logger.info(`Created ${scans.length} sample scans`);
  return scans;
};

/**
 * Create sample results for scans
 */
const createResultsForScans = async (scans) => {
  logger.info('Creating sample results for scans...');
  
  const completedScans = scans.filter(scan => scan.status === 'completed');
  
  for (const scan of completedScans) {
    // Generate sample findings for each category
    const sslFindings = createSampleSslFindings();
    const headerFindings = createSampleHeaderFindings();
    const vulnFindings = createSampleVulnerabilityFindings();
    const portFindings = scan.options.portScan ? createSamplePortFindings() : [];
    
    // Create result document
    const result = await Result.create({
      scanId: scan._id,
      url: scan.url,
      results: {
        ssl: {
          score: scan.summary.ssl,
          findings: sslFindings
        },
        headers: {
          score: scan.summary.headers,
          findings: headerFindings
        },
        vulnerabilities: {
          score: scan.summary.vulnerabilities,
          findings: vulnFindings
        },
        ports: scan.options.portScan ? {
          score: scan.summary.server,
          findings: portFindings
        } : null,
        content: scan.options.contentAnalysis ? {
          score: Math.floor(Math.random() * 40) + 60,
          findings: []
        } : null,
        performance: scan.options.performanceCheck ? {
          score: Math.floor(Math.random() * 40) + 60,
          findings: []
        } : null
      },
      summary: scan.summary,
      createdAt: scan.completedAt
    });
    
    // Update scan with result reference
    await Scan.findByIdAndUpdate(scan._id, { results: result._id });
    
    logger.info(`Created result for scan ${scan._id}`);
  }
};

/**
 * Create sample alerts for a user
 */
const createAlertsForUser = async (userId) => {
  logger.info(`Creating sample alerts for user ${userId}...`);
  
  const alertTypes = ['security', 'system', 'info'];
  const severities = ['critical', 'high', 'medium', 'low', 'info'];
  
  const sampleAlerts = [
    {
      title: 'Critical Vulnerability Detected',
      message: 'A critical vulnerability has been detected in your website. Please review the scan results and take immediate action.',
      type: 'security',
      severity: 'critical'
    },
    {
      title: 'SSL Certificate Expiring Soon',
      message: 'Your SSL certificate for example.com will expire in 14 days. Please renew your certificate to avoid security warnings.',
      type: 'security',
      severity: 'high'
    },
    {
      title: 'New Scan Completed',
      message: 'A security scan for vulnerable-site.net has been completed. View the results to see the findings.',
      type: 'info',
      severity: 'info'
    },
    {
      title: 'Security Headers Missing',
      message: 'Important security headers are missing from your website. This could expose your site to various attacks.',
      type: 'security',
      severity: 'medium'
    },
    {
      title: 'System Maintenance',
      message: 'Site-Analyser will undergo maintenance on Sunday, July 10th from 2-4 AM UTC. Service may be intermittently unavailable.',
      type: 'system',
      severity: 'info'
    }
  ];
  
  // Get random scan ID for this user
  const userScans = await Scan.find({ userId }).limit(3);
  const scanIds = userScans.map(scan => scan._id);
  
  for (let i = 0; i < sampleAlerts.length; i++) {
    const alert = sampleAlerts[i];
    const now = new Date();
    const createdAt = new Date(now);
    createdAt.setHours(now.getHours() - i * 5); // Space out the alerts
    
    await Alert.create({
      userId,
      title: alert.title,
      message: alert.message,
      type: alert.type,
      severity: alert.severity,
      scanId: i < 3 && scanIds.length > i ? scanIds[i] : null,
      read: i > 2, // First three alerts are unread
      createdAt
    });
  }
  
  logger.info(`Created ${sampleAlerts.length} sample alerts`);
};

/**
 * Create sample SSL findings
 */
const createSampleSslFindings = () => {
  return [
    {
      title: 'Outdated SSL/TLS Protocol',
      description: 'The server supports TLS 1.0 and TLS 1.1, which are deprecated and considered insecure.',
      severity: 'High',
      evidence: 'Server supports: TLS 1.0, TLS 1.1, TLS 1.2',
      recommendation: 'Disable TLS 1.0 and TLS 1.1. Only enable TLS 1.2 and TLS 1.3.',
      references: [
        'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html',
        'https://www.ssllabs.com/ssltest/'
      ]
    },
    {
      title: 'Weak Cipher Suites',
      description: 'The server supports cipher suites that use weak encryption algorithms.',
      severity: 'Medium',
      evidence: 'Detected cipher suites: TLS_RSA_WITH_3DES_EDE_CBC_SHA',
      recommendation: 'Configure the server to use only strong cipher suites and disable weak ciphers.',
      references: [
        'https://ciphersuite.info/',
        'https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices'
      ]
    },
    {
      title: 'Certificate Expires Soon',
      description: 'The SSL certificate will expire in the next 30 days.',
      severity: 'Medium',
      evidence: 'Expiration date: 2023-07-15',
      recommendation: 'Renew the SSL certificate before expiration to avoid security warnings.',
      references: [
        'https://letsencrypt.org/',
        'https://www.digicert.com/ssl-certificate-installation'
      ]
    }
  ];
};

/**
 * Create sample header findings
 */
const createSampleHeaderFindings = () => {
  return [
    {
      title: 'Missing Content-Security-Policy Header',
      description: 'The Content-Security-Policy header is not set. This header helps prevent Cross-Site Scripting (XSS) and other code injection attacks.',
      severity: 'High',
      evidence: 'Header not present in server response',
      recommendation: 'Implement a Content-Security-Policy header with appropriate directives.',
      references: [
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
        'https://content-security-policy.com/'
      ]
    },
    {
      title: 'Missing X-Frame-Options Header',
      description: 'The X-Frame-Options header is not set. This header can prevent clickjacking attacks by preventing the site from being framed.',
      severity: 'Medium',
      evidence: 'Header not present in server response',
      recommendation: 'Add the X-Frame-Options header with a value of DENY or SAMEORIGIN.',
      references: [
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
        'https://owasp.org/www-community/attacks/Clickjacking'
      ]
    },
    {
      title: 'Server Information Disclosure',
      description: 'The server is revealing detailed version information through the Server header.',
      severity: 'Low',
      evidence: 'Server: Apache/2.4.41 (Ubuntu)',
      recommendation: 'Configure the server to limit the information disclosed in the Server header.',
      references: [
        'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server'
      ]
    }
  ];
};

/**
 * Create sample vulnerability findings
 */
const createSampleVulnerabilityFindings = () => {
  return [
    {
      title: 'Cross-Site Scripting (XSS) Vulnerability',
      description: 'A potential Cross-Site Scripting vulnerability was detected in the search parameter.',
      severity: 'Critical',
      location: '/search?q=parameter',
      evidence: 'Payload: <script>alert(1)</script> was reflected in the response',
      recommendation: 'Implement proper input validation and output encoding for user-supplied data.',
      references: [
        'https://owasp.org/www-community/attacks/xss/',
        'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'
      ],
      cwe: 'CWE-79'
    },
    {
      title: 'SQL Injection Vulnerability',
      description: 'A potential SQL Injection vulnerability was detected in the ID parameter.',
      severity: 'Critical',
      location: '/product?id=parameter',
      evidence: "Payload: ' OR '1'='1 caused unexpected behavior",
      recommendation: 'Use prepared statements or parameterized queries to prevent SQL injection.',
      references: [
        'https://owasp.org/www-community/attacks/SQL_Injection',
        'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'
      ],
      cwe: 'CWE-89'
    },
    {
      title: 'Insecure Cookie Configuration',
      description: 'Cookies are set without the Secure and HttpOnly flags.',
      severity: 'Medium',
      evidence: 'Cookie: sessionid=1234; Path=/',
      recommendation: 'Set the Secure flag to ensure cookies are only sent over HTTPS and HttpOnly to prevent access from JavaScript.',
      references: [
        'https://owasp.org/www-community/controls/SecureCookieAttribute',
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies'
      ],
      cwe: 'CWE-614'
    }
  ];
};

/**
 * Create sample port findings
 */
const createSamplePortFindings = () => {
  return [
    {
      title: 'Open SSH Port',
      description: 'SSH port (22) is open on the server.',
      severity: 'Info',
      location: '22',
      recommendation: 'If SSH is not required, consider closing this port to reduce the attack surface.'
    },
    {
      title: 'Telnet Service Enabled',
      description: 'Telnet port (23) is open. Telnet transmits data in cleartext.',
      severity: 'High',
      location: '23',
      recommendation: 'Disable Telnet and use SSH instead for secure remote access.'
    },
    {
      title: 'MySQL Database Exposed',
      description: 'MySQL port (3306) is accessible from external networks.',
      severity: 'Medium',
      location: '3306',
      recommendation: 'Restrict access to the database port using firewall rules or bind it to localhost only.'
    }
  ];
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}
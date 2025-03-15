require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
  version: process.env.VERSION || '1.0.0',
  
  // Database configuration
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/site-analyser',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    }
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // CORS configuration
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    prefix: process.env.REDIS_PREFIX || 'site-analyser:'
  },
  
  // External API keys
  apiKeys: {
    shodan: process.env.SHODAN_API_KEY,
    virusTotal: process.env.VIRUSTOTAL_API_KEY
  },
  
  // AI Service configuration
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000/api',
    timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '30000', 10)
  },
  
  // Email configuration
  email: {
    from: process.env.EMAIL_FROM || 'no-reply@site-analyser.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    }
  },
  
  // Feature flags
  features: {
    aiAnalysis: process.env.FEATURE_AI_ANALYSIS !== 'false',
    emailNotifications: process.env.FEATURE_EMAIL_NOTIFICATIONS !== 'false',
    mfa: process.env.FEATURE_MFA !== 'false'
  },
  
  // Security scan configuration
  scan: {
    concurrentScans: parseInt(process.env.MAX_CONCURRENT_SCANS || '50', 10),
    timeout: parseInt(process.env.SCAN_TIMEOUT || '300000', 10), // 5 minutes
    depthFactors: {
      1: 0.5,  // Basic scan - 50% depth
      2: 1.0,  // Standard scan - 100% depth
      3: 2.0   // Comprehensive scan - 200% depth
    }
  }
};

module.exports = config;
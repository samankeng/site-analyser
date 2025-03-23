const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const { createRateLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./api/auth/routes');
const scanRoutes = require('./api/scans/routes');
const reportRoutes = require('./api/reports/routes');
const alertRoutes = require('./api/alerts/routes');
const config = require('./config');

// Initialize Express app
const app = express();

// Connect to MongoDB using our enhanced database module with retry logic
connectDB()
  .then(() => console.log('MongoDB connected successfully using database module'))
  .catch(err => {
    console.error('Failed to connect to database:', err);
    console.warn('Application continuing despite MongoDB connection error');
  });

// Middleware
app.use(helmet()); // Security headers

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);

      // List of allowed origins
      const allowedOrigins = [
        'http://localhost',
        'http://localhost:3000',
        'http://localhost:80',
        'http://client',
      ];

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Rate limiting
app.use(
  createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);

// Swagger documentation
if (config.env !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = require('./config/swagger.json');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    version: config.version,
  });
});

// Default route - API info
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Site-Analyser API',
    version: config.version,
    documentation: `${config.baseUrl}/api-docs`,
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource '${req.originalUrl}' was not found on this server`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.env} mode`);
  console.log(`API documentation available at ${config.baseUrl}/api-docs`);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  // Perform graceful shutdown or recovery actions
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Perform graceful shutdown or recovery actions
  process.exit(1);
});

// In app.js, add this before your API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Public endpoint works' });
});

module.exports = app;

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Site Analyser API Server',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/scans', '/api/reports'],
  });
});

// Mock scans endpoint
app.get('/api/scans', (req, res) => {
  res.json({
    scans: [{ id: 1, domain: 'example.com', status: 'completed', createdAt: new Date() }],
  });
});

// Mock reports endpoint
app.get('/api/reports', (req, res) => {
  res.json({
    reports: [
      { id: 1, domain: 'example.com', scanType: 'full', createdAt: new Date(), riskScore: 65 },
    ],
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'Not set'}`);
  console.log(`Redis URL: ${process.env.REDIS_URL || 'Not set'}`);
  console.log(`AI Service URL: ${process.env.AI_SERVICE_URL || 'Not set'}`);
});

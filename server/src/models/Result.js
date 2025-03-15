const mongoose = require('mongoose');

// Schema for individual findings
const FindingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low', 'Info'],
    required: true
  },
  location: {
    type: String
  },
  evidence: {
    type: String
  },
  recommendation: {
    type: String
  },
  references: [String],
  cwe: {
    type: String
  },
  cvss: {
    score: Number,
    vector: String
  },
  metadataKey: {
    type: String
  }
});

// Schema for component-specific results (SSL, Headers, etc.)
const ComponentResultSchema = new mongoose.Schema({
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  findings: [FindingSchema],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  rawData: mongoose.Schema.Types.Mixed
});

// Main result schema
const ResultSchema = new mongoose.Schema({
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  results: {
    ssl: ComponentResultSchema,
    headers: ComponentResultSchema,
    vulnerabilities: ComponentResultSchema,
    ports: ComponentResultSchema,
    content: ComponentResultSchema,
    performance: ComponentResultSchema
  },
  summary: {
    overall: Number,
    ssl: Number,
    headers: Number,
    vulnerabilities: Number,
    server: Number,
    findings: {
      critical: {
        type: Number,
        default: 0
      },
      high: {
        type: Number,
        default: 0
      },
      medium: {
        type: Number,
        default: 0
      },
      low: {
        type: Number,
        default: 0
      },
      info: {
        type: Number,
        default: 0
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Results expire after 90 days by default
      const date = new Date();
      date.setDate(date.getDate() + 90);
      return date;
    }
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ResultSchema.index({ scanId: 1 }, { unique: true });
ResultSchema.index({ url: 1, createdAt: -1 });
ResultSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Calculate total findings count
ResultSchema.virtual('totalFindings').get(function() {
  let count = 0;
  
  // Add up all findings from each component
  Object.keys(this.results || {}).forEach(component => {
    if (this.results[component] && this.results[component].findings) {
      count += this.results[component].findings.length;
    }
  });
  
  return count;
});

// Get all findings in a flattened array
ResultSchema.methods.getAllFindings = function() {
  const allFindings = [];
  
  // Collect all findings from each component
  Object.keys(this.results || {}).forEach(component => {
    if (this.results[component] && this.results[component].findings) {
      this.results[component].findings.forEach(finding => {
        allFindings.push({
          ...finding.toObject(),
          component
        });
      });
    }
  });
  
  return allFindings;
};

// Get findings by severity
ResultSchema.methods.getFindingsBySeverity = function(severity) {
  return this.getAllFindings().filter(finding => 
    finding.severity.toLowerCase() === severity.toLowerCase()
  );
};

// Calculate component scores
ResultSchema.methods.calculateComponentScore = function(componentName, findings = []) {
  // If no findings provided, use the component's findings
  const targetFindings = findings.length > 0 
    ? findings 
    : (this.results[componentName]?.findings || []);
  
  if (targetFindings.length === 0) {
    return 100; // Perfect score if no findings
  }
  
  // Base score
  let score = 100;
  
  // Deduct points based on severity
  const deductions = {
    'Critical': 25,
    'High': 15,
    'Medium': 10,
    'Low': 5,
    'Info': 0
  };
  
  // Apply deductions
  targetFindings.forEach(finding => {
    score -= deductions[finding.severity] || 0;
  });
  
  // Ensure score is within 0-100
  return Math.max(0, Math.min(100, score));
};

// Update component score
ResultSchema.methods.updateComponentScore = function(componentName) {
  if (!this.results[componentName]) {
    return;
  }
  
  this.results[componentName].score = this.calculateComponentScore(componentName);
  
  // Also update the summary
  if (this.summary) {
    this.summary[componentName === 'ports' ? 'server' : componentName] = 
      this.results[componentName].score;
  }
};

module.exports = mongoose.model('Result', ResultSchema);
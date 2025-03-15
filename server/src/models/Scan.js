const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Please provide a URL'],
    trim: true
  },
  scanDepth: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
    default: 2
  },
  options: {
    sslCheck: {
      type: Boolean,
      default: true
    },
    headerAnalysis: {
      type: Boolean,
      default: true
    },
    portScan: {
      type: Boolean,
      default: true
    },
    vulnDetection: {
      type: Boolean,
      default: true
    },
    contentAnalysis: {
      type: Boolean,
      default: false
    },
    performanceCheck: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  results: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result'
  },
  jobId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  error: {
    type: String
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
  aiAnalysis: {
    recommendations: [String],
    riskAssessment: String,
    prioritizedActions: [String],
    threatIntelligence: mongoose.Schema.Types.Mixed
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create index on userId and createdAt for faster queries
ScanSchema.index({ userId: 1, createdAt: -1 });

// Create index on status for queue processing
ScanSchema.index({ status: 1 });

// Create compound index on url and userId to optimize lookup
ScanSchema.index({ url: 1, userId: 1 });

// Create index on domain for related scans
ScanSchema.virtual('domain').get(function() {
  try {
    const urlObj = new URL(this.url);
    return urlObj.hostname;
  } catch (err) {
    return null;
  }
});

// Get estimated time based on scan configuration
ScanSchema.methods.getEstimatedTime = function() {
  let baseTime = 30; // Base time in seconds
  
  // Adjust for scan depth
  const depthFactor = this.scanDepth === 1 ? 0.5 : this.scanDepth === 2 ? 1 : 2;
  baseTime *= depthFactor;
  
  // Add time for each enabled option
  const optionTimes = {
    sslCheck: 15,
    headerAnalysis: 10,
    vulnDetection: 30,
    portScan: 25,
    contentAnalysis: 20,
    performanceCheck: 15
  };
  
  Object.keys(this.options).forEach(option => {
    if (this.options[option]) {
      baseTime += optionTimes[option] * depthFactor;
    }
  });
  
  return baseTime;
};

// Virtual to estimate completion time
ScanSchema.virtual('estimatedCompletionTime').get(function() {
  if (this.status === 'completed' || this.status === 'failed' || this.status === 'cancelled') {
    return null;
  }
  
  if (!this.startedAt) {
    return null;
  }
  
  const estimatedSeconds = this.getEstimatedTime();
  const startTime = new Date(this.startedAt).getTime();
  const estimatedCompletionTime = new Date(startTime + (estimatedSeconds * 1000));
  
  return estimatedCompletionTime;
});

// Method to check if scan is stale (running for too long)
ScanSchema.methods.isStale = function(timeoutInMinutes = 10) {
  if (this.status !== 'in_progress' && this.status !== 'pending') {
    return false;
  }
  
  const startTime = this.startedAt || this.createdAt;
  const currentTime = new Date();
  const runningTimeInMinutes = (currentTime - startTime) / (1000 * 60);
  
  return runningTimeInMinutes > timeoutInMinutes;
};

module.exports = mongoose.model('Scan', ScanSchema);
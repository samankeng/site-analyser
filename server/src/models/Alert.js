const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide an alert title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Please provide an alert message']
  },
  type: {
    type: String,
    required: true,
    enum: ['security', 'system', 'info'],
    default: 'security'
  },
  severity: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    default: 'info'
  },
  status: {
    type: String,
    enum: ['new', 'read', 'resolved', 'ignored'],
    default: 'new'
  },
  url: {
    type: String,
    trim: true
  },
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan'
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Alerts expire after 180 days by default
      const date = new Date();
      date.setDate(date.getDate() + 180);
      return date;
    }
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create index on userId and createdAt for faster queries
AlertSchema.index({ userId: 1, createdAt: -1 });

// Create index on status for filtering
AlertSchema.index({ userId: 1, status: 1 });

// Create index on severity for filtering
AlertSchema.index({ userId: 1, severity: 1 });

// Create index on type for filtering
AlertSchema.index({ userId: 1, type: 1 });

// Create index on expiry date
AlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Create index on scan ID for related alerts
AlertSchema.index({ scanId: 1 });

// Method to mark alert as read
AlertSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = Date.now();
  return this.save();
};

// Method to mark alert as resolved
AlertSchema.methods.resolve = function() {
  this.status = 'resolved';
  this.resolvedAt = Date.now();
  return this.save();
};

// Method to ignore alert
AlertSchema.methods.ignore = function() {
  this.status = 'ignored';
  return this.save();
};

// Virtual to check if the alert is read
AlertSchema.virtual('isRead').get(function() {
  return this.status === 'read' || this.status === 'resolved' || this.status === 'ignored';
});

// Virtual to check if the alert is critical and unread
AlertSchema.virtual('isUrgent').get(function() {
  return this.severity === 'critical' && this.status === 'new';
});

// Virtual to get related scan
AlertSchema.virtual('scan', {
  ref: 'Scan',
  localField: 'scanId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Alert', AlertSchema);
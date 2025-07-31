/**
 * System Log Model
 * Purpose: Schema for tracking system activities and logs
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const mongoose = require('mongoose');

// SystemLog schema
const systemLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'user_login',
      'user_logout',
      'user_register',
      'user_verify',
      'password_reset',
      'election_create',
      'election_update',
      'election_delete',
      'candidate_create',
      'candidate_approve',
      'candidate_reject',
      'vote_cast',
      'result_publish',
      'backup_create',
      'system_error',
      'admin_action',
      'teacher_action'
    ]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // May not always have a user (system actions)
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning', 'info'],
    default: 'info'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index on timestamp for faster querying of logs
systemLogSchema.index({ timestamp: -1 });
// Add index on action for faster filtering
systemLogSchema.index({ action: 1 });
// Add index on user for faster user-specific queries
systemLogSchema.index({ user: 1 });

// Static method to create a new log entry
systemLogSchema.statics.createLog = async function(data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('Error creating log entry:', error);
    // Still return something even if logging fails
    return null;
  }
};

// Static method to get recent logs
systemLogSchema.statics.getRecentLogs = async function(limit = 100) {
  return await this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name email role')
    .exec();
};

// Static method to get logs by action
systemLogSchema.statics.getLogsByAction = async function(action, limit = 100) {
  return await this.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name email role')
    .exec();
};

// Static method to get logs by user
systemLogSchema.statics.getLogsByUser = async function(userId, limit = 100) {
  return await this.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

// Create the model
const SystemLog = mongoose.model('SystemLog', systemLogSchema);

module.exports = SystemLog;

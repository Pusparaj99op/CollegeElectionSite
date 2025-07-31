/**
 * Candidate Model
 * Purpose: Schema for election candidates
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const mongoose = require('mongoose');

// List of available symbols for candidates
const availableSymbols = [
  'star', 'circle', 'square', 'triangle', 'diamond',
  'heart', 'club', 'spade', 'apple', 'book',
  'pencil', 'pen', 'trophy', 'flag', 'crown',
  'leaf', 'flower', 'tree', 'sun', 'moon',
  'cloud', 'umbrella', 'bell', 'key', 'lock',
  'phone', 'camera', 'computer', 'rocket', 'car'
];

// Candidate schema
const candidateSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: [true, 'Election is required']
  },
  symbol: {
    type: String,
    required: [true, 'Symbol is required'],
    enum: availableSymbols
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    default: '#3498db'
  },
  manifesto: {
    type: String,
    trim: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for unique student-election combination
candidateSchema.index({ student: 1, election: 1 }, { unique: true });

// Static method to get all available symbols
candidateSchema.statics.getAvailableSymbols = function() {
  return availableSymbols;
};

// Create the model
const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;

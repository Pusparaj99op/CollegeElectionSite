/**
 * Election Model
 * Purpose: Schema for college elections
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const mongoose = require('mongoose');

// Election schema
const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Election title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  electionType: {
    type: String,
    required: [true, 'Election type is required'],
    enum: ['CR', 'BR', 'Other'],
    default: 'Other'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  candidates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  }],
  // QR Code and Public Access Features
  qrCode: {
    data: String, // QR code data URL
    accessToken: String, // Unique token for accessing the election
    isEnabled: {
      type: Boolean,
      default: true
    }
  },
  publicAccess: {
    allowAnonymousVoting: {
      type: Boolean,
      default: true
    },
    requireRollNumber: {
      type: Boolean,
      default: true
    },
    votingTimeSlots: [{
      startTime: Date,
      endTime: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  },
  anonymousVotes: [{
    rollNumber: {
      type: String,
      required: true
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  votes: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  results: {
    published: {
      type: Boolean,
      default: false
    },
    publishedAt: Date,
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    }
  }
}, {
  timestamps: true
});

// Virtual for checking if election is active
electionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.startDate <= now && now <= this.endDate && this.status === 'active';
});

// Virtual for checking if election is pending
electionSchema.virtual('isPending').get(function() {
  const now = new Date();
  return now < this.startDate && this.status === 'pending';
});

// Virtual for checking if election is completed
electionSchema.virtual('isCompleted').get(function() {
  const now = new Date();
  return now > this.endDate || this.status === 'completed';
});

// Virtual for getting vote count
electionSchema.virtual('voteCount').get(function() {
  return this.votes.length;
});

// Method to check if a student has voted (including anonymous votes)
electionSchema.methods.hasVoted = function(studentId, rollNumber = null) {
  // Check registered student votes
  if (studentId) {
    const hasRegisteredVote = this.votes.some(vote => vote.student.toString() === studentId.toString());
    if (hasRegisteredVote) return true;
  }

  // Check anonymous votes by roll number
  if (rollNumber) {
    const hasAnonymousVote = this.anonymousVotes.some(vote => vote.rollNumber === rollNumber);
    if (hasAnonymousVote) return true;
  }

  return false;
};

// Method to check if voting is currently allowed
electionSchema.methods.isVotingAllowed = function() {
  const now = new Date();

  // Check if election is active
  if (!this.isActive) return false;

  // Check if public access is enabled
  if (!this.publicAccess.allowAnonymousVoting) return false;

  // Check time slots
  if (this.publicAccess.votingTimeSlots.length > 0) {
    return this.publicAccess.votingTimeSlots.some(slot =>
      slot.isActive && now >= slot.startTime && now <= slot.endTime
    );
  }

  // If no time slots, allow voting during election period
  return true;
};

// Method to generate QR code access token
electionSchema.methods.generateQRToken = function() {
  const crypto = require('crypto');
  this.qrCode.accessToken = crypto.randomBytes(32).toString('hex');
  return this.qrCode.accessToken;
};

// Method to get public voting URL
electionSchema.methods.getPublicVotingURL = function() {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseURL}/vote/${this.qrCode.accessToken}`;
};

// Method to calculate results
electionSchema.methods.calculateResults = async function() {
  // Group votes by candidate
  const voteCount = {};

  this.votes.forEach(vote => {
    const candidateId = vote.candidate.toString();
    voteCount[candidateId] = (voteCount[candidateId] || 0) + 1;
  });

  // Find the candidate with the most votes
  let maxVotes = 0;
  let winnerId = null;

  Object.entries(voteCount).forEach(([candidateId, votes]) => {
    if (votes > maxVotes) {
      maxVotes = votes;
      winnerId = candidateId;
    }
  });

  // Set the winner
  if (winnerId) {
    this.results.winner = winnerId;
    this.results.published = true;
    this.results.publishedAt = new Date();
    this.status = 'completed';
    await this.save();
  }

  return {
    totalVotes: this.votes.length,
    voteCounts: voteCount,
    winnerId,
    maxVotes
  };
};

// Create the model
const Election = mongoose.model('Election', electionSchema);

module.exports = Election;

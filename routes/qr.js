/**
 * QR Code Management Routes
 * Purpose: Handle QR code generation and management for elections
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const express = require('express');
const router = express.Router();
const publicVotingController = require('../controllers/publicVotingController');
const { isAuthenticated, isTeacher } = require('../middlewares/auth');

// Generate QR code for election
router.post('/generate/:electionId',
  isAuthenticated,
  isTeacher,
  publicVotingController.generateElectionQR
);

// Toggle QR code access
router.post('/toggle/:electionId',
  isAuthenticated,
  isTeacher,
  publicVotingController.toggleQRAccess
);

// Add voting time slot
router.post('/timeslot/:electionId',
  isAuthenticated,
  isTeacher,
  publicVotingController.addVotingTimeSlot
);

module.exports = router;

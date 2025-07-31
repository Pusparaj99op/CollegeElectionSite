/**
 * Public Voting Routes
 * Purpose: Handle public/anonymous voting via QR codes
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const express = require('express');
const router = express.Router();
const publicVotingController = require('../controllers/publicVotingController');

// Public voting page (accessed via QR code)
router.get('/:token', publicVotingController.getPublicVotingPage);

// Submit public vote
router.post('/:token', publicVotingController.submitPublicVote);

module.exports = router;

/**
 * Public Election Routes
 * Purpose: Handle public-facing election routes
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');

// Get election details
router.get('/:id', electionController.getElectionById);

// List all elections
router.get('/', electionController.listAllElections);

// Get candidate details
router.get('/:id/candidates/:candidateId', electionController.getCandidateDetails);

module.exports = router;

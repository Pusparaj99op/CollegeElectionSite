/**
 * Student Routes
 * Purpose: Handle student-specific routes
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isAuthenticated, isStudent, isVerified, logActivity, isSameCollege } = require('../middlewares/auth');

// Apply auth middlewares to all student routes
router.use(isAuthenticated);
router.use(isVerified);
router.use(isStudent);
router.use(isSameCollege);

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Election management
router.get('/elections/:id', studentController.getElectionDetails);
router.post('/elections/:id/vote', logActivity('vote_cast'), studentController.castVote);
router.get('/elections', studentController.getAllElections);

// Class information
router.get('/class', studentController.getClassInfo);

// Profile management
router.get('/profile', studentController.getProfile);
router.post('/profile/update', studentController.updateProfile);

module.exports = router;

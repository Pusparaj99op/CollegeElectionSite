/**
 * Teacher Routes
 * Purpose: Handle teacher-specific routes
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { isAuthenticated, isTeacher, isVerified, logActivity } = require('../middlewares/auth');

// Apply auth middlewares to all teacher routes
router.use(isAuthenticated);
router.use(isVerified);
router.use(isTeacher);

// Dashboard
router.get('/dashboard', teacherController.getDashboard);

// Class management
router.get('/classes/:id', teacherController.getClassDetails);

// Student management
router.get('/students', teacherController.getStudentManagement);

// Election management
router.get('/elections/create', teacherController.getCreateElection);
router.post('/elections/create', logActivity('election_create'), teacherController.createElection);
router.get('/elections', teacherController.getElectionManagement);
router.get('/elections/:id', teacherController.getElectionDetails);
router.get('/elections/:id/edit', teacherController.getElectionEdit);
router.post('/elections/:id/update', logActivity('election_update'), teacherController.updateElection);

// Candidate management
router.post('/elections/:id/candidates', logActivity('candidate_create'), teacherController.addCandidate);
router.post('/elections/:id/candidates/:candidateId/remove', logActivity('teacher_action'), teacherController.removeCandidate);

// Election results
router.post('/elections/:id/publish-results', logActivity('result_publish'), teacherController.publishResults);

// Send reminders
router.post('/elections/:id/send-reminders', logActivity('teacher_action'), teacherController.sendVotingReminder);

module.exports = router;

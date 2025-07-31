/**
 * Admin Routes
 * Purpose: Handle admin-specific routes
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin, isVerified, logActivity } = require('../middlewares/auth');

// Apply auth middlewares to all admin routes
router.use(isAuthenticated);
router.use(isVerified);
router.use(isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUserManagement);
router.get('/users/:id/edit', adminController.getUserEdit);
router.post('/users/:id/update', logActivity('admin_action'), adminController.updateUser);
router.post('/users/:id/delete', logActivity('admin_action'), adminController.deleteUser);

// Class management
router.get('/classes', adminController.getClassManagement);
router.get('/classes/create', adminController.getClassCreate);
router.post('/classes/create', logActivity('admin_action'), adminController.createClass);
router.get('/classes/:id/edit', adminController.getClassEdit);
router.post('/classes/:id/update', logActivity('admin_action'), adminController.updateClass);
router.get('/classes/:id', adminController.getClassDetails);
router.post('/classes/:id/delete', logActivity('admin_action'), adminController.deleteClass);

// Election management
router.get('/elections', adminController.getElectionManagement);
router.get('/elections/:id', adminController.getElectionDetails);
router.post('/elections/:id/status', logActivity('admin_action'), adminController.updateElectionStatus);
router.post('/elections/:id/delete', logActivity('admin_action'), adminController.deleteElection);

// System logs
router.get('/logs', adminController.getSystemLogs);

// Backup
router.get('/backup', adminController.getBackupPage);
router.post('/backup/create', logActivity('backup_create'), adminController.createBackup);

// System settings
router.get('/settings', adminController.getSettingsPage);

module.exports = router;

/**
 * Authentication Routes
 * Purpose: Handle user authentication and registration routes
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { logActivity } = require('../middlewares/auth');

// Login routes
router.get('/login', authController.getLoginPage);
router.post('/login', logActivity('user_login'), authController.login);

// Registration routes
router.get('/register', authController.getRegisterPage);
router.post('/register', logActivity('user_register'), authController.register);

// Email verification routes
router.get('/verify/:token', authController.verifyEmail);
router.get('/verify-email', authController.getVerifyEmailPage);
router.post('/resend-verification', authController.resendVerificationEmail);

// Password reset routes
router.get('/forgot-password', authController.getForgotPasswordPage);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.getResetPasswordPage);
router.post('/reset-password/:token', authController.resetPassword);

// Logout route
router.get('/logout', logActivity('user_logout'), authController.logout);

module.exports = router;

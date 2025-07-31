/**
 * Authentication Middleware
 * Purpose: Handles authentication and authorization for routes
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const User = require('../models/User');
const SystemLog = require('../models/SystemLog');

/**
 * Check if user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }

  req.flash('error', 'Please log in to access this page');
  return res.redirect('/auth/login');
};

/**
 * Check if user is an admin
 */
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  req.flash('error', 'You need admin privileges to access this page');
  return res.redirect('/');
};

/**
 * Check if user is a teacher
 */
const isTeacher = (req, res, next) => {
  if (req.session.user && (req.session.user.role === 'teacher' || req.session.user.role === 'admin')) {
    return next();
  }

  req.flash('error', 'You need teacher privileges to access this page');
  return res.redirect('/');
};

/**
 * Check if user is a student
 */
const isStudent = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'student') {
    return next();
  }

  req.flash('error', 'This page is only accessible to students');
  return res.redirect('/');
};

/**
 * Check if user email is verified
 */
const isVerified = (req, res, next) => {
  if (req.session.user && req.session.user.isVerified) {
    return next();
  }

  req.flash('error', 'Please verify your email address before accessing this page');
  return res.redirect('/auth/verify-email');
};

/**
 * Log user activity
 */
const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      // Get user IP and User Agent
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Create log entry
      await SystemLog.createLog({
        action,
        user: req.session.user ? req.session.user._id : null,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.method === 'POST' ? { ...req.body, password: undefined } : undefined
        },
        ip,
        userAgent,
        status: 'info'
      });

      next();
    } catch (error) {
      console.error('Error logging activity:', error);
      next(); // Continue even if logging fails
    }
  };
};

/**
 * Check if the college is the same
 */
const isSameCollege = (req, res, next) => {
  const userEmail = req.session.user.email;
  const domainFromEmail = userEmail.split('@')[1];

  if (domainFromEmail === process.env.COLLEGE_EMAIL_DOMAIN) {
    return next();
  }

  req.flash('error', 'You can only access resources from your college');
  return res.redirect('/');
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isTeacher,
  isStudent,
  isVerified,
  logActivity,
  isSameCollege
};

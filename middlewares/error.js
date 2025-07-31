/**
 * Error Handling Middleware
 * Purpose: Centralized error handling for the application
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const SystemLog = require('../models/SystemLog');

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error to console
  console.error(err.stack);

  // Log error to database
  SystemLog.createLog({
    action: 'system_error',
    user: req.session?.user?._id,
    details: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      path: req.path,
      method: req.method
    },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'failure'
  }).catch(logErr => console.error('Error logging to database:', logErr));

  // Set status code
  const statusCode = err.statusCode || 500;

  // Send response based on request type
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    // JSON response for API requests
    return res.status(statusCode).json({
      status: 'error',
      message: err.message || 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'development' ? err : undefined
    });
  } else {
    // HTML response for browser requests
    return res.status(statusCode).render('error', {
      title: 'Error',
      message: err.message || 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'development' ? err : {},
      user: req.session?.user || null
    });
  }
};

/**
 * Not found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Validation error handler
 */
const validationErrorHandler = (req, res, next) => {
  // Extract validation errors from request
  const errors = req.validationErrors();

  if (errors) {
    // Create error object
    const error = new Error('Validation Failed');
    error.statusCode = 422;
    error.data = errors.map(e => ({
      field: e.param,
      message: e.msg
    }));

    return next(error);
  }

  next();
};

/**
 * Async handler to avoid try-catch blocks in route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
  asyncHandler
};

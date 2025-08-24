/**
 * Authentication Controller
 * Purpose: Handles user authentication and registration logic
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const Class = require('../models/Class');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const mailer = require('../config/mailer');
const { asyncHandler } = require('../middlewares/error');

/**
 * Render login page
 */
const getLoginPage = (req, res) => {
  if (req.session.user) {
    // Redirect based on user role
    switch (req.session.user.role) {
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'teacher':
        return res.redirect('/teacher/dashboard');
      case 'student':
        return res.redirect('/student/dashboard');
      default:
        return res.redirect('/');
    }
  }

  res.render('auth/login', {
    title: 'Login',
    user: null
  });
};

/**
 * Handle user login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    req.flash('error', 'Email and password are required');
    return res.redirect('/auth/login');
  }

  // Find user by email and include password for comparison
  const user = await User.findOne({ email }).select('+password');

  // Check if user exists
  if (!user) {
    req.flash('error', 'Invalid email or password');
    return res.redirect('/auth/login');
  }

  // Check if user is active
  if (!user.active) {
    req.flash('error', 'Your account is deactivated. Please contact the administrator.');
    return res.redirect('/auth/login');
  }

  // Compare passwords
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Log failed login attempt
    await SystemLog.createLog({
      action: 'user_login',
      user: user._id,
      status: 'failure',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    req.flash('error', 'Invalid email or password');
    return res.redirect('/auth/login');
  }

  // Check if user is verified
  if (!user.isVerified) {
    req.flash('warning', 'Please verify your email address first');
    return res.redirect('/auth/verify-email');
  }

  // Set session data
  req.session.user = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    class: user.class,
    rollNumber: user.rollNumber
  };

  // Update last login time
  user.lastLogin = new Date();
  await user.save();

  // Log successful login
  await SystemLog.createLog({
    action: 'user_login',
    user: user._id,
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Redirect based on user role
  req.flash('success', `Welcome back, ${user.name}!`);

  switch (user.role) {
    case 'admin':
      return res.redirect('/admin/dashboard');
    case 'teacher':
      return res.redirect('/teacher/dashboard');
    case 'student':
      return res.redirect('/student/dashboard');
    default:
      return res.redirect('/');
  }
});

/**
 * Render registration page
 */
const getRegisterPage = asyncHandler(async (req, res) => {
  if (req.session.user) {
    // Redirect based on user role
    switch (req.session.user.role) {
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'teacher':
        return res.redirect('/teacher/dashboard');
      case 'student':
        return res.redirect('/student/dashboard');
      default:
        return res.redirect('/');
    }
  }

  // Get all classes for student registration
  const classes = await Class.find({ active: true }).sort({ name: 1 });

  res.render('auth/register', {
    title: 'Register',
    user: null,
    classes
  });
});

/**
 * Handle user registration
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, rollNumber, classId, role } = req.body;

  // Basic validation
  if (!name || !email || !password || !confirmPassword) {
    req.flash('error', 'Please fill all required fields');
    return res.redirect('/auth/register');
  }

  // Check password match
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/auth/register');
  }

  // Check password strength
  if (password.length < 8) {
    req.flash('error', 'Password must be at least 8 characters long');
    return res.redirect('/auth/register');
  }

  // Check if email is a college email
  if (!mailer.isCollegeEmail(email)) {
    req.flash('error', 'Please use your college email address');
    return res.redirect('/auth/register');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    req.flash('error', 'Email is already registered');
    return res.redirect('/auth/register');
  }

  // Additional validation for student role
  if (role === 'student' && (!rollNumber || !classId)) {
    req.flash('error', 'Roll number and class are required for students');
    return res.redirect('/auth/register');
  }

  // Check if roll number is already registered for the class
  if (role === 'student') {
    const studentWithRollInClass = await User.findOne({
      rollNumber,
      class: classId,
      role: 'student'
    });

    if (studentWithRollInClass) {
      req.flash('error', 'This roll number is already registered for this class');
      return res.redirect('/auth/register');
    }
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // Create new user with default role as student
  const newUser = new User({
    name,
    email,
    password,
    role: role || 'student',
    verificationToken,
    verificationExpires,
    rollNumber: role === 'student' ? rollNumber : undefined,
    class: role === 'student' ? classId : undefined
  });

  // Save the user
  await newUser.save();

  // Send verification email
  await mailer.sendVerificationEmail(newUser.email, newUser.name, verificationToken);

  // Log registration
  await SystemLog.createLog({
    action: 'user_register',
    user: newUser._id,
    status: 'success',
    details: { role: newUser.role },
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Registration successful! Please check your email to verify your account.');
  res.redirect('/auth/verify-email');
});

/**
 * Verify email with token
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Find user with matching token and not expired
  const user = await User.findOne({
    verificationToken: token,
    verificationExpires: { $gt: Date.now() }
  });

  // Check if user exists
  if (!user) {
    req.flash('error', 'Invalid or expired verification token');
    return res.redirect('/auth/verify-email');
  }

  // Update user verification status
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();

  // Log verification
  await SystemLog.createLog({
    action: 'user_verify',
    user: user._id,
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Email verification successful! You can now log in.');
  res.redirect('/auth/login');
});

/**
 * Render verify email page
 */
const getVerifyEmailPage = (req, res) => {
  res.render('auth/verify-email', {
    title: 'Verify Email',
    user: req.session.user || null
  });
};

/**
 * Resend verification email
 */
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user by email and not verified
  const user = await User.findOne({ email, isVerified: false });

  // Check if user exists
  if (!user) {
    req.flash('error', 'Email not found or already verified');
    return res.redirect('/auth/verify-email');
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // Update user verification token
  user.verificationToken = verificationToken;
  user.verificationExpires = verificationExpires;
  await user.save();

  // Send verification email
  await mailer.sendVerificationEmail(user.email, user.name, verificationToken);

  req.flash('success', 'Verification email sent. Please check your inbox.');
  res.redirect('/auth/verify-email');
});

/**
 * Render forgot password page
 */
const getForgotPasswordPage = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    user: req.session.user || null
  });
};

/**
 * Handle forgot password request
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    req.flash('error', 'Email is required');
    return res.redirect('/auth/forgot-password');
  }

  // Find user by email
  const user = await User.findOne({ email });

  // Always send success message even if user doesn't exist (security)
  if (!user) {
    req.flash('success', 'If your email is registered, you will receive password reset instructions.');
    return res.redirect('/auth/login');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

  // Update user reset token
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetExpires;
  await user.save();

  // Send password reset email
  await mailer.sendPasswordResetEmail(user.email, user.name, resetToken);

  // Log password reset request
  await SystemLog.createLog({
    action: 'password_reset',
    user: user._id,
    status: 'info',
    details: { stage: 'request' },
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Password reset email sent. Please check your inbox.');
  res.redirect('/auth/login');
});

/**
 * Render reset password page
 */
const getResetPasswordPage = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Find user with matching token and not expired
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  // Check if token is valid
  if (!user) {
    req.flash('error', 'Invalid or expired reset token');
    return res.redirect('/auth/forgot-password');
  }

  res.render('auth/reset-password', {
    title: 'Reset Password',
    token,
    user: null
  });
});

/**
 * Handle reset password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  // Validate passwords
  if (!password || !confirmPassword) {
    req.flash('error', 'Both password fields are required');
    return res.redirect(`/auth/reset-password/${token}`);
  }

  // Check password match
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect(`/auth/reset-password/${token}`);
  }

  // Check password strength
  if (password.length < 8) {
    req.flash('error', 'Password must be at least 8 characters long');
    return res.redirect(`/auth/reset-password/${token}`);
  }

  // Find user with matching token and not expired
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  // Check if token is valid
  if (!user) {
    req.flash('error', 'Invalid or expired reset token');
    return res.redirect('/auth/forgot-password');
  }

  // Update user password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Log password reset completion
  await SystemLog.createLog({
    action: 'password_reset',
    user: user._id,
    status: 'success',
    details: { stage: 'complete' },
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Password reset successful! You can now log in with your new password.');
  res.redirect('/auth/login');
});

/**
 * Handle user logout
 */
const logout = asyncHandler(async (req, res) => {
  const userId = req.session.user?._id;

  // Log logout if user is logged in
  if (userId) {
    await SystemLog.createLog({
      action: 'user_logout',
      user: userId,
      status: 'success',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  }

  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/auth/login');
  });
});

module.exports = {
  getLoginPage,
  login,
  getRegisterPage,
  register,
  verifyEmail,
  getVerifyEmailPage,
  resendVerificationEmail,
  getForgotPasswordPage,
  forgotPassword,
  getResetPasswordPage,
  resetPassword,
  logout
};

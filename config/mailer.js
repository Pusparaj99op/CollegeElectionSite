/**
 * Email Configuration File
 * Purpose: Handle email sending functionality
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 *
 * How to use:
 * 1. Configure email settings in .env file
 * 2. Import this module where email functionality is needed
 * 3. Call sendEmail() with appropriate parameters
 */

const nodemailer = require('nodemailer');

// Create transport
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.text] - Plain text alternative
 * @returns {Promise<object>} - Email send result
 */
const sendEmail = async (options) => {
  try {
    // Default sender email
    const from = `College Election System <${process.env.EMAIL_USER}>`;

    // Prepare mail options
    const mailOptions = {
      from,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify the college email domain
 * @param {string} email - Email to verify
 * @returns {boolean} - True if email belongs to college domain
 */
const isCollegeEmail = (email) => {
  const domain = email.split('@')[1];
  return domain === process.env.COLLEGE_EMAIL_DOMAIN;
};

/**
 * Send verification email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} verificationToken - Verification token
 * @returns {Promise<object>} - Email send result
 */
const sendVerificationEmail = async (to, name, verificationToken) => {
  const subject = 'College Election System - Email Verification';

  // Generate verification URL
  const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/verify/${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a4a4a;">Email Verification</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with the College Election System. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
      </div>
      <p>If the button doesn't work, you can also click on the link below or copy it into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not request this verification, please ignore this email.</p>
      <p>Best regards,<br>College Election System Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html
  });
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetToken - Password reset token
 * @returns {Promise<object>} - Email send result
 */
const sendPasswordResetEmail = async (to, name, resetToken) => {
  const subject = 'College Election System - Password Reset';

  // Generate reset URL
  const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a4a4a;">Password Reset</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset for your College Election System account. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can also click on the link below or copy it into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this password reset, please ignore this email or contact support.</p>
      <p>Best regards,<br>College Election System Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html
  });
};

/**
 * Send election notification email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {object} electionInfo - Election information
 * @returns {Promise<object>} - Email send result
 */
const sendElectionNotificationEmail = async (to, name, electionInfo) => {
  const subject = `College Election System - ${electionInfo.title} Election`;

  // Format dates for display
  const startDate = new Date(electionInfo.startDate).toLocaleString();
  const endDate = new Date(electionInfo.endDate).toLocaleString();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a4a4a;">${electionInfo.title} Election</h2>
      <p>Hello ${name},</p>
      <p>We are pleased to inform you about the upcoming ${electionInfo.title} election.</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Election Details:</strong></p>
        <p><strong>Title:</strong> ${electionInfo.title}</p>
        <p><strong>Description:</strong> ${electionInfo.description}</p>
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
      </div>
      <p>You can access the election portal by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.BASE_URL || 'http://localhost:3000'}/election/${electionInfo._id}" style="background-color: #FF5722; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Election</a>
      </div>
      <p>Please make sure to cast your vote before the election ends.</p>
      <p>Best regards,<br>College Election System Team</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  isCollegeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendElectionNotificationEmail
};

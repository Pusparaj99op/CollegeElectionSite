/**
 * Enhanced Email Configuration File
 * Purpose: Handle email sending functionality with Gmail API integration
 * Version: 2.0.0
 * Last Modified: August 1, 2025
 *
 * How to use:
 * 1. Configure Gmail API credentials in .env file
 * 2. Import this module where email functionality is needed
 * 3. Call sendEmail() or specific email functions
 */

const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Gmail API OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Create enhanced transport with Gmail API
const createTransporter = async () => {
  try {
    // Use Gmail API if configured
    if (process.env.GMAIL_API_KEY && process.env.GOOGLE_CLIENT_ID) {
      const accessToken = await oauth2Client.getAccessToken();

      return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
          accessToken: accessToken.token
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      // Fallback to basic auth
      return nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    throw error;
  }
};

/**
 * Enhanced email sending function
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.text] - Plain text alternative
 * @returns {Promise<object>} - Email send result
 */
const sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();

    // Enhanced sender email with college branding
    const from = `College Election System <${process.env.EMAIL_USER}>`;

    // Prepare enhanced mail options
    const mailOptions = {
      from,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html,
      // Add email headers for better deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      },
      // Add tracking and analytics
      list: {
        unsubscribe: `${process.env.BASE_URL || 'http://localhost:3000'}/unsubscribe`
      }
    };

    // Send email with retry logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const info = await transporter.sendMail(mailOptions);

        // Log successful email send
        console.log(`Email sent successfully to ${options.to}:`, info.messageId);

        return {
          success: true,
          messageId: info.messageId,
          response: info.response
        };
      } catch (error) {
        attempts++;
        console.error(`Email send attempt ${attempts} failed:`, error.message);

        if (attempts === maxAttempts) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
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
/**
 * Send enhanced verification email with modern design
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} verificationToken - Verification token
 * @returns {Promise<object>} - Email send result
 */
const sendVerificationEmail = async (to, name, verificationToken) => {
  const subject = '🎓 College Election System - Verify Your Account';

  // Generate verification URL
  const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/verify/${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 2rem; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 1.8rem; font-weight: 600; }
            .content { padding: 2rem; }
            .logo { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
            .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 1.5rem 0; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
            .btn:hover { box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4); }
            .footer { background: #f1f5f9; padding: 1.5rem; text-align: center; color: #64748b; font-size: 0.875rem; }
            .security-notice { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
            .divider { height: 1px; background: #e2e8f0; margin: 1.5rem 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓</div>
                <h1>Welcome to College Election System</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0;">Verify your account to get started</p>
            </div>

            <div class="content">
                <h2 style="color: #1f2937; margin-bottom: 1rem;">Hello ${name}! 👋</h2>

                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1.5rem;">
                    Thank you for joining our College Election System! You're just one step away from participating in democratic processes at your institution.
                </p>

                <div style="text-align: center; margin: 2rem 0;">
                    <a href="${verificationUrl}" class="btn">✅ Verify My Account</a>
                </div>

                <div class="security-notice">
                    <h4 style="margin: 0 0 0.5rem; color: #92400e;">🔒 Security Notice</h4>
                    <p style="margin: 0; color: #92400e; font-size: 0.875rem;">
                        This verification link is valid for 24 hours and can only be used once for security purposes.
                    </p>
                </div>

                <div class="divider"></div>

                <p style="color: #6b7280; font-size: 0.875rem; line-height: 1.5;">
                    <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
                </p>

                <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1.5rem;">
                    If you didn't create an account with us, please ignore this email or contact our support team.
                </p>
            </div>

            <div class="footer">
                <p><strong>College Election System</strong></p>
                <p>Secure • Transparent • Democratic</p>
                <p style="margin-top: 1rem;">
                    <a href="${process.env.BASE_URL || 'http://localhost:3000'}" style="color: #2563eb;">Visit Website</a> |
                    <a href="mailto:${process.env.EMAIL_USER}" style="color: #2563eb;">Support</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Hello ${name}, please verify your email by visiting: ${verificationUrl}`
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

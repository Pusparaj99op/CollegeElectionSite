/**
 * Hostinger Configuration
 * Purpose: Configure College Election Site for Hostinger shared hosting
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

module.exports = {
  // Database settings for Hostinger
  database: {
    // Use the local MongoDB on Hostinger
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/college_election',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    // If behind a proxy (like Hostinger's Apache)
    trustProxy: true
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'college-election-secure-pranay-secret-2025-production',
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    }
  },

  // Paths configuration
  paths: {
    uploads: process.env.UPLOAD_PATH || '/home/u123456789/public_html/uploads',
    backups: process.env.BACKUP_PATH || '/home/u123456789/backups'
  },

  // SSL settings
  ssl: {
    enabled: true,
    // If you're using Hostinger's Let's Encrypt integration,
    // these paths may not be needed as they handle SSL at the server level
    cert: '/etc/letsencrypt/live/anymovie.shop/fullchain.pem',
    key: '/etc/letsencrypt/live/anymovie.shop/privkey.pem'
  },

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || 'pranaygajbhiye2020@gmail.com',
    password: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'College Election System <pranaygajbhiye2020@gmail.com>'
  },

  // Google API configuration for backups
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN
  }
};

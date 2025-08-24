# College Election Site - Credentials Setup Guide
**Purpose:** Complete guide for setting up all required credentials and environment variables
**Version:** 1.0.0
**Project Version:** 1.0.0
**Last Modified:** August 1, 2025

## Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

### Database Configuration
```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/college-election
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college-election

# Database Name
DB_NAME=college-election
```

### Server Configuration
```bash
# Server Port
PORT=3000

# Base URL (for email links)
BASE_URL=http://localhost:3000
# OR for production:
# BASE_URL=https://yourdomain.com

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-here

# College Email Domain
COLLEGE_EMAIL_DOMAIN=your-college-domain.edu
```

### Email Configuration (Gmail API)
```bash
# Gmail API Credentials
GMAIL_API_KEY=your-gmail-api-key-here
EMAIL_SERVICE=Gmail
EMAIL_USER=your-college-email@gmail.com
EMAIL_PASS=your-app-password-here

# Alternative: OAuth2 for Gmail (More Secure)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_REFRESH_TOKEN=your-google-refresh-token
```

### Google Drive Integration (Optional - for backups)
```bash
# Google Drive API
GOOGLE_DRIVE_FOLDER_ID=your-backup-folder-id
```

### Security & Authentication
```bash
# JWT Secret (if using JWT)
JWT_SECRET=your-jwt-secret-key

# Admin Setup
ADMIN_EMAIL=admin@your-college-domain.edu
ADMIN_PASSWORD=secure-admin-password

# Password Reset Token Expiry (in minutes)
RESET_TOKEN_EXPIRY=60

# Email Verification Token Expiry (in minutes)
VERIFICATION_TOKEN_EXPIRY=1440
```

### Development/Production Flags
```bash
# Environment
NODE_ENV=development
# OR for production:
# NODE_ENV=production

# Debug Mode
DEBUG=true

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Setting Up Gmail API

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API and Google Drive API

### Step 2: Create Credentials
1. Go to "Credentials" in the API & Services section
2. Click "Create Credentials" → "API Key"
3. Restrict the API key to Gmail API only
4. Copy the API key to `GMAIL_API_KEY`

### Step 3: OAuth2 Setup (Recommended)
1. Create OAuth 2.0 Client ID
2. Add authorized redirect URIs
3. Download the client credentials JSON
4. Extract `client_id`, `client_secret`

### Step 4: Generate Refresh Token
```bash
# Use Google OAuth2 Playground or run this script:
node scripts/generate-refresh-token.js
```

## MongoDB Setup

### Local MongoDB
```bash
# Install MongoDB locally
sudo apt install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster
3. Add database user
4. Whitelist IP addresses
5. Get connection string

## Security Best Practices

### Environment File Protection
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
```

### Strong Passwords
- Use minimum 12 characters
- Include uppercase, lowercase, numbers, symbols
- Use password manager
- Rotate credentials regularly

### API Key Security
- Restrict API keys to specific services
- Use IP restrictions when possible
- Monitor API usage
- Set up usage alerts

## Testing Configuration

### Verify Database Connection
```bash
npm run test:db
```

### Verify Email Configuration
```bash
npm run test:email
```

### Verify All Services
```bash
npm run test:all
```

## Troubleshooting

### Common Issues
1. **MongoDB Connection Failed**
   - Check if MongoDB service is running
   - Verify connection string format
   - Check network connectivity

2. **Email Sending Failed**
   - Verify Gmail API credentials
   - Check if "Less secure apps" is enabled (for basic auth)
   - Confirm OAuth2 refresh token is valid

3. **Session Issues**
   - Ensure SESSION_SECRET is set
   - Check if session store is configured
   - Verify cookie settings

### Debug Commands
```bash
# Check environment variables
npm run debug:env

# Test database connection
npm run debug:db

# Test email functionality
npm run debug:email
```

## Production Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
BASE_URL=https://your-production-domain.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/college-election
SESSION_SECRET=production-secret-key
DEBUG=false
```

### Security Headers
Ensure your production server includes:
- HTTPS certificates
- Security headers (HSTS, CSP, etc.)
- Rate limiting
- Input validation
- CORS configuration

## Backup & Recovery

### Database Backup
```bash
# Create backup script
node scripts/backup.js
```

### Google Drive Integration
- Automated daily backups
- Encrypted backup files
- Retention policy (30 days)

---

**Important:** Never commit your `.env` file to version control. Keep credentials secure and rotate them regularly.

For additional help, contact the development team or refer to the main README.md file.

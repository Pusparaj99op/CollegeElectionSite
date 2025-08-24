# 🚀 Getting Started with College Election System

**Modern College Election Management System - Quick Setup Guide**
**Version:** 2.0.0
**Last Updated:** August 1, 2025

This comprehensive quick start guide will help you get the enhanced College Election System up and running on your local machine in minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16.x or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5.x or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **npm** (v8.x or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/downloads)

### 🔍 Verify Prerequisites
```bash
node --version    # Should show v16.x or higher
npm --version     # Should show v8.x or higher
mongo --version   # Should show v5.x or higher
git --version     # Should show git version
```

## ⚡ Quick Setup (5 Minutes)

### 1. **Clone the Repository**
```bash
git clone https://github.com/Pusparaj99op/College-Election-Site.git
cd College-Election-Site
```

### 2. **Install Dependencies**
```bash
# Clean installation for best results
npm install

# Alternative: If you encounter issues
npm install --legacy-peer-deps
```

### 3. **Setup Environment Variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit with your favorite editor
nano .env
# OR
code .env
```

**⚠️ Important:** Configure these essential variables in your `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
SESSION_SECRET=your-super-secret-session-key-here

# Database
MONGODB_URI=mongodb://localhost:27017/college-election
DB_NAME=college-election

# Email Configuration (Gmail API - Recommended)
EMAIL_SERVICE=Gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GMAIL_API_KEY=your-gmail-api-key-here

# Google OAuth2 (For enhanced email features)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_REFRESH_TOKEN=your-google-refresh-token

# College Settings
COLLEGE_EMAIL_DOMAIN=your-college-domain.edu
ADMIN_EMAIL=admin@your-college-domain.edu
ADMIN_PASSWORD=secure-admin-password-123
```

💡 **Need help with credentials?** Check the detailed `CREDENTIALS-SETUP.md` guide!

### 4. **Start MongoDB**
```bash
# On Linux/Mac
sudo systemctl start mongod
# OR
mongod

# On Windows
net start MongoDB
```

### 5. **Initialize the Application**
```bash
# Initialize database and create admin user
node init.js
```

### 6. **Start the Development Server**
```bash
# Option 1: Development mode with auto-restart
npm run dev

# Option 2: Production mode
npm start

# Option 3: If port 3000 is busy, use different port
PORT=3001 npm start
```

### 7. **Access the Application**
🌐 **Open your browser and navigate to:**
- **Local:** http://localhost:3000
- **If using different port:** http://localhost:3001

## 🔑 Default Login Credentials

### Admin Account
- **Email:** The email you set as `ADMIN_EMAIL` in `.env`
- **Password:** The password you set as `ADMIN_PASSWORD` in `.env`
- **Role:** Administrator (Full Access)

### Test Accounts (Created by init.js)
- **Teacher:** teacher@test.edu / password123
- **Student:** student@test.edu / password123

## 🎯 First Steps After Login

### For Administrators:
1. **📊 Dashboard Overview**
   - Navigate to `/admin/dashboard`
   - Review system statistics and health

2. **🏫 Setup College Structure**
   - Go to **Admin → Classes**
   - Create departments and classes (e.g., "Computer Science - Semester 7")

3. **👥 User Management**
   - Navigate to **Admin → Users**
   - Add teachers and verify student registrations

4. **⚙️ System Configuration**
   - **Admin → Settings**: Configure election rules
   - **Admin → Backup**: Setup Google Drive integration

### For Teachers:
1. **🗳️ Create Elections**
   - Go to **Teacher Dashboard**
   - Click "Create New Election"
   - Set up candidates, voting dates, and rules

2. **📱 QR Code Management**
   - Generate QR codes for quick voting access
   - Configure voting time slots

### For Students:
1. **✅ Verify Email**
   - Check your email for verification link
   - Complete profile setup

2. **🗳️ Participate in Elections**
   - View available elections
   - Cast your votes securely

## 🛠️ Development Commands

```bash
# Development with auto-restart
npm run dev

# Production start
npm start

# Run tests (when available)
npm test

# Database initialization
node init.js

# Database backup
node scripts/backup.js

# Clear cache and reinstall
npm run clean-install
```

## 🔧 Troubleshooting

### 🚨 Common Issues & Solutions

#### Port Already in Use (EADDRINUSE)
```bash
# Kill existing processes
pkill -f "node server.js"
# OR use different port
PORT=3001 npm start
```

#### MongoDB Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# For MongoDB Atlas (cloud)
# Verify connection string in .env file
```

#### Email Not Sending
```bash
# Verify Gmail settings
# Enable 2FA and generate App Password
# Check CREDENTIALS-SETUP.md for detailed Gmail API setup
```

#### Permission Errors
```bash
# Fix npm permissions (Linux/Mac)
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
```

#### Module Not Found
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Additional Resources

### 📖 Documentation
- **`CREDENTIALS-SETUP.md`** - Complete credential configuration guide
- **`DEPLOYMENT.md`** - Production deployment instructions
- **`ENHANCEMENT-SUMMARY.md`** - Latest features and improvements
- **`README.md`** - Comprehensive project documentation

### 🔗 Useful Links
- **MongoDB Setup:** https://docs.mongodb.com/manual/installation/
- **Gmail API Setup:** https://developers.google.com/gmail/api/quickstart
- **Node.js Best Practices:** https://nodejs.org/en/docs/guides/

### 🆘 Need Help?

1. **Check Documentation:** Review the guides in the project root
2. **GitHub Issues:** Report bugs or request features
3. **Contact Developer:** Pranay Gajbhiye for technical support

## 🎉 Success Indicators

✅ **You're ready when you see:**
- Server running message in terminal
- "Connected to MongoDB" confirmation
- No error messages in console
- Application loads at http://localhost:3000
- Admin login works successfully

## 🚀 Next Steps

Once your system is running:

1. **🎨 Customize Branding**
   - Replace logo in `/public/images/`
   - Update college information
   - Customize color scheme in CSS

2. **🔒 Security Setup**
   - Change default passwords
   - Configure HTTPS for production
   - Set up proper email authentication

3. **📊 Configure Analytics**
   - Set up monitoring
   - Configure backup schedules
   - Review security logs

4. **🌐 Deploy to Production**
   - Follow `DEPLOYMENT.md` guide
   - Configure domain and SSL
   - Set up monitoring and alerts

---

**🎓 Welcome to the Modern College Election System!**
Your enhanced, secure, and user-friendly election platform is now ready to serve your educational institution.

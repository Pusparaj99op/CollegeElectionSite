# 🗳️ College Election Site - Complete Deployment Guide

**Created by:** Pranay Gajbhiye
**Date:** July 31, 2025

## 🎯 Two Deployment Options

### Option 1: Use Your PC as Server (Recommended for College Use)
### Option 2: Deploy on Your Domain (Professional Setup)

---

## 🖥️ Option 1: PC as Server Setup

This is perfect if you want to run the election system within your college network.

### Step 1: Quick Setup
```bash
# Navigate to your project directory
cd /home/pranay/Documents/GitHub/College-Election-Site

# Run the complete setup script
bash setup.sh
```

### Step 2: Configure Your Settings
Edit the `.env` file:
```bash
nano .env
```

Update these important values:
```env
# Your PC's IP address (find with: ip addr show)
BASE_URL=http://192.168.1.100:3000

# Your Gmail for sending emails
EMAIL_USER=pranay.gajbhiye@gmail.com
EMAIL_PASS=your-gmail-app-password

# Your college domain
COLLEGE_EMAIL_DOMAIN=yourcollege.edu

# Admin credentials (change these!)
ADMIN_EMAIL=pranay.gajbhiye@yourcollege.edu
ADMIN_PASSWORD=YourSecurePassword123
```

### Step 3: Get Gmail App Password
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Use this password in EMAIL_PASS

### Step 4: Start the System
```bash
# Initialize the database
node init.js

# Start the service
sudo systemctl start college-election

# Check if it's running
sudo systemctl status college-election
```

### Step 5: Access Your Election Site
- **Local Access:** http://localhost
- **Network Access:** http://YOUR_PC_IP (e.g., http://192.168.1.100)
- **Admin Login:** Use the credentials from your .env file

---

## 🌐 Option 2: Domain Deployment

If you have a domain and want professional hosting:

### Step 1: Server Setup
```bash
# Run the main setup
bash setup.sh

# Configure your domain
bash configure-domain.sh yourdomain.com
```

### Step 2: Update Environment
```bash
nano .env
```

Update for production:
```env
NODE_ENV=production
BASE_URL=https://yourdomain.com
# ... other settings
```

### Step 3: SSL Certificate
The script automatically gets SSL certificate using Let's Encrypt.

---

## 🚀 Quick Start Commands

```bash
# Check if everything is running
sudo systemctl status college-election
sudo systemctl status nginx
sudo systemctl status mongod

# View logs
sudo journalctl -u college-election -f

# Restart services if needed
sudo systemctl restart college-election
sudo systemctl restart nginx

# Check what's listening on ports
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80
```

---

## 📱 How Students Will Use It

### For Students:
1. Go to your website (http://your-pc-ip or https://yourdomain.com)
2. Click "Register"
3. Use college email and roll number
4. Verify email
5. Login and vote!

### For Teachers:
1. You create teacher accounts from admin panel
2. Teachers login and create elections
3. Add candidates with symbols and colors
4. Monitor voting progress

### For You (Admin):
1. Login with admin credentials
2. Manage users, classes, elections
3. Monitor system health
4. Create backups

---

## 🔧 Troubleshooting

### Site Not Loading?
```bash
# Check if the service is running
sudo systemctl status college-election

# Check nginx
sudo systemctl status nginx

# Check logs
sudo journalctl -u college-election -n 50
```

### Can't Send Emails?
1. Check Gmail app password
2. Verify EMAIL_USER and EMAIL_PASS in .env
3. Check firewall settings

### Database Issues?
```bash
# Check MongoDB
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

---

## 🔒 Security Checklist

- [ ] Changed default admin password
- [ ] Updated SESSION_SECRET
- [ ] Configured college email domain
- [ ] Set up firewall (done by setup script)
- [ ] SSL certificate (for domain deployment)
- [ ] Regular backups configured

---

## 📊 Features Included

✅ **User Management:** Students, Teachers, Admin roles
✅ **Email Verification:** College email domain restriction
✅ **Election Management:** Create elections with start/end times
✅ **Candidate System:** Symbols, colors, manifestos
✅ **Secure Voting:** One vote per student per election
✅ **Real-time Results:** Live vote counting
✅ **Mobile Responsive:** Works on all devices
✅ **System Monitoring:** Logs and analytics
✅ **Google Drive Backup:** Optional data backup

---

## 📞 Support

If you need help:
1. Check the logs: `sudo journalctl -u college-election -f`
2. Restart services: `sudo systemctl restart college-election`
3. Check this guide again
4. Contact: Pranay Gajbhiye

---

## 🎉 You're All Set!

Your college election system is now ready! Students can register, teachers can create elections, and you can monitor everything from the admin panel.

**Default Admin Access:**
- URL: http://your-pc-ip or https://yourdomain.com
- Email: From your .env file
- Password: From your .env file

**Happy Voting! 🗳️**

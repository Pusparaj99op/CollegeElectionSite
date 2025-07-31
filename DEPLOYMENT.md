# College Election Site - Deployment Guide

This guide will help you deploy the College Election Site on your server. Follow these steps carefully to ensure a successful deployment.

## Prerequisites

- Node.js (v14.x or higher)
- MongoDB (v4.x or higher)
- npm (v6.x or higher)
- Git
- A domain name (optional for production)
- SSL certificate (recommended for production)

## Step 1: Clone the Repository

```bash
git clone https://github.com/Pusparaj99op/College-Election-Site.git
cd College-Election-Site
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment Variables

1. Create a `.env` file from the example:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your specific configuration:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production  # Use 'development' for development environment
BASE_URL=https://your-domain.com  # Use your actual domain in production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/college_election

# Session Configuration
SESSION_SECRET=your-super-secure-random-string

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-college-email@gmail.com
EMAIL_PASS=your-app-specific-password
COLLEGE_EMAIL_DOMAIN=yourcollege.edu

# Google Drive API for backup
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
GOOGLE_REFRESH_TOKEN=your-google-refresh-token

# Admin Credentials (Initial Setup)
ADMIN_EMAIL=admin@yourcollege.edu
ADMIN_PASSWORD=secure-admin-password
```

## Step 4: Initialize the Application

Run the initialization script to set up the admin user and initial data:

```bash
node init.js
```

## Step 5: Setup Google Drive Backup (Optional)

To enable Google Drive backup functionality:

1. Go to the [Google Developer Console](https://console.developers.google.com/)
2. Create a new project
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials
5. Set up the consent screen
6. Get the refresh token using the authorization code

## Step 6: Start the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

For production deployment, it's recommended to use a process manager like PM2:

1. Install PM2 globally:

```bash
npm install -g pm2
```

2. Start the application with PM2:

```bash
pm2 start server.js --name college-election
```

3. Configure PM2 to start on system boot:

```bash
pm2 startup
pm2 save
```

## Step 7: Set Up a Reverse Proxy (Production)

For production, it's recommended to use Nginx as a reverse proxy:

1. Install Nginx:

```bash
sudo apt update
sudo apt install nginx
```

2. Create a new Nginx site configuration:

```
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

3. Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/your-config /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Set Up SSL with Let's Encrypt (Production)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 9: Regular Maintenance

1. Set up automated backups:

```bash
# Add to crontab
0 2 * * * cd /path/to/app && node scripts/backup.js >> /var/log/election-backup.log 2>&1
```

2. Update the application:

```bash
# Use the deploy script
./deploy.sh
```

## Troubleshooting

### Cannot Connect to MongoDB

1. Verify MongoDB is running:
```bash
sudo systemctl status mongodb
```

2. Check MongoDB connection string in `.env` file

### Email Not Sending

1. Check your email service credentials
2. Make sure you're using an app-specific password for Gmail
3. Check for any firewall blocking outgoing SMTP

### Google Drive Backup Fails

1. Verify your Google API credentials
2. Make sure the refresh token is valid
3. Check permissions on the Google Drive API

## Support

For issues and support, please contact Pranay Gajbhiye or open an issue in the GitHub repository.

#!/bin/bash

#
# College Election Site - Complete Setup Script
# Created by: Pranay Gajbhiye
# Date: July 31, 2025
#
# This script will set up the entire college election system
# Run with: bash setup.sh
#

echo "========================================="
echo "College Election Site - Complete Setup"
echo "Created by: Pranay Gajbhiye"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed successfully"
else
    print_success "Node.js is already installed"
fi

# Install MongoDB (if not installed)
if ! command -v mongod &> /dev/null; then
    print_status "Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
    print_success "MongoDB installed and started"
else
    print_success "MongoDB is already installed"
    sudo systemctl start mongod
fi

# Install PM2 (Process Manager)
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 is already installed"
fi

# Install Nginx (for reverse proxy)
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed and started"
else
    print_success "Nginx is already installed"
fi

# Install project dependencies
print_status "Installing project dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cp .env .env.backup 2>/dev/null || true
    cat > .env << EOL
# College Election System - Environment Variables
PORT=3000
NODE_ENV=production
BASE_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/college_election
SESSION_SECRET=college-election-secure-$(openssl rand -hex 32)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
COLLEGE_EMAIL_DOMAIN=yourcollege.edu
ADMIN_EMAIL=admin@yourcollege.edu
ADMIN_PASSWORD=Admin@College2025
VOTING_REMINDERS_ENABLED=true
RESULT_NOTIFICATION_ENABLED=true
BACKUP_FREQUENCY=daily
EOL
    print_success ".env file created"
    print_warning "Please edit the .env file with your actual values!"
else
    print_success ".env file already exists"
fi

# Initialize the application
print_status "Initializing the application..."
node init.js

# Create systemd service file
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/college-election.service > /dev/null << EOL
[Unit]
Description=College Election System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/college-election > /dev/null << EOL
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable the Nginx site
sudo ln -sf /etc/nginx/sites-available/college-election /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable college-election
sudo systemctl start college-election

# Create backup script
print_status "Creating backup script..."
mkdir -p scripts
cat > scripts/backup.js << EOL
const { createDataBackup } = require('../config/googleDrive');
const User = require('../models/User');
const Election = require('../models/Election');
const SystemLog = require('../models/SystemLog');

async function createBackup() {
    try {
        const users = await User.find({});
        const elections = await Election.find({}).populate('candidates');
        const logs = await SystemLog.find({}).limit(1000);

        const backupData = {
            timestamp: new Date(),
            users,
            elections,
            logs
        };

        const result = await createDataBackup(backupData);
        console.log('Backup created:', result);
    } catch (error) {
        console.error('Backup failed:', error);
    }
}

createBackup();
EOL

# Set up firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

print_success "========================================="
print_success "College Election Site Setup Complete!"
print_success "========================================="

echo ""
print_status "Next Steps:"
echo "1. Edit the .env file with your actual configuration"
echo "2. Configure your domain name (if you have one)"
echo "3. Set up SSL certificate (recommended for production)"
echo "4. Access your site at: http://localhost (or your domain)"
echo ""
print_status "Admin Login:"
echo "Email: admin@yourcollege.edu (change in .env)"
echo "Password: Admin@College2025 (change in .env)"
echo ""
print_status "Useful Commands:"
echo "sudo systemctl status college-election  # Check service status"
echo "sudo systemctl restart college-election # Restart the service"
echo "sudo systemctl logs college-election    # View logs"
echo "pm2 status                              # Check PM2 processes"
echo ""
print_warning "Remember to:"
echo "- Change default passwords in .env file"
echo "- Configure your college email domain"
echo "- Set up Google Drive backup (optional)"
echo "- Set up SSL certificate for production"

# Final check
if curl -f http://localhost > /dev/null 2>&1; then
    print_success "Site is accessible at http://localhost"
else
    print_warning "Site might not be running properly. Check the logs."
fi

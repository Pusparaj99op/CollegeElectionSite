#!/bin/bash
#
# Automatic Domain Deployment Script for anymovie.shop
# Purpose: Deploy College Election System to anymovie.shop domain
# Version: 1.0.0
# Last Modified: July 31, 2025
# Created By: Pranay Gajbhiye
#
# How to use:
# 1. Make the script executable: chmod +x auto-deploy.sh
# 2. Run the script: sudo ./auto-deploy.sh

# Exit on error
set -e

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
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo"
    exit 1
fi

echo "======================================================"
echo "      COLLEGE ELECTION SITE - DOMAIN DEPLOYMENT       "
echo "                  DOMAIN: anymovie.shop               "
echo "======================================================"

# Define domain settings
DOMAIN="anymovie.shop"
EMAIL="pranaygajbhiye2020@gmail.com"
PROJECT_DIR="/home/pranay/Documents/GitHub/College-Election-Site"

# Step 1: Install required packages
print_status "Installing required packages..."
apt update
apt install -y nginx certbot python3-certbot-nginx mongodb nodejs npm

# Step 2: Start MongoDB
print_status "Starting MongoDB service..."
systemctl start mongodb
systemctl enable mongodb

# Step 3: Install PM2 for process management
print_status "Installing PM2 globally..."
npm install -g pm2

# Step 4: Navigate to project directory
print_status "Navigating to project directory..."
cd "$PROJECT_DIR"

# Step 5: Install dependencies
print_status "Installing project dependencies..."
npm install --production

# Step 6: Update .env file
print_status "Updating environment configuration..."
sed -i "s|BASE_URL=.*|BASE_URL=https://$DOMAIN|g" .env
sed -i "s|GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=https://$DOMAIN/auth/google/callback|g" .env
print_success "Updated .env file with domain $DOMAIN"

# Step 7: Initialize the application
print_status "Initializing the application..."
node init.js

# Step 8: Create Nginx configuration
print_status "Configuring Nginx for $DOMAIN..."
cat > /etc/nginx/sites-available/college-election << EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

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

# Step 9: Enable the site and disable default
print_status "Enabling site in Nginx..."
ln -sf /etc/nginx/sites-available/college-election /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Step 10: Set up SSL with Certbot (will modify the Nginx config automatically)
print_status "Setting up SSL certificate with Let's Encrypt..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

# Step 11: Create systemd service
print_status "Creating systemd service for the application..."
cat > /etc/systemd/system/college-election.service << EOL
[Unit]
Description=College Election System
After=network.target mongodb.service

[Service]
Type=simple
User=pranay
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Step 12: Enable and start the service
print_status "Starting the application service..."
systemctl daemon-reload
systemctl enable college-election
systemctl start college-election

# Step 13: Set up automatic renewal for SSL
print_status "Setting up automatic SSL certificate renewal..."
echo "0 3 * * * certbot renew --quiet" | crontab -

# Step 14: Set up automatic backups
print_status "Setting up automatic database backups..."
mkdir -p "$PROJECT_DIR/backups"
cat > /etc/cron.daily/college-election-backup << EOL
#!/bin/bash
DATE=\$(date +%Y-%m-%d)
cd $PROJECT_DIR
node scripts/backup.js >> /var/log/college-election-backup.log 2>&1
EOL
chmod +x /etc/cron.daily/college-election-backup

print_success "======================================================"
print_success "      DEPLOYMENT COMPLETE! Site is now LIVE at:       "
print_success "          https://$DOMAIN                 "
print_success "======================================================"
print_status "Admin Login:"
print_status "- URL: https://$DOMAIN/auth/login"
print_status "- Email: $EMAIL"
print_status "- Password: Check your .env file"
print_status ""
print_status "Important commands:"
print_status "- View logs: sudo journalctl -u college-election -f"
print_status "- Restart app: sudo systemctl restart college-election"
print_status "- Check status: sudo systemctl status college-election"
print_status ""
print_warning "NEXT STEPS:"
print_warning "1. Update your domain DNS to point to this server's IP"
print_warning "   Current nameservers: ns1.dns-parking.com, ns2.dns-parking.com"
print_warning "2. Ensure port 80 and 443 are open in your firewall/router"
print_warning "3. Get Gmail app password and update in .env file"
print_warning "4. Change default admin password after first login"
print_warning ""
print_status "Happy voting! 🗳️"

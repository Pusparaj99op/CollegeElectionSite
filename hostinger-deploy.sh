#!/bin/bash

#
# Hostinger Deployment Script for College Election Site
# Purpose: Deploy anymovie.shop to Hostinger shared hosting
# Version: 1.0.0
# Last Modified: July 31, 2025
# Created By: GitHub Copilot
#
# How to use:
# 1. Make the script executable: chmod +x hostinger-deploy.sh
# 2. Run the script: ./hostinger-deploy.sh
#

# Configuration
DOMAIN="anymovie.shop"
HOSTINGER_USER="u123456789"  # Replace with your Hostinger username
HOSTINGER_SERVER="server123.hostinger.com"  # Replace with your Hostinger server
APP_DIR="/home/pranay/Documents/GitHub/College-Election-Site"
REMOTE_DIR="/home/$HOSTINGER_USER/public_html"

echo "========================================="
echo "Deploying College Election Site to Hostinger"
echo "Domain: $DOMAIN"
echo "========================================="

# Check if SSH key is set up
echo "Checking SSH access..."
if ! ssh -q $HOSTINGER_USER@$HOSTINGER_SERVER exit; then
    echo "SSH connection failed. Please set up SSH key access to your Hostinger account first."
    echo "See: https://support.hostinger.com/en/articles/4455931-how-to-generate-and-use-ssh-keys"
    exit 1
fi

# Install required packages on Hostinger server
echo "Installing required software on remote server..."
ssh $HOSTINGER_USER@$HOSTINGER_SERVER "
    mkdir -p $REMOTE_DIR/tmp;
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh > $REMOTE_DIR/tmp/nvm-install.sh;
    bash $REMOTE_DIR/tmp/nvm-install.sh;
    source ~/.nvm/nvm.sh;
    nvm install 20;
    npm install -g pm2;
    echo 'PATH=\$PATH:~/.nvm/versions/node/*/bin' >> ~/.bashrc;
"

# Prepare application for deployment
echo "Preparing application for deployment..."
cd $APP_DIR

# Create production build directory
mkdir -p ./dist
cp -R controllers config middlewares models public routes scripts views ./dist/
cp package.json package-lock.json server.js .env ./dist/

# Remove development dependencies for smaller package
cd ./dist
npm install --production

# Create the ecosystem.config.js for PM2
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: "college-election",
    script: "server.js",
    env: {
      NODE_ENV: "production",
    },
    instances: "1",
    exec_mode: "cluster",
    max_memory_restart: "256M"
  }]
}
EOL

# Create .htaccess for proper routing
cat > public/.htaccess << EOL
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>
EOL

# Create a zip file for deployment
cd ..
zip -r college-election.zip dist/

# Deploy to Hostinger
echo "Deploying to Hostinger..."
scp college-election.zip $HOSTINGER_USER@$HOSTINGER_SERVER:$REMOTE_DIR/

# Extract and set up on the server
ssh $HOSTINGER_USER@$HOSTINGER_SERVER "
    cd $REMOTE_DIR;
    unzip -o college-election.zip;
    rm college-election.zip;
    cd dist;
    source ~/.nvm/nvm.sh;
    pm2 stop college-election || true;
    pm2 start ecosystem.config.js;
    pm2 save;

    # Create a simple PHP index file to proxy requests to Node.js
    echo '<?php
    header(\"Location: /\");
    ?>' > $REMOTE_DIR/index.php;

    # Set up proper permissions
    chmod -R 755 $REMOTE_DIR;
"

echo "========================================="
echo "Deployment complete!"
echo "Your application should now be accessible at https://$DOMAIN"
echo "========================================="
echo ""
echo "IMPORTANT: Make sure to:"
echo "1. Set up your DNS records in Hostinger control panel"
echo "2. Configure SSL certificate for your domain"
echo "3. Update your database connection if needed"
echo "========================================="

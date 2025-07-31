#!/bin/bash

#
# Domain Configuration Script for College Election Site
# Purpose: Configure anymovie.shop for College Election System
# Version: 1.0.0
# Last Modified: July 31, 2025
# Created By: Pranay Gajbhiye
#
# How to use:
# 1. Make the script executable: chmod +x configure-domain.sh
# 2. Run the script: ./configure-domain.sh

# Use fixed domain and email for automatic configuration
DOMAIN="anymovie.shop"
EMAIL="pranaygajbhiye2020@gmail.com"

echo "Configuring domain: $DOMAIN"

# Update .env file
if [ -f .env ]; then
    sed -i "s|BASE_URL=.*|BASE_URL=https://$DOMAIN|g" .env
    sed -i "s|GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=https://$DOMAIN/auth/google/callback|g" .env
    echo "Updated .env file with domain $DOMAIN"
fi

# Update Nginx configuration
sudo tee /etc/nginx/sites-available/college-election > /dev/null << EOL
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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

# Install Certbot and get SSL certificate
sudo apt install -y certbot python3-certbot-nginx

echo "Getting SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Test Nginx configuration and reload
sudo nginx -t && sudo systemctl reload nginx

# Restart the application
sudo systemctl restart college-election

echo "Domain configuration completed!"
echo "Your site should now be accessible at: https://$DOMAIN"

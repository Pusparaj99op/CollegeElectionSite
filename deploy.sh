#!/bin/bash
#
# Deployment Script for College Election Site
# Purpose: Automate the deployment process
# Version: 1.0.0
# Last Modified: July 31, 2025
# Created By: Pranay Gajbhiye
#
# How to use:
# 1. Make the script executable: chmod +x deploy.sh
# 2. Run the script: ./deploy.sh

# Exit on error
set -e

echo "========================================="
echo "College Election Site Deployment Script"
echo "========================================="

# Update repository
echo "Updating repository..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please update the .env file with your configuration values!"
fi

# Build assets if needed
echo "Building assets..."
# Uncomment if you have a build step
# npm run build

# Initialize the application
echo "Initializing application..."
node init.js

# Restart the application (if using PM2)
if command -v pm2 &> /dev/null; then
    echo "Restarting application with PM2..."
    pm2 restart college-election || pm2 start server.js --name college-election
else
    echo "PM2 not found. Consider installing PM2 for production deployment:"
    echo "npm install -g pm2"
    echo "Then start the application with: pm2 start server.js --name college-election"
fi

echo "========================================="
echo "Deployment completed!"
echo "========================================="

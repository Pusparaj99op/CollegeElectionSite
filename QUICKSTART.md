# Getting Started with College Election Site

This quick start guide will help you get the College Election System up and running on your local machine.

## Prerequisites

- Node.js (v14.x or higher)
- MongoDB (v4.x or higher)
- npm (v6.x or higher)

## Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Pusparaj99op/College-Election-Site.git
   cd College-Election-Site
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit the .env file with your specific configuration
   ```

4. **Initialize the application:**
   ```bash
   node init.js
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

## Default Admin Credentials

- **Email:** The email you set in your `.env` file as `ADMIN_EMAIL`
- **Password:** The password you set in your `.env` file as `ADMIN_PASSWORD`

## First Steps

1. Log in with the admin credentials
2. Create classes for your college
3. Set up teacher accounts
4. Configure Google Drive backup
5. Create your first election

## Need Help?

Refer to the `DEPLOYMENT.md` file for detailed deployment instructions or contact Pranay Gajbhiye for assistance.

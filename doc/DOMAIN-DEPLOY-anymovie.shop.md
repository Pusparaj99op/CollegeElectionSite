# Deploying College Election Site to anymovie.shop

**Created by:** Pranay Gajbhiye
**Domain:** anymovie.shop
**Date:** July 31, 2025

## Domain Configuration Steps

### Step 1: Update DNS Settings

First, you need to point your domain to your server:

1. Log in to your domain registrar account
2. Navigate to the DNS settings for anymovie.shop
3. Change the nameservers from:
   - ns1.dns-parking.com
   - ns2.dns-parking.com

   To your hosting provider's nameservers (or use A records to point directly to your server IP)

4. If using A records:
   - Create an A record for @ pointing to your server IP
   - Create an A record for www pointing to your server IP

### Step 2: Server Setup

On your Linux server:

```bash
# Clone the repository
git clone https://github.com/Pusparaj99op/College-Election-Site.git
cd College-Election-Site

# Make the auto-deploy script executable
chmod +x auto-deploy.sh

# Run the automated deployment script
sudo ./auto-deploy.sh
```

This will:
- Install all required software (Nginx, MongoDB, Node.js, etc.)
- Configure your domain
- Set up SSL certificates
- Start the application
- Configure auto-renewal of SSL certificates

### Step 3: Gmail App Password Setup

To enable email sending:

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security > 2-Step Verification
3. At the bottom, click on "App passwords"
4. Create a new app password for "Mail"
5. Copy the generated 16-character password
6. Edit your .env file:
   ```bash
   nano .env
   ```
7. Update the EMAIL_PASS value with your app password
8. Save and exit (Ctrl+X, then Y, then Enter)
9. Restart the application:
   ```bash
   sudo systemctl restart college-election
   ```

### Step 4: First Login

1. Visit https://anymovie.shop/auth/login
2. Log in with:
   - Email: pranaygajbhiye2020@gmail.com
   - Password: Pranay@College2025
3. Immediately change your password in the admin panel

### Maintenance Commands

```bash
# View application logs
sudo journalctl -u college-election -f

# Restart the application
sudo systemctl restart college-election

# Check status
sudo systemctl status college-election

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Troubleshooting

**Site not loading?**
1. Check if the domain DNS propagation is complete:
   ```bash
   nslookup anymovie.shop
   ```

2. Verify the services are running:
   ```bash
   sudo systemctl status nginx
   sudo systemctl status mongodb
   sudo systemctl status college-election
   ```

3. Check firewall settings:
   ```bash
   sudo ufw status
   ```

**Email not working?**
1. Verify Gmail app password is correct
2. Check logs for email errors:
   ```bash
   sudo journalctl -u college-election -f | grep email
   ```

**Need to restart everything?**
```bash
sudo systemctl restart nginx mongodb college-election
```

### Need Help?

If you need assistance with your deployment, feel free to reach out!

**Contact:**
- Email: pranaygajbhiye2020@gmail.com
- Phone: +91 9067463863

Remember to regularly back up your data and keep your system updated.

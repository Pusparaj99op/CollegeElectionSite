# College Election Site

A comprehensive web-based voting platform for college elections developed by Pranay Gajbhiye.

## Features

- **User Authentication**: Separate login for students, teachers, and administrators
- **Email Verification**: Secure registration with college email domain verification
- **Multiple Election Types**: Support for Class Representative (CR), Batch Representative (BR), and other elections
- **Candidate Management**: Teachers can add and manage election candidates
- **Secure Voting**: Students can only vote once per election with their college email ID and roll number
- **Visual Identity**: Candidates can select symbols and colors for better recognition
- **Real-time Results**: View vote counts and winners after election completion
- **Data Backup**: Automatic backup to Google Drive
- **Mobile Responsive**: Works on all devices for easy access
- **Admin Dashboard**: Monitor system health, performance, and user activity

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, EJS templates
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Session-based with password encryption
- **Email Service**: Nodemailer with Gmail
- **Backup**: Google Drive API integration

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Pusparaj99op/College-Election-Site.git
   cd College-Election-Site
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration values.

5. Start the application:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## User Types

### Admin
- Create and manage teacher accounts
- Monitor all elections and system health
- Access system logs and statistics
- Manage database backups

### Teacher (Class In-charge)
- Create and manage elections for their class
- Add and approve candidates
- View voting statistics and results
- Generate reports

### Student
- Register with college email and roll number
- View upcoming and ongoing elections
- Cast votes for candidates
- View election results after completion

## Directory Structure

```
├── config/           # Configuration files
├── controllers/      # Business logic
├── middlewares/      # Custom middlewares
├── models/           # Database models
├── public/           # Static assets (CSS, JS, images)
├── routes/           # API routes
├── uploads/          # Uploaded files
├── views/            # EJS templates
└── server.js         # Main application entry point
```

## API Documentation

The application includes the following main API routes:

- `/auth` - Authentication routes (login, register, etc.)
- `/admin` - Admin dashboard and management routes
- `/teacher` - Teacher specific routes
- `/student` - Student dashboard and voting routes
- `/election` - Election management and voting routes

## License

MIT License

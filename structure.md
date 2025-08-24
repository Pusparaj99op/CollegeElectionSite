# College Election Site - Website Structure

## Project Overview
A modern college election management system built with Node.js, Express, MongoDB, and EJS templates.

## Directory Structure

```
College-Election-Site/
├── server.js                    # Main server file - Entry point
├── package.json                 # Dependencies and scripts
├── .env                        # Environment variables
├── README.md                   # Project documentation
├──
├── config/                     # Configuration files
│   ├── database.js            # MongoDB connection config
│   ├── googleDrive.js         # Google Drive API config
│   ├── hostinger.js           # Hostinger deployment config
│   └── mailer.js              # Email configuration
│
├── controllers/               # Business logic controllers
│   ├── adminController.js     # Admin dashboard logic
│   ├── authController.js      # Authentication logic
│   ├── electionController.js  # Election management
│   ├── publicVotingController.js # Public voting logic
│   ├── studentController.js   # Student dashboard logic
│   └── teacherController.js   # Teacher dashboard logic
│
├── middlewares/              # Express middlewares
│   ├── auth.js              # Authentication middleware
│   └── error.js             # Error handling middleware
│
├── models/                  # MongoDB/Mongoose models
│   ├── Candidate.js         # Candidate schema
│   ├── Class.js            # Class/Department schema
│   ├── Election.js         # Election schema
│   ├── SystemLog.js        # System logging schema
│   └── User.js             # User schema (admin/teacher/student)
│
├── routes/                  # Express route definitions
│   ├── admin.js            # Admin routes
│   ├── auth.js             # Authentication routes
│   ├── election.js         # Election management routes
│   ├── qr.js               # QR code routes
│   ├── student.js          # Student routes
│   ├── teacher.js          # Teacher routes
│   └── vote.js             # Voting routes
│
├── views/                   # EJS template files
│   ├── layout.ejs          # Main layout template
│   ├── index.ejs           # Homepage template
│   ├── error.ejs           # Error page template
│   │
│   ├── admin/              # Admin panel views
│   │   └── dashboard.ejs   # Admin dashboard
│   │
│   ├── auth/               # Authentication views
│   │   ├── login.ejs       # Login page
│   │   ├── register.ejs    # Registration page
│   │   ├── verify-email.ejs # Email verification
│   │   └── forgot-password.ejs # Password reset
│   │
│   ├── election/           # Election views
│   │   ├── index.ejs       # Election homepage
│   │   └── list.ejs        # Election list
│   │
│   ├── partials/           # Reusable template components
│   │   ├── header.ejs      # Header component
│   │   ├── footer.ejs      # Footer component
│   │   ├── navbar.ejs      # Navigation bar
│   │   ├── messages.ejs    # Flash messages
│   │   ├── qr-management.ejs # QR code component
│   │   └── teacher-sidebar.ejs # Teacher sidebar
│   │
│   ├── student/            # Student views
│   │   └── dashboard.ejs   # Student dashboard
│   │
│   ├── teacher/            # Teacher views
│   │   ├── dashboard.ejs   # Teacher dashboard
│   │   └── elections.ejs   # Teacher elections view
│   │
│   └── vote/               # Voting views
│       ├── public.ejs      # Public voting interface
│       ├── success.ejs     # Vote success page
│       └── not-available.ejs # Voting not available
│
├── public/                  # Static assets
│   ├── manifest.json       # PWA manifest
│   ├── sw.js              # Service worker
│   ├── css/               # Stylesheets
│   │   ├── style.css      # Main stylesheet
│   │   └── additional-styles.css # Additional styles
│   ├── js/                # Client-side JavaScript
│   │   └── main.js        # Main JS file
│   └── images/            # Image assets
│       ├── favicon.png    # Favicon
│       └── logo.png       # Site logo
│
├── scripts/               # Utility scripts
│   ├── backup.js         # Database backup script
│   └── port-manager.js   # Port management utility
│
├── uploads/              # File upload directory
│   ├── favicon-32x32.png # Uploaded favicon
│   ├── logo.png         # Uploaded logo
│   └── README.md        # Upload directory info
│
└── deployment/           # Deployment related files
    ├── auto-deploy.sh    # Automatic deployment script
    ├── check-domain.sh   # Domain verification script
    ├── configure-domain.sh # Domain configuration
    ├── deploy.sh         # Main deployment script
    ├── hostinger-deploy.sh # Hostinger specific deployment
    ├── init-db.js        # Database initialization
    ├── init.js           # Application initialization
    ├── setup.sh          # Setup script
    └── start-dev.sh      # Development server start
```

## Key Routes and URLs

### Authentication Routes (`/auth`)
- `GET /auth/login` - Login page
- `POST /auth/login` - Process login
- `GET /auth/register` - Registration page
- `POST /auth/register` - Process registration
- `GET /auth/logout` - Logout user
- `GET /auth/verify/:token` - Email verification
- `GET /auth/forgot-password` - Password reset page

### Admin Routes (`/admin`)
- `GET /admin/dashboard` - Admin dashboard
- Protected by `isAdmin` middleware

### Teacher Routes (`/teacher`)
- `GET /teacher/dashboard` - Teacher dashboard
- `GET /teacher/elections` - Manage elections
- Protected by `isTeacher` middleware

### Student Routes (`/student`)
- `GET /student/dashboard` - Student dashboard
- Protected by `isAuthenticated` middleware

### Election Routes (`/election`)
- `GET /election` - Election homepage
- `GET /election/list` - List all elections

### Voting Routes (`/vote`)
- `GET /vote/public` - Public voting interface
- `POST /vote/submit` - Submit vote

## Database Models

### User Model
- Handles admin, teacher, and student accounts
- Fields: name, email, password, role, isVerified, active, etc.

### Election Model
- Manages election data
- Fields: title, description, startDate, endDate, status, etc.

### Candidate Model
- Stores candidate information
- Fields: name, position, description, election reference

### Class Model
- Manages class/department data
- Fields: name, department, year, section

## Authentication Flow
1. User submits login form at `/auth/login`
2. `authController.login` processes credentials
3. Password verification using bcrypt
4. Session creation with user data
5. Redirect to appropriate dashboard based on role

## Current Login Credentials
- **Admin**: pranaykgajbhiye.cse24f@kdkce.edu.in / Pranay@College2025
- **Teacher**: teacher@kdkce.edu.in / Teacher@2025
- **Student**: student01@kdkce.edu.in / Student@2025

## Server Configuration
- Default Port: 3000 (fallback to 3001)
- Database: MongoDB (mongodb://localhost:27017/college_election)
- Session Store: MongoDB with 14-day expiry
- View Engine: EJS with express-ejs-layouts

## Security Features
- Helmet.js for security headers
- bcrypt for password hashing
- Session-based authentication
- CSRF protection
- Input validation and sanitization

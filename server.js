/**
 * College Election Site - Main Server File
 * Purpose: Entry point for the college election web application
 * Version: 1.0.1
 * Last Modified: August 1, 2025
 *
 * How to run:
 * 1. Install dependencies with 'npm install'
 * 2. Create a .env file with required configurations
 * 3. Start the server with 'npm start' or 'npm run dev' for development
 *
 * Port conflict resolution:
 * - The server will automatically resolve port conflicts
 * - Default port is 3000, fallback to 3001 if needed
 * - Use PORT environment variable to specify a custom port
 */

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const electionRoutes = require('./routes/election');
const voteRoutes = require('./routes/vote');
const qrRoutes = require('./routes/qr');

// Load environment variables
dotenv.config();

// Import port manager for handling port conflicts
const { managePort } = require('./scripts/port-manager');

// Initialize express app
const app = express();

// We'll set the port after port management
let PORT = process.env.PORT || 3000;

// Load Hostinger configuration if in production
let hostingerConfig = {};
if (process.env.NODE_ENV === 'production') {
  try {
    hostingerConfig = require('./config/hostinger');
    console.log('Loaded Hostinger configuration');
  } catch (err) {
    console.log('Hostinger configuration not found, using default settings');
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI,
  hostingerConfig.database ? hostingerConfig.database.options : {})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://code.jquery.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
    },
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Setup session
app.use(session({
  secret: process.env.SESSION_SECRET || 'college-election-secure-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native'
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Flash messages
app.use(flash());

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Global middleware for all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.user = req.session.user || null; // Add user variable for templates
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.info = req.flash('info');
  next();
});

// Simple test route
app.get('/test', (req, res) => {
  res.send('Hello World! The server is working.');
});

// Simple home route
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    user: null,
    error: null,
    success: null,
    info: null
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/teacher', teacherRoutes);
app.use('/student', studentRoutes);
app.use('/election', electionRoutes);
app.use('/vote', voteRoutes);
app.use('/qr', qrRoutes);

// Root route
app.get('/', (req, res) => {
  res.render('index');
});

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.render('error', {
    title: 'Error',
    message: error.message,
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

// Initialize port management before starting server
async function startServer() {
  try {
    // Ensure we have a free port before starting
    await managePort();
    PORT = process.env.PORT || 3000;

    // Start the server with graceful shutdown support
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Store the server instance for graceful shutdown
    app.set('server', server);

    // Handle graceful shutdown for nodemon restarts
    process.once('SIGUSR2', () => {
      console.log('Nodemon restart signal received. Gracefully shutting down...');
      server.close(() => {
        console.log('Server shut down successfully');
        process.kill(process.pid, 'SIGUSR2');
      });
    });

    // Handle normal termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server shut down successfully');
        process.exit(0);
      });
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('SIGINT signal received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server shut down successfully');
        process.exit(0);
      });
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;

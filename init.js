/**
 * Initialize Application Script
 * Purpose: Set up initial admin user and basic configurations
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 * Created By: Pranay Gajbhiye
 *
 * How to run:
 * 1. Make sure MongoDB is running
 * 2. Set up your .env file
 * 3. Run with: node init.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const SystemLog = require('./models/SystemLog');
const Class = require('./models/Class');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for initialization'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

/**
 * Initialize application with basic setup
 */
async function initializeApp() {
  try {
    console.log('Starting application initialization...');

    // 1. Create admin user if doesn't exist
    await createAdminUser();

    // 2. Create sample classes
    await createSampleClasses();

    // 3. Log initialization
    await SystemLog.createLog({
      action: 'admin_action',
      details: { action: 'System initialization completed' },
      status: 'success'
    });

    console.log('Application initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

/**
 * Create admin user if doesn't exist
 */
async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not found in environment variables');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping creation.');
      return;
    }

    // Create new admin user
    const adminUser = new User({
      name: 'Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isVerified: true
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

/**
 * Create sample classes
 */
async function createSampleClasses() {
  try {
    const classCount = await Class.countDocuments();

    if (classCount > 0) {
      console.log('Classes already exist, skipping creation.');
      return;
    }

    // Create sample classes
    const sampleClasses = [
      {
        name: 'CSE-2025-A',
        department: 'Computer Science & Engineering',
        year: 2025,
        section: 'A',
        active: true
      },
      {
        name: 'CSE-2025-B',
        department: 'Computer Science & Engineering',
        year: 2025,
        section: 'B',
        active: true
      },
      {
        name: 'ECE-2025-A',
        department: 'Electronics & Communication',
        year: 2025,
        section: 'A',
        active: true
      },
      {
        name: 'ME-2025-A',
        department: 'Mechanical Engineering',
        year: 2025,
        section: 'A',
        active: true
      }
    ];

    await Class.insertMany(sampleClasses);
    console.log('Sample classes created successfully!');
  } catch (error) {
    console.error('Error creating sample classes:', error);
    throw error;
  }
}

// Run initialization
initializeApp();

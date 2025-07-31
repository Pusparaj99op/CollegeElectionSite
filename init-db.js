/**
 * Database Initialization Script
 * Purpose: Initialize the database with required data for College Election Site
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 *
 * How to run: node init.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Class = require('./models/Class');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');

    // Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Pranay@College2025', 10);
    const admin = await User.create({
      name: 'Pranay Gajbhiye',
      email: process.env.ADMIN_EMAIL || 'pranaygajbhiye2020@gmail.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      active: true
    });
    console.log('✅ Admin user created:', admin.email);

    // Create Sample Classes
    console.log('🏫 Creating sample classes...');
    const classes = await Class.insertMany([
      {
        name: 'Computer Science A',
        department: 'Computer Science',
        year: 2021,
        section: 'A',
        active: true
      },
      {
        name: 'Computer Science B',
        department: 'Computer Science',
        year: 2021,
        section: 'B',
        active: true
      },
      {
        name: 'Information Technology',
        department: 'Information Technology',
        year: 2021,
        section: 'A',
        active: true
      },
      {
        name: 'Electronics Engineering',
        department: 'Electronics',
        year: 2021,
        section: 'A',
        active: true
      }
    ]);
    console.log('✅ Sample classes created:', classes.length);

    // Create Teacher User
    console.log('👨‍🏫 Creating teacher user...');
    const teacherPassword = await bcrypt.hash('Teacher@2025', 10);
    const teacher = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'teacher@kdkce.edu.in',
      password: teacherPassword,
      role: 'teacher',
      isVerified: true,
      active: true,
      class: classes[0]._id
    });
    console.log('✅ Teacher user created:', teacher.email);

    // Create Sample Students
    console.log('👨‍🎓 Creating sample students...');
    const studentPassword = await bcrypt.hash('Student@2025', 10);
    const students = [];

    for (let i = 1; i <= 20; i++) {
      const student = await User.create({
        name: `Student ${i.toString().padStart(2, '0')}`,
        email: `student${i.toString().padStart(2, '0')}@kdkce.edu.in`,
        password: studentPassword,
        role: 'student',
        isVerified: true,
        active: true,
        rollNumber: `CS2021${i.toString().padStart(3, '0')}`,
        class: classes[i % 4]._id
      });
      students.push(student);
    }
    console.log('✅ Sample students created:', students.length);

    // Create Sample Election (create first, then candidates)
    console.log('🗳️ Creating sample election...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(17, 0, 0, 0);

    const election = await Election.create({
      title: 'Class Representative Election - CS A',
      description: 'Election for Class Representative of Computer Science A, Year 2021. Students can vote for their preferred candidate.',
      electionType: 'CR',
      class: classes[0]._id,
      startDate: tomorrow,
      endDate: dayAfterTomorrow,
      candidates: [],
      status: 'active',
      createdBy: teacher._id,
      qrCode: {
        accessToken: require('crypto').randomBytes(32).toString('hex'),
        isEnabled: true
      },
      publicAccess: {
        allowAnonymousVoting: true,
        requireRollNumber: true,
        votingTimeSlots: []
      },
      votes: [],
      anonymousVotes: []
    });
    console.log('✅ Sample election created:', election.title);

    // Create Sample Candidates (first 4 students from CS A)
    console.log('🗳️ Creating sample candidates...');
    const candidates = [];
    const symbols = ['star', 'circle', 'square', 'triangle'];
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

    for (let i = 0; i < 4; i++) {
      if (students[i].class.toString() === classes[0]._id.toString()) {
        const candidate = await Candidate.create({
          student: students[i]._id,
          election: election._id,
          symbol: symbols[i],
          color: colors[i],
          manifesto: `I am ${students[i].name} and I promise to work for the betterment of our class. Vote for change, vote for progress!`,
          approved: true
        });
        candidates.push(candidate);
      }
    }
    console.log('✅ Sample candidates created:', candidates.length);

    // Update election with candidates
    election.candidates = candidates.map(c => c._id);
    await election.save();

    console.log('🎉 Database initialization completed successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('👤 Admin:', process.env.ADMIN_EMAIL || 'pranaygajbhiye2020@gmail.com', '/', process.env.ADMIN_PASSWORD || 'Pranay@College2025');
    console.log('👨‍🏫 Teacher: teacher@kdkce.edu.in / Teacher@2025');
    console.log('👨‍🎓 Student: student01@kdkce.edu.in / Student@2025');
    console.log('');
    console.log('🔗 Access URLs:');
    console.log('🏠 Home:', process.env.BASE_URL || 'http://localhost:3000');
    console.log('🔑 Login:', (process.env.BASE_URL || 'http://localhost:3000') + '/auth/login');
    console.log('🗳️ Public Vote:', (process.env.BASE_URL || 'http://localhost:3000') + '/vote/' + election.qrCode.accessToken);

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

// Run initialization
initializeDatabase();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixAllPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('./models/User');

    // Fix admin password
    const adminPassword = 'Pranay@College2025';
    const adminSalt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash(adminPassword, adminSalt);

    await User.updateOne(
      { email: 'pranaykgajbhiye.cse24f@kdkce.edu.in' },
      { password: adminHash }
    );
    console.log('Admin password updated');

    // Fix teacher password
    const teacherPassword = 'Teacher@2025';
    const teacherSalt = await bcrypt.genSalt(10);
    const teacherHash = await bcrypt.hash(teacherPassword, teacherSalt);

    await User.updateOne(
      { email: 'teacher@kdkce.edu.in' },
      { password: teacherHash }
    );
    console.log('Teacher password updated');

    // Fix student password
    const studentPassword = 'Student@2025';
    const studentSalt = await bcrypt.genSalt(10);
    const studentHash = await bcrypt.hash(studentPassword, studentSalt);

    await User.updateOne(
      { email: 'student01@kdkce.edu.in' },
      { password: studentHash }
    );
    console.log('Student password updated');

    await mongoose.disconnect();
    console.log('All passwords fixed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAllPasswords();

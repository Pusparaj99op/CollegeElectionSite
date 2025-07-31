/**
 * Admin Controller
 * Purpose: Handles admin-specific functionalities
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const User = require('../models/User');
const Class = require('../models/Class');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const SystemLog = require('../models/SystemLog');
const googleDrive = require('../config/googleDrive');
const { asyncHandler } = require('../middlewares/error');

/**
 * Render admin dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  // Get statistics for dashboard
  const stats = {
    totalStudents: await User.countDocuments({ role: 'student' }),
    totalTeachers: await User.countDocuments({ role: 'teacher' }),
    totalClasses: await Class.countDocuments({}),
    activeElections: await Election.countDocuments({ status: 'active' }),
    pendingElections: await Election.countDocuments({ status: 'pending' }),
    completedElections: await Election.countDocuments({ status: 'completed' })
  };

  // Get recent system logs
  const recentLogs = await SystemLog.getRecentLogs(10);

  // Get active elections
  const activeElections = await Election.find({ status: 'active' })
    .populate('class', 'name department year section')
    .populate('createdBy', 'name email')
    .sort({ startDate: 1 })
    .limit(5);

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    user: req.session.user,
    stats,
    recentLogs,
    activeElections
  });
});

/**
 * Render user management page
 */
const getUserManagement = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 10 } = req.query;

  // Build query
  const query = {};
  if (role && ['admin', 'teacher', 'student'].includes(role)) {
    query.role = role;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } }
    ];
  }

  // Count total documents
  const totalUsers = await User.countDocuments(query);

  // Calculate pagination
  const totalPages = Math.ceil(totalUsers / limit);
  const skip = (page - 1) * limit;

  // Get users with pagination
  const users = await User.find(query)
    .populate('class', 'name department year section')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.render('admin/users', {
    title: 'User Management',
    user: req.session.user,
    users,
    currentPage: page,
    totalPages,
    totalUsers,
    role,
    search
  });
});

/**
 * Render user edit page
 */
const getUserEdit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find user
  const userToEdit = await User.findById(id)
    .populate('class', 'name department year section');

  if (!userToEdit) {
    req.flash('error', 'User not found');
    return res.redirect('/admin/users');
  }

  // Get all classes for select dropdown
  const classes = await Class.find({ active: true }).sort({ name: 1 });

  res.render('admin/user-edit', {
    title: 'Edit User',
    user: req.session.user,
    userToEdit,
    classes
  });
});

/**
 * Update user
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, active, rollNumber, classId } = req.body;

  // Find user
  const userToUpdate = await User.findById(id);

  if (!userToUpdate) {
    req.flash('error', 'User not found');
    return res.redirect('/admin/users');
  }

  // Check if email is changed and new email is already taken
  if (email !== userToUpdate.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email is already taken');
      return res.redirect(`/admin/users/${id}/edit`);
    }
  }

  // Update user data
  userToUpdate.name = name;
  userToUpdate.email = email;
  userToUpdate.role = role;
  userToUpdate.active = active === 'true';

  // Update role-specific fields
  if (role === 'student') {
    userToUpdate.rollNumber = rollNumber;
    userToUpdate.class = classId;
  }

  await userToUpdate.save();

  // Log user update
  await SystemLog.createLog({
    action: 'admin_action',
    user: req.session.user._id,
    details: {
      actionType: 'user_update',
      userId: userToUpdate._id,
      changes: {
        name,
        email,
        role,
        active: active === 'true'
      }
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'User updated successfully');
  res.redirect('/admin/users');
});

/**
 * Delete user
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find user
  const userToDelete = await User.findById(id);

  if (!userToDelete) {
    req.flash('error', 'User not found');
    return res.redirect('/admin/users');
  }

  // Check if trying to delete self
  if (userToDelete._id.toString() === req.session.user._id.toString()) {
    req.flash('error', 'You cannot delete your own account');
    return res.redirect('/admin/users');
  }

  // Delete user
  await userToDelete.deleteOne();

  // Log user deletion
  await SystemLog.createLog({
    action: 'admin_action',
    user: req.session.user._id,
    details: {
      actionType: 'user_delete',
      deletedUserId: userToDelete._id,
      deletedUserEmail: userToDelete.email,
      deletedUserRole: userToDelete.role
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'User deleted successfully');
  res.redirect('/admin/users');
});

/**
 * Render class management page
 */
const getClassManagement = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { section: { $regex: search, $options: 'i' } }
    ];
  }

  // Count total documents
  const totalClasses = await Class.countDocuments(query);

  // Calculate pagination
  const totalPages = Math.ceil(totalClasses / limit);
  const skip = (page - 1) * limit;

  // Get classes with pagination
  const classes = await Class.find(query)
    .populate('classTeacher', 'name email')
    .sort({ department: 1, year: 1, section: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.render('admin/classes', {
    title: 'Class Management',
    user: req.session.user,
    classes,
    currentPage: page,
    totalPages,
    totalClasses,
    search
  });
});

/**
 * Render class create page
 */
const getClassCreate = asyncHandler(async (req, res) => {
  // Get all teachers for select dropdown
  const teachers = await User.find({ role: 'teacher', active: true }).sort({ name: 1 });

  res.render('admin/class-create', {
    title: 'Create Class',
    user: req.session.user,
    teachers
  });
});

/**
 * Create new class
 */
const createClass = asyncHandler(async (req, res) => {
  const { name, department, year, section, classTeacher } = req.body;

  // Check if class with same name exists
  const existingClass = await Class.findOne({ name });
  if (existingClass) {
    req.flash('error', 'Class with this name already exists');
    return res.redirect('/admin/classes/create');
  }

  // Create new class
  const newClass = new Class({
    name,
    department,
    year,
    section,
    classTeacher
  });

  await newClass.save();

  // Log class creation
  await SystemLog.createLog({
    action: 'admin_action',
    user: req.session.user._id,
    details: {
      actionType: 'class_create',
      classId: newClass._id,
      className: newClass.name
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Class created successfully');
  res.redirect('/admin/classes');
});

/**
 * Render class edit page
 */
const getClassEdit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find class
  const classToEdit = await Class.findById(id);

  if (!classToEdit) {
    req.flash('error', 'Class not found');
    return res.redirect('/admin/classes');
  }

  // Get all teachers for select dropdown
  const teachers = await User.find({ role: 'teacher', active: true }).sort({ name: 1 });

  res.render('admin/class-edit', {
    title: 'Edit Class',
    user: req.session.user,
    classToEdit,
    teachers
  });
});

/**
 * Update class
 */
const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, department, year, section, classTeacher, active } = req.body;

  // Find class
  const classToUpdate = await Class.findById(id);

  if (!classToUpdate) {
    req.flash('error', 'Class not found');
    return res.redirect('/admin/classes');
  }

  // Check if name is changed and new name is already taken
  if (name !== classToUpdate.name) {
    const existingClass = await Class.findOne({ name });
    if (existingClass) {
      req.flash('error', 'Class with this name already exists');
      return res.redirect(`/admin/classes/${id}/edit`);
    }
  }

  // Update class data
  classToUpdate.name = name;
  classToUpdate.department = department;
  classToUpdate.year = year;
  classToUpdate.section = section;
  classToUpdate.classTeacher = classTeacher;
  classToUpdate.active = active === 'true';

  await classToUpdate.save();

  // Log class update
  await SystemLog.createLog({
    action: 'admin_action',
    user: req.session.user._id,
    details: {
      actionType: 'class_update',
      classId: classToUpdate._id,
      className: classToUpdate.name
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Class updated successfully');
  res.redirect('/admin/classes');
});

/**
 * View class details
 */
const getClassDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find class with students and class teacher
  const classDetails = await Class.findById(id)
    .populate('classTeacher', 'name email')
    .populate({
      path: 'students',
      select: 'name email rollNumber',
      options: { sort: { rollNumber: 1 } }
    });

  if (!classDetails) {
    req.flash('error', 'Class not found');
    return res.redirect('/admin/classes');
  }

  // Find all students in this class
  const students = await User.find({
    class: id,
    role: 'student',
    active: true
  }).sort({ rollNumber: 1 });

  // Get elections for this class
  const elections = await Election.find({ class: id })
    .sort({ createdAt: -1 })
    .limit(5);

  res.render('admin/class-details', {
    title: `Class: ${classDetails.name}`,
    user: req.session.user,
    classDetails,
    students,
    elections
  });
});

/**
 * Delete class
 */
const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find class
  const classToDelete = await Class.findById(id);

  if (!classToDelete) {
    req.flash('error', 'Class not found');
    return res.redirect('/admin/classes');
  }

  // Check if there are students in the class
  const studentsInClass = await User.countDocuments({ class: id });
  if (studentsInClass > 0) {
    req.flash('error', `Cannot delete class with ${studentsInClass} students. Please reassign or delete students first.`);
    return res.redirect('/admin/classes');
  }

  // Check if there are elections for this class
  const electionsForClass = await Election.countDocuments({ class: id });
  if (electionsForClass > 0) {
    req.flash('error', `Cannot delete class with ${electionsForClass} elections. Please delete elections first.`);
    return res.redirect('/admin/classes');
  }

  // Delete class
  await classToDelete.deleteOne();

  // Log class deletion
  await SystemLog.createLog({
    action: 'admin_action',
    user: req.session.user._id,
    details: {
      actionType: 'class_delete',
      deletedClassId: classToDelete._id,
      deletedClassName: classToDelete.name
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Class deleted successfully');
  res.redirect('/admin/classes');
});

/**
 * Render election management page
 */
const getElectionManagement = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;

  // Build query
  const query = {};

  if (status && ['pending', 'active', 'completed', 'cancelled'].includes(status)) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Count total documents
  const totalElections = await Election.countDocuments(query);

  // Calculate pagination
  const totalPages = Math.ceil(totalElections / limit);
  const skip = (page - 1) * limit;

  // Get elections with pagination
  const elections = await Election.find(query)
    .populate('class', 'name department year section')
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.render('admin/elections', {
    title: 'Election Management',
    user: req.session.user,
    elections,
    currentPage: page,
    totalPages,
    totalElections,
    status,
    search
  });
});

/**
 * View election details
 */
const getElectionDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find election with all related data
  const election = await Election.findById(id)
    .populate('class', 'name department year section')
    .populate('createdBy', 'name email role')
    .populate({
      path: 'candidates',
      populate: {
        path: 'student',
        select: 'name email rollNumber'
      }
    });

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/admin/elections');
  }

  // Get vote statistics
  const totalStudentsInClass = await User.countDocuments({
    class: election.class._id,
    role: 'student',
    active: true
  });

  const voteStats = {
    totalVotes: election.votes.length,
    totalStudents: totalStudentsInClass,
    participationRate: totalStudentsInClass ? (election.votes.length / totalStudentsInClass * 100).toFixed(2) : 0,
    candidateVotes: {}
  };

  // Count votes for each candidate
  election.candidates.forEach(candidate => {
    voteStats.candidateVotes[candidate._id] = 0;
  });

  election.votes.forEach(vote => {
    const candidateId = vote.candidate.toString();
    if (voteStats.candidateVotes[candidateId] !== undefined) {
      voteStats.candidateVotes[candidateId]++;
    }
  });

  res.render('admin/election-details', {
    title: `Election: ${election.title}`,
    user: req.session.user,
    election,
    voteStats
  });
});

/**
 * Update election status
 */
const updateElectionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate status
  if (!['pending', 'active', 'completed', 'cancelled'].includes(status)) {
    req.flash('error', 'Invalid status');
    return res.redirect(`/admin/elections/${id}`);
  }

  // Find election
  const election = await Election.findById(id);

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/admin/elections');
  }

  // Update status
  election.status = status;

  // If completing election, calculate results
  if (status === 'completed') {
    await election.calculateResults();
  }

  await election.save();

  // Log election status update
  await SystemLog.createLog({
    action: 'admin_action',
    user: req.session.user._id,
    details: {
      actionType: 'election_status_update',
      electionId: election._id,
      electionTitle: election.title,
      oldStatus: election.status,
      newStatus: status
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', `Election status updated to ${status}`);
  res.redirect(`/admin/elections/${id}`);
});

/**
 * Delete election
 */
const deleteElection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find election
  const election = await Election.findById(id);

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/admin/elections');
  }

  // Check if election is active
  if (election.status === 'active') {
    req.flash('error', 'Cannot delete an active election');
    return res.redirect('/admin/elections');
  }

  // Delete related candidates
  await Candidate.deleteMany({ election: id });

  // Delete election
  await election.deleteOne();

  // Log election deletion
  await SystemLog.createLog({
    action: 'admin_action',
    user: req.session.user._id,
    details: {
      actionType: 'election_delete',
      deletedElectionId: election._id,
      deletedElectionTitle: election.title
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Election deleted successfully');
  res.redirect('/admin/elections');
});

/**
 * Render system logs page
 */
const getSystemLogs = asyncHandler(async (req, res) => {
  const { action, status, user: userId, startDate, endDate, page = 1, limit = 50 } = req.query;

  // Build query
  const query = {};

  if (action) {
    query.action = action;
  }

  if (status && ['success', 'failure', 'warning', 'info'].includes(status)) {
    query.status = status;
  }

  if (userId) {
    query.user = userId;
  }

  if (startDate && endDate) {
    query.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    query.timestamp = {
      $gte: new Date(startDate)
    };
  } else if (endDate) {
    query.timestamp = {
      $lte: new Date(endDate)
    };
  }

  // Count total documents
  const totalLogs = await SystemLog.countDocuments(query);

  // Calculate pagination
  const totalPages = Math.ceil(totalLogs / limit);
  const skip = (page - 1) * limit;

  // Get logs with pagination
  const logs = await SystemLog.find(query)
    .populate('user', 'name email role')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get unique actions for filter
  const actions = await SystemLog.distinct('action');

  // Get users for filter
  const users = await User.find({}).select('name email role');

  res.render('admin/logs', {
    title: 'System Logs',
    user: req.session.user,
    logs,
    actions,
    users,
    currentPage: page,
    totalPages,
    totalLogs,
    filters: {
      action,
      status,
      userId,
      startDate,
      endDate
    }
  });
});

/**
 * Create system backup
 */
const createBackup = asyncHandler(async (req, res) => {
  // Get all data for backup
  const users = await User.find({}).select('-password -__v');
  const classes = await Class.find({}).select('-__v');
  const elections = await Election.find({}).select('-__v');
  const candidates = await Candidate.find({}).select('-__v');

  // Create backup object
  const backup = {
    timestamp: new Date(),
    data: {
      users,
      classes,
      elections,
      candidates
    },
    metadata: {
      totalUsers: users.length,
      totalClasses: classes.length,
      totalElections: elections.length,
      totalCandidates: candidates.length,
      createdBy: req.session.user._id,
      creatorName: req.session.user.name,
      creatorEmail: req.session.user.email
    }
  };

  // Upload to Google Drive
  const backupResult = await googleDrive.createDataBackup(
    backup,
    `college-election-backup-${new Date().toISOString().split('T')[0]}.json`
  );

  // Log backup creation
  await SystemLog.createLog({
    action: 'backup_create',
    user: req.session.user._id,
    details: {
      success: backupResult.success,
      fileId: backupResult.fileId,
      fileName: backupResult.fileName,
      link: backupResult.link
    },
    status: backupResult.success ? 'success' : 'failure',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  if (backupResult.success) {
    req.flash('success', 'System backup created successfully');
  } else {
    req.flash('error', `Backup creation failed: ${backupResult.error}`);
  }

  res.redirect('/admin/dashboard');
});

/**
 * Render system backup page
 */
const getBackupPage = asyncHandler(async (req, res) => {
  // Get backup logs
  const backupLogs = await SystemLog.find({ action: 'backup_create' })
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(20);

  res.render('admin/backup', {
    title: 'System Backup',
    user: req.session.user,
    backupLogs
  });
});

/**
 * Render system settings page
 */
const getSettingsPage = asyncHandler(async (req, res) => {
  res.render('admin/settings', {
    title: 'System Settings',
    user: req.session.user
  });
});

module.exports = {
  getDashboard,
  getUserManagement,
  getUserEdit,
  updateUser,
  deleteUser,
  getClassManagement,
  getClassCreate,
  createClass,
  getClassEdit,
  updateClass,
  getClassDetails,
  deleteClass,
  getElectionManagement,
  getElectionDetails,
  updateElectionStatus,
  deleteElection,
  getSystemLogs,
  createBackup,
  getBackupPage,
  getSettingsPage
};

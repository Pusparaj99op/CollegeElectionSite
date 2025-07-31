/**
 * Teacher Controller
 * Purpose: Handles teacher-specific functionalities
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const User = require('../models/User');
const Class = require('../models/Class');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const SystemLog = require('../models/SystemLog');
const mailer = require('../config/mailer');
const { asyncHandler } = require('../middlewares/error');

/**
 * Render teacher dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.session.user._id;

  // Find classes where teacher is class teacher
  const teacherClasses = await Class.find({ classTeacher: teacherId })
    .sort({ department: 1, year: 1, section: 1 });

  // Get statistics
  const stats = {
    managedClasses: teacherClasses.length,
    totalStudents: 0,
    activeElections: 0,
    pendingElections: 0,
    completedElections: 0
  };

  // Get class IDs
  const classIds = teacherClasses.map(c => c._id);

  // Count students in these classes
  if (classIds.length > 0) {
    stats.totalStudents = await User.countDocuments({
      class: { $in: classIds },
      role: 'student',
      active: true
    });

    // Count elections for these classes
    stats.activeElections = await Election.countDocuments({
      class: { $in: classIds },
      status: 'active'
    });

    stats.pendingElections = await Election.countDocuments({
      class: { $in: classIds },
      status: 'pending'
    });

    stats.completedElections = await Election.countDocuments({
      class: { $in: classIds },
      status: 'completed'
    });
  }

  // Get active elections for these classes
  const activeElections = await Election.find({
    class: { $in: classIds },
    status: 'active'
  })
    .populate('class', 'name department year section')
    .sort({ startDate: 1 });

  // Get upcoming elections
  const upcomingElections = await Election.find({
    class: { $in: classIds },
    status: 'pending',
    startDate: { $gt: new Date() }
  })
    .populate('class', 'name department year section')
    .sort({ startDate: 1 })
    .limit(5);

  res.render('teacher/dashboard', {
    title: 'Teacher Dashboard',
    user: req.session.user,
    teacherClasses,
    stats,
    activeElections,
    upcomingElections
  });
});

/**
 * Render class details page
 */
const getClassDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherId = req.session.user._id;

  // Find class and verify teacher is class teacher
  const classDetails = await Class.findOne({
    _id: id,
    classTeacher: teacherId
  }).populate('classTeacher', 'name email');

  if (!classDetails) {
    req.flash('error', 'Class not found or you do not have permission to view it');
    return res.redirect('/teacher/dashboard');
  }

  // Find students in this class
  const students = await User.find({
    class: id,
    role: 'student',
    active: true
  }).sort({ rollNumber: 1 });

  // Get elections for this class
  const elections = await Election.find({ class: id })
    .sort({ createdAt: -1 });

  res.render('teacher/class-details', {
    title: `Class: ${classDetails.name}`,
    user: req.session.user,
    classDetails,
    students,
    elections
  });
});

/**
 * Render student management page
 */
const getStudentManagement = asyncHandler(async (req, res) => {
  const teacherId = req.session.user._id;

  // Find classes managed by this teacher
  const managedClasses = await Class.find({ classTeacher: teacherId });
  const managedClassIds = managedClasses.map(c => c._id);

  // Check if there are managed classes
  if (managedClassIds.length === 0) {
    req.flash('info', 'You are not assigned as a class teacher to any class yet');
    return res.redirect('/teacher/dashboard');
  }

  const { classId, search, page = 1, limit = 20 } = req.query;

  // Build query for students
  const query = {
    role: 'student',
    class: { $in: managedClassIds }
  };

  // Filter by specific class if provided
  if (classId && managedClassIds.includes(classId)) {
    query.class = classId;
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } }
    ];
  }

  // Count total students
  const totalStudents = await User.countDocuments(query);

  // Calculate pagination
  const totalPages = Math.ceil(totalStudents / limit);
  const skip = (page - 1) * limit;

  // Get students with pagination
  const students = await User.find(query)
    .populate('class', 'name department year section')
    .sort({ rollNumber: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.render('teacher/students', {
    title: 'Student Management',
    user: req.session.user,
    students,
    managedClasses,
    currentPage: page,
    totalPages,
    totalStudents,
    classId,
    search
  });
});

/**
 * Render create election page
 */
const getCreateElection = asyncHandler(async (req, res) => {
  const teacherId = req.session.user._id;

  // Find classes managed by this teacher
  const managedClasses = await Class.find({
    classTeacher: teacherId,
    active: true
  }).sort({ name: 1 });

  // Check if there are managed classes
  if (managedClasses.length === 0) {
    req.flash('info', 'You need to be assigned as a class teacher to create elections');
    return res.redirect('/teacher/dashboard');
  }

  res.render('teacher/create-election', {
    title: 'Create Election',
    user: req.session.user,
    managedClasses
  });
});

/**
 * Create new election
 */
const createElection = asyncHandler(async (req, res) => {
  const teacherId = req.session.user._id;
  const { title, description, electionType, classId, startDate, endDate } = req.body;

  // Validate required fields
  if (!title || !description || !electionType || !classId || !startDate || !endDate) {
    req.flash('error', 'All fields are required');
    return res.redirect('/teacher/elections/create');
  }

  // Verify teacher is class teacher for this class
  const classExists = await Class.findOne({
    _id: classId,
    classTeacher: teacherId,
    active: true
  });

  if (!classExists) {
    req.flash('error', 'You do not have permission to create an election for this class');
    return res.redirect('/teacher/elections/create');
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start < now) {
    req.flash('error', 'Start date must be in the future');
    return res.redirect('/teacher/elections/create');
  }

  if (end <= start) {
    req.flash('error', 'End date must be after start date');
    return res.redirect('/teacher/elections/create');
  }

  // Check for overlapping elections
  const overlappingElections = await Election.findOne({
    class: classId,
    status: { $in: ['active', 'pending'] },
    $or: [
      { startDate: { $lte: end, $gte: start } },
      { endDate: { $lte: end, $gte: start } },
      { $and: [{ startDate: { $lte: start } }, { endDate: { $gte: end } }] }
    ]
  });

  if (overlappingElections) {
    req.flash('error', 'There is already an election scheduled for this class during this time period');
    return res.redirect('/teacher/elections/create');
  }

  // Create new election
  const election = new Election({
    title,
    description,
    electionType,
    class: classId,
    startDate: start,
    endDate: end,
    status: 'pending',
    createdBy: teacherId
  });

  await election.save();

  // Log election creation
  await SystemLog.createLog({
    action: 'election_create',
    user: teacherId,
    details: {
      electionId: election._id,
      electionTitle: election.title,
      electionType,
      classId
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Notify students about the new election
  await notifyStudentsAboutElection(election);

  req.flash('success', 'Election created successfully');
  res.redirect(`/teacher/elections/${election._id}`);
});

/**
 * Notify students about a new election
 */
const notifyStudentsAboutElection = async (election) => {
  try {
    // Find class details
    const classDetails = await Class.findById(election.class);

    if (!classDetails) return;

    // Find all active students in this class
    const students = await User.find({
      class: classDetails._id,
      role: 'student',
      active: true,
      isVerified: true
    });

    // Send email notification to each student
    for (const student of students) {
      await mailer.sendElectionNotificationEmail(
        student.email,
        student.name,
        election
      );
    }
  } catch (error) {
    console.error('Error notifying students about election:', error);
  }
};

/**
 * Render election management page
 */
const getElectionManagement = asyncHandler(async (req, res) => {
  const teacherId = req.session.user._id;

  // Find classes managed by this teacher
  const managedClasses = await Class.find({ classTeacher: teacherId });
  const managedClassIds = managedClasses.map(c => c._id);

  const { status, classId, page = 1, limit = 10 } = req.query;

  // Build query
  const query = {
    $or: [
      { class: { $in: managedClassIds } },
      { createdBy: teacherId }
    ]
  };

  // Filter by status
  if (status && ['pending', 'active', 'completed', 'cancelled'].includes(status)) {
    query.status = status;
  }

  // Filter by specific class
  if (classId && managedClassIds.includes(classId)) {
    query.class = classId;
  }

  // Count total documents
  const totalElections = await Election.countDocuments(query);

  // Calculate pagination
  const totalPages = Math.ceil(totalElections / limit);
  const skip = (page - 1) * limit;

  // Get elections with pagination
  const elections = await Election.find(query)
    .populate('class', 'name department year section')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.render('teacher/elections', {
    title: 'Election Management',
    user: req.session.user,
    elections,
    managedClasses,
    currentPage: page,
    totalPages,
    totalElections,
    status,
    classId
  });
});

/**
 * Render election details page
 */
const getElectionDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherId = req.session.user._id;

  // Find election
  const election = await Election.findById(id)
    .populate('class', 'name department year section classTeacher')
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
    return res.redirect('/teacher/elections');
  }

  // Check if teacher has permission to view this election
  const hasPermission =
    election.createdBy._id.toString() === teacherId.toString() ||
    election.class.classTeacher.toString() === teacherId.toString();

  if (!hasPermission) {
    req.flash('error', 'You do not have permission to view this election');
    return res.redirect('/teacher/elections');
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

  // Get students who haven't voted yet
  let studentsNotVoted = [];
  if (election.status === 'active' || election.status === 'completed') {
    const votedStudentIds = election.votes.map(vote => vote.student.toString());

    studentsNotVoted = await User.find({
      class: election.class._id,
      role: 'student',
      active: true,
      _id: { $nin: votedStudentIds }
    }).select('name email rollNumber');
  }

  // Get available symbols for candidates
  const availableSymbols = Candidate.getAvailableSymbols();

  res.render('teacher/election-details', {
    title: `Election: ${election.title}`,
    user: req.session.user,
    election,
    voteStats,
    studentsNotVoted,
    availableSymbols
  });
});

/**
 * Update election
 */
const updateElection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherId = req.session.user._id;
  const { title, description, startDate, endDate, status } = req.body;

  // Find election
  const election = await Election.findById(id);

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/teacher/elections');
  }

  // Check if teacher has permission to update this election
  const hasPermission =
    election.createdBy.toString() === teacherId.toString() ||
    (await Class.exists({ _id: election.class, classTeacher: teacherId }));

  if (!hasPermission) {
    req.flash('error', 'You do not have permission to update this election');
    return res.redirect('/teacher/elections');
  }

  // Check if election is already completed
  if (election.status === 'completed' && status !== 'completed') {
    req.flash('error', 'Cannot modify a completed election');
    return res.redirect(`/teacher/elections/${id}`);
  }

  // Update election data
  if (title) election.title = title;
  if (description) election.description = description;

  // Only update dates if election is not active or completed
  if (election.status === 'pending') {
    if (startDate) {
      const newStartDate = new Date(startDate);
      if (newStartDate > new Date()) {
        election.startDate = newStartDate;
      } else {
        req.flash('error', 'Start date must be in the future');
        return res.redirect(`/teacher/elections/${id}/edit`);
      }
    }

    if (endDate) {
      const newEndDate = new Date(endDate);
      if (newEndDate > election.startDate) {
        election.endDate = newEndDate;
      } else {
        req.flash('error', 'End date must be after start date');
        return res.redirect(`/teacher/elections/${id}/edit`);
      }
    }
  }

  // Update status if provided and valid transition
  if (status) {
    if (status === 'completed' && election.status === 'active') {
      // Calculate and publish results
      await election.calculateResults();
    } else if (status === 'cancelled' && election.status !== 'completed') {
      election.status = 'cancelled';
    } else if (status === 'active' && election.status === 'pending') {
      election.status = 'active';
    }
  }

  await election.save();

  // Log election update
  await SystemLog.createLog({
    action: 'election_update',
    user: teacherId,
    details: {
      electionId: election._id,
      electionTitle: election.title,
      updatedFields: {
        title: title ? true : false,
        description: description ? true : false,
        startDate: startDate ? true : false,
        endDate: endDate ? true : false,
        status: status ? true : false
      }
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Election updated successfully');
  res.redirect(`/teacher/elections/${id}`);
});

/**
 * Render election edit page
 */
const getElectionEdit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherId = req.session.user._id;

  // Find election
  const election = await Election.findById(id)
    .populate('class', 'name department year section');

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/teacher/elections');
  }

  // Check if teacher has permission to edit this election
  const hasPermission =
    election.createdBy.toString() === teacherId.toString() ||
    (await Class.exists({ _id: election.class._id, classTeacher: teacherId }));

  if (!hasPermission) {
    req.flash('error', 'You do not have permission to edit this election');
    return res.redirect('/teacher/elections');
  }

  // Check if election can be edited
  if (election.status === 'completed') {
    req.flash('error', 'Completed elections cannot be edited');
    return res.redirect(`/teacher/elections/${id}`);
  }

  res.render('teacher/election-edit', {
    title: 'Edit Election',
    user: req.session.user,
    election
  });
});

/**
 * Add candidate to election
 */
const addCandidate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherId = req.session.user._id;
  const { studentId, symbol, color, manifesto } = req.body;

  // Find election
  const election = await Election.findById(id);

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/teacher/elections');
  }

  // Check if teacher has permission to add candidates
  const hasPermission =
    election.createdBy.toString() === teacherId.toString() ||
    (await Class.exists({ _id: election.class, classTeacher: teacherId }));

  if (!hasPermission) {
    req.flash('error', 'You do not have permission to add candidates to this election');
    return res.redirect('/teacher/elections');
  }

  // Check if election is in a valid state for adding candidates
  if (election.status === 'completed' || election.status === 'cancelled') {
    req.flash('error', 'Cannot add candidates to a completed or cancelled election');
    return res.redirect(`/teacher/elections/${id}`);
  }

  // Validate student
  const student = await User.findOne({
    _id: studentId,
    role: 'student',
    class: election.class,
    active: true
  });

  if (!student) {
    req.flash('error', 'Invalid student or student does not belong to this class');
    return res.redirect(`/teacher/elections/${id}`);
  }

  // Check if student is already a candidate
  const existingCandidate = await Candidate.findOne({
    student: studentId,
    election: id
  });

  if (existingCandidate) {
    req.flash('error', 'This student is already a candidate in this election');
    return res.redirect(`/teacher/elections/${id}`);
  }

  // Validate symbol
  const availableSymbols = Candidate.getAvailableSymbols();
  if (!availableSymbols.includes(symbol)) {
    req.flash('error', 'Invalid symbol');
    return res.redirect(`/teacher/elections/${id}`);
  }

  // Create candidate
  const candidate = new Candidate({
    student: studentId,
    election: id,
    symbol,
    color: color || '#3498db',
    manifesto: manifesto || '',
    approved: true,
    approvedBy: teacherId,
    approvedAt: new Date()
  });

  await candidate.save();

  // Add candidate to election
  election.candidates.push(candidate._id);
  await election.save();

  // Log candidate creation
  await SystemLog.createLog({
    action: 'candidate_create',
    user: teacherId,
    details: {
      candidateId: candidate._id,
      studentId: student._id,
      studentName: student.name,
      electionId: election._id,
      electionTitle: election.title
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', `${student.name} has been added as a candidate`);
  res.redirect(`/teacher/elections/${id}`);
});

/**
 * Remove candidate from election
 */
const removeCandidate = asyncHandler(async (req, res) => {
  const { id, candidateId } = req.params;
  const teacherId = req.session.user._id;

  // Find election
  const election = await Election.findById(id);

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/teacher/elections');
  }

  // Check if teacher has permission
  const hasPermission =
    election.createdBy.toString() === teacherId.toString() ||
    (await Class.exists({ _id: election.class, classTeacher: teacherId }));

  if (!hasPermission) {
    req.flash('error', 'You do not have permission to remove candidates from this election');
    return res.redirect('/teacher/elections');
  }

  // Check if election has started
  if (election.status === 'active' || election.status === 'completed') {
    req.flash('error', 'Cannot remove candidates from an active or completed election');
    return res.redirect(`/teacher/elections/${id}`);
  }

  // Find candidate
  const candidate = await Candidate.findOne({
    _id: candidateId,
    election: id
  }).populate('student', 'name');

  if (!candidate) {
    req.flash('error', 'Candidate not found');
    return res.redirect(`/teacher/elections/${id}`);
  }

  // Remove candidate from election
  election.candidates = election.candidates.filter(
    c => c.toString() !== candidateId
  );
  await election.save();

  // Delete candidate
  await candidate.deleteOne();

  // Log candidate removal
  await SystemLog.createLog({
    action: 'teacher_action',
    user: teacherId,
    details: {
      actionType: 'candidate_remove',
      candidateId,
      studentName: candidate.student.name,
      electionId: election._id,
      electionTitle: election.title
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', `Candidate ${candidate.student.name} has been removed`);
  res.redirect(`/teacher/elections/${id}`);
});

/**
 * Publish election results
 */
const publishResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherId = req.session.user._id;

  // Find election
  const election = await Election.findById(id);

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/teacher/elections');
  }

  // Check if teacher has permission
  const hasPermission =
    election.createdBy.toString() === teacherId.toString() ||
    (await Class.exists({ _id: election.class, classTeacher: teacherId }));

  if (!hasPermission) {
    req.flash('error', 'You do not have permission to publish results for this election');
    return res.redirect('/teacher/elections');
  }

  // Check if election is completed
  if (election.status !== 'completed') {
    // If election is active and end date has passed, complete it
    const now = new Date();
    if (election.status === 'active' && election.endDate <= now) {
      election.status = 'completed';
    } else {
      req.flash('error', 'Cannot publish results for an election that is not completed');
      return res.redirect(`/teacher/elections/${id}`);
    }
  }

  // Calculate and publish results
  const results = await election.calculateResults();

  // Update election
  election.results.published = true;
  election.results.publishedAt = new Date();
  await election.save();

  // Log result publication
  await SystemLog.createLog({
    action: 'result_publish',
    user: teacherId,
    details: {
      electionId: election._id,
      electionTitle: election.title,
      totalVotes: results.totalVotes,
      winnerId: results.winnerId
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Election results published successfully');
  res.redirect(`/teacher/elections/${id}`);
});

/**
 * Send reminder to students who haven't voted
 */
const sendVotingReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherId = req.session.user._id;

  // Find election
  const election = await Election.findById(id)
    .populate('class', 'name');

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/teacher/elections');
  }

  // Check if teacher has permission
  const hasPermission =
    election.createdBy.toString() === teacherId.toString() ||
    (await Class.exists({ _id: election.class._id, classTeacher: teacherId }));

  if (!hasPermission) {
    req.flash('error', 'You do not have permission for this action');
    return res.redirect('/teacher/elections');
  }

  // Check if election is active
  if (election.status !== 'active') {
    req.flash('error', 'Reminders can only be sent for active elections');
    return res.redirect(`/teacher/elections/${id}`);
  }

  // Get students who haven't voted
  const votedStudentIds = election.votes.map(vote => vote.student.toString());

  const studentsNotVoted = await User.find({
    class: election.class._id,
    role: 'student',
    active: true,
    isVerified: true,
    _id: { $nin: votedStudentIds }
  });

  if (studentsNotVoted.length === 0) {
    req.flash('info', 'All students have already voted in this election');
    return res.redirect(`/teacher/elections/${id}`);
  }

  // Send reminders
  let sentCount = 0;
  for (const student of studentsNotVoted) {
    try {
      await mailer.sendEmail({
        to: student.email,
        subject: `Reminder: ${election.title} Election is Active`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #4a4a4a;">${election.title} - Voting Reminder</h2>
            <p>Hello ${student.name},</p>
            <p>This is a friendly reminder that you have not yet cast your vote in the <strong>${election.title}</strong> election for your class (${election.class.name}).</p>
            <p>The election is currently active and will end on <strong>${new Date(election.endDate).toLocaleString()}</strong>.</p>
            <p>Your vote is important! Please take a moment to log in and cast your vote.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.BASE_URL || 'http://localhost:3000'}/election/${election._id}" style="background-color: #FF5722; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Vote Now</a>
            </div>
            <p>Thank you for your participation!</p>
            <p>Best regards,<br>College Election System Team</p>
          </div>
        `
      });
      sentCount++;
    } catch (error) {
      console.error(`Failed to send reminder to ${student.email}:`, error);
    }
  }

  // Log reminder sending
  await SystemLog.createLog({
    action: 'teacher_action',
    user: teacherId,
    details: {
      actionType: 'send_reminder',
      electionId: election._id,
      electionTitle: election.title,
      remindersSent: sentCount,
      totalNotVoted: studentsNotVoted.length
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', `Reminders sent to ${sentCount} students who haven't voted yet`);
  res.redirect(`/teacher/elections/${id}`);
});

module.exports = {
  getDashboard,
  getClassDetails,
  getStudentManagement,
  getCreateElection,
  createElection,
  getElectionManagement,
  getElectionDetails,
  updateElection,
  getElectionEdit,
  addCandidate,
  removeCandidate,
  publishResults,
  sendVotingReminder
};

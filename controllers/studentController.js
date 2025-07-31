/**
 * Student Controller
 * Purpose: Handles student-specific functionalities
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const User = require('../models/User');
const Class = require('../models/Class');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const SystemLog = require('../models/SystemLog');
const { asyncHandler } = require('../middlewares/error');

/**
 * Render student dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const studentId = req.session.user._id;
  const student = await User.findById(studentId).populate('class', 'name department year section');

  if (!student) {
    req.session.destroy();
    return res.redirect('/auth/login');
  }

  // Get active elections for student's class
  const activeElections = await Election.find({
    class: student.class._id,
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).sort({ endDate: 1 });

  // Get upcoming elections
  const upcomingElections = await Election.find({
    class: student.class._id,
    status: 'pending',
    startDate: { $gt: new Date() }
  }).sort({ startDate: 1 });

  // Get completed elections where results are published
  const completedElections = await Election.find({
    class: student.class._id,
    status: 'completed',
    'results.published': true
  }).sort({ endDate: -1 }).limit(5);

  // For each active election, check if student has voted
  for (const election of activeElections) {
    election.hasVoted = election.hasVoted(studentId);
  }

  // Get classmates (limited info)
  const classmates = await User.find({
    class: student.class._id,
    role: 'student',
    active: true,
    _id: { $ne: studentId }
  })
    .select('name rollNumber')
    .sort({ rollNumber: 1 })
    .limit(30);

  res.render('student/dashboard', {
    title: 'Student Dashboard',
    user: req.session.user,
    student,
    activeElections,
    upcomingElections,
    completedElections,
    classmateCount: classmates.length,
    classmates
  });
});

/**
 * Render election details page for a student
 */
const getElectionDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.session.user._id;

  // Find student with class
  const student = await User.findById(studentId).populate('class');

  if (!student) {
    req.session.destroy();
    return res.redirect('/auth/login');
  }

  // Find election and verify it's for student's class
  const election = await Election.findOne({
    _id: id,
    class: student.class._id
  })
    .populate('class', 'name department year section')
    .populate({
      path: 'candidates',
      populate: {
        path: 'student',
        select: 'name rollNumber'
      }
    });

  if (!election) {
    req.flash('error', 'Election not found or you do not have access to it');
    return res.redirect('/student/dashboard');
  }

  // Check if student has voted
  const hasVoted = election.hasVoted(studentId);

  // If results are published, get vote counts
  let voteStats = null;
  let winner = null;

  if (election.status === 'completed' && election.results.published) {
    // Get vote statistics
    voteStats = {
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

    // Get winner if exists
    if (election.results.winner) {
      winner = election.candidates.find(
        c => c._id.toString() === election.results.winner.toString()
      );
    }
  }

  res.render('student/election-details', {
    title: `Election: ${election.title}`,
    user: req.session.user,
    election,
    hasVoted,
    voteStats,
    winner,
    now: new Date()
  });
});

/**
 * Cast a vote in an election
 */
const castVote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { candidateId } = req.body;
  const studentId = req.session.user._id;

  // Find student with class
  const student = await User.findById(studentId).populate('class');

  if (!student) {
    req.session.destroy();
    return res.redirect('/auth/login');
  }

  // Find election and verify it's for student's class
  const election = await Election.findOne({
    _id: id,
    class: student.class._id,
    status: 'active'
  });

  if (!election) {
    req.flash('error', 'Election not found, not active, or you do not have access to it');
    return res.redirect('/student/dashboard');
  }

  // Verify election is currently active (time-wise)
  const now = new Date();
  if (now < election.startDate || now > election.endDate) {
    req.flash('error', 'Election is not currently active');
    return res.redirect(`/student/elections/${id}`);
  }

  // Check if student has already voted
  if (election.hasVoted(studentId)) {
    req.flash('error', 'You have already voted in this election');
    return res.redirect(`/student/elections/${id}`);
  }

  // Verify candidate exists for this election
  const candidate = await Candidate.findOne({
    _id: candidateId,
    election: id,
    approved: true,
    active: true
  });

  if (!candidate) {
    req.flash('error', 'Invalid candidate selection');
    return res.redirect(`/student/elections/${id}`);
  }

  // Add vote to election
  election.votes.push({
    student: studentId,
    candidate: candidateId,
    timestamp: now
  });

  await election.save();

  // Log vote casting (without revealing the chosen candidate for privacy)
  await SystemLog.createLog({
    action: 'vote_cast',
    user: studentId,
    details: {
      electionId: election._id,
      electionTitle: election.title
    },
    status: 'success',
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  req.flash('success', 'Your vote has been successfully recorded');
  res.redirect(`/student/elections/${id}`);
});

/**
 * Get class information
 */
const getClassInfo = asyncHandler(async (req, res) => {
  const studentId = req.session.user._id;

  // Find student with class details
  const student = await User.findById(studentId).populate({
    path: 'class',
    populate: {
      path: 'classTeacher',
      select: 'name email'
    }
  });

  if (!student || !student.class) {
    req.flash('error', 'Class information not found');
    return res.redirect('/student/dashboard');
  }

  // Get classmates
  const classmates = await User.find({
    class: student.class._id,
    role: 'student',
    active: true
  })
    .select('name rollNumber')
    .sort({ rollNumber: 1 });

  // Get past elections for this class
  const pastElections = await Election.find({
    class: student.class._id,
    status: 'completed',
    'results.published': true
  })
    .populate({
      path: 'results.winner',
      populate: {
        path: 'student',
        select: 'name rollNumber'
      }
    })
    .sort({ endDate: -1 })
    .limit(10);

  res.render('student/class-info', {
    title: 'Class Information',
    user: req.session.user,
    classDetails: student.class,
    classmates,
    pastElections
  });
});

/**
 * Render student profile page
 */
const getProfile = asyncHandler(async (req, res) => {
  const studentId = req.session.user._id;

  // Find student with class
  const student = await User.findById(studentId)
    .select('-password')
    .populate('class', 'name department year section');

  if (!student) {
    req.session.destroy();
    return res.redirect('/auth/login');
  }

  // Get voting history (elections where student has voted)
  const votedElections = await Election.find({
    'votes.student': studentId
  })
    .select('title electionType startDate endDate status results class')
    .populate('class', 'name')
    .sort({ endDate: -1 });

  // Get candidacy history (elections where student was a candidate)
  const candidacyHistory = await Candidate.find({
    student: studentId
  })
    .populate({
      path: 'election',
      select: 'title electionType startDate endDate status results',
      populate: {
        path: 'class',
        select: 'name'
      }
    });

  res.render('student/profile', {
    title: 'My Profile',
    user: req.session.user,
    student,
    votedElections,
    candidacyHistory
  });
});

/**
 * Update student profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const studentId = req.session.user._id;
  const { name } = req.body;

  // Find student
  const student = await User.findById(studentId);

  if (!student) {
    req.session.destroy();
    return res.redirect('/auth/login');
  }

  // Update name
  if (name && name.trim() !== student.name) {
    student.name = name.trim();
    await student.save();

    // Update session data
    req.session.user.name = student.name;
  }

  req.flash('success', 'Profile updated successfully');
  res.redirect('/student/profile');
});

/**
 * Get all elections (active, upcoming, past)
 */
const getAllElections = asyncHandler(async (req, res) => {
  const studentId = req.session.user._id;

  // Find student with class
  const student = await User.findById(studentId).populate('class');

  if (!student || !student.class) {
    req.flash('error', 'Class information not found');
    return res.redirect('/student/dashboard');
  }

  // Get active elections
  const activeElections = await Election.find({
    class: student.class._id,
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).sort({ endDate: 1 });

  // Get upcoming elections
  const upcomingElections = await Election.find({
    class: student.class._id,
    status: 'pending',
    startDate: { $gt: new Date() }
  }).sort({ startDate: 1 });

  // Get past elections
  const pastElections = await Election.find({
    class: student.class._id,
    $or: [
      { status: 'completed' },
      { status: 'cancelled' },
      { endDate: { $lt: new Date() } }
    ]
  }).sort({ endDate: -1 });

  // For each election, check if student has voted
  for (const election of [...activeElections, ...pastElections]) {
    election.hasVoted = election.hasVoted(studentId);
  }

  res.render('student/all-elections', {
    title: 'All Elections',
    user: req.session.user,
    activeElections,
    upcomingElections,
    pastElections
  });
});

module.exports = {
  getDashboard,
  getElectionDetails,
  castVote,
  getClassInfo,
  getProfile,
  updateProfile,
  getAllElections
};

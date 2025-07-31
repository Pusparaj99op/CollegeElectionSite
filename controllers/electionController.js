/**
 * Election Controller
 * Purpose: Handles public-facing election functionalities
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
 * Get election by ID (public view)
 */
const getElectionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.session.user?._id;

  // Find election with candidates
  const election = await Election.findById(id)
    .populate('class', 'name department year section')
    .populate('createdBy', 'name')
    .populate({
      path: 'candidates',
      populate: {
        path: 'student',
        select: 'name rollNumber'
      }
    });

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/');
  }

  let userCanVote = false;
  let hasVoted = false;
  let userClass = null;

  // Check if user is logged in and is a student
  if (userId && req.session.user.role === 'student') {
    // Get user's class
    const user = await User.findById(userId);
    if (user) {
      userClass = user.class;

      // Check if user belongs to the election's class
      if (user.class && user.class.toString() === election.class._id.toString()) {
        userCanVote = true;
        hasVoted = election.hasVoted(userId);
      }
    }
  }

  // Prepare data based on election status
  let voteStats = null;
  let winner = null;

  // Show results if completed and published or user is admin/teacher
  const showResults =
    (election.status === 'completed' && election.results.published) ||
    (req.session.user && ['admin', 'teacher'].includes(req.session.user.role));

  if (showResults) {
    // Get vote statistics
    voteStats = {
      totalVotes: election.votes.length,
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

  res.render('election/details', {
    title: `Election: ${election.title}`,
    user: req.session.user,
    election,
    userCanVote,
    hasVoted,
    userClass,
    voteStats: showResults ? voteStats : null,
    winner: showResults ? winner : null,
    showResults,
    now: new Date()
  });
});

/**
 * List all elections (public view)
 */
const listAllElections = asyncHandler(async (req, res) => {
  // Get query parameters
  const { status, type, classId, page = 1, limit = 10 } = req.query;

  // Build query
  const query = {};

  // Filter by status
  if (status && ['active', 'pending', 'completed'].includes(status)) {
    query.status = status;
  }

  // Filter by election type
  if (type && ['CR', 'BR', 'Other'].includes(type)) {
    query.electionType = type;
  }

  // Filter by class
  if (classId) {
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
    .sort({
      status: 1, // Active first, then pending, then completed
      startDate: 1 // Earliest start date first
    })
    .skip(skip)
    .limit(parseInt(limit));

  // Get all classes for filter dropdown
  const classes = await Class.find({ active: true }).sort({ name: 1 });

  res.render('election/list', {
    title: 'All Elections',
    user: req.session.user,
    elections,
    classes,
    currentPage: page,
    totalPages,
    totalElections,
    filters: {
      status,
      type,
      classId
    }
  });
});

/**
 * Get candidate details
 */
const getCandidateDetails = asyncHandler(async (req, res) => {
  const { id, candidateId } = req.params;

  // Find election
  const election = await Election.findById(id);

  if (!election) {
    req.flash('error', 'Election not found');
    return res.redirect('/election/list');
  }

  // Find candidate
  const candidate = await Candidate.findOne({
    _id: candidateId,
    election: id
  }).populate('student', 'name email rollNumber');

  if (!candidate) {
    req.flash('error', 'Candidate not found');
    return res.redirect(`/election/${id}`);
  }

  // Get vote count if election is completed and results published
  let voteCount = null;
  let votePercentage = null;

  if (election.status === 'completed' && election.results.published) {
    const candidateVotes = election.votes.filter(
      vote => vote.candidate.toString() === candidateId
    ).length;

    voteCount = candidateVotes;
    votePercentage = election.votes.length > 0
      ? (candidateVotes / election.votes.length * 100).toFixed(2)
      : 0;
  }

  res.render('election/candidate', {
    title: `Candidate: ${candidate.student.name}`,
    user: req.session.user,
    candidate,
    election,
    voteCount,
    votePercentage
  });
});

module.exports = {
  getElectionById,
  listAllElections,
  getCandidateDetails
};

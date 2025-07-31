/**
 * Public Voting Controller
 * Purpose: Handle anonymous/public voting via QR codes
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const SystemLog = require('../models/SystemLog');
const QRCode = require('qrcode');
const { asyncHandler } = require('../middlewares/error');

/**
 * Get public voting page via QR token
 */
const getPublicVotingPage = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Find election by QR token
  const election = await Election.findOne({
    'qrCode.accessToken': token,
    'qrCode.isEnabled': true
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
    req.flash('error', 'Invalid or expired voting link');
    return res.redirect('/');
  }

  // Check if voting is currently allowed
  if (!election.isVotingAllowed()) {
    return res.render('vote/not-available', {
      title: 'Voting Not Available',
      election,
      message: 'Voting is not currently available for this election. Please check the voting schedule.'
    });
  }

  // Get client IP for tracking
  const clientIP = req.ip || req.connection.remoteAddress;

  res.render('vote/public', {
    title: `Vote - ${election.title}`,
    election,
    candidates: election.candidates,
    clientIP,
    requireRollNumber: election.publicAccess.requireRollNumber
  });
});

/**
 * Submit public vote
 */
const submitPublicVote = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { candidateId, rollNumber } = req.body;

  // Validate required fields
  if (!candidateId) {
    req.flash('error', 'Please select a candidate');
    return res.redirect(`/vote/${token}`);
  }

  // Find election
  const election = await Election.findOne({
    'qrCode.accessToken': token,
    'qrCode.isEnabled': true
  }).populate('candidates');

  if (!election) {
    req.flash('error', 'Invalid or expired voting link');
    return res.redirect('/');
  }

  // Check if voting is allowed
  if (!election.isVotingAllowed()) {
    req.flash('error', 'Voting is not currently available');
    return res.redirect(`/vote/${token}`);
  }

  // Validate roll number if required
  if (election.publicAccess.requireRollNumber && !rollNumber) {
    req.flash('error', 'Roll number is required');
    return res.redirect(`/vote/${token}`);
  }

  // Check if roll number has already voted
  if (rollNumber && election.hasVoted(null, rollNumber)) {
    req.flash('error', 'This roll number has already voted');
    return res.redirect(`/vote/${token}`);
  }

  // Validate candidate
  const candidate = await Candidate.findById(candidateId);
  if (!candidate || !election.candidates.some(c => c._id.toString() === candidateId)) {
    req.flash('error', 'Invalid candidate selection');
    return res.redirect(`/vote/${token}`);
  }

  // Get client information
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  // Create anonymous vote
  const vote = {
    rollNumber: rollNumber || `anonymous_${Date.now()}`,
    candidate: candidateId,
    ipAddress: clientIP,
    userAgent: userAgent,
    timestamp: new Date()
  };

  // Add vote to election
  election.anonymousVotes.push(vote);
  await election.save();

  // Log the voting activity
  await SystemLog.create({
    action: 'ANONYMOUS_VOTE_CAST',
    details: {
      electionId: election._id,
      candidateId: candidateId,
      rollNumber: rollNumber,
      ipAddress: clientIP
    },
    ipAddress: clientIP,
    userAgent: userAgent
  });

  req.flash('success', 'Your vote has been recorded successfully!');
  res.render('vote/success', {
    title: 'Vote Submitted',
    election,
    candidate
  });
});

/**
 * Generate QR code for election
 */
const generateElectionQR = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  // Check if user is authorized (teacher or admin)
  if (!req.session.user || !['teacher', 'admin'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Find election
  const election = await Election.findById(electionId);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  // Generate access token if not exists
  if (!election.qrCode.accessToken) {
    election.generateQRToken();
    await election.save();
  }

  // Generate QR code
  const votingURL = election.getPublicVotingURL();
  const qrCodeDataURL = await QRCode.toDataURL(votingURL, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  // Update election with QR code data
  election.qrCode.data = qrCodeDataURL;
  await election.save();

  res.json({
    success: true,
    qrCode: qrCodeDataURL,
    votingURL: votingURL,
    accessToken: election.qrCode.accessToken
  });
});

/**
 * Toggle QR code access for election
 */
const toggleQRAccess = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  // Check authorization
  if (!req.session.user || !['teacher', 'admin'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const election = await Election.findById(electionId);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  // Toggle QR access
  election.qrCode.isEnabled = !election.qrCode.isEnabled;
  await election.save();

  res.json({
    success: true,
    qrEnabled: election.qrCode.isEnabled
  });
});

/**
 * Add voting time slot
 */
const addVotingTimeSlot = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const { startTime, endTime } = req.body;

  // Check authorization
  if (!req.session.user || !['teacher', 'admin'].includes(req.session.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const election = await Election.findById(electionId);
  if (!election) {
    return res.status(404).json({ error: 'Election not found' });
  }

  // Validate time slot
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    return res.status(400).json({ error: 'Start time must be before end time' });
  }

  // Add time slot
  election.publicAccess.votingTimeSlots.push({
    startTime: start,
    endTime: end,
    isActive: true
  });

  await election.save();

  res.json({
    success: true,
    message: 'Voting time slot added successfully'
  });
});

module.exports = {
  getPublicVotingPage,
  submitPublicVote,
  generateElectionQR,
  toggleQRAccess,
  addVotingTimeSlot
};

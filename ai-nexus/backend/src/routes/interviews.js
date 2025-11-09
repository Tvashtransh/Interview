import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { Interview } from '../models/Interview.js';
import { AccessToken } from 'livekit-server-sdk';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// SPIKES: Get LiveKit token for spike testing (no auth required)
router.post('/spike/token', async (req, res) => {
  try {
    const { roomName, role } = req.body;
    const interviewId = 'spike-interview-123';

    // Generate LiveKit token
    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `${role}-${Date.now()}`,
      name: role === 'hr' ? 'HR Recruiter' : 'Candidate'
    });

    at.addGrant({
      room: roomName || 'test-room',
      roomJoin: true,
      canPublish: true,
      canSubscribe: true
    });

    const token = await at.toJwt();

    res.json({
      token,
      url: livekitUrl,
      room: roomName || 'test-room'
    });
  } catch (error) {
    console.error('Get spike token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Get all interviews for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let query = {};
    if (role === 'HR_Recruiter') {
      query.hrId = userId;
    } else {
      query.candidateId = userId;
    }

    const interviews = await Interview.find(query)
      .populate('hrId', 'name email')
      .populate('candidateId', 'name email')
      .sort({ scheduledAt: -1 });

    res.json(interviews);
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Schedule new interview
router.post('/schedule', authenticateToken, upload.single('jobDescription'), async (req, res) => {
  try {
    if (req.user.role !== 'HR_Recruiter') {
      return res.status(403).json({ error: 'Only HR can schedule interviews' });
    }

    const { candidateId, scheduledAt } = req.body;
    const hrId = req.user.userId;

    if (!candidateId || !scheduledAt) {
      return res.status(400).json({ error: 'Candidate ID and scheduled time are required' });
    }

    // Handle JD file upload
    let jobDescription = {};
    if (req.file) {
      // In production, upload to cloud storage (S3, etc.)
      jobDescription = {
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname
      };
    } else if (req.body.jobDescriptionText) {
      jobDescription.text = req.body.jobDescriptionText;
    } else {
      return res.status(400).json({ error: 'Job Description is mandatory' });
    }

    const interviewId = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const livekitRoomName = `room-${interviewId}`;

    const interview = new Interview({
      interviewId,
      hrId,
      candidateId,
      jobDescription,
      scheduledAt: new Date(scheduledAt),
      livekitRoomName,
      status: 'scheduled'
    });

    await interview.save();

    res.status(201).json(interview);
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// Get LiveKit access token
router.post('/:interviewId/token', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.userId;

    const interview = await Interview.findOne({ interviewId });
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Verify user is part of this interview
    if (interview.hrId.toString() !== userId && interview.candidateId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const role = interview.hrId.toString() === userId ? 'hr' : 'candidate';
    const participantName = req.user.name;

    // Generate LiveKit token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'LiveKit not configured' });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: participantName
    });

    at.addGrant({
      room: interview.livekitRoomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true
    });

    const token = await at.toJwt();

    res.json({
      token,
      url: livekitUrl,
      room: interview.livekitRoomName
    });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Start interview
router.post('/:interviewId/start', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findOne({ interviewId });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.status = 'in-progress';
    interview.startedAt = new Date();
    await interview.save();

    res.json(interview);
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// Save spike interview data (no auth required for spike testing)
router.post('/spike/save', async (req, res) => {
  try {
    const { roomName, transcripts, qaPairs, hrId, candidateId } = req.body;

    if (!roomName || !transcripts) {
      return res.status(400).json({ error: 'roomName and transcripts are required' });
    }

    // Create or update interview record
    const interviewId = `spike-${roomName}-${Date.now()}`;
    let interview = await Interview.findOne({ livekitRoomName: roomName, status: { $in: ['in-progress', 'completed'] } })
      .sort({ createdAt: -1 });

    if (!interview) {
      // Create new interview record for spike
      interview = new Interview({
        interviewId,
        hrId: hrId || new mongoose.Types.ObjectId(), // Use provided ID or create dummy
        candidateId: candidateId || new mongoose.Types.ObjectId(),
        scheduledAt: new Date(),
        livekitRoomName: roomName,
        status: 'completed',
        transcripts: transcripts.map(t => ({
          role: t.role,
          text: t.text,
          timestamp: new Date(t.timestamp),
          isFinal: t.isFinal !== false
        })),
        completedAt: new Date()
      });
    } else {
      // Update existing interview
      interview.transcripts = transcripts.map(t => ({
        role: t.role,
        text: t.text,
        timestamp: new Date(t.timestamp),
        isFinal: t.isFinal !== false
      }));
      interview.status = 'completed';
      interview.completedAt = new Date();
    }

    // Store Q&A pairs in a custom field (we'll add this to schema if needed)
    interview.qaPairs = qaPairs || [];

    await interview.save();

    res.json({ 
      success: true, 
      interviewId: interview.interviewId,
      message: 'Interview data saved successfully' 
    });
  } catch (error) {
    console.error('Save spike interview error:', error);
    res.status(500).json({ error: 'Failed to save interview data' });
  }
});

export default router;

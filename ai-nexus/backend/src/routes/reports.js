import express from 'express';
import { InterviewReport } from '../models/InterviewReport.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get report by interview ID
router.get('/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const report = await InterviewReport.findOne({ interviewId });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Verify user has access
    if (role === 'HR_Recruiter' && report.hrId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (role === 'Student_Candidate' && report.candidateId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Get all reports for user
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

    const reports = await InterviewReport.find(query)
      .populate('candidateId', 'name email')
      .populate('hrId', 'name email')
      .sort({ generatedAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;


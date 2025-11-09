import mongoose from 'mongoose';

const qaBreakdownSchema = new mongoose.Schema({
  question: { type: String, required: true },
  candidateAnswer: { type: String, required: true },
  idealAnswer: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 10 },
  justification: { type: String, required: true }
}, { _id: false });

const interviewReportSchema = new mongoose.Schema({
  interviewId: { type: String, required: true, unique: true, ref: 'Interview' },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  overallScore: { type: Number, required: true, min: 0, max: 100 },
  aiSummaryHR: { type: String, required: true },
  aiSummaryCandidate: { type: String, required: true },
  qaBreakdown: [qaBreakdownSchema],
  fullTranscript: { type: String },
  jobDescription: { type: String },
  generatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);


import mongoose from 'mongoose';

const transcriptSchema = new mongoose.Schema({
  role: { type: String, enum: ['hr', 'candidate'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
  isFinal: { type: Boolean, default: false }
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  interviewId: { type: String, required: true, unique: true },
  hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobDescription: {
    text: String,
    fileUrl: String,
    fileName: String
  },
  scheduledAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  transcripts: [transcriptSchema],
  livekitRoomName: { type: String },
  completedAt: { type: Date },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport' }
}, {
  timestamps: true
});

export const Interview = mongoose.model('Interview', interviewSchema);


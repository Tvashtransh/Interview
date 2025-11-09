# 🎯 Priority 1: Live Video/Audio Pipeline - Spike Testing Guide

## Goal
Prove that the core live interview pipeline works:
- ✅ Two users connect to LiveKit video room
- ✅ Audio streams via MediaRecorder + WebSocket
- ✅ Chrome Web Speech API transcribes both participants separately
- ✅ Backend logs two separate, live transcripts in console

## Setup Instructions

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```

The backend will:
- Start on `http://localhost:5000`
- WebSocket server on `ws://localhost:5000/ws/audio`
- Log transcripts to console with clear formatting

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Start LiveKit Server (if not using cloud)
```bash
# Install LiveKit server
# See: https://docs.livekit.io/realtime/self-hosting/deployment/

# Or use LiveKit Cloud (free tier available)
# Set LIVEKIT_URL in backend/.env
```

### 4. Configure Environment Variables

**backend/.env:**
```env
PORT=5000
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=ws://localhost:7880
MONGODB_URI=mongodb://localhost:27017/ai-nexus
```

## Testing Steps

### Step 1: Open Two Browser Windows
1. Open Chrome/Edge (Web Speech API support required)
2. Open the spike page: `http://localhost:3000/spike/live-interview`
3. Open the same page in an incognito window (or different browser profile)

### Step 2: Configure First User (HR)
- Select role: **HR**
- Room name: `test-room-123`
- Click **"Start Interview"**
- Grant microphone permissions
- Wait for video room to connect

### Step 3: Configure Second User (Candidate)
- Select role: **Candidate**
- Room name: `test-room-123` (MUST match!)
- Click **"Start Interview"**
- Grant microphone permissions
- Wait for video room to connect

### Step 4: Test Audio Streaming
1. **HR speaks**: "Hello, welcome to the interview. Can you tell me about yourself?"
2. **Check backend console**: Should see:
   ```
   ================================================================================
   📝 👔 HR TRANSCRIPT (FINAL) - Interview: spike-interview-123
   ⏰ Time: 2024-01-01T12:00:00.000Z
   💬 Text: "Hello, welcome to the interview. Can you tell me about yourself?"
   ================================================================================
   ```

3. **Candidate speaks**: "Thank you. I'm a software engineer with 5 years of experience..."
4. **Check backend console**: Should see:
   ```
   ================================================================================
   📝 🎓 CANDIDATE TRANSCRIPT (FINAL) - Interview: spike-interview-123
   ⏰ Time: 2024-01-01T12:00:05.000Z
   💬 Text: "Thank you. I'm a software engineer with 5 years of experience..."
   ================================================================================
   ```

### Step 5: Verify Frontend Transcripts
- Both users should see transcripts appearing in real-time
- HR sees their own transcripts in blue
- Candidate sees their own transcripts in purple
- Each user also sees the other participant's transcripts

## Success Criteria ✅

- [ ] Both users can see each other in video
- [ ] Audio is streaming (check browser console for MediaRecorder logs)
- [ ] WebSocket connection established (check backend console: "✅ HR joined" / "✅ CANDIDATE joined")
- [ ] Speech recognition active (check frontend status indicator)
- [ ] **HR transcripts logged separately in backend console**
- [ ] **Candidate transcripts logged separately in backend console**
- [ ] Transcripts appear in real-time on frontend
- [ ] Final transcripts saved to MongoDB (optional for spike)

## Troubleshooting

### "Speech Recognition not supported"
- Use Chrome, Edge, or Safari
- Ensure HTTPS or localhost (required for Web Speech API)

### "WebSocket connection failed"
- Check backend is running on port 5000
- Check firewall/network settings
- Verify WebSocket path: `ws://localhost:5000/ws/audio`

### "LiveKit connection failed"
- Verify LiveKit server is running
- Check LIVEKIT_URL in backend/.env
- For local testing, use LiveKit Cloud or Docker setup

### "No transcripts appearing"
- Check browser console for errors
- Verify microphone permissions granted
- Check backend console for WebSocket messages
- Ensure Chrome Web Speech API is supported

## Next Steps After Success

Once this spike works:
1. ✅ Priority 1 complete - Core pipeline proven
2. Move to Priority 2: AI Analysis Pipeline
3. Then Priority 3: UI Shell (Dashboards, Reports)


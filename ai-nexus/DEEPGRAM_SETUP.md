# 🎤 Deepgram Integration Setup

## Overview

AI-NEXUS now uses **Deepgram** for real-time speech-to-text transcription instead of Chrome Web Speech API. This provides:
- ✅ Higher accuracy
- ✅ Better reliability
- ✅ Continuous transcription (no stopping after a few words)
- ✅ Works across all browsers
- ✅ Professional-grade transcription

## Setup

### 1. Get Deepgram API Key

1. Sign up at [deepgram.com](https://deepgram.com)
2. Go to your dashboard
3. Create a new API key
4. Copy the API key

### 2. Add to Backend .env

Edit `ai-nexus/backend/.env` and add:

```env
DEEPGRAM_API_KEY=your-deepgram-api-key-here
```

**For this project, use:**
```env
DEEPGRAM_API_KEY=4044321658d2a2067d82f4df183cdc4d8b70176e
```

### 3. Install Dependencies

```bash
cd ai-nexus/backend
npm install
```

This will install `@deepgram/sdk` automatically.

### 4. Restart Backend

```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 AI-NEXUS Backend running on port 5000
📡 WebSocket server ready at ws://localhost:5000/ws/audio
```

## How It Works

### Flow:

1. **Frontend** → Captures audio via MediaRecorder
2. **Frontend** → Sends audio chunks to backend via WebSocket
3. **Backend** → Forwards audio to Deepgram
4. **Deepgram** → Transcribes audio in real-time
5. **Backend** → Receives transcripts from Deepgram
6. **Backend** → Sends transcripts to frontend via WebSocket
7. **Frontend** → Displays transcripts in UI

### Architecture:

```
┌─────────────┐      Audio Chunks      ┌─────────────┐      Audio      ┌─────────────┐
│  Frontend   │ ──────────────────────> │   Backend   │ ──────────────> │  Deepgram   │
│ (Browser)   │                         │ (Node.js)   │                 │   (Cloud)   │
└─────────────┘                         └─────────────┘                 └─────────────┘
      ▲                                        │                                │
      │                                        │                                │
      │         Transcripts                    │         Transcripts            │
      └────────────────────────────────────────┴────────────────────────────────┘
```

## Testing

1. **Start Backend:**
   ```bash
   cd ai-nexus/backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd ai-nexus/frontend
   npm run dev
   ```

3. **Open Browser:**
   - Go to: `http://localhost:3000/spike/live-interview`
   - Select role (HR or Candidate)
   - Enter room name
   - Click "Start Interview"

4. **Start Speaking:**
   - Grant microphone permissions
   - Speak into your microphone
   - Transcripts should appear in real-time!

## Backend Console Output

You should see:
```
✅ HR joined interview spike-interview-123
✅ Deepgram connection established for HR
✅ Deepgram connection opened for hr (spike-interview-123)
📝 👔 HR TRANSCRIPT (DEEPGRAM INTERIM) - "Hello"
📝 👔 HR TRANSCRIPT (DEEPGRAM FINAL) - "Hello, welcome to the interview"
⏰ Time: 2024-01-01T12:00:00.000Z
💬 Text: "Hello, welcome to the interview"
🎯 Confidence: 95.2%
```

## Troubleshooting

### "DEEPGRAM_API_KEY not found"
- ✅ Check `backend/.env` file exists
- ✅ Verify `DEEPGRAM_API_KEY=...` is in the file
- ✅ Restart backend after adding the key

### "Failed to create Deepgram connection"
- ✅ Check API key is correct
- ✅ Verify you have Deepgram credits/quota
- ✅ Check internet connection

### No transcripts appearing
- ✅ Check backend console for Deepgram connection logs
- ✅ Verify microphone permissions granted
- ✅ Check WebSocket connection is open
- ✅ Look for errors in browser console

### Audio not being sent
- ✅ Check MediaRecorder is working
- ✅ Verify WebSocket is connected
- ✅ Check browser console for errors

## Benefits Over Chrome Web Speech API

| Feature | Chrome Web Speech | Deepgram |
|---------|------------------|----------|
| Accuracy | Good | Excellent |
| Reliability | Stops after few words | Continuous |
| Browser Support | Chrome/Edge/Safari only | All browsers |
| Offline | Yes | No (requires internet) |
| Cost | Free | Paid (but more reliable) |
| API Keys | Not needed | Required |

## Next Steps

- ✅ Deepgram is now integrated
- ✅ Audio streaming works
- ✅ Real-time transcription active
- ✅ Transcripts saved to MongoDB
- ✅ Separate transcripts for HR and Candidate

Enjoy professional-grade transcription! 🎉


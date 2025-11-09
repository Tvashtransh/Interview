# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Issue 0: "Cannot read properties of undefined (reading 'name')" - LiveKit Error Handler

**Symptoms:**
- Alert shows: "LiveKit connection error: Cannot read properties of undefined (reading 'name')"
- LiveKit room not connecting
- Video/camera not working

**Solutions:**

1. **This error is now fixed** - The error handler now safely handles undefined errors
2. **Test transcription separately** - Transcription works WITHOUT LiveKit:
   - Open: `http://localhost:3002/spike/test-transcription`
   - Click "Start Listening"
   - If transcripts appear → Transcription is working! ✅
   - The issue is only LiveKit video connection

3. **Check LiveKit Setup:**
   - Verify `backend/.env` has correct LiveKit credentials
   - Check if LiveKit server is running (Cloud or local)
   - See Issue 1 below for detailed LiveKit troubleshooting

**Key Point:** Transcription (the hard part) should work even if LiveKit doesn't! Test it separately.

### Issue 1: "Disconnected" - LiveKit Not Connecting

**Symptoms:**
- Status shows "Disconnected"
- No video/camera
- No microphone
- No transcription

**Solutions:**

1. **Check LiveKit Server:**
   ```bash
   # If using LiveKit Cloud, verify your credentials in backend/.env
   # If using local server, check if it's running:
   # Docker: docker ps (should see livekit container)
   # Binary: Check if process is running
   ```

2. **Verify Backend .env:**
   ```env
   LIVEKIT_API_KEY=your-actual-key
   LIVEKIT_API_SECRET=your-actual-secret
   LIVEKIT_URL=wss://your-project.livekit.cloud
   # OR for local: ws://localhost:7880
   ```

3. **Test LiveKit Connection:**
   - Check backend console for token generation errors
   - Verify token is being generated successfully
   - Check browser console for LiveKit connection errors

4. **Check Network:**
   - LiveKit Cloud requires internet connection
   - Local LiveKit requires server running on port 7880
   - Check firewall allows WebSocket connections

### Issue 2: No Camera/Microphone

**Symptoms:**
- Camera not showing
- Microphone not working
- Browser asking for permissions repeatedly

**Solutions:**

1. **Grant Permissions:**
   - Click the lock icon in browser address bar
   - Allow camera and microphone
   - Refresh the page

2. **Check Browser:**
   - Use Chrome, Edge, or Safari (best Web Speech API support)
   - Must be HTTPS or localhost (required for media access)

3. **Check Device:**
   - Verify camera/microphone work in other apps
   - Check system permissions (Windows Settings > Privacy)

4. **Browser Console:**
   - Look for permission errors
   - Check for "getUserMedia" errors

### Issue 3: No Transcription

**Symptoms:**
- Speech recognition shows "Active" but no transcripts
- No text appearing in transcripts panel

**Solutions:**

1. **Check Browser:**
   - Must use Chrome, Edge, or Safari
   - Web Speech API not supported in Firefox

2. **Check Permissions:**
   - Microphone permission must be granted
   - Check browser console for speech recognition errors

3. **Check Console:**
   - Look for "Speech recognition error" messages
   - Verify recognition is actually starting

4. **Test Speech Recognition:**
   - Open browser console
   - Should see: "🎙️ Speech recognition started"
   - Speak clearly and check for errors

### Issue 4: WebSocket Closed

**Symptoms:**
- Status shows "WebSocket: Closed"
- Transcripts not being sent to backend

**Solutions:**

1. **Check Backend:**
   - Verify backend is running on port 5000
   - Check backend console for WebSocket connection logs
   - Should see: "🔌 New WebSocket connection"

2. **Check Network:**
   - Verify WebSocket URL is correct
   - Check firewall allows WebSocket (port 5000)
   - Try accessing: `ws://localhost:5000/ws/audio` in browser console

3. **Check CORS:**
   - Backend CORS should allow your frontend port
   - Restart backend after changing CORS settings

### Issue 5: Backend Not Running

**Symptoms:**
- "Failed to get LiveKit token"
- CORS errors
- Connection refused errors

**Solutions:**

1. **Start Backend:**
   ```bash
   cd ai-nexus/backend
   npm install
   npm run dev
   ```

2. **Check Port:**
   - Verify port 5000 is not in use
   - Check: `netstat -ano | findstr :5000` (Windows)
   - Or: `lsof -i :5000` (Mac/Linux)

3. **Check .env:**
   - Verify .env file exists in backend/
   - Check all required variables are set
   - Restart backend after changing .env

### Issue 6: LiveKit Token Generation Fails

**Symptoms:**
- "Failed to get LiveKit token" alert
- Backend returns 500 error

**Solutions:**

1. **Check LiveKit Credentials:**
   ```bash
   # In backend/.env, verify:
   LIVEKIT_API_KEY=correct-key
   LIVEKIT_API_SECRET=correct-secret
   LIVEKIT_URL=correct-url
   ```

2. **Test Token Generation:**
   ```bash
   # In backend console, should see token generation
   # Check for errors in backend logs
   ```

3. **Verify LiveKit Server:**
   - If using LiveKit Cloud: Check dashboard for active project
   - If using local: Verify server is running

### Issue 7: Two Laptops Can't Connect

**Symptoms:**
- Laptop 2 can't access Laptop 1's backend
- Connection timeout errors

**Solutions:**

1. **Check Same Network:**
   - Both laptops must be on same WiFi
   - Check IP addresses are on same subnet

2. **Check Firewall:**
   - Windows: Allow port 5000 in Windows Firewall
   - Mac: System Preferences > Security > Firewall

3. **Use Correct IP:**
   - Laptop 1: Find IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Laptop 2: Use `http://LAPTOP1_IP:5000` not `localhost:5000`

4. **Update Frontend Config:**
   - Laptop 2: Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://LAPTOP1_IP:5000
   NEXT_PUBLIC_WS_URL=ws://LAPTOP1_IP:5000
   ```

---

## 🔍 Debugging Steps

### Step 1: Check Backend
```bash
cd ai-nexus/backend
npm run dev
# Should see:
# ✅ Connected to MongoDB
# 🚀 AI-NEXUS Backend running on port 5000
# 📡 WebSocket server ready at ws://localhost:5000/ws/audio
```

### Step 2: Check Frontend
```bash
cd ai-nexus/frontend
npm run dev
# Should see:
# Ready on http://localhost:3000 (or 3002, etc.)
```

### Step 3: Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for:
  - ✅ WebSocket connected
  - ✅ Connected to LiveKit room
  - 🎙️ Speech recognition started
  - Any error messages

### Step 4: Check Network Tab
- Open DevTools > Network tab
- Look for:
  - `/api/interviews/spike/token` - Should return 200
  - WebSocket connection - Should show "101 Switching Protocols"

### Step 5: Test LiveKit Directly
```bash
# Test if LiveKit server is accessible
# For LiveKit Cloud: Check dashboard
# For local: curl http://localhost:7880
```

---

## ✅ Quick Health Check

Run these checks:

1. **Backend running?**
   ```bash
   curl http://localhost:5000/api/health
   # Should return: {"status":"OK","message":"AI-NEXUS Backend API"}
   ```

2. **LiveKit token works?**
   ```bash
   curl -X POST http://localhost:5000/api/interviews/spike/token \
     -H "Content-Type: application/json" \
     -d '{"roomName":"test","role":"hr"}'
   # Should return token and URL
   ```

3. **WebSocket works?**
   - Open browser console
   - Run: `new WebSocket('ws://localhost:5000/ws/audio')`
   - Should connect without errors

4. **Media permissions?**
   - Browser should prompt for camera/microphone
   - Check browser settings if not prompting

---

## 🆘 Still Not Working?

1. **Check all console logs** (backend + frontend + browser)
2. **Verify all .env files** are correct
3. **Restart all services** (backend, frontend, LiveKit)
4. **Clear browser cache** and try again
5. **Try different browser** (Chrome recommended)

---

## 📝 Common Error Messages

| Error | Solution |
|-------|----------|
| "Failed to get LiveKit token" | Check backend running + LiveKit credentials |
| "CORS policy" | Backend CORS fixed - restart backend |
| "WebSocket closed" | Check backend WebSocket server running |
| "Speech recognition not supported" | Use Chrome/Edge/Safari |
| "Media permission denied" | Grant permissions in browser |
| "Connection refused" | Backend not running or wrong port |


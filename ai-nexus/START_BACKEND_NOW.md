# 🚀 START BACKEND NOW - Step by Step

## The Problem
You're getting `ERR_CONNECTION_REFUSED` because the backend is not running.

## ✅ Solution: Start Backend (Do This Now!)

### Step 1: Open Command Prompt or PowerShell

### Step 2: Run These Commands

```bash
cd d:\Codes\Interview\ai-nexus\backend
npm install
npm run dev
```

### Step 3: Wait for This Message

You MUST see:
```
✅ Connected to MongoDB (or MongoDB error - that's OK)
🚀 AI-NEXUS Backend running on port 5000
📡 WebSocket server ready at ws://localhost:5000/ws/audio
```

### Step 4: Keep Terminal Open!

**IMPORTANT:** Don't close this terminal! The backend must keep running.

### Step 5: Test Backend

Open in browser: `http://localhost:5000/api/health`

Should see: `{"status":"OK","message":"AI-NEXUS Backend API"}`

### Step 6: Now Try Interview Again

1. Go to: `http://localhost:3002/spike/live-interview`
2. Click "Start Interview"
3. Should work! ✅

---

## Quick Check: Is Backend Running?

**Check if port 5000 is in use:**
```bash
netstat -ano | findstr :5000
```

If you see output, backend is running!
If no output, backend is NOT running - start it!

---

## If Backend Won't Start

**Check for errors in terminal:**
- MongoDB connection error? (That's OK - server will still work)
- Missing dependencies? Run: `npm install`
- Port already in use? Change port in `.env`

---

**The backend MUST be running for the frontend to work!** 🚀





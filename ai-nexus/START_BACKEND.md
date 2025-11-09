# 🚀 Quick Start: Backend Server

## The Error You're Seeing

```
Failed to start interview: Failed to fetch
```

**This means:** The backend server is not running!

## Solution: Start the Backend

### Step 1: Open Terminal/Command Prompt

### Step 2: Navigate to Backend Directory

```bash
cd d:\Codes\Interview\ai-nexus\backend
```

### Step 3: Install Dependencies (if not done)

```bash
npm install
```

### Step 4: Start Backend Server

```bash
npm run dev
```

### Step 5: Verify It's Running

You should see:
```
✅ Connected to MongoDB
🚀 AI-NEXUS Backend running on port 5000
📡 WebSocket server ready at ws://localhost:5000/ws/audio
```

### Step 6: Keep This Terminal Open!

**Important:** Don't close this terminal! The backend must keep running.

### Step 7: Now Start Frontend (New Terminal)

Open a **NEW** terminal window:

```bash
cd d:\Codes\Interview\ai-nexus\frontend
npm run dev
```

### Step 8: Test

1. Open browser: `http://localhost:3000/spike/live-interview`
2. Click "Start Interview"
3. Should work now! ✅

---

## Quick Checklist

- [ ] Backend terminal is open and running
- [ ] You see: `🚀 AI-NEXUS Backend running on port 5000`
- [ ] Frontend is running in separate terminal
- [ ] Browser is open to the interview page

---

## Common Issues

**"Port 5000 already in use":**
- Another process is using port 5000
- Change port in `backend/.env`: `PORT=5001`
- Update frontend `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5001`

**"Cannot find module":**
- Run: `npm install` in backend directory

**"MongoDB connection error":**
- MongoDB not running
- Or update `MONGODB_URI` in `backend/.env` to use MongoDB Atlas

---

**The backend MUST be running for the frontend to work!** 🚀


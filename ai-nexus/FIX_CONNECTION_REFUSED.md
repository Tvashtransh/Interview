# 🔧 Fix: ERR_CONNECTION_REFUSED Error

## Error Message
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
❌ Error starting room: TypeError: Failed to fetch
```

## What This Means

The backend server is **NOT running**. The frontend is trying to connect to `http://localhost:5000` but nothing is listening on that port.

## ✅ Solution: Start the Backend

### Option 1: Use the Startup Script (Easiest)

**Windows:**
```bash
cd d:\Codes\Interview\ai-nexus
START_SERVERS.bat
```

This will open two windows - one for backend, one for frontend.

### Option 2: Manual Start

**Step 1: Start Backend (Terminal 1)**
```bash
cd d:\Codes\Interview\ai-nexus\backend
npm run dev
```

**Wait for this message:**
```
✅ Connected to MongoDB
🚀 AI-NEXUS Backend running on port 5000
📡 WebSocket server ready at ws://localhost:5000/ws/audio
```

**Step 2: Start Frontend (Terminal 2 - NEW WINDOW)**
```bash
cd d:\Codes\Interview\ai-nexus\frontend
npm run dev
```

**Step 3: Test**
- Open: `http://localhost:3000/spike/live-interview` (or 3002)
- Click "Start Interview"
- Should work now! ✅

## Quick Verification

**Test if backend is running:**
```bash
curl http://localhost:5000/api/health
```

**OR** open in browser: `http://localhost:5000/api/health`

Should return: `{"status":"OK","message":"AI-NEXUS Backend API"}`

## Common Issues

### Backend Won't Start

**Check:**
1. MongoDB running? (or using MongoDB Atlas)
2. `.env` file exists in `backend/` directory?
3. Dependencies installed? Run: `npm install` in backend folder

### Port 5000 Already in Use

**Solution:**
1. Find what's using port 5000:
   ```bash
   netstat -ano | findstr :5000
   ```
2. Kill that process OR change backend port:
   - Edit `backend/.env`: `PORT=5001`
   - Edit `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5001`

### MongoDB Connection Error

**Solution:**
- If using local MongoDB: Start MongoDB service
- If using MongoDB Atlas: Update `MONGODB_URI` in `backend/.env`

## Checklist

Before clicking "Start Interview":
- [ ] Backend terminal is open and running
- [ ] You see: `🚀 AI-NEXUS Backend running on port 5000`
- [ ] Frontend is running (separate terminal)
- [ ] Test: `http://localhost:5000/api/health` works

---

**The backend MUST be running before the frontend can connect!** 🚀





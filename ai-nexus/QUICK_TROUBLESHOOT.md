# 🔧 Quick Troubleshooting: "Failed to fetch" Error

## Error Message
```
Failed to start interview: Failed to fetch
```

## Common Causes & Solutions

### 1. Backend Not Running ⚠️

**Check:**
```bash
# Check if backend is running on port 5000
netstat -ano | findstr :5000
# OR
curl http://localhost:5000/api/health
```

**Solution:**
```bash
cd ai-nexus/backend
npm install
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 AI-NEXUS Backend running on port 5000
📡 WebSocket server ready at ws://localhost:5000/ws/audio
```

### 2. Backend Running on Different Port

**Check:**
- Look at backend console output
- Check `backend/.env` for `PORT=...`

**Solution:**
- Update frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT
NEXT_PUBLIC_WS_URL=ws://localhost:YOUR_PORT
```

### 3. CORS Issue

**Check:**
- Backend console for CORS errors
- Browser console for CORS policy errors

**Solution:**
- Backend CORS is already configured
- Restart backend after any changes

### 4. Firewall Blocking

**Check:**
- Windows Firewall might be blocking port 5000

**Solution:**
- Allow port 5000 in Windows Firewall
- Or temporarily disable firewall for testing

### 5. Backend Crash on Startup

**Check:**
- Backend console for error messages
- Common issues:
  - MongoDB not running
  - Missing environment variables
  - Port already in use

**Solution:**
```bash
# Check MongoDB
# Windows: Check if MongoDB service is running
# Or use MongoDB Atlas connection string

# Check .env file exists
cd ai-nexus/backend
dir .env

# Check for missing variables
# Should have at least:
# - PORT=5000
# - DEEPGRAM_API_KEY=...
# - MONGODB_URI=...
```

## Quick Test

1. **Test Backend Health:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"OK","message":"AI-NEXUS Backend API"}`

2. **Test from Browser:**
   - Open: `http://localhost:5000/api/health`
   - Should see JSON response

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for network errors
   - Check if request to `/api/interviews/spike/token` is being made

## Step-by-Step Fix

1. **Stop everything:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)

2. **Start Backend:**
   ```bash
   cd ai-nexus/backend
   npm run dev
   ```
   Wait for: `🚀 AI-NEXUS Backend running on port 5000`

3. **Start Frontend (new terminal):**
   ```bash
   cd ai-nexus/frontend
   npm run dev
   ```

4. **Test:**
   - Open: `http://localhost:3000/spike/live-interview`
   - Click "Start Interview"
   - Should work now!

## Still Not Working?

Check:
- ✅ Backend console for errors
- ✅ Browser console (F12) for errors
- ✅ Network tab in DevTools
- ✅ Backend `.env` file exists and has required variables
- ✅ MongoDB is running (or using Atlas)

---

**Most Common Issue:** Backend not running! Make sure backend is started first. 🚀


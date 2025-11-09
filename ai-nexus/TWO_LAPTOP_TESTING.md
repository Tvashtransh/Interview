# 💻 Two Laptop Testing Guide

## 🎯 Quick Answer

**No, the candidate does NOT need separate LiveKit keys!**

Both HR and Candidate use the **same LiveKit server** and **same API keys**. They just connect to the **same room** with different roles.

---

## 📋 Setup Overview

```
┌─────────────────┐         ┌─────────────────┐
│  Laptop 1 (HR)  │         │ Laptop 2 (Candidate) │
│                 │         │                      │
│  ✅ Backend     │◄────────┤  Frontend Only       │
│  ✅ Frontend    │         │  (points to Laptop 1) │
│  ✅ LiveKit Keys│         │                      │
└─────────────────┘         └─────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │ LiveKit Cloud│
              │ (Same Server)│
              └─────────────┘
```

---

## 🚀 Step-by-Step Setup

### **Step 1: Laptop 1 (HR) - Setup Backend & Frontend**

1. **Find Your IP Address:**
   ```bash
   # Windows:
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   # Mac/Linux:
   ifconfig
   # Look for "inet" address
   ```
   **Note this IP address!** (e.g., `192.168.1.100`)

2. **Configure Backend:**
   - Edit `ai-nexus/backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ai-nexus
   
   # LiveKit Configuration (ONE SET OF KEYS FOR BOTH!)
   LIVEKIT_API_KEY=your-api-key-here
   LIVEKIT_API_SECRET=your-api-secret-here
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

3. **Start Backend:**
   ```bash
   cd ai-nexus/backend
   npm install
   npm run dev
   ```
   ✅ Should see: `🚀 AI-NEXUS Backend running on port 5000`

4. **Start Frontend:**
   ```bash
   cd ai-nexus/frontend
   npm install
   npm run dev
   ```
   ✅ Should see: `Ready on http://localhost:3000` (or 3002, etc.)

5. **Open Browser (Laptop 1):**
   - Go to: `http://localhost:3000/spike/live-interview`
   - Select Role: **HR**
   - Enter Room Name: `demo-interview-001` (or any name you want)
   - Click **"Start Interview"**

---

### **Step 2: Laptop 2 (Candidate) - Setup Frontend Only**

1. **Make sure both laptops are on the same WiFi network!**

2. **Configure Frontend to point to Laptop 1:**
   - Create/edit: `ai-nexus/frontend/.env.local`
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
   NEXT_PUBLIC_WS_URL=ws://192.168.1.100:5000
   ```
   **Replace `192.168.1.100` with Laptop 1's actual IP address!**

3. **Start Frontend:**
   ```bash
   cd ai-nexus/frontend
   npm install
   npm run dev
   ```

4. **Open Browser (Laptop 2):**
   - Go to: `http://localhost:3000/spike/live-interview`
   - Select Role: **Candidate**
   - Enter Room Name: `demo-interview-001` (**SAME as Laptop 1!**)
   - Click **"Start Interview"**

---

## ✅ What Should Happen

1. **Both laptops connect to the same LiveKit room**
2. **You see each other's video feeds**
3. **Both can speak and see transcripts**
4. **Backend logs show separate HR and Candidate transcripts**

---

## 🔍 Verification Checklist

### **Laptop 1 (HR):**
- [ ] Backend running on port 5000
- [ ] Frontend running (any port)
- [ ] Browser shows "Connected" status
- [ ] Can see own video
- [ ] Speech recognition shows "Active"

### **Laptop 2 (Candidate):**
- [ ] Frontend running
- [ ] `.env.local` points to Laptop 1's IP
- [ ] Browser shows "Connected" status
- [ ] Can see own video
- [ ] Can see HR's video (after HR connects)
- [ ] Speech recognition shows "Active"

### **Backend Console (Laptop 1):**
- [ ] Should see: `✅ HR joined interview spike-interview-123`
- [ ] Should see: `✅ CANDIDATE joined interview spike-interview-123`
- [ ] Should see separate transcript logs for HR and Candidate

---

## 🐛 Troubleshooting

### **"Failed to get LiveKit token" (Laptop 2)**
- ✅ Check Laptop 1's backend is running
- ✅ Check `.env.local` has correct IP address
- ✅ Try accessing `http://LAPTOP1_IP:5000/api/health` from Laptop 2's browser
- ✅ Check both laptops on same network

### **"CORS policy" error**
- ✅ Backend CORS is already configured to allow all localhost ports
- ✅ Restart backend after any changes

### **Can't see each other's video**
- ✅ Check both entered the **same room name**
- ✅ Check LiveKit credentials are correct in backend/.env
- ✅ Check browser console for LiveKit connection errors

### **WebSocket connection failed**
- ✅ Check Windows Firewall allows port 5000
- ✅ Verify WebSocket URL in `.env.local` uses `ws://` not `http://`
- ✅ Check backend console for WebSocket connection logs

### **Transcription not working**
- ✅ Check microphone permissions granted on both laptops
- ✅ Check browser console for speech recognition errors
- ✅ Try the test page: `/spike/test-transcription` on both laptops

---

## 🎯 Quick Test Script

**Laptop 1 (HR):**
```bash
# Terminal 1: Backend
cd ai-nexus/backend
npm run dev

# Terminal 2: Frontend
cd ai-nexus/frontend
npm run dev

# Browser: http://localhost:3000/spike/live-interview
# Role: HR, Room: demo-001
```

**Laptop 2 (Candidate):**
```bash
# Terminal: Frontend
cd ai-nexus/frontend
npm run dev

# Browser: http://localhost:3000/spike/live-interview
# Role: Candidate, Room: demo-001
```

---

## 📝 Important Notes

1. **Same LiveKit Keys:** Both HR and Candidate use the same LiveKit server/keys. The keys are stored in Laptop 1's backend `.env` file.

2. **Same Room Name:** Both must enter the **exact same room name** to connect to the same room.

3. **Network:** Both laptops must be on the **same WiFi network**.

4. **Firewall:** Laptop 1's firewall must allow incoming connections on port 5000.

5. **No Authentication:** The spike pages work without JWT/auth - perfect for testing!

---

## 🎬 Demo Flow

1. **Laptop 1 (HR):** Start interview, wait for connection
2. **Laptop 2 (Candidate):** Start interview, should see HR's video
3. **HR speaks:** "Hello, can you hear me?"
4. **Candidate speaks:** "Yes, I can hear you clearly"
5. **Check Backend Console:** Should see separate transcripts:
   ```
   📝 👔 HR TRANSCRIPT - "Hello, can you hear me?"
   📝 🎓 CANDIDATE TRANSCRIPT - "Yes, I can hear you clearly"
   ```

---

## ✅ Success Indicators

- ✅ Both see each other's video
- ✅ Both can speak and see their own transcripts
- ✅ Backend console shows separate HR/Candidate transcripts
- ✅ WebSocket status shows "Open" on both
- ✅ Speech Recognition shows "Active" on both

---

**That's it! You're ready to test with two laptops! 🚀**


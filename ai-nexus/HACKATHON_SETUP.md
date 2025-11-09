# 🏆 Hackathon Setup Guide - Two Laptop Configuration

## ✅ What's COMPLETED

### 1. **Video Conferencing** ✅
- LiveKit integration working
- Both HR and Candidate can join the same room
- Video and audio streaming between laptops

### 2. **Transcription** ✅
- **Browser Speech Recognition**: Works on both laptops (no backend needed)
- **Deepgram Integration**: Optional, better accuracy (requires backend + API key)
- **Cross-participant transcripts**: Candidate's voice transcribed and visible on HR laptop
- **Real-time display**: Transcripts appear in "Live Transcripts" panel

### 3. **AI Answer Generation** ✅
- HR asks question → AI generates ideal answer immediately
- Uses Ollama (cloud or local)
- Ideal answer appears in "Real-time Q&A Analysis" panel

### 4. **Answer Comparison & Scoring** ✅
- Candidate answers → Automatically compared to ideal answer
- Score (0-10) generated with justification
- Both answers displayed side-by-side

### 5. **Backend WebSocket** ✅
- Broadcasts transcripts between participants
- Routes audio to Deepgram (if configured)
- Handles cross-laptop communication

---

## ⚠️ What's LEFT / Needs Testing

### 1. **Network Configuration** ⚠️
- Need to ensure both laptops on same WiFi network
- Firewall rules may need adjustment
- IP address configuration for candidate laptop

### 2. **Complete Transcription** ⚠️
- Currently fixed: Transcripts now accumulate properly
- Full paragraphs should be captured (2-second delay after speech ends)

### 3. **Interruption Handling** ⚠️
- Currently fixed: New questions process even if previous unanswered
- HR can interrupt and ask new questions

### 4. **Testing** ⚠️
- Need to test full flow: HR asks → Candidate answers → Scoring
- Need to verify transcripts appear on HR laptop from candidate

---

## 🚀 Hackathon Setup Instructions

### **Laptop 1 (HR - Judges PC)**

#### Step 1: Find Your IP Address
```bash
# Windows PowerShell:
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)

# Or run this command:
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object IPAddress
```

#### Step 2: Start Backend
```bash
cd ai-nexus/backend
npm install  # Only first time
npm start
```
✅ Backend running on `http://localhost:5000`

**Important:** Note your IP address (e.g., `192.168.1.100`)

#### Step 3: Start Frontend
```bash
cd ai-nexus/frontend
npm install  # Only first time
npm run dev
```
✅ Frontend running on `http://localhost:3000`

#### Step 4: Configure Environment (if needed)
Create/edit `ai-nexus/backend/.env`:
```env
PORT=5000
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud

# Ollama Configuration
OLLAMA_API_KEY=your_ollama_api_key
OLLAMA_MODEL=qwen3-coder:480b-cloud
OLLAMA_CLOUD_URL=https://ollama.com

# Optional: Deepgram (for better transcription)
DEEPGRAM_API_KEY=your_deepgram_key
```

#### Step 5: Open Browser
- Go to: `http://localhost:3000/spike/live-interview`
- Select role: **HR**
- Enter room name: `hackathon-demo-2024` (or any name)
- Click **"Start Interview"**

---

### **Laptop 2 (Candidate)**

#### Step 1: Connect to Same WiFi
- Make sure both laptops are on the **same WiFi network**

#### Step 2: Configure Frontend to Point to HR Laptop
Create/edit `ai-nexus/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://LAPTOP1_IP:5000
NEXT_PUBLIC_WS_URL=ws://LAPTOP1_IP:5000
```
**Replace `LAPTOP1_IP` with the IP address from Laptop 1** (e.g., `192.168.1.100`)

Example:
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
NEXT_PUBLIC_WS_URL=ws://192.168.1.100:5000
```

#### Step 3: Start Frontend
```bash
cd ai-nexus/frontend
npm install  # Only first time
npm run dev
```
✅ Frontend running on `http://localhost:3000`

#### Step 4: Open Browser
- Go to: `http://localhost:3000/spike/live-interview`
- Select role: **Candidate**
- Enter room name: `hackathon-demo-2024` (**SAME as HR laptop!**)
- Click **"Start Interview"**

---

## 🎯 How It Works

### Flow:
1. **HR asks question** → 
   - Question transcribed on HR laptop
   - AI generates ideal answer immediately
   - Ideal answer appears in "Real-time Q&A Analysis" panel

2. **Candidate answers** →
   - Candidate's voice transcribed on candidate laptop
   - Transcript sent to backend via WebSocket
   - Backend broadcasts to HR laptop
   - HR laptop displays candidate's transcript in "Live Transcripts" panel

3. **Scoring** →
   - When candidate finishes answering
   - HR laptop automatically compares candidate answer to ideal answer
   - Score (0-10) generated with justification
   - Both answers displayed side-by-side

---

## 🔧 Troubleshooting

### **"Failed to load resource: net::ERR_CONNECTION_REFUSED"**
- ✅ Check backend is running on Laptop 1
- ✅ Check both laptops on same WiFi
- ✅ Verify IP address is correct in `.env.local`
- ✅ Test: Open `http://LAPTOP1_IP:5000/api/health` from Laptop 2 browser

### **"Cannot connect to backend"**
- ✅ Check Windows Firewall allows port 5000
- ✅ Run on Laptop 1: `netsh advfirewall firewall add rule name="Node.js Backend" dir=in action=allow protocol=TCP localport=5000`

### **"WebSocket connection failed"**
- ✅ Check backend WebSocket server is running
- ✅ Verify `NEXT_PUBLIC_WS_URL` in `.env.local` is correct
- ✅ Check firewall allows WebSocket connections

### **"Transcription not showing on HR laptop"**
- ✅ Check WebSocket is connected (status bar should show "WebSocket: Open")
- ✅ Check browser console (F12) for errors
- ✅ Verify candidate is speaking clearly
- ✅ Check backend console for transcript messages

### **"AI answer not generating"**
- ✅ Check backend is running
- ✅ Check backend console for Ollama API calls
- ✅ Verify `OLLAMA_API_KEY` is set in `backend/.env`
- ✅ Check browser Network tab for API request errors

### **"Video not showing"**
- ✅ Check LiveKit is configured in `backend/.env`
- ✅ Verify both laptops joined same room name
- ✅ Check browser permissions (camera/microphone)
- ✅ Check LiveKit status in UI (should show "Connected")

---

## 📋 Quick Checklist

### Before Hackathon:
- [ ] Backend running on HR laptop
- [ ] Frontend running on both laptops
- [ ] `.env.local` configured on candidate laptop with HR laptop IP
- [ ] Both laptops on same WiFi network
- [ ] LiveKit keys configured in `backend/.env`
- [ ] Ollama API key configured (for cloud models)
- [ ] Test connection: Candidate laptop can access `http://HR_IP:5000/api/health`

### During Demo:
- [ ] HR laptop: Open interview, select HR role
- [ ] Candidate laptop: Open interview, select Candidate role
- [ ] Both: Enter **same room name**
- [ ] Both: Click "Start Interview"
- [ ] HR: Ask a question
- [ ] Verify: Ideal answer appears on HR laptop
- [ ] Candidate: Answer the question
- [ ] Verify: Candidate transcript appears on HR laptop
- [ ] Verify: Score appears on HR laptop

---

## 🎬 Demo Script

1. **Setup (2 minutes)**
   - Start backend on HR laptop
   - Start frontend on both laptops
   - Configure candidate laptop `.env.local`
   - Both join same room

2. **Demo (3-5 minutes)**
   - HR: "What is time complexity of merge sort?"
   - Show: Ideal answer appears immediately
   - Candidate: Answers the question
   - Show: Candidate transcript appears on HR laptop
   - Show: Score and comparison appear

3. **Features to Highlight**
   - ✅ Real-time transcription
   - ✅ AI-generated ideal answers
   - ✅ Automatic scoring
   - ✅ Side-by-side comparison
   - ✅ Works across two laptops

---

## 🔐 Security Note

For hackathon/demo:
- ✅ No authentication required (spike endpoint)
- ✅ Works on local network
- ⚠️ Not production-ready (no security)

For production, you would need:
- JWT authentication
- User accounts
- Database for interview history
- HTTPS/WSS encryption

---

## 📞 Quick Reference

**HR Laptop:**
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000/spike/live-interview`
- Role: HR

**Candidate Laptop:**
- Frontend: `http://localhost:3000/spike/live-interview`
- Backend URL: `http://HR_IP:5000` (in `.env.local`)
- Role: Candidate

**Room Name:** Must be **identical** on both laptops!


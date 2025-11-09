# 🎬 START YOUR DEMO HERE

## ⚡ Quick Start (3 Commands)

Open **3 separate terminal windows** and run:

### Terminal 1 - Backend
```bash
cd ai-nexus/backend
npm install
npm run dev
```
✅ Should see: `🚀 AI-NEXUS Backend running on port 5000`

### Terminal 2 - ML API
```bash
cd ai-nexus/ml-api
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
✅ Should see: `Application startup complete`

### Terminal 3 - Frontend
```bash
cd ai-nexus/frontend
npm install
npm run dev
```
✅ Should see: `Ready on http://localhost:3000`

---

## 🎯 Demo Flow (5 Minutes)

### 1️⃣ Landing Page (30 sec)
👉 Open: `http://localhost:3000`
- Show "AI-NEXUS - From Subjective to Objective"
- Click "Get Started"

### 2️⃣ Live Interview Demo (2 min)
👉 Open: `http://localhost:3000/spike/live-interview`

**In TWO browser windows:**
- Window 1: Select "HR", Room: `demo-123`
- Window 2: Select "Candidate", Room: `demo-123`
- Click "Start Interview" in both
- **Speak into microphone:**
  - HR: "Welcome. Tell me about yourself."
  - Candidate: "I'm a software engineer..."
- **Show:** Real-time transcripts appearing!
- **Check Terminal 1:** See logged transcripts

### 3️⃣ AI Analysis Demo (2 min)
👉 Open: `http://localhost:3000/spike/schedule-interview`

1. **Upload JD** (or paste text):
   ```
   Senior Software Engineer
   - 5+ years React/Node.js
   - System design experience
   - Cloud platforms (AWS)
   ```

2. **Enter Mock Transcript:**
   ```
   HR: Welcome. Tell me about yourself?
   Candidate: I'm a software engineer with 5 years experience in React and Node.js.
   
   HR: How would you design a scalable system?
   Candidate: I'd use microservices, load balancing, and Redis caching.
   ```

3. Click **"Run AI Analysis Pipeline"**
4. **Wait 30-60 seconds**
5. **Show Results:**
   - Overall Score: 82/100
   - Q&A Breakdown
   - Ideal Answers
   - Scores & Justifications

### 4️⃣ UI Shell Demo (1 min)
👉 Go to: `http://localhost:3000/auth`

**HR View:**
- Select "HR / Recruiter"
- Show Dashboard → Stats, Interviews table
- Click "Schedule Interview" → Show modal with JD upload
- Click "View Report" → Show Scorecard

**Student View:**
- Select "Student / Candidate"  
- Show Dashboard → Performance stats
- Click "View Report" → Show Report Card with tips

---

## ✅ Demo Checklist

Before starting:
- [ ] All 3 services running
- [ ] MongoDB running (or Atlas connected)
- [ ] OpenAI API key in `ml-api/.env`
- [ ] Two browser windows ready
- [ ] Microphone permissions ready

During demo:
- [ ] Landing page loads
- [ ] Live interview connects (2 users)
- [ ] Transcripts appear in real-time
- [ ] Backend logs show separate transcripts
- [ ] AI analysis completes
- [ ] Report displays correctly
- [ ] HR and Student views work

---

## 🎉 That's It!

You've demonstrated:
- ✅ Live video/audio with real-time transcription
- ✅ AI-powered analysis pipeline
- ✅ Complete UI with role-based dashboards
- ✅ Professional reports for HR and candidates

**Full details:** See `DEMO_GUIDE.md` and `DEMO_SCRIPT.md`


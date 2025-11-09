# ⚡ Hackathon Quick Start - 5 Minute Setup

## 🎯 Goal
HR laptop shows candidate's transcript and AI-generated answers + scores.

---

## 📋 Setup Checklist

### HR Laptop (Judges PC)

1. **Find IP Address:**
   ```powershell
   ipconfig
   # Note: IPv4 Address (e.g., 192.168.1.100)
   ```

2. **Start Backend:**
   ```bash
   cd ai-nexus/backend
   npm start
   ```
   ✅ Should see: `Server running on port 5000`

3. **Start Frontend:**
   ```bash
   cd ai-nexus/frontend
   npm run dev
   ```
   ✅ Should see: `Ready on http://localhost:3000`

4. **Open Browser:**
   - Go to: `http://localhost:3000/spike/live-interview`
   - Role: **HR**
   - Room: `demo-2024`
   - Click: **Start Interview**

---

### Candidate Laptop

1. **Create `.env.local` file:**
   ```bash
   cd ai-nexus/frontend
   # Create file: .env.local
   ```
   
   Add this (replace `192.168.1.100` with HR laptop IP):
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
   NEXT_PUBLIC_WS_URL=ws://192.168.1.100:5000
   ```

2. **Start Frontend:**
   ```bash
   cd ai-nexus/frontend
   npm run dev
   ```

3. **Open Browser:**
   - Go to: `http://localhost:3000/spike/live-interview`
   - Role: **Candidate**
   - Room: `demo-2024` (**SAME as HR!**)
   - Click: **Start Interview**

---

## ✅ Verify It Works

1. **HR laptop:** Should see candidate's video
2. **Candidate laptop:** Should see HR's video
3. **HR asks question:** Ideal answer appears on HR laptop
4. **Candidate answers:** Transcript appears on HR laptop
5. **After candidate finishes:** Score appears on HR laptop

---

## 🐛 Quick Fixes

**"Connection refused":**
- ✅ Check both laptops on same WiFi
- ✅ Check HR laptop IP is correct
- ✅ Test: `http://HR_IP:5000/api/health` from candidate browser

**"No transcription":**
- ✅ Check WebSocket status (should be "Open")
- ✅ Check browser console (F12) for errors
- ✅ Verify microphone permissions

**"No AI answer":**
- ✅ Check backend console for Ollama API calls
- ✅ Verify `OLLAMA_API_KEY` in `backend/.env`

---

## 📞 Emergency Contacts

**Backend not starting?**
```bash
# Kill port 5000
cd ai-nexus/backend
npm run kill-port
npm start
```

**Frontend not connecting?**
- Check `.env.local` has correct IP
- Restart frontend: `Ctrl+C` then `npm run dev`

**Still stuck?**
- Check `HACKATHON_SETUP.md` for detailed troubleshooting
- Check browser console (F12) for errors

---

## 🎬 Demo Flow

1. **HR:** "What is time complexity of merge sort?"
   - ✅ Ideal answer appears immediately

2. **Candidate:** Answers the question
   - ✅ Transcript appears on HR laptop

3. **After candidate finishes:**
   - ✅ Score (0-10) appears
   - ✅ Both answers shown side-by-side

**That's it!** 🎉


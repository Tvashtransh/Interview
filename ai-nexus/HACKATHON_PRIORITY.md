# 🏆 Hackathon Priority Guide

## ⚡ Quick Decision: Test VC First (5 min), Then Complete Backend

---

## 🎯 Step 1: Quick VC Connection Test (5-10 minutes)

### Why First?
- ✅ Validates network setup early
- ✅ Builds confidence
- ✅ Frontend person can test while you finish backend
- ✅ Identifies firewall/network issues immediately

### What to Test:
1. **HR Laptop (You - Backend):**
   ```bash
   # Just start backend (no need for full features yet)
   cd ai-nexus/backend
   npm start
   ```

2. **Candidate Laptop (Frontend person):**
   - Configure `.env.local` with your IP
   - Start frontend
   - Both join same room

3. **Verify:**
   - ✅ Can see each other's video?
   - ✅ Can hear each other's audio?
   - ✅ Connection is stable?

**If this works → Great! Move to Step 2**
**If this fails → Fix network issues first (firewall, IP, WiFi)**

---

## 🔧 Step 2: Complete Backend (While Frontend Tests)

### What Needs to Be Done:

#### Critical (Must Have):
- [ ] Backend running and accessible
- [ ] LiveKit token generation working
- [ ] WebSocket server running
- [ ] Ollama API integration working
- [ ] Transcript broadcasting working

#### Nice to Have:
- [ ] Error handling improved
- [ ] Logging for debugging
- [ ] Environment variables configured

### Parallel Work:
- **You (Backend):** Complete backend features
- **Frontend Person:** Test VC connection, verify UI works

---

## ✅ Step 3: Full End-to-End Test (10 minutes)

### Test Complete Flow:
1. HR asks question → AI answer appears
2. Candidate answers → Transcript appears on HR laptop
3. Score generated → Displayed correctly

### If Issues Found:
- **Backend issues:** Fix immediately
- **Frontend issues:** Frontend person fixes
- **Network issues:** Both troubleshoot together

---

## 🚨 Emergency Mode (If Time Running Out)

### Minimum Viable Demo:
1. ✅ Video call works (Step 1)
2. ✅ Basic transcription works
3. ✅ AI answer generation works (even if scoring is basic)

### Can Skip:
- ❌ Perfect error handling
- ❌ Edge cases
- ❌ Polished UI

---

## 📋 Recommended Timeline

### Hour 1: Setup & Quick Test
- [ ] 10 min: Quick VC test
- [ ] 30 min: Complete backend
- [ ] 20 min: Full end-to-end test

### Hour 2: Polish & Demo Prep
- [ ] Fix any critical bugs
- [ ] Test demo flow
- [ ] Prepare talking points

---

## 💡 Pro Tips

1. **Test Early, Test Often**
   - Don't wait until everything is "perfect"
   - Test as you build

2. **Divide & Conquer**
   - Backend person: Focus on API/WebSocket
   - Frontend person: Test UI/UX while backend develops

3. **Have a Fallback**
   - If Ollama fails → Use mock responses
   - If Deepgram fails → Browser speech recognition works
   - If network fails → Demo on single laptop

4. **Document Issues**
   - Keep a list of bugs found during testing
   - Prioritize: Critical > Important > Nice-to-have

---

## 🎯 Decision Matrix

| Scenario | Action |
|----------|--------|
| VC test works, backend 80% done | ✅ Complete backend, then full test |
| VC test fails | ⚠️ Fix network first, then continue |
| Backend critical features missing | ⚠️ Complete backend first, test later |
| Time running out | 🚨 Test what you have, demo basic flow |

---

## ✅ Recommended Order

1. **Quick VC Test (5 min)** ← Start here!
2. **Complete Backend (30 min)**
3. **Full End-to-End Test (10 min)**
4. **Polish & Demo Prep (remaining time)**

**Total: ~45 minutes for core testing + backend completion**

---

## 🚀 Quick Start Commands

### For Quick VC Test:
```bash
# HR Laptop (Backend)
cd ai-nexus/backend
npm start  # Just start backend, don't worry about features yet

# Candidate Laptop (Frontend)
# Configure .env.local with HR IP
cd ai-nexus/frontend
npm run dev
```

**Test: Can you see each other? If yes → Continue with backend!**


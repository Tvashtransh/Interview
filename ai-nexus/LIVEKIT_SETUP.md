# 🎥 LiveKit Setup Guide

## Option 1: LiveKit Cloud (Recommended for Demo) ⭐

**Easiest option - No downloads needed!**

### Steps:

1. **Sign up for LiveKit Cloud:**
   - Go to: https://cloud.livekit.io/
   - Sign up for free account (free tier available)
   - Create a new project

2. **Get your credentials:**
   - After creating project, you'll get:
     - **API Key** (starts with `AP...`)
     - **API Secret** (starts with `secret...`)
     - **WebSocket URL** (e.g., `wss://your-project.livekit.cloud`)

3. **Update backend/.env:**
   ```env
   LIVEKIT_API_KEY=APxxxxxxxxxxxxx
   LIVEKIT_API_SECRET=secretxxxxxxxxxxxxx
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

4. **Done!** No downloads needed. ✅

---

## Option 2: Self-Hosted LiveKit Server

### For Local Development (Docker - Easiest)

1. **Install Docker Desktop:**
   - Download: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop

2. **Run LiveKit Server:**
   ```bash
   docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp -e LIVEKIT_KEYS="devkey: secret" livekit/livekit-server --dev
   ```

3. **Update backend/.env:**
   ```env
   LIVEKIT_API_KEY=devkey
   LIVEKIT_API_SECRET=secret
   LIVEKIT_URL=ws://localhost:7880
   ```

### For Production (Binary Download)

1. **Download LiveKit Server:**
   - Go to: https://github.com/livekit/livekit/releases
   - Download latest release for your OS:
     - **Windows:** `livekit-server_x.x.x_windows_amd64.zip`
     - **Mac:** `livekit-server_x.x.x_darwin_amd64.tar.gz`
     - **Linux:** `livekit-server_x.x.x_linux_amd64.tar.gz`

2. **Extract and run:**
   ```bash
   # Extract the archive
   # Then run:
   ./livekit-server --dev
   ```

3. **Update backend/.env:**
   ```env
   LIVEKIT_API_KEY=devkey
   LIVEKIT_API_SECRET=secret
   LIVEKIT_URL=ws://localhost:7880
   ```

---

## 🎯 Quick Setup for Demo (Recommended)

**Use LiveKit Cloud - No downloads needed!**

1. Sign up: https://cloud.livekit.io/
2. Create project
3. Copy API Key, Secret, and URL
4. Paste into `backend/.env`
5. Done!

---

## ✅ Verification

After setup, test the connection:

1. Start backend: `cd backend && npm run dev`
2. Check console for: `🚀 AI-NEXUS Backend running on port 5000`
3. Open: `http://localhost:3000/spike/live-interview`
4. Try to get a token - if it works, LiveKit is configured correctly!

---

## 📝 Environment Variables

Make sure your `backend/.env` has:

```env
LIVEKIT_API_KEY=your-api-key-here
LIVEKIT_API_SECRET=your-api-secret-here
LIVEKIT_URL=wss://your-project.livekit.cloud
# OR for local:
# LIVEKIT_URL=ws://localhost:7880
```

---

## 🐛 Troubleshooting

**"LiveKit not configured" error:**
- Check `.env` file exists in `backend/` directory
- Verify API_KEY and API_SECRET are set
- Restart backend server after changing .env

**Connection failed:**
- For cloud: Check URL starts with `wss://`
- For local: Check URL starts with `ws://` and server is running
- Check firewall/network settings

**Token generation fails:**
- Verify API key and secret are correct
- Check LiveKit server is running (if self-hosted)
- Check network connectivity

---

## 💡 Recommendation

**For Demo:** Use LiveKit Cloud (Option 1)
- ✅ No downloads
- ✅ No setup
- ✅ Free tier available
- ✅ Works immediately
- ✅ Production-ready

**For Development:** Use Docker (Option 2)
- ✅ Local testing
- ✅ No cloud dependency
- ✅ Free


# 🔧 Environment Variables Setup Guide

## Where to Create .env Files

You need to create `.env` files in **two locations**:

### 1. Backend `.env` File
**Location:** `ai-nexus/backend/.env`

This file contains:
- Server port
- MongoDB connection
- JWT secret
- **LiveKit credentials** ⭐
- ML API URL

### 2. ML API `.env` File
**Location:** `ai-nexus/ml-api/.env`

This file contains:
- MongoDB connection
- OpenAI/Anthropic API keys
- LLM provider settings

---

## 📝 Step-by-Step Setup

### Step 1: Create Backend .env File

1. **Navigate to:** `ai-nexus/backend/`
2. **Create file:** `.env` (note the dot at the beginning)
3. **Add your LiveKit credentials:**

```env
# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-nexus

# JWT Authentication
JWT_SECRET=demo-secret-key-change-in-production

# LiveKit Configuration - REPLACE WITH YOUR KEYS
LIVEKIT_API_KEY=APxxxxxxxxxxxxx
LIVEKIT_API_SECRET=secretxxxxxxxxxxxxx
LIVEKIT_URL=wss://your-project.livekit.cloud

# Deepgram Configuration - REPLACE WITH YOUR KEY
DEEPGRAM_API_KEY=your-deepgram-api-key-here

# ML API
ML_API_URL=http://localhost:8000
```

**Replace:**
- `APxxxxxxxxxxxxx` → Your LiveKit API Key
- `secretxxxxxxxxxxxxx` → Your LiveKit API Secret
- `wss://your-project.livekit.cloud` → Your LiveKit WebSocket URL

### Step 2: Create ML API .env File

1. **Navigate to:** `ai-nexus/ml-api/`
2. **Create file:** `.env`
3. **Add your OpenAI/Anthropic credentials:**

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-nexus

# LLM Provider (openai or anthropic)
LLM_PROVIDER=openai

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# OR Anthropic (if using Claude)
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

---

## 🎯 Quick Setup Commands

### Windows (PowerShell):

**Backend:**
```powershell
cd ai-nexus\backend
@"
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/ai-nexus
JWT_SECRET=demo-secret-key
LIVEKIT_API_KEY=YOUR_KEY_HERE
LIVEKIT_API_SECRET=YOUR_SECRET_HERE
LIVEKIT_URL=YOUR_URL_HERE
ML_API_URL=http://localhost:8000
"@ | Out-File -FilePath .env -Encoding utf8
```

**ML API:**
```powershell
cd ai-nexus\ml-api
@"
MONGODB_URI=mongodb://localhost:27017/ai-nexus
LLM_PROVIDER=openai
OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE
"@ | Out-File -FilePath .env -Encoding utf8
```

### Linux/Mac:

**Backend:**
```bash
cd ai-nexus/backend
cat > .env << EOF
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/ai-nexus
JWT_SECRET=demo-secret-key
LIVEKIT_API_KEY=YOUR_KEY_HERE
LIVEKIT_API_SECRET=YOUR_SECRET_HERE
LIVEKIT_URL=YOUR_URL_HERE
ML_API_URL=http://localhost:8000
EOF
```

**ML API:**
```bash
cd ai-nexus/ml-api
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/ai-nexus
LLM_PROVIDER=openai
OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE
EOF
```

---

## ✅ Verification

After creating the files:

1. **Check backend/.env exists:**
   ```bash
   cd ai-nexus/backend
   # Windows:
   dir .env
   # Linux/Mac:
   ls -la .env
   ```

2. **Check ml-api/.env exists:**
   ```bash
   cd ai-nexus/ml-api
   # Windows:
   dir .env
   # Linux/Mac:
   ls -la .env
   ```

3. **Start backend and verify:**
   ```bash
   cd ai-nexus/backend
   npm run dev
   ```
   Should see: `🚀 AI-NEXUS Backend running on port 5000`

---

## 🔒 Security Notes

- **Never commit .env files to git** (they're in .gitignore)
- **Don't share your API keys**
- **Use different keys for development and production**
- **Rotate keys if they're exposed**

---

## 📍 File Locations Summary

```
ai-nexus/
├── backend/
│   └── .env          ← Create here (LiveKit keys)
├── ml-api/
│   └── .env          ← Create here (OpenAI keys)
└── frontend/
    └── (no .env needed for demo)
```

---

## 🆘 Troubleshooting

**"Cannot find module" errors:**
- Make sure .env file is in the correct directory
- Check file name is exactly `.env` (with the dot)
- Restart the server after creating .env

**"LiveKit not configured" error:**
- Check .env file exists in `backend/` directory
- Verify LIVEKIT_API_KEY and LIVEKIT_API_SECRET are set
- Make sure there are no spaces around the `=` sign
- Restart backend server

**"OpenAI API key not found" error:**
- Check .env file exists in `ml-api/` directory
- Verify OPENAI_API_KEY is set
- Restart ML API server


# 💻 Two Laptop Setup Guide

Simple setup for running AI-NEXUS on two laptops (one HR, one Candidate).

## 🎯 Quick Setup

### Laptop 1 (HR) - Backend + Frontend

1. **Start Backend:**
   ```bash
   cd ai-nexus/backend
   npm install
   npm run dev
   ```
   ✅ Backend running on `http://localhost:5000`

2. **Start Frontend:**
   ```bash
   cd ai-nexus/frontend
   npm install
   npm run dev
   ```
   ✅ Frontend running on `http://localhost:3000` (or 3002, 3001, etc.)

3. **Open Browser:**
   - Go to: `http://localhost:3000/spike/live-interview`
   - Select role: **HR**
   - Enter room name: `demo-room-123`

### Laptop 2 (Candidate) - Frontend Only

1. **Find Laptop 1's IP Address:**
   - On Laptop 1, run:
     ```bash
     # Windows:
     ipconfig
     # Look for IPv4 Address (e.g., 192.168.1.100)
     
     # Mac/Linux:
     ifconfig
     # Look for inet address
     ```

2. **Update Frontend Config (Laptop 2):**
   - Create/edit: `ai-nexus/frontend/.env.local`
   ```env
   NEXT_PUBLIC_API_URL=http://LAPTOP1_IP:5000
   NEXT_PUBLIC_WS_URL=ws://LAPTOP1_IP:5000
   ```
   Replace `LAPTOP1_IP` with actual IP (e.g., `192.168.1.100`)

3. **Start Frontend (Laptop 2):**
   ```bash
   cd ai-nexus/frontend
   npm install
   npm run dev
   ```

4. **Open Browser (Laptop 2):**
   - Go to: `http://localhost:3000/spike/live-interview`
   - Select role: **Candidate**
   - Enter room name: `demo-room-123` (SAME as Laptop 1!)

5. **Click "Start Interview" on both laptops**

---

## 🔧 Alternative: Same Network, Different Ports

If both laptops are on the same network:

### Laptop 1 (Backend Host):
- Backend: `http://192.168.1.100:5000`
- Frontend: `http://192.168.1.100:3000`

### Laptop 2:
- Frontend: `http://192.168.1.100:3000` (access Laptop 1's frontend)
- OR run frontend locally and point to Laptop 1's backend

---

## ✅ CORS Fix Applied

The backend now allows connections from:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`
- `http://localhost:5173`
- Any IP on your local network

---

## 🐛 Troubleshooting

**"Failed to get LiveKit token":**
- ✅ Check backend is running on Laptop 1
- ✅ Check backend console for errors
- ✅ Verify `.env` file has LiveKit keys

**CORS errors:**
- ✅ Backend CORS is now fixed to allow multiple ports
- ✅ Restart backend after changes

**Can't connect from Laptop 2:**
- ✅ Check both laptops on same WiFi network
- ✅ Check Windows Firewall allows port 5000
- ✅ Verify Laptop 1's IP address is correct
- ✅ Try accessing `http://LAPTOP1_IP:5000/api/health` from Laptop 2

**WebSocket connection failed:**
- ✅ Check backend WebSocket server is running
- ✅ Verify WebSocket URL in frontend config
- ✅ Check firewall allows WebSocket connections

---

## 🎯 Simple Test

1. **Laptop 1:** Start backend + frontend
2. **Laptop 1:** Open `http://localhost:3000/spike/live-interview` → Select HR
3. **Laptop 2:** Open `http://LAPTOP1_IP:3000/spike/live-interview` → Select Candidate
4. **Both:** Enter same room name
5. **Both:** Click "Start Interview"
6. **Both:** Start speaking!

---

## 📝 No JWT/Auth Needed

For two-laptop demo, you don't need:
- ❌ JWT tokens
- ❌ User authentication
- ❌ Database (optional)
- ✅ Just LiveKit keys in backend/.env

The spike pages work without authentication!


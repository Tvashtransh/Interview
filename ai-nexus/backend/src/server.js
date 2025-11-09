import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interviews.js';
import reportRoutes from './routes/reports.js';
import ollamaRoutes from './routes/ollama.js';

// Import WebSocket handlers
import { setupWebSocketServer } from './websocket/audioProxy.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173', // Vite default port
      'http://localhost:8080' // arc-insight-lab frontend port
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection (non-blocking - server will start even if MongoDB fails)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-nexus';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️ Server will continue without MongoDB (some features may not work)');
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ollama', ollamaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI-NEXUS Backend API' });
});

// WebSocket server for audio streaming
// The WebSocketServer automatically handles upgrade requests for the specified path
const wss = new WebSocketServer({ 
  server, 
  path: '/ws/audio',
  perMessageDeflate: false, // Disable compression to avoid upgrade issues
  clientTracking: true
});
setupWebSocketServer(wss);

const PORT = process.env.PORT || 5000;

// Handle server errors gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`💡 Please either:`);
    console.error(`   1. Stop the process using port ${PORT}`);
    console.error(`   2. Or set a different PORT in .env file`);
    console.error(`\n🔍 To find and kill the process on Windows:`);
    console.error(`   Get-NetTCPConnection -LocalPort ${PORT} | Select-Object OwningProcess`);
    console.error(`   Stop-Process -Id <PID> -Force`);
    console.error(`\n🔍 To find and kill the process on Linux/Mac:`);
    console.error(`   lsof -ti:${PORT} | xargs kill -9`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 AI-NEXUS Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready at ws://localhost:${PORT}/ws/audio`);
});


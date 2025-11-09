// Simple test server to verify backend can start
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

app.post('/api/interviews/spike/token', (req, res) => {
  res.json({
    token: 'test-token',
    url: 'ws://localhost:7880',
    room: req.body.roomName || 'test-room'
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/api/health`);
});





import { WebSocketServer, WebSocket } from 'ws';

// Create WebSocket server on port 3001
// Note: The frontend now uses Chrome's native Web Speech API directly,
// so this server is kept for potential future use or other features
const wss = new WebSocketServer({ port: 3001 });

console.log('WebSocket server started on port 3001');
console.log('Note: Frontend uses Chrome Web Speech API directly (no backend transcription needed)');

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Handle messages from client
  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
    // Echo back or handle as needed
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'echo',
        message: 'Message received',
      }));
    }
  });

  // Handle WebSocket close
  ws.on('close', () => {
    console.log('Client disconnected');
  });

  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});


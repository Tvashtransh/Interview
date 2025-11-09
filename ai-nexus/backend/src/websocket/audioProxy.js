import { WebSocket } from 'ws';
import { getDeepgramConnection, removeDeepgramConnection } from './deepgramClient.js';

/**
 * WebSocket server that accepts binary audio chunks from two clients (HR, Candidate)
 * via MediaRecorder and forwards them to Deepgram for real-time transcription
 * 
 * This server manages:
 * - Two separate WebSocket connections (HR and Candidate)
 * - Audio chunk routing to Deepgram
 * - Transcript aggregation from Deepgram
 * - Saving transcripts to MongoDB
 */

const connections = new Map(); // Map<interviewId, { hr: WebSocket, candidate: WebSocket }>
const transcripts = new Map(); // Map<interviewId, { hr: [], candidate: [] }>
const deepgramConnections = new Map(); // Map<interviewId-role, DeepgramConnection>

export const setupWebSocketServer = (wss) => {
  wss.on('connection', (ws, req) => {
    console.log('🔌 New WebSocket connection');

    let interviewId = null;
    let role = null; // 'hr' or 'candidate'

    ws.on('message', async (message) => {
      try {
        // Handle JSON control messages vs binary audio data
        let data;
        let isJSON = false;
        
        try {
          // Try to parse as JSON
          const messageStr = message.toString();
          if (messageStr.trim().startsWith('{')) {
            data = JSON.parse(messageStr);
            isJSON = true;
          }
        } catch (e) {
          // Not JSON, treat as binary audio data
          isJSON = false;
        }
        
        if (isJSON && data) {
          
          if (data.type === 'join') {
            interviewId = data.interviewId;
            role = data.role; // 'hr' or 'candidate'
            
            if (!connections.has(interviewId)) {
              connections.set(interviewId, { hr: null, candidate: null });
              transcripts.set(interviewId, { hr: [], candidate: [] });
            }
            
            connections.get(interviewId)[role] = ws;
            console.log(`✅ ${role.toUpperCase()} joined interview ${interviewId}`);
            
            // Create Deepgram connection for this participant
            // Only attempt if DEEPGRAM_API_KEY is configured
            if (process.env.DEEPGRAM_API_KEY) {
              try {
                const deepgramConn = getDeepgramConnection(
                  interviewId,
                  role,
                  async (transcriptData) => {
                    // Handle transcript from Deepgram
                    const { text, isFinal, timestamp } = transcriptData;
                    
                    // Store transcript
                    transcripts.get(interviewId)[role].push({
                      text,
                      isFinal,
                      timestamp: timestamp || Date.now()
                    });
                    
                    // Broadcast to other participant
                    const otherRole = role === 'hr' ? 'candidate' : 'hr';
                    const otherWs = connections.get(interviewId)?.[otherRole];
                    
                    if (otherWs && otherWs.readyState === WebSocket.OPEN) {
                      otherWs.send(JSON.stringify({
                        type: 'transcript',
                        role,
                        text,
                        isFinal,
                        timestamp
                      }));
                    }
                    
                    // Send transcript back to sender
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({
                        type: 'transcript',
                        role,
                        text,
                        isFinal,
                        timestamp
                      }));
                    }
                    
                    // If final, save to MongoDB
                    if (isFinal) {
                      await saveTranscript(interviewId, role, text, timestamp);
                    }
                  }
                );
                
                // Connect to Deepgram
                await deepgramConn.connect();
                deepgramConnections.set(`${interviewId}-${role}`, deepgramConn);
                console.log(`✅ Deepgram connection established for ${role.toUpperCase()}`);
              } catch (error) {
                console.error(`❌ Failed to create Deepgram connection for ${role}:`, error);
                // Only send error once, and make it non-blocking
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: `Deepgram transcription unavailable: ${error.message}. Using browser speech recognition instead.` 
                  }));
                }
                // Continue without Deepgram - browser speech recognition will work
              }
            } else {
              console.warn(`⚠️ DEEPGRAM_API_KEY not configured. Deepgram transcription disabled.`);
              console.warn(`💡 The app will use browser speech recognition instead.`);
            }
            
            ws.send(JSON.stringify({ type: 'joined', interviewId, role }));
          } else if (data.type === 'transcript') {
            // Legacy: Receive transcript from client (if using Chrome Web Speech API as fallback)
            // With Deepgram, transcripts come from Deepgram connection callback
            // This is kept for backward compatibility
            const { text, isFinal, timestamp } = data;
            
            if (interviewId && role) {
              transcripts.get(interviewId)[role].push({
                text,
                isFinal,
                timestamp: timestamp || Date.now()
              });
              
              // Broadcast to other participant
              const otherRole = role === 'hr' ? 'candidate' : 'hr';
              const otherWs = connections.get(interviewId)?.[otherRole];
              
              if (otherWs && otherWs.readyState === WebSocket.OPEN) {
                otherWs.send(JSON.stringify({
                  type: 'transcript',
                  role,
                  text,
                  isFinal,
                  timestamp
                }));
              }
              
              // If final, save to MongoDB
              if (isFinal) {
                await saveTranscript(interviewId, role, text, timestamp);
              }
            }
          } else if (data.type === 'end-interview') {
            // End interview signal
            await finalizeInterview(interviewId);
          }
        } else {
          // Binary audio data - forward to Deepgram for transcription
          if (interviewId && role) {
            const deepgramKey = `${interviewId}-${role}`;
            const deepgramConn = deepgramConnections.get(deepgramKey);
            
            if (deepgramConn) {
              // Send audio chunk to Deepgram
              deepgramConn.sendAudio(message);
            } else {
              console.warn(`⚠️ Deepgram connection not found for ${role} (${interviewId})`);
            }
          }
          
          // Acknowledge receipt (optional)
          // ws.send(JSON.stringify({ type: 'audio-received' }));
        }
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: error.message }));
      }
    });

    ws.on('close', () => {
      if (interviewId && role) {
        // Close Deepgram connection
        removeDeepgramConnection(interviewId, role);
        
        const conn = connections.get(interviewId);
        if (conn) {
          conn[role] = null;
          console.log(`🔌 ${role.toUpperCase()} disconnected from interview ${interviewId}`);
          
          // Clean up if both disconnected
          if (!conn.hr && !conn.candidate) {
            connections.delete(interviewId);
            transcripts.delete(interviewId);
            console.log(`🗑️ Cleaned up interview ${interviewId}`);
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });
};

// Save transcript to MongoDB
async function saveTranscript(interviewId, role, text, timestamp) {
  try {
    // Import here to avoid circular dependencies
    const { Interview } = await import('../models/Interview.js');
    
    await Interview.findOneAndUpdate(
      { interviewId },
      {
        $push: {
          transcripts: {
            role,
            text,
            timestamp: new Date(timestamp),
            isFinal: true
          }
        }
      },
      { upsert: true, new: true }
    );
    
    console.log(`💾 Saved ${role} transcript for interview ${interviewId}`);
  } catch (error) {
    console.error('❌ Error saving transcript:', error);
  }
}

// Finalize interview and trigger ML analysis
async function finalizeInterview(interviewId) {
  try {
    const { Interview } = await import('../models/Interview.js');
    const interview = await Interview.findOne({ interviewId });
    
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    // Mark interview as completed
    interview.status = 'completed';
    interview.completedAt = new Date();
    await interview.save();
    
    // Trigger ML analysis
    const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';
    const response = await fetch(`${ML_API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to trigger ML analysis');
    }
    
    console.log(`✅ Interview ${interviewId} finalized and analysis triggered`);
  } catch (error) {
    console.error('❌ Error finalizing interview:', error);
  }
}


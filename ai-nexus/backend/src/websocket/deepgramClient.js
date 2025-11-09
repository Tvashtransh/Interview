import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

/**
 * Deepgram WebSocket client for real-time transcription
 * Creates a separate Deepgram connection for each participant (HR/Candidate)
 */

const deepgramConnections = new Map(); // Map<interviewId-role, DeepgramConnection>

export class DeepgramConnection {
  constructor(interviewId, role, onTranscript) {
    this.interviewId = interviewId;
    this.role = role;
    this.onTranscript = onTranscript;
    this.deepgram = null;
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const apiKey = process.env.DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error('DEEPGRAM_API_KEY not found in environment variables');
      }

      // Create Deepgram client
      const deepgram = createClient(apiKey);
      
      // Create live transcription connection
      // For @deepgram/sdk v3, the API is: deepgram.listen.live()
      if (!deepgram.listen || typeof deepgram.listen.live !== 'function') {
        throw new Error('Deepgram SDK API structure not found. Please check @deepgram/sdk version and API documentation.');
      }

      // Use the correct API for SDK v3
      this.connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        punctuate: true,
        diarize: false,
        endpointing: 300,
        encoding: 'linear16',
        sample_rate: 16000,
        channels: 1
      });

      // Handle connection open (using SDK v3 event constants)
      this.connection.on(LiveTranscriptionEvents.Open, () => {
        console.log(`✅ Deepgram connection opened for ${this.role} (${this.interviewId})`);
        this.isConnected = true;
      });

      // Handle transcript results (using SDK v3 event constants)
      this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        try {
          // SDK v3 transcript structure
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          const isFinal = data.is_final || false;
          
          if (transcript && transcript.trim()) {
            const transcriptData = {
              text: transcript.trim(),
              isFinal,
              timestamp: Date.now(),
              confidence: data.channel?.alternatives?.[0]?.confidence || 0
            };

            // Log transcript
            const roleLabel = this.role === 'hr' ? '👔 HR' : '🎓 CANDIDATE';
            if (isFinal) {
              console.log('\n' + '='.repeat(80));
              console.log(`📝 ${roleLabel} TRANSCRIPT (DEEPGRAM FINAL) - Interview: ${this.interviewId}`);
              console.log(`⏰ Time: ${new Date(transcriptData.timestamp).toISOString()}`);
              console.log(`💬 Text: "${transcriptData.text}"`);
              console.log(`🎯 Confidence: ${(transcriptData.confidence * 100).toFixed(1)}%`);
              console.log('='.repeat(80) + '\n');
            } else {
              console.log(`📝 ${roleLabel} TRANSCRIPT (DEEPGRAM INTERIM) - "${transcriptData.text}"`);
            }

            // Call callback with transcript
            if (this.onTranscript) {
              this.onTranscript(transcriptData);
            }
          }
        } catch (error) {
          console.error('❌ Error processing Deepgram result:', error);
        }
      });

      // Handle errors (using SDK v3 event constants)
      this.connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error(`❌ Deepgram error for ${this.role} (${this.interviewId}):`, error);
        this.isConnected = false;
      });

      // Handle close (using SDK v3 event constants)
      this.connection.on(LiveTranscriptionEvents.Close, () => {
        console.log(`🔌 Deepgram connection closed for ${this.role} (${this.interviewId})`);
        this.isConnected = false;
      });

      this.deepgram = deepgram;
      return this.connection;
    } catch (error) {
      console.error(`❌ Failed to create Deepgram connection for ${this.role}:`, error);
      throw error;
    }
  }

  sendAudio(audioData) {
    if (this.connection && this.isConnected) {
      try {
        // Send audio data to Deepgram
        this.connection.send(audioData);
      } catch (error) {
        console.error(`❌ Error sending audio to Deepgram for ${this.role}:`, error);
      }
    } else {
      console.warn(`⚠️ Deepgram connection not ready for ${this.role}`);
    }
  }

  async close() {
    if (this.connection) {
      try {
        // Send finish signal
        this.connection.finish();
        this.isConnected = false;
        console.log(`✅ Deepgram connection closed for ${this.role} (${this.interviewId})`);
      } catch (error) {
        console.error(`❌ Error closing Deepgram connection for ${this.role}:`, error);
      }
    }
  }
}

/**
 * Get or create Deepgram connection for a participant
 */
export function getDeepgramConnection(interviewId, role, onTranscript) {
  const key = `${interviewId}-${role}`;
  
  if (!deepgramConnections.has(key)) {
    const connection = new DeepgramConnection(interviewId, role, onTranscript);
    deepgramConnections.set(key, connection);
    return connection;
  }
  
  return deepgramConnections.get(key);
}

/**
 * Remove Deepgram connection
 */
export function removeDeepgramConnection(interviewId, role) {
  const key = `${interviewId}-${role}`;
  const connection = deepgramConnections.get(key);
  
  if (connection) {
    connection.close();
    deepgramConnections.delete(key);
  }
}


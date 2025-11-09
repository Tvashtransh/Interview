'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function HomePage() {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [llmResponse, setLlmResponse] = useState('');
  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [ollamaModel, setOllamaModel] = useState('qwen3-coder:480b-cloud');
  const [autoSendToLLM, setAutoSendToLLM] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  const sendToOllama = useCallback(async (text?: string) => {
    const prompt = text || finalTranscript || interimTranscript;
    
    if (!prompt.trim()) {
      alert('No text to send to Ollama. Please transcribe some speech first.');
      return;
    }

    setIsLoadingLLM(true);
    setLlmResponse('');

    try {
      const response = await fetch('/api/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          model: ollamaModel,
        }),
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to get response from Ollama';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setLlmResponse(data.response || 'No response received');
    } catch (error: any) {
      console.error('Error sending to Ollama:', error);
      
      // Extract error message
      let errorMsg = error.message || 'Unknown error occurred';
      
      // Show helpful error message with tips
      const tips = [];
      if (errorMsg.includes('Cloud model') || errorMsg.includes('signin') || errorMsg.includes('Authentication')) {
        tips.push('🔐 For cloud models, sign in: ollama signin');
      }
      if (errorMsg.includes('running') || errorMsg.includes('connect') || errorMsg.includes('Cannot connect')) {
        tips.push('▶️ Make sure Ollama is running: ollama serve');
      }
      if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        tips.push('📋 Check available models: ollama list');
        tips.push('📝 Verify the model name is correct');
      }
      
      const tipsText = tips.length > 0 ? `\n\n💡 Tips:\n${tips.map(t => `- ${t}`).join('\n')}` : '';
      setLlmResponse(`❌ Error: ${errorMsg}${tipsText}`);
    } finally {
      setIsLoadingLLM(false);
    }
  }, [finalTranscript, interimTranscript, ollamaModel]);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening continuously
    recognition.interimResults = true; // Show partial results
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1; // Only need one result
    
    // Note: Chrome's Web Speech API has a known issue where it stops after a few words
    // We handle this with aggressive auto-restart in onend handler

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        const finalText = final.trim();
        setFinalTranscript(prev => prev + (prev ? ' ' : '') + finalText);
        setInterimTranscript('');
        
        // Auto-send to LLM if enabled
        if (autoSendToLLM && finalText) {
          // Call sendToOllama with the final text
          const prompt = finalText;
          
          setIsLoadingLLM(true);
          setLlmResponse('');

          fetch('/api/ollama', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: prompt,
              model: ollamaModel,
            }),
          })
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              throw new Error(data.error);
            }
            setLlmResponse(data.response || 'No response received');
          })
          .catch(error => {
            console.error('Error sending to Ollama:', error);
            setLlmResponse(`Error: ${error.message}. Make sure Ollama is running on localhost:11434`);
          })
          .finally(() => {
            setIsLoadingLLM(false);
          });
        }
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Don't log 'no-speech' errors as they're normal (happens when user stops speaking)
      if (event.error === 'no-speech') {
        // This is normal - just means no speech detected, recognition continues
        return;
      }
      
      if (event.error === 'aborted') {
        // Recognition was stopped intentionally, don't restart
        return;
      }
      
      console.error('Speech recognition error:', event.error, event.message);
      
      // For other errors, try to restart after a delay if still listening
      if (isListeningRef.current) {
        setTimeout(() => {
          if (recognitionRef.current && isListeningRef.current) {
            try {
              recognitionRef.current.start();
              console.log('🔄 Speech recognition restarted after error');
            } catch (e: any) {
              console.error('Failed to restart after error:', e.message);
              setIsListening(false);
              isListeningRef.current = false;
            }
          }
        }, 1000);
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended - will auto-restart if still listening');
      
      // Automatically restart if still listening (aggressive restart)
      if (isListeningRef.current) {
        // Use a very short delay to avoid "already started" errors
        setTimeout(() => {
          if (recognitionRef.current && isListeningRef.current) {
            try {
              const state = (recognitionRef.current as any).state;
              // Only restart if it's actually stopped/idle
              if (state === 'idle' || state === 'stopped' || state === undefined) {
                recognitionRef.current.start();
                console.log('🔄 Speech recognition auto-restarted (onend)');
              } else {
                console.log('Speech recognition still running, state:', state);
              }
            } catch (error: any) {
              // If it says "already started", that's actually good - it means it's running
              if (error.message && error.message.includes('already started')) {
                console.log('✅ Speech recognition already running (good!)');
              } else {
                console.error('Error restarting recognition:', error);
                // Try again after a longer delay
                setTimeout(() => {
                  if (recognitionRef.current && isListeningRef.current) {
                    try {
                      recognitionRef.current.start();
                      console.log('🔄 Speech recognition restarted (retry)');
                    } catch (retryError) {
                      console.error('Failed to restart on retry:', retryError);
                      setIsListening(false);
                      isListeningRef.current = false;
                    }
                  }
                }, 2000);
              }
            }
          }
        }, 50); // Very short delay - restart almost immediately
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [autoSendToLLM, ollamaModel]);

  // Health check for speech recognition (runs every 2 seconds when listening)
  useEffect(() => {
    if (!recognitionRef.current || !isListening) return;

    const healthCheckInterval = setInterval(() => {
      if (isListeningRef.current && recognitionRef.current) {
        try {
          const state = (recognitionRef.current as any).state;
          
          // If should be listening but recognition is not active, restart it
          if (state === 'idle' || state === 'stopped' || state === undefined) {
            console.log('⚠️ Health check: Recognition stopped (state:', state, ') - restarting NOW');
            try {
              recognitionRef.current.start();
              console.log('✅ Health check: Restarted successfully');
            } catch (startError: any) {
              if (startError.message && startError.message.includes('already started')) {
                // It's actually running, just update state
                console.log('✅ Health check: Already running');
              } else {
                console.warn('⚠️ Health check restart failed:', startError.message);
              }
            }
          }
        } catch (e: any) {
          // If error says already started, that's fine
          if (e.message && e.message.includes('already started')) {
            // Good - it's running
          } else {
            console.warn('Speech recognition health check error:', e.message);
          }
        }
      }
    }, 2000); // Check every 2 seconds

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [isListening]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Clear old transcripts
    setFinalTranscript('');
    setInterimTranscript('');

    try {
      recognitionRef.current.start();
      setIsListening(true);
      isListeningRef.current = true;
    } catch (error) {
      console.error('Error starting recognition:', error);
      alert('Error starting speech recognition. Please try again.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    isListeningRef.current = false;
  };

  if (!isSupported) {
    return (
      <main className="container">
        <h1>Live Transcription</h1>
        <div className="error-message">
          <p>Web Speech API is not supported in your browser.</p>
          <p>Please use Chrome, Edge, or Safari for the best experience.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Live Transcription + Ollama LLM</h1>
      <p className="subtitle">Free Web Speech API → Ollama Integration</p>
      
      <div className="controls">
        <button
          onClick={isListening ? stopListening : startListening}
          className={isListening ? 'stop-button' : 'start-button'}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
        
        <div className="ollama-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoSendToLLM}
              onChange={(e) => setAutoSendToLLM(e.target.checked)}
            />
            <span>Auto-send to Ollama</span>
          </label>
          
          <div className="model-selector">
            <label>Model:</label>
            <div className="model-selector-row">
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="qwen3-coder:480b-cloud"
                className="model-input"
              />
            </div>
            <span className="model-hint">💡 Use -cloud suffix for cloud models (runs on remote GPUs, faster!)</span>
          </div>
          
          <button
            onClick={() => sendToOllama()}
            disabled={isLoadingLLM || (!finalTranscript && !interimTranscript)}
            className="llm-button"
          >
            {isLoadingLLM ? 'Loading...' : 'Send to Ollama'}
          </button>
        </div>
      </div>

      <div className="content-grid">
        <div className="transcription-box">
          <h2>Transcription</h2>
          <p>{finalTranscript}</p>
          <span className="interim">{interimTranscript}</span>
          {!finalTranscript && !interimTranscript && (
            <p className="placeholder">Your transcription will appear here...</p>
          )}
        </div>

        <div className="llm-response-box">
          <h2>Ollama Response</h2>
          {isLoadingLLM ? (
            <div className="loading">Processing with {ollamaModel}...</div>
          ) : llmResponse ? (
            <p className="llm-text">{llmResponse}</p>
          ) : (
            <p className="placeholder">LLM response will appear here...</p>
          )}
        </div>
      </div>
    </main>
  );
}


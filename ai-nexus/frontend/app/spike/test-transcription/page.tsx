'use client'

import { useEffect, useRef, useState } from 'react'

export default function TestTranscription() {
  const [transcripts, setTranscripts] = useState<Array<{text: string, timestamp: number}>>([])
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Initialize Chrome Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            const transcriptData = {
              text: finalTranscript.trim(),
              timestamp: Date.now()
            }
            
            setTranscripts(prev => [...prev, transcriptData])
            console.log('📝 Final transcript:', finalTranscript)
            
            // Send to backend via WebSocket if connected
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'transcript',
                role: 'test',
                text: finalTranscript.trim(),
                timestamp: Date.now(),
                isFinal: true
              }))
            }
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error !== 'no-speech') {
            console.error('Speech recognition error:', event.error)
          }
        }

        recognition.onend = () => {
          if (isListening) {
            try {
              recognition.start()
            } catch (e) {
              console.log('Recognition already started')
            }
          }
        }

        recognitionRef.current = recognition
      }
    }

    // Connect to backend WebSocket
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:5000/ws/audio')
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        ws.send(JSON.stringify({
          type: 'join',
          interviewId: 'test-transcription',
          role: 'test'
        }))
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('📨 WebSocket message:', data)
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('🔌 WebSocket closed')
      }

      wsRef.current = ws
    }

    connectWebSocket()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [isListening])

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        console.log('🎙️ Started listening')
      } catch (error) {
        console.error('Error starting recognition:', error)
        alert('Error starting speech recognition. Please grant microphone permissions.')
      }
    } else {
      alert('Speech recognition not supported. Please use Chrome, Edge, or Safari.')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      console.log('🛑 Stopped listening')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🎙️ Transcription Test (No LiveKit Required)</h1>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Test Speech Recognition</h2>
          <p className="text-slate-400 mb-4">
            This page tests transcription WITHOUT LiveKit. If this works, your transcription is fine.
          </p>

          <div className="flex gap-4 mb-4">
            <button
              onClick={startListening}
              disabled={isListening}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded-lg font-semibold"
            >
              {isListening ? 'Listening...' : 'Start Listening'}
            </button>
            <button
              onClick={stopListening}
              disabled={!isListening}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 rounded-lg font-semibold"
            >
              Stop Listening
            </button>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Status:</h3>
            <p className="text-sm">
              {isListening ? '✅ Listening - Start speaking!' : '⏸️ Not listening'}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              WebSocket: {wsRef.current?.readyState === WebSocket.OPEN ? '✅ Connected' : '❌ Disconnected'}
            </p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Transcripts</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transcripts.length === 0 ? (
              <p className="text-slate-400">No transcripts yet. Click "Start Listening" and speak.</p>
            ) : (
              transcripts.map((t, idx) => (
                <div key={idx} className="bg-slate-700 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-white">{t.text}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mt-6">
          <h3 className="font-semibold mb-2">💡 If transcription works here:</h3>
          <p className="text-sm text-slate-300">
            Your transcription is working! The LiveKit connection issue is separate. 
            Check your LiveKit server/credentials in backend/.env
          </p>
        </div>
      </div>
    </div>
  )
}


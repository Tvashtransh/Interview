'use client'

import { useState } from 'react'

export default function TestConnection() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...')
  const [livekitStatus, setLivekitStatus] = useState<string>('Checking...')
  const [mediaStatus, setMediaStatus] = useState<string>('Not tested')
  const [speechStatus, setSpeechStatus] = useState<string>('Not tested')

  const testBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health')
      const data = await response.json()
      setBackendStatus(`✅ Connected: ${data.message}`)
    } catch (error: any) {
      setBackendStatus(`❌ Error: ${error.message}`)
    }
  }

  const testLiveKitToken = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/interviews/spike/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: 'test-room', role: 'hr' })
      })
      const data = await response.json()
      if (data.token) {
        setLivekitStatus(`✅ Token received (${data.token.substring(0, 20)}...)`)
      } else {
        setLivekitStatus('❌ No token in response')
      }
    } catch (error: any) {
      setLivekitStatus(`❌ Error: ${error.message}`)
    }
  }

  const testMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      setMediaStatus(`✅ Permissions granted - Audio: ${stream.getAudioTracks().length}, Video: ${stream.getVideoTracks().length}`)
      stream.getTracks().forEach(track => track.stop())
    } catch (error: any) {
      setMediaStatus(`❌ Error: ${error.message}`)
    }
  }

  const testSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechStatus('❌ Not supported in this browser (use Chrome/Edge/Safari)')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setSpeechStatus('✅ Speech recognition started - Say something!')
      setTimeout(() => recognition.stop(), 3000)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setSpeechStatus(`✅ Working! Heard: "${transcript}"`)
      recognition.stop()
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setSpeechStatus(`❌ Error: ${event.error}`)
    }

    try {
      recognition.start()
    } catch (error: any) {
      setSpeechStatus(`❌ Failed to start: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Connection Diagnostics</h1>

        <div className="space-y-6">
          {/* Backend Test */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Backend Connection</h2>
            <p className="text-slate-300 mb-4">{backendStatus}</p>
            <button
              onClick={testBackend}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Test Backend
            </button>
          </div>

          {/* LiveKit Test */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">LiveKit Token</h2>
            <p className="text-slate-300 mb-4">{livekitStatus}</p>
            <button
              onClick={testLiveKitToken}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Test LiveKit Token
            </button>
          </div>

          {/* Media Test */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Camera/Microphone</h2>
            <p className="text-slate-300 mb-4">{mediaStatus}</p>
            <button
              onClick={testMedia}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Test Media Permissions
            </button>
          </div>

          {/* Speech Recognition Test */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Speech Recognition</h2>
            <p className="text-slate-300 mb-4">{speechStatus}</p>
            <button
              onClick={testSpeech}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Test Speech Recognition
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


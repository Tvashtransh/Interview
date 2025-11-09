'use client'

import { useEffect, useRef, useState, useContext } from 'react'
import { VideoConference, ControlBar, LiveKitRoom, RoomContext } from '@livekit/components-react'
import '@livekit/components-styles'
import { Room, RoomEvent, Track } from 'livekit-client'

export default function LiveInterviewSpike() {
  const [token, setToken] = useState<string>('')
  const [roomName, setRoomName] = useState<string>('')
  const [serverUrl, setServerUrl] = useState<string>('')
  const [role, setRole] = useState<'hr' | 'candidate'>('hr')
  const [connected, setConnected] = useState(false)
  const [transcripts, setTranscripts] = useState<Array<{role: string, text: string, timestamp: number, isFinal?: boolean}>>([])
  const [wsConnected, setWsConnected] = useState(false)
  const [speechRecognitionActive, setSpeechRecognitionActive] = useState(false)
  const [jobDescription, setJobDescription] = useState<string>('')
  const [qaPairs, setQaPairs] = useState<Array<{
    question: string
    questionTimestamp: number
    candidateAnswer?: string
    candidateAnswerTimestamp?: number
    idealAnswer?: string
    score?: number
    justification?: string
    loadingIdealAnswer?: boolean
    loadingScore?: boolean
    idealAnswerError?: string
  }>>([])
  const errorShownRef = useRef(false)
  
  const roomRef = useRef<Room | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const wsConnectingRef = useRef(false) // Prevent multiple simultaneous connection attempts
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track reconnection timeout
  const recognitionRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Prevent rapid speech recognition restarts
  const isRestartingRecognitionRef = useRef(false) // Flag to prevent multiple simultaneous restarts
  const lastRestartAttemptRef = useRef<number>(0) // Track last restart attempt time to prevent rapid restarts
  const recognitionEndCountRef = useRef<number>(0) // Track how many times onend has fired
  const speechRecognitionActiveRef = useRef<boolean>(false) // Track actual state to prevent unnecessary re-renders
  const lastProcessedHRQuestionRef = useRef<string>('') // Track last processed HR question to avoid duplicates
  const hrQuestionDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Debounce HR question processing
  const accumulatedTranscriptRef = useRef<string>('') // Accumulate transcripts across multiple onresult events
  const finalTranscriptTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Timeout to process final transcript after speech ends

  // Initialize Chrome Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true // Keep listening continuously
        recognition.interimResults = true // Show partial results
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1 // Only need one result
        
        // Note: Chrome's Web Speech API has a known issue where it stops after a few words
        // We handle this with aggressive auto-restart in onend handler

        recognition.onstart = () => {
          console.log('🎙️ Speech recognition started')
          isRestartingRecognitionRef.current = false // Clear restart flag when it actually starts
          lastRestartAttemptRef.current = 0 // Reset restart attempt time
          recognitionEndCountRef.current = 0 // Reset end count
          speechRecognitionActiveRef.current = true
          // Only update state if it changed to prevent unnecessary re-renders
          if (!speechRecognitionActive) {
            setSpeechRecognitionActive(true)
          }
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          let interimTranscript = ''

          // Accumulate all results from this event
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
              // Accumulate final transcripts
              accumulatedTranscriptRef.current += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          // Show interim transcripts in real-time
          if (interimTranscript) {
            console.log('📝 Interim transcript:', interimTranscript)
            setTranscripts(prev => {
              const filtered = prev.filter(t => !(t.role === role && t.isFinal === false))
              if (interimTranscript.trim().length > 0) {
                return [...filtered, {
                  role,
                  text: interimTranscript.trim(),
                  timestamp: Date.now(),
                  isFinal: false
                }]
              }
              return filtered
            })
          }

          // Process final transcripts - but wait a bit to accumulate all parts
          if (finalTranscript) {
            console.log('📝 Final transcript chunk received:', finalTranscript.trim())
            console.log('📝 Accumulated so far:', accumulatedTranscriptRef.current.trim())
            
            // Clear any existing timeout
            if (finalTranscriptTimeoutRef.current) {
              clearTimeout(finalTranscriptTimeoutRef.current)
            }
            
            // Wait 2 seconds after the last final transcript to process the complete accumulated text
            // This ensures we capture the full sentence/paragraph
            finalTranscriptTimeoutRef.current = setTimeout(() => {
              const completeText = accumulatedTranscriptRef.current.trim()
              
              if (completeText.length > 0) {
                const transcriptData = {
                  role,
                  text: completeText,
                  timestamp: Date.now(),
                  isFinal: true
                }
                
                console.log('📝 Complete final transcript:', completeText)
                console.log('📝 Adding complete transcript to state:', transcriptData)
                setTranscripts(prev => {
                  // Remove any interim transcript for this role
                  const filtered = prev.filter(t => !(t.role === role && t.isFinal === false))
                  const updated = [...filtered, transcriptData]
                  console.log('📝 Transcripts state updated. Total count:', updated.length)
                  return updated
                })
                
                // Send to backend via WebSocket
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({
                    type: 'transcript',
                    ...transcriptData
                  }))
                  console.log('✅ Complete transcript sent to backend')
                } else {
                  console.warn('⚠️ WebSocket not open, transcript not sent. State:', wsRef.current?.readyState)
                }

                // Real-time analysis: Process HR questions immediately with complete text
                if (role === 'hr' && completeText.length > 10) {
                  // Always process new questions - don't check if previous was answered
                  const normalizedQuestion = completeText.toLowerCase()
                  
                  // Check if this is significantly different from the last processed question
                  // (to handle when HR interrupts with a new question)
                  const isNewQuestion = normalizedQuestion !== lastProcessedHRQuestionRef.current && 
                                       !lastProcessedHRQuestionRef.current.includes(normalizedQuestion) &&
                                       !normalizedQuestion.includes(lastProcessedHRQuestionRef.current)
                  
                  if (isNewQuestion || lastProcessedHRQuestionRef.current === '') {
                    lastProcessedHRQuestionRef.current = normalizedQuestion
                    console.log('👔 HR COMPLETE question detected, generating ideal answer immediately...')
                    handleHRQuestion(completeText, Date.now())
                  } else {
                    console.log('⚠️ Question similar to previous, skipping to avoid duplicates')
                  }
                }
                // If candidate answers, only process when final (complete answer)
                else if (role === 'candidate' && completeText.length > 10) {
                  console.log('🎓 Candidate COMPLETE answer detected, scoring answer...')
                  handleCandidateAnswer(completeText, Date.now())
                }
                
                // Clear accumulated transcript after processing
                accumulatedTranscriptRef.current = ''
              }
            }, 2000) // Wait 2 seconds after last final transcript to ensure we have the complete text
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          // Don't log 'no-speech' errors as they're normal (happens when user stops speaking)
          if (event.error === 'no-speech') {
            // This is normal - just means no speech detected, recognition continues
            return
          }
          
          if (event.error === 'aborted') {
            // Recognition was stopped intentionally, don't restart
            return
          }
          
          console.error('❌ Speech recognition error:', event.error, event.message)
          setSpeechRecognitionActive(false)
          
          // For other errors, try to restart after a delay
          if (roomRef.current !== null) {
            setTimeout(() => {
              if (recognitionRef.current && roomRef.current !== null) {
                try {
                  recognitionRef.current.start()
                  console.log('🔄 Speech recognition restarted after error')
                  setSpeechRecognitionActive(true)
                } catch (e: any) {
                  console.error('Failed to restart after error:', e.message)
                }
              }
            }, 1000)
          }
        }

        recognition.onend = () => {
          recognitionEndCountRef.current += 1
          const endCount = recognitionEndCountRef.current
          
          // Process any accumulated transcript when recognition ends
          // This ensures we capture the complete text even if onresult didn't fire for the last chunk
          if (accumulatedTranscriptRef.current.trim().length > 0) {
            // Clear any pending timeout and process immediately
            if (finalTranscriptTimeoutRef.current) {
              clearTimeout(finalTranscriptTimeoutRef.current)
              finalTranscriptTimeoutRef.current = null
            }
            
            // Process accumulated transcript after a short delay to ensure it's complete
            setTimeout(() => {
              const completeText = accumulatedTranscriptRef.current.trim()
              
              if (completeText.length > 0) {
                const transcriptData = {
                  role,
                  text: completeText,
                  timestamp: Date.now(),
                  isFinal: true
                }
                
                console.log('📝 Processing accumulated transcript on end:', completeText)
                setTranscripts(prev => {
                  const filtered = prev.filter(t => !(t.role === role && t.isFinal === false))
                  return [...filtered, transcriptData]
                })
                
                // Send to backend
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({
                    type: 'transcript',
                    ...transcriptData
                  }))
                }
                
                // Process HR questions
                if (role === 'hr' && completeText.length > 10) {
                  const normalizedQuestion = completeText.toLowerCase()
                  const isNewQuestion = normalizedQuestion !== lastProcessedHRQuestionRef.current && 
                                       !lastProcessedHRQuestionRef.current.includes(normalizedQuestion) &&
                                       !normalizedQuestion.includes(lastProcessedHRQuestionRef.current)
                  
                  if (isNewQuestion || lastProcessedHRQuestionRef.current === '') {
                    lastProcessedHRQuestionRef.current = normalizedQuestion
                    console.log('👔 HR question detected on end, generating ideal answer...')
                    handleHRQuestion(completeText, Date.now())
                  }
                }
                
                // Clear accumulated transcript
                accumulatedTranscriptRef.current = ''
              }
            }, 500) // Short delay to ensure all final chunks are captured
          }
          
          // Don't log every single onend event - only log occasionally to reduce console spam
          if (endCount % 10 === 0 || endCount === 1) {
            console.log(`🛑 Speech recognition ended (count: ${endCount})`)
          }
          
          // Don't update state immediately - wait a bit to see if it restarts automatically
          // Chrome sometimes fires onend even when it's still running
          const now = Date.now()
          const timeSinceLastRestart = now - lastRestartAttemptRef.current
          
          // If we just tried to restart recently (within 5 seconds), don't try again
          if (timeSinceLastRestart < 5000) {
            if (endCount % 20 === 0) {
              console.log(`⏸️ Skipping restart - only ${timeSinceLastRestart}ms since last attempt (end count: ${endCount})`)
            }
            return
          }
          
          // Clear any pending restart
          if (recognitionRestartTimeoutRef.current) {
            clearTimeout(recognitionRestartTimeoutRef.current)
            recognitionRestartTimeoutRef.current = null
          }
          
          // Only restart if still in interview and not already restarting
          const shouldRestart = (roomRef.current !== null || token) && recognitionRef.current && !isRestartingRecognitionRef.current
          
          if (shouldRestart) {
            // Wait a bit before checking state - Chrome might restart automatically
            setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  const state = (recognitionRef.current as any).state
                  // If it's already running, don't restart or update state
                  if (state === 'listening' || state === 'starting') {
                    if (endCount % 20 === 0) {
                      console.log('✅ Speech recognition already running (state:', state, ')')
                    }
                    speechRecognitionActiveRef.current = true
                    // Only update state if it changed
                    if (!speechRecognitionActive) {
                      setSpeechRecognitionActive(true)
                    }
                    return
                  }
                } catch (e) {
                  // Ignore state check errors
                }
              }
              
              // Only update state and restart if it's actually stopped
              speechRecognitionActiveRef.current = false
              // Only update React state if it changed to prevent re-renders
              if (speechRecognitionActive) {
                setSpeechRecognitionActive(false)
              }
              
              isRestartingRecognitionRef.current = true
              lastRestartAttemptRef.current = Date.now()
              
              // Use a longer delay to prevent rapid restart loops
              recognitionRestartTimeoutRef.current = setTimeout(() => {
                isRestartingRecognitionRef.current = false
                
                if (recognitionRef.current && (roomRef.current !== null || token)) {
                  try {
                    const state = (recognitionRef.current as any).state
                    // Double-check it's actually stopped before restarting
                    if (state === 'idle' || state === 'stopped' || state === undefined) {
                      recognitionRef.current.start()
                      console.log('🔄 Speech recognition restarted - state:', state, 'after', endCount, 'end events')
                      speechRecognitionActiveRef.current = true
                      setSpeechRecognitionActive(true)
                    } else {
                      // Already running, just update state
                      speechRecognitionActiveRef.current = true
                      if (!speechRecognitionActive) {
                        setSpeechRecognitionActive(true)
                      }
                    }
                  } catch (e: any) {
                    if (e.message && e.message.includes('already started')) {
                      console.log('✅ Speech recognition already running')
                      speechRecognitionActiveRef.current = true
                      if (!speechRecognitionActive) {
                        setSpeechRecognitionActive(true)
                      }
                    } else {
                      console.log('⚠️ Restart error:', e.message)
                    }
                  }
                }
              }, 5000) // 5 second delay to prevent rapid switching
            }, 1000) // Wait 1 second first to see if Chrome restarts automatically
          } else {
            speechRecognitionActiveRef.current = false
            // Only update state if it changed
            if (speechRecognitionActive) {
              setSpeechRecognitionActive(false)
            }
          }
        }

        recognitionRef.current = recognition
      } else {
        console.error('❌ Speech Recognition not supported in this browser')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]) // Only depend on role, handle connected/token in onend handler

  // Debug: Log transcript changes
  useEffect(() => {
    console.log('📊 Transcripts state changed. Count:', transcripts.length)
    if (transcripts.length > 0) {
      console.log('📊 Latest transcript:', transcripts[transcripts.length - 1])
    }
  }, [transcripts])

  // Health check for speech recognition - DISABLED to prevent rapid switching
  // The onend handler will handle restarts automatically
  // Uncomment this if you need a backup health check (but it may cause rapid switching)
  /*
  useEffect(() => {
    if (!recognitionRef.current) return

    const healthCheckInterval = setInterval(() => {
      const interviewActive = roomRef.current !== null || token
      
      // Don't check if already restarting
      if (interviewActive && recognitionRef.current && !isRestartingRecognitionRef.current) {
        try {
          const state = (recognitionRef.current as any).state
          
          // Only restart if truly stopped and not already restarting
          if ((state === 'idle' || state === 'stopped') && !isRestartingRecognitionRef.current) {
            console.log('⚠️ Health check: Recognition stopped - scheduling restart')
            isRestartingRecognitionRef.current = true
            
            // Clear any pending restart
            if (recognitionRestartTimeoutRef.current) {
              clearTimeout(recognitionRestartTimeoutRef.current)
            }
            
            recognitionRestartTimeoutRef.current = setTimeout(() => {
              isRestartingRecognitionRef.current = false
              
              if (recognitionRef.current && (roomRef.current !== null || token)) {
                try {
                  recognitionRef.current.start()
                  setSpeechRecognitionActive(true)
                  console.log('✅ Health check: Restarted successfully')
                } catch (startError: any) {
                  if (startError.message && startError.message.includes('already started')) {
                    setSpeechRecognitionActive(true)
                  }
                }
              }
            }, 2000)
          } else if (state === 'listening' || state === 'starting') {
            isRestartingRecognitionRef.current = false
          }
        } catch (e: any) {
          if (e.message && e.message.includes('already started')) {
            setSpeechRecognitionActive(true)
          }
        }
      }
    }, 10000) // Check every 10 seconds (very conservative)

    return () => {
      clearInterval(healthCheckInterval)
    }
  }, [token])
  */

  // Connect to backend WebSocket (optional - app works with browser speech recognition if this fails)
  const connectWebSocket = async (interviewId: string, wsUrl: string = 'ws://localhost:5000') => {
    // Prevent multiple simultaneous connection attempts
    if (wsConnectingRef.current) {
      console.log('⚠️ WebSocket connection already in progress, skipping...')
      return
    }

    // If already connected, don't reconnect
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected')
      return
    }

    // Close existing connection if any
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null // Remove close handler to prevent reconnection loop
        wsRef.current.onerror = null // Remove error handler
        wsRef.current.close(1000, 'Reconnecting')
      } catch (e) {
        // Ignore errors when closing
      }
      wsRef.current = null
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    wsConnectingRef.current = true

    // First, check if backend is reachable
    const httpUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://')
    try {
      // Use a longer timeout and add cache-busting
      const healthCheckUrl = `${httpUrl}/api/health?t=${Date.now()}`
      const healthCheck = await fetch(healthCheckUrl, { 
        method: 'GET',
        cache: 'no-store', // Prevent caching
        signal: AbortSignal.timeout(5000) // 5 second timeout (increased from 3)
      })
      if (!healthCheck.ok) {
        throw new Error(`Backend health check failed: ${healthCheck.status}`)
      }
      console.log('✅ Backend health check passed')
    } catch (error: any) {
      console.warn('⚠️ Backend server not reachable:', error?.message || error)
      console.warn('💡 The app will continue using browser speech recognition only.')
      console.warn('💡 To enable Deepgram transcription, make sure the backend server is running:')
      console.warn(`   cd backend && npm start`)
      console.warn(`   Then refresh this page (Ctrl+Shift+R to clear cache)`)
      setWsConnected(false)
      wsConnectingRef.current = false
      return // Don't attempt WebSocket connection if backend is down
    }

    // Ensure we're using the correct WebSocket URL format
    const wsUrlFull = wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://') 
      ? `${wsUrl}/ws/audio`
      : `ws://${wsUrl.replace('http://', '').replace('https://', '')}/ws/audio`
    console.log(`🔌 Attempting WebSocket connection to ${wsUrlFull}...`)
    
    try {
      const ws = new WebSocket(wsUrlFull, []) // Empty protocols array to avoid upgrade issues
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        setWsConnected(true)
        wsConnectingRef.current = false
        // Join interview
        const joinMessage = {
          type: 'join',
          interviewId,
          role
        }
        ws.send(JSON.stringify(joinMessage))
        console.log('📤 Sent join message:', joinMessage)
      }

      ws.onmessage = (event) => {
        try {
          // Check if message is binary (audio) or text (JSON)
          if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
            console.log('📨 Received binary message (audio acknowledgment or error)')
            return
          }
          
          const data = JSON.parse(event.data)
          console.log('📨 WebSocket message received:', data)
          
          if (data.type === 'joined') {
            console.log(`✅ Successfully joined as ${data.role} for interview ${data.interviewId}`)
            console.log('🎤 Deepgram transcription is now active - start speaking!')
          } else if (data.type === 'transcript') {
            // Received transcript from Deepgram (can be from self or other participant)
            console.log(`📝 Transcript from ${data.role}:`, data.text, data.isFinal ? '(FINAL)' : '(INTERIM)')
            
            if (!data.text || !data.text.trim()) {
              console.warn('⚠️ Received empty transcript, ignoring')
              return
            }
            
            const transcriptData = {
              role: data.role,
              text: data.text.trim(),
              timestamp: data.timestamp || Date.now(),
              isFinal: data.isFinal !== undefined ? data.isFinal : true
            }
            
            console.log('📝 Adding WebSocket transcript to state:', transcriptData)
            setTranscripts(prev => {
              const updated = [...prev, transcriptData]
              console.log('📝 Transcripts state updated. Total count:', updated.length, 'Latest:', transcriptData.text.substring(0, 50))
              return updated
            })
            
            // Real-time analysis: Handle transcripts for Q&A generation
            // Process HR questions immediately (even if interim) to generate ideal answer right away
            // Process candidate answers only when final (to avoid scoring partial answers)
            const isFinalTranscript = data.isFinal !== false && data.text.trim().length > 10
            const isInterimTranscript = data.isFinal === false && data.text.trim().length > 10
            
            // Process HR questions immediately (even if interim) with debouncing
            if (data.role === 'hr' && (isFinalTranscript || isInterimTranscript)) {
              const normalizedQuestion = data.text.trim().toLowerCase()
              
              // Clear any existing debounce timeout
              if (hrQuestionDebounceTimeoutRef.current) {
                clearTimeout(hrQuestionDebounceTimeoutRef.current)
              }
              
              // Debounce: Wait 1 second to see if we get a longer/better version
              // If it's final, process immediately; if interim, wait a bit
              const debounceDelay = isFinalTranscript ? 0 : 1000
              
              hrQuestionDebounceTimeoutRef.current = setTimeout(() => {
                // Check if this is a significantly different question (to handle interruptions)
                const isNewQuestion = normalizedQuestion !== lastProcessedHRQuestionRef.current && 
                                     !lastProcessedHRQuestionRef.current.includes(normalizedQuestion) &&
                                     !normalizedQuestion.includes(lastProcessedHRQuestionRef.current)
                
                if (isNewQuestion || lastProcessedHRQuestionRef.current === '') {
                  lastProcessedHRQuestionRef.current = normalizedQuestion
                  console.log(`👔 HR ${isFinalTranscript ? 'FINAL' : 'INTERIM'} transcript detected, generating ideal answer...`)
                  handleHRQuestion(data.text.trim(), data.timestamp || Date.now())
                } else {
                  console.log('⚠️ Question similar to previous, skipping to avoid duplicates')
                }
              }, debounceDelay)
            }
            // Process candidate answers only when final (complete answer)
            else if (data.role === 'candidate' && isFinalTranscript) {
              console.log('🎓 Candidate FINAL transcript detected, scoring answer...')
              handleCandidateAnswer(data.text.trim(), data.timestamp || Date.now())
            }
          } else if (data.type === 'error') {
            console.error('❌ WebSocket error message:', data.message)
            // Only show alert once per unique error message to prevent spam
            const errorKey = `ws-error-${data.message}`
            if (!sessionStorage.getItem(errorKey)) {
              sessionStorage.setItem(errorKey, 'true')
              // Use a more user-friendly notification instead of alert
              console.warn('⚠️ Transcription service unavailable. Using browser speech recognition instead.')
              // Don't show alert - just log it. The status indicator will show the issue.
            }
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.warn('⚠️ WebSocket connection error (this is optional)')
        console.warn('💡 The app will continue using browser speech recognition.')
        setWsConnected(false)
        wsConnectingRef.current = false
      }

      ws.onclose = (event) => {
        wsConnectingRef.current = false
        if (event.code !== 1000) { // 1000 = normal closure
          console.log('🔌 WebSocket closed', event.code, event.reason || 'Connection closed')
        }
        setWsConnected(false)
        
        // Only attempt to reconnect if we were previously connected and still in interview
        // AND not already attempting to reconnect
        if (event.code !== 1000 && (connected || token) && !wsConnectingRef.current) {
          console.log('🔄 Attempting to reconnect WebSocket in 5 seconds...')
          reconnectTimeoutRef.current = setTimeout(() => {
            if (connected || token) { // Double-check we still need connection
              connectWebSocket(interviewId, wsUrl)
            }
          }, 5000)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.warn('⚠️ Failed to create WebSocket connection:', error)
      console.warn('💡 The app will continue using browser speech recognition only.')
      setWsConnected(false)
      wsConnectingRef.current = false
    }
  }

  // Setup MediaRecorder for audio streaming
  const setupAudioStreaming = async (audioStream: MediaStream) => {
    try {
      // Store stream reference
      audioStreamRef.current = audioStream

      // Try different mimeTypes in order of preference
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        '' // Let browser choose default
      ]

      let mediaRecorder: MediaRecorder | null = null
      let selectedMimeType = ''

      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          try {
            mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)
            selectedMimeType = mimeType || 'browser-default'
            console.log(`✅ MediaRecorder created with mimeType: ${selectedMimeType}`)
            break
          } catch (e) {
            console.warn(`Failed to create MediaRecorder with ${mimeType}, trying next...`)
            continue
          }
        }
      }

      if (!mediaRecorder) {
        // Last resort: try without specifying mimeType
        try {
          mediaRecorder = new MediaRecorder(audioStream)
          selectedMimeType = 'browser-default'
          console.log('✅ MediaRecorder created with browser default')
        } catch (e: any) {
          console.error('❌ Failed to create MediaRecorder with any mimeType:', e.message)
          return // Don't break the flow, just skip MediaRecorder
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Send audio chunk to backend (which forwards to Deepgram)
          console.log(`🎤 Sending audio chunk to backend: ${event.data.size} bytes, type: ${event.data.type || 'unknown'}`)
          wsRef.current.send(event.data)
          // Note: Transcripts will come back via WebSocket messages from Deepgram
        } else {
          if (event.data.size > 0) {
            console.warn(`⚠️ Audio chunk ready but WebSocket not open. Size: ${event.data.size}, WS state: ${wsRef.current?.readyState}`)
          }
        }
      }

      mediaRecorder.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event.error)
      }

      // Start recording in chunks (every 1 second)
      if (mediaRecorder.state === 'inactive') {
        mediaRecorder.start(1000)
        mediaRecorderRef.current = mediaRecorder
        console.log(`🎤 MediaRecorder started with mimeType: ${selectedMimeType}`)
      }
    } catch (error: any) {
      // MediaRecorder is optional - don't break the flow if it fails
      console.warn('⚠️ MediaRecorder setup failed (this is optional):', error.message)
      // Don't throw - allow interview to continue without MediaRecorder
      // Speech recognition will still work
    }
  }

  // Start LiveKit room
  const startRoom = async () => {
    try {
      console.log('🚀 Starting room setup...')
      
      // Request media permissions FIRST
      console.log('🎤 Requesting microphone and camera permissions...')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }, 
          video: true 
        })
        console.log('✅ Media permissions granted')
        console.log('🎤 Audio tracks:', stream.getAudioTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled, muted: t.muted })))
        console.log('📹 Video tracks:', stream.getVideoTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled })))
        
        // Store stream for speech recognition
        audioStreamRef.current = stream
        
        // Initialize speech recognition if it doesn't exist (e.g., after ending previous interview)
        if (!recognitionRef.current) {
          console.log('🔄 Reinitializing speech recognition...')
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          if (SpeechRecognition) {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'
            recognition.maxAlternatives = 1
            
            // Copy all the event handlers from the useEffect initialization
            recognition.onstart = () => {
              console.log('🎙️ Speech recognition started')
              isRestartingRecognitionRef.current = false
              lastRestartAttemptRef.current = 0
              recognitionEndCountRef.current = 0
              speechRecognitionActiveRef.current = true
              if (!speechRecognitionActive) {
                setSpeechRecognitionActive(true)
              }
            }
            
            recognition.onresult = (event: SpeechRecognitionEvent) => {
              let finalTranscript = ''
              let interimTranscript = ''
              
              // Accumulate all results from this event (same logic as main handler)
              for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                  finalTranscript += transcript + ' '
                  accumulatedTranscriptRef.current += transcript + ' '
                } else {
                  interimTranscript += transcript
                }
              }
              
              // Show interim transcripts in real-time
              if (interimTranscript) {
                setTranscripts(prev => {
                  const filtered = prev.filter(t => !(t.role === role && t.isFinal === false))
                  if (interimTranscript.trim().length > 0) {
                    return [...filtered, {
                      role,
                      text: interimTranscript.trim(),
                      timestamp: Date.now(),
                      isFinal: false
                    }]
                  }
                  return filtered
                })
              }
              
              // Process final transcripts with accumulation (same logic as main handler)
              if (finalTranscript) {
                console.log('📝 Final transcript chunk received:', finalTranscript.trim())
                console.log('📝 Accumulated so far:', accumulatedTranscriptRef.current.trim())
                
                // Clear any existing timeout
                if (finalTranscriptTimeoutRef.current) {
                  clearTimeout(finalTranscriptTimeoutRef.current)
                }
                
                // Wait 2 seconds after the last final transcript to process the complete accumulated text
                finalTranscriptTimeoutRef.current = setTimeout(() => {
                  const completeText = accumulatedTranscriptRef.current.trim()
                  
                  if (completeText.length > 0) {
                    const transcriptData = {
                      role,
                      text: completeText,
                      timestamp: Date.now(),
                      isFinal: true
                    }
                    
                    console.log('📝 Complete final transcript:', completeText)
                    setTranscripts(prev => {
                      const filtered = prev.filter(t => !(t.role === role && t.isFinal === false))
                      return [...filtered, transcriptData]
                    })
                    
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({
                        type: 'transcript',
                        ...transcriptData
                      }))
                    }
                    
                    // Process HR questions
                    if (role === 'hr' && completeText.length > 10) {
                      const normalizedQuestion = completeText.toLowerCase()
                      const isNewQuestion = normalizedQuestion !== lastProcessedHRQuestionRef.current && 
                                           !lastProcessedHRQuestionRef.current.includes(normalizedQuestion) &&
                                           !normalizedQuestion.includes(lastProcessedHRQuestionRef.current)
                      
                      if (isNewQuestion || lastProcessedHRQuestionRef.current === '') {
                        lastProcessedHRQuestionRef.current = normalizedQuestion
                        console.log('👔 HR COMPLETE question detected, generating ideal answer...')
                        handleHRQuestion(completeText, Date.now())
                      }
                    } else if (role === 'candidate' && completeText.length > 10) {
                      handleCandidateAnswer(completeText, Date.now())
                    }
                    
                    // Clear accumulated transcript
                    accumulatedTranscriptRef.current = ''
                  }
                }, 2000) // Wait 2 seconds after last final transcript
              }
            }
            
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
              if (event.error === 'no-speech' || event.error === 'aborted') {
                return
              }
              console.error('❌ Speech recognition error:', event.error)
              setSpeechRecognitionActive(false)
              if (roomRef.current !== null) {
                setTimeout(() => {
                  if (recognitionRef.current && roomRef.current !== null) {
                    try {
                      recognitionRef.current.start()
                      setSpeechRecognitionActive(true)
                    } catch (e: any) {
                      console.error('Failed to restart after error:', e.message)
                    }
                  }
                }, 1000)
              }
            }
            
            recognition.onend = () => {
              recognitionEndCountRef.current += 1
              const endCount = recognitionEndCountRef.current
              
              // Process any accumulated transcript when recognition ends
              if (accumulatedTranscriptRef.current.trim().length > 0) {
                if (finalTranscriptTimeoutRef.current) {
                  clearTimeout(finalTranscriptTimeoutRef.current)
                  finalTranscriptTimeoutRef.current = null
                }
                
                setTimeout(() => {
                  const completeText = accumulatedTranscriptRef.current.trim()
                  
                  if (completeText.length > 0) {
                    const transcriptData = {
                      role,
                      text: completeText,
                      timestamp: Date.now(),
                      isFinal: true
                    }
                    
                    console.log('📝 Processing accumulated transcript on end:', completeText)
                    setTranscripts(prev => {
                      const filtered = prev.filter(t => !(t.role === role && t.isFinal === false))
                      return [...filtered, transcriptData]
                    })
                    
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({
                        type: 'transcript',
                        ...transcriptData
                      }))
                    }
                    
                    if (role === 'hr' && completeText.length > 10) {
                      const normalizedQuestion = completeText.toLowerCase()
                      const isNewQuestion = normalizedQuestion !== lastProcessedHRQuestionRef.current && 
                                           !lastProcessedHRQuestionRef.current.includes(normalizedQuestion) &&
                                           !normalizedQuestion.includes(lastProcessedHRQuestionRef.current)
                      
                      if (isNewQuestion || lastProcessedHRQuestionRef.current === '') {
                        lastProcessedHRQuestionRef.current = normalizedQuestion
                        console.log('👔 HR question detected on end, generating ideal answer...')
                        handleHRQuestion(completeText, Date.now())
                      }
                    }
                    
                    accumulatedTranscriptRef.current = ''
                  }
                }, 500)
              }
              
              const now = Date.now()
              const timeSinceLastRestart = now - lastRestartAttemptRef.current
              
              if (timeSinceLastRestart < 5000) {
                return
              }
              
              if (recognitionRestartTimeoutRef.current) {
                clearTimeout(recognitionRestartTimeoutRef.current)
                recognitionRestartTimeoutRef.current = null
              }
              
              const shouldRestart = (roomRef.current !== null || token) && recognitionRef.current && !isRestartingRecognitionRef.current
              
              if (shouldRestart) {
                setTimeout(() => {
                  if (recognitionRef.current) {
                    try {
                      const state = (recognitionRef.current as any).state
                      if (state === 'listening' || state === 'starting') {
                        speechRecognitionActiveRef.current = true
                        if (!speechRecognitionActive) {
                          setSpeechRecognitionActive(true)
                        }
                        return
                      }
                    } catch (e) {
                      // Ignore
                    }
                  }
                  
                  speechRecognitionActiveRef.current = false
                  if (speechRecognitionActive) {
                    setSpeechRecognitionActive(false)
                  }
                  
                  isRestartingRecognitionRef.current = true
                  lastRestartAttemptRef.current = Date.now()
                  
                  recognitionRestartTimeoutRef.current = setTimeout(() => {
                    isRestartingRecognitionRef.current = false
                    if (recognitionRef.current && (roomRef.current !== null || token)) {
                      try {
                        const state = (recognitionRef.current as any).state
                        if (state === 'idle' || state === 'stopped' || state === undefined) {
                          recognitionRef.current.start()
                          speechRecognitionActiveRef.current = true
                          setSpeechRecognitionActive(true)
                        } else {
                          speechRecognitionActiveRef.current = true
                          if (!speechRecognitionActive) {
                            setSpeechRecognitionActive(true)
                          }
                        }
                      } catch (e: any) {
                        if (e.message && e.message.includes('already started')) {
                          speechRecognitionActiveRef.current = true
                          if (!speechRecognitionActive) {
                            setSpeechRecognitionActive(true)
                          }
                        }
                      }
                    }
                  }, 5000)
                }, 1000)
              } else {
                speechRecognitionActiveRef.current = false
                if (speechRecognitionActive) {
                  setSpeechRecognitionActive(false)
                }
              }
            }
            
            recognitionRef.current = recognition
            console.log('✅ Speech recognition reinitialized')
          } else {
            console.error('❌ Speech Recognition not supported in this browser')
          }
        }
        
        // Start speech recognition immediately (it will use system default mic)
        if (recognitionRef.current) {
          try {
            // Check if already running
            const state = (recognitionRef.current as any).state
            if (state === 'idle' || state === 'stopped' || state === undefined) {
              recognitionRef.current.start()
              console.log('🎙️ Speech recognition started')
              speechRecognitionActiveRef.current = true
              setSpeechRecognitionActive(true)
            } else {
              console.log('✅ Speech recognition already running (state:', state, ')')
              speechRecognitionActiveRef.current = true
              setSpeechRecognitionActive(true)
            }
          } catch (recError: any) {
            if (recError.message && recError.message.includes('already started')) {
              console.log('✅ Speech recognition already running')
              speechRecognitionActiveRef.current = true
              setSpeechRecognitionActive(true)
            } else {
              console.warn('⚠️ Speech recognition start error:', recError.message)
              // Don't fail the interview if speech recognition fails - it's optional
            }
          }
        } else {
          console.warn('⚠️ Speech recognition not initialized and could not be created')
        }
        
        // Setup audio streaming
        setupAudioStreaming(stream)
        
        // Don't stop the stream yet - LiveKit might need it
        // We'll let LiveKit handle its own stream
      } catch (mediaError: any) {
        console.error('❌ Media permission error:', mediaError)
        alert(`Please grant microphone and camera permissions to continue.\n\nError: ${mediaError.message}`)
        return
      }

      // Get LiveKit token from backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      console.log(`📡 Fetching LiveKit token from ${API_URL}...`)
      
      let response
      try {
        response = await fetch(`${API_URL}/api/interviews/spike/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: roomName || 'test-room', role }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - backend may be slow to respond')
        } else if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('ECONNREFUSED')) {
          throw new Error(`Cannot connect to backend at ${API_URL}. Make sure the backend server is running: cd backend && npm start`)
        } else {
          throw new Error(`Network error: ${fetchError.message}`)
        }
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('✅ LiveKit token received:', data)
      console.log('🔑 Token length:', data.token?.length || 0)
      console.log('🌐 Server URL:', data.url)
      
      if (!data.token) {
        throw new Error('No token received from backend')
      }
      
      if (!data.url) {
        console.warn('⚠️ No server URL in response, using default')
      }
      
      setToken(data.token)
      setServerUrl(data.url || 'ws://localhost:7880')
      console.log('✅ Token and server URL set. Token:', data.token.substring(0, 50) + '...', 'URL:', data.url || 'ws://localhost:7880')

      // Connect WebSocket for audio streaming (will be used after room connects)
      // We'll connect it in handleRoomConnected to ensure proper timing
    } catch (error: any) {
      console.error('❌ Error starting room:', error)
      alert(`Failed to start interview: ${error.message}\n\nMake sure:\n1. Backend is running on port 5000\n2. LiveKit is configured in backend/.env\n3. Microphone/camera permissions are granted`)
    }
  }

  // Component to handle room connection using RoomContext
  const RoomConnectionHandler = ({ onConnected }: { onConnected: (room: Room | undefined) => void }) => {
    const room = useContext(RoomContext)
    
    useEffect(() => {
      console.log('🔍 RoomConnectionHandler: room state changed:', room?.state, 'room:', room ? 'exists' : 'null')
      
      if (room) {
        // Log room details for debugging
        console.log('🔍 Room details:', {
          name: room.name,
          state: room.state,
          localParticipant: room.localParticipant ? 'exists' : 'null',
          remoteParticipants: room.remoteParticipants?.size || 0
        })
        
        // Listen for connection state changes
        const handleConnected = () => {
          console.log('✅ Room connected event fired!')
          onConnected(room)
        }
        
        const handleDisconnected = () => {
          console.log('🔌 Room disconnected event fired')
          setConnected(false)
        }
        
        // Check current state
        if (room.state === 'connected') {
          console.log('✅ Room already connected, calling onConnected')
          onConnected(room)
        }
        
        // Listen for future state changes using RoomEvent
        if (room.on) {
          room.on(RoomEvent.Connected, handleConnected)
          room.on(RoomEvent.Disconnected, handleDisconnected)
        }
        
        return () => {
          if (room.off) {
            room.off(RoomEvent.Connected, handleConnected)
            room.off(RoomEvent.Disconnected, handleDisconnected)
          }
        }
      } else {
        console.warn('⚠️ RoomConnectionHandler: room is null/undefined')
      }
    }, [room, onConnected])
    
    return null
  }

  // Handle room connection
  const handleRoomConnected = (room: Room | undefined) => {
    if (!room) {
      console.warn('⚠️ Room is undefined in handleRoomConnected - LiveKit may not be properly configured')
      console.warn('⚠️ Check: 1) Token is valid, 2) Server URL is correct, 3) LiveKit server is accessible')
      // Don't return - we can still use speech recognition without LiveKit
      setConnected(false)
      return
    }

    console.log('✅ Connected to LiveKit room:', room?.name || 'unknown')
    console.log('✅ Room state:', room?.state)
    console.log('✅ Room participants:', room?.remoteParticipants?.size || 0)
    roomRef.current = room
    setConnected(true)

    // Connect WebSocket now that room is connected
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'
    console.log(`🔌 Connecting WebSocket to ${WS_URL}...`)
    connectWebSocket('spike-interview-123', WS_URL)

    // Speech recognition should already be started from startRoom
    // Just verify it's running
    if (recognitionRef.current) {
      try {
        const state = (recognitionRef.current as any).state || 'unknown'
        console.log('🎙️ Speech recognition state:', state)
        if (state === 'idle' || state === 'stopped' || !speechRecognitionActive) {
          recognitionRef.current.start()
          console.log('🎙️ Speech recognition restarted after room connection')
          setSpeechRecognitionActive(true)
        } else {
          console.log('✅ Speech recognition already running')
        }
      } catch (e: any) {
        console.log('Speech recognition restart error:', e.message)
      }
    } else {
      console.warn('⚠️ Speech recognition not initialized')
    }

    // Listen for new audio tracks (only if room is valid)
    try {
      if (room && typeof room.on === 'function') {
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          console.log('🔊 Subscribed to track:', track.kind, 'from', participant.identity)
          if (track.kind === Track.Kind.Audio) {
            console.log('🔊 Audio track subscribed from', participant.identity)
          }
          if (track.kind === Track.Kind.Video) {
            console.log('📹 Video track subscribed from', participant.identity)
          }
        })

        // Listen for local tracks (only if localParticipant exists)
        if (room.localParticipant) {
          room.localParticipant.audioTrackPublications.forEach((publication) => {
            console.log('🎤 Local audio track:', publication.trackSid)
          })
          
          room.localParticipant.videoTrackPublications.forEach((publication) => {
            console.log('📹 Local video track:', publication.trackSid)
          })
        }
      }
    } catch (error: any) {
      console.error('❌ Error setting up room event listeners:', error)
    }
  }

  // Handle HR question - generate ideal answer in real-time
  // This function is called for EVERY new HR question, regardless of previous Q&A state
  const handleHRQuestion = async (question: string, timestamp: number) => {
    console.log('🤔 HR Question detected:', question)
    console.log('📊 Current Q&A pairs count:', qaPairs.length)
    
    // Always add the question to Q&A pairs first (even if previous questions weren't answered)
    // This ensures each new question gets processed, even if HR interrupts with a new question
    const newQAPair = {
      question,
      questionTimestamp: timestamp,
      loadingIdealAnswer: true // Always show loading
    }
    
    console.log('📝 Adding Q&A pair to state...')
    setQaPairs(prev => {
      // Add new question - don't filter out unanswered questions
      // This allows multiple questions to be displayed and processed
      const updated = [...prev, newQAPair]
      console.log('✅ Q&A pair added. New count:', updated.length)
      return updated
    })

    console.log('📝 Generating ideal answer with Ollama...')

    try {
      // Use backend Ollama endpoint
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const endpoint = `${API_URL}/api/ollama/generate-ideal-answer`
      console.log(`📡 Calling Ollama API: ${endpoint}`)
      console.log(`📤 Request payload:`, { question })
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question
        })
      })

      console.log(`📥 Response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API response error:', response.status, errorText)
        throw new Error(`Failed to generate ideal answer: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Ideal answer received from API')
      console.log('📄 Response data keys:', Object.keys(data))
      console.log('📄 Ideal answer preview:', data.idealAnswer ? data.idealAnswer.substring(0, 150) + '...' : 'MISSING!')
      
      if (!data.idealAnswer) {
        console.error('❌ No idealAnswer field in response:', data)
        throw new Error('No ideal answer in response')
      }
      
      // Update Q&A pair with ideal answer - find by question and timestamp
      setQaPairs(prev => {
        const updated = prev.map((qa) => {
          if (qa.question === question && qa.questionTimestamp === timestamp) {
            console.log('✅ Updating Q&A pair with ideal answer')
            return { ...qa, idealAnswer: data.idealAnswer, loadingIdealAnswer: false }
          }
          return qa
        })
        console.log('📊 Updated Q&A pairs count:', updated.length)
        return updated
      })

      console.log('✅ Ideal answer generated and displayed successfully!')
    } catch (error: any) {
      console.error('❌ Error generating ideal answer:', error.message || error)
      console.error('💡 Troubleshooting:')
      console.error('   1. Check if backend is running: cd backend && npm start')
      console.error('   2. Check if Ollama is running: ollama serve')
      console.error('   3. Check backend/.env has OLLAMA_URL=http://localhost:11434')
      console.error('   4. Check browser Network tab for the API request')
      
      // Update Q&A pair to remove loading state and set error
      const errorMessage = error.message || 'Failed to generate ideal answer. Please check backend logs and ensure Ollama is configured correctly.'
      setQaPairs(prev => prev.map((qa) => 
        qa.question === question && qa.questionTimestamp === timestamp
          ? { ...qa, loadingIdealAnswer: false, idealAnswerError: errorMessage }
          : qa
      ))
    }
  }

  // Handle candidate answer - score it in real-time (only on HR side)
  const handleCandidateAnswer = async (answer: string, timestamp: number) => {
    // Find the latest unanswered question
    const latestUnanswered = qaPairs
      .filter(qa => !qa.candidateAnswer)
      .sort((a, b) => b.questionTimestamp - a.questionTimestamp)[0]

    if (!latestUnanswered) {
      console.log('⚠️ No unanswered question found')
      return
    }

    // Update Q&A pair with candidate answer
    setQaPairs(prev => prev.map(qa => 
      qa.question === latestUnanswered.question && !qa.candidateAnswer
        ? { ...qa, candidateAnswer: answer, candidateAnswerTimestamp: timestamp, loadingScore: role === 'hr' && !!latestUnanswered.idealAnswer }
        : qa
    ))

    // Score the answer (only if HR side and we have ideal answer)
    if (role === 'hr' && latestUnanswered.idealAnswer) {
      try {
        // Use backend Ollama endpoint instead of ML API
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const response = await fetch(`${API_URL}/api/ollama/score-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: latestUnanswered.question,
            candidateAnswer: answer,
            idealAnswer: latestUnanswered.idealAnswer
          })
        })

        if (!response.ok) {
          throw new Error('Failed to score answer')
        }

        const data = await response.json()
        
        // Update Q&A pair with score
        setQaPairs(prev => prev.map(qa => 
          qa.question === latestUnanswered.question && qa.candidateAnswer === answer
            ? { ...qa, score: data.score, justification: data.justification, loadingScore: false }
            : qa
        ))

        console.log('✅ Answer scored:', data.score, '/10')
      } catch (error: any) {
        console.error('❌ Error scoring answer:', error)
        setQaPairs(prev => prev.map(qa => 
          qa.question === latestUnanswered.question && qa.candidateAnswer === answer
            ? { ...qa, loadingScore: false }
            : qa
        ))
      }
    }
  }

  // Handle room disconnect
  const handleRoomDisconnected = () => {
    console.log('🔌 Disconnected from LiveKit room')
    setConnected(false)
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore
      }
    }
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        // Ignore
      }
    }
    
    // Close WebSocket properly
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null // Prevent reconnection
        wsRef.current.onerror = null
        wsRef.current.close(1000, 'Room disconnected')
      } catch (e) {
        // Ignore
      }
      wsRef.current = null
    }
    setWsConnected(false)
    wsConnectingRef.current = false
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  // End interview
  const endInterview = () => {
    console.log('🛑 Ending interview...')
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log('✅ Speech recognition stopped')
      } catch (e: any) {
        console.log('Error stopping speech recognition:', e.message)
      }
      recognitionRef.current = null
    }
    setSpeechRecognitionActive(false)
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
        console.log('✅ MediaRecorder stopped')
      } catch (e: any) {
        console.log('Error stopping MediaRecorder:', e.message)
      }
      mediaRecorderRef.current = null
    }
    
    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('✅ Stopped track:', track.kind)
      })
      audioStreamRef.current = null
    }
    
    // Send end interview message to backend
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'end-interview',
        interviewId: 'spike-interview-123'
      }))
    }
    
    // Disconnect from LiveKit room
    if (roomRef.current) {
      try {
        roomRef.current.disconnect()
        console.log('✅ Disconnected from LiveKit room')
      } catch (e: any) {
        console.log('Error disconnecting from room:', e.message)
      }
      roomRef.current = null
    }
    
    // Close WebSocket properly
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null // Remove handlers to prevent reconnection
        wsRef.current.onerror = null
        wsRef.current.close(1000, 'Interview ended')
      } catch (e) {
        // Ignore errors
      }
      wsRef.current = null
    }
    setWsConnected(false)
    wsConnectingRef.current = false
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Clear speech recognition restart timeout
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current)
      recognitionRestartTimeoutRef.current = null
    }
    isRestartingRecognitionRef.current = false
    
    // Clear HR question debounce timeout
    if (hrQuestionDebounceTimeoutRef.current) {
      clearTimeout(hrQuestionDebounceTimeoutRef.current)
      hrQuestionDebounceTimeoutRef.current = null
    }
    
    // Clear final transcript timeout
    if (finalTranscriptTimeoutRef.current) {
      clearTimeout(finalTranscriptTimeoutRef.current)
      finalTranscriptTimeoutRef.current = null
    }
    
    lastProcessedHRQuestionRef.current = '' // Reset processed questions
    accumulatedTranscriptRef.current = '' // Clear accumulated transcript
    
    // Reset state
    setConnected(false)
    setToken('')
    setServerUrl('')
    setRoomName('')
    setTranscripts([])
    
    console.log('✅ Interview ended')
  }

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Close WebSocket
      if (wsRef.current) {
        try {
          wsRef.current.onclose = null
          wsRef.current.onerror = null
          wsRef.current.close(1000, 'Component unmounting')
        } catch (e) {
          // Ignore
        }
        wsRef.current = null
      }
      
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      // Clear speech recognition restart timeout
      if (recognitionRestartTimeoutRef.current) {
        clearTimeout(recognitionRestartTimeoutRef.current)
        recognitionRestartTimeoutRef.current = null
      }
      isRestartingRecognitionRef.current = false
      
      // Clear HR question debounce timeout
      if (hrQuestionDebounceTimeoutRef.current) {
        clearTimeout(hrQuestionDebounceTimeoutRef.current)
        hrQuestionDebounceTimeoutRef.current = null
      }
      
      // Clear final transcript timeout
      if (finalTranscriptTimeoutRef.current) {
        clearTimeout(finalTranscriptTimeoutRef.current)
        finalTranscriptTimeoutRef.current = null
      }
      
      lastProcessedHRQuestionRef.current = '' // Reset processed questions
      accumulatedTranscriptRef.current = '' // Clear accumulated transcript
      
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null // Remove onend handler to prevent restart
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore
        }
      }
      
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch (e) {
          // Ignore
        }
      }
      
      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }
    }
  }, [])

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">🎥 Live Interview Spike Test</h1>
          
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Setup</h2>
            
            <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">💡 Two Laptop Testing:</h3>
              <p className="text-sm text-slate-300 mb-2">
                <strong>Laptop 1 (HR):</strong> Run backend + frontend. Use role "HR".<br/>
                <strong>Laptop 2 (Candidate):</strong> Run frontend only. Point to Laptop 1's IP. Use role "Candidate".<br/>
                <strong>Both:</strong> Enter the <strong>same room name</strong> to connect!
              </p>
              <p className="text-xs text-slate-400">
                See <code>TWO_LAPTOP_TESTING.md</code> for detailed setup instructions.
              </p>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-400">
                <strong>Current API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}<br/>
                <strong>Current WS URL:</strong> {process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                💡 For Laptop 2, create <code>.env.local</code> with these pointing to Laptop 1's IP
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Role</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setRole('hr')}
                    className={`px-4 py-2 rounded-lg ${
                      role === 'hr' ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    HR
                  </button>
                  <button
                    onClick={() => setRole('candidate')}
                    className={`px-4 py-2 rounded-lg ${
                      role === 'candidate' ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    Candidate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="test-room"
                  className="w-full px-4 py-2 bg-slate-700 rounded-lg"
                />
              </div>


              <button
                onClick={startRoom}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              >
                Start Interview
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-300">
              <li>Select your role (HR or Candidate)</li>
              <li>Enter a room name (both users need same name)</li>
              <li>Click "Start Interview"</li>
              <li>Grant microphone permissions</li>
              <li>Start speaking - transcripts will appear below</li>
              <li>Check backend console for logged transcripts</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Live Interview - {role === 'hr' ? 'HR' : 'Candidate'}
          </h1>
          <button
            onClick={endInterview}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            End Interview
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Video Conference */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              {token && serverUrl ? (
                <LiveKitRoom
                  video={true}
                  audio={true}
                  token={token}
                  serverUrl={serverUrl}
                  onDisconnected={handleRoomDisconnected}
                  onError={(error: any) => {
                    console.error('❌ LiveKit room error:', error)
                    let errorMessage = 'Unknown error'
                    if (error) {
                      if (typeof error === 'string') {
                        errorMessage = error
                      } else if (error.message) {
                        errorMessage = error.message
                      } else if (error.toString) {
                        errorMessage = error.toString()
                      } else {
                        errorMessage = JSON.stringify(error)
                      }
                    }
                    console.error('Full error details:', error)
                    
                    // Only show alert once to prevent spam
                    if (!errorShownRef.current) {
                      errorShownRef.current = true
                      alert(`LiveKit connection error: ${errorMessage}\n\nCheck:\n1. LiveKit server is running\n2. LIVEKIT_URL in backend/.env is correct\n3. LiveKit credentials are valid\n4. Check browser console (F12) for details\n\n(Error will only show once - check console for more details)`)
                      
                      // Reset after 5 seconds so user can see it again if needed
                      setTimeout(() => {
                        errorShownRef.current = false
                      }, 5000)
                    }
                  }}
                  className="h-full"
                  options={{
                    adaptiveStream: true,
                    dynacast: true,
                  }}
                >
                  <RoomConnectionHandler onConnected={handleRoomConnected} />
                  <VideoConference />
                  <ControlBar />
                </LiveKitRoom>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Connecting to LiveKit...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Transcripts Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-4 h-full">
              <h2 className="text-xl font-semibold mb-4">
                📝 Live Transcripts {transcripts.length > 0 && `(${transcripts.length})`}
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {transcripts.length === 0 ? (
                  <p className="text-slate-400 text-sm">No transcripts yet. Start speaking...</p>
                ) : (
                  transcripts.map((transcript, idx) => (
                    <div 
                      key={`${transcript.timestamp}-${idx}-${transcript.role}`} 
                      className={`p-3 rounded-lg text-sm ${
                        transcript.role === 'hr' 
                          ? 'bg-blue-900/20 border border-blue-700' 
                          : 'bg-purple-900/20 border border-purple-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${
                          transcript.role === 'hr' ? 'text-blue-400' : 'text-purple-400'
                        }`}>
                          {transcript.role === 'hr' ? '👔 HR' : '🎓 Candidate'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(transcript.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`text-white ${transcript.isFinal === false ? 'italic opacity-70' : ''}`}>
                        {transcript.text}
                        {transcript.isFinal === false && (
                          <span className="ml-2 text-xs text-slate-400">(typing...)</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Q&A Analysis Panel with Real-time Ideal Answers */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-4 h-full">
              <h2 className="text-xl font-semibold mb-4">
                {role === 'hr' ? '📊 Real-time Q&A Analysis' : '💬 Interview Q&A'}
              </h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {qaPairs.length === 0 ? (
                  <p className="text-slate-400 text-sm">
                    {role === 'hr' 
                      ? 'Ask a question to see AI-generated ideal answers in real-time!'
                      : 'Questions and answers will appear here...'}
                  </p>
                ) : (
                  qaPairs.map((qa, idx) => (
                    <div key={idx} className="bg-slate-700 rounded-lg p-4 space-y-3">
                      {/* Question */}
                      <div className="border-b border-slate-600 pb-2">
                        <div className="text-xs font-semibold text-blue-400 mb-1">Q{idx + 1}: HR Question</div>
                        <div className="text-sm text-white">{qa.question}</div>
                      </div>

                      {/* Answers Section - Show Ideal Answer and Candidate Answer Together */}
                      {qa.loadingIdealAnswer ? (
                        <div className="bg-green-900/20 border border-green-700 rounded p-2">
                          <div className="flex items-center gap-2 text-green-400 text-xs">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400" />
                            <span>Generating ideal answer...</span>
                          </div>
                        </div>
                      ) : qa.idealAnswerError ? (
                        <div className="bg-red-900/20 border border-red-700 rounded p-2">
                          <div className="text-xs font-semibold text-red-400 mb-1">⚠️ Error Generating Ideal Answer</div>
                          <div className="text-xs text-red-200">{qa.idealAnswerError}</div>
                        </div>
                      ) : qa.idealAnswer && qa.candidateAnswer ? (
                        // Show both answers side-by-side when both are available
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-green-900/20 border border-green-700 rounded p-3">
                            <div className="text-xs font-semibold text-green-400 mb-1">✨ Ideal Answer (AI Generated)</div>
                            <div className="text-xs text-green-200 whitespace-pre-wrap max-h-48 overflow-y-auto">{qa.idealAnswer}</div>
                          </div>
                          <div className="bg-purple-900/20 border border-purple-700 rounded p-3">
                            <div className="text-xs font-semibold text-purple-400 mb-1">💬 Candidate Answer</div>
                            <div className="text-xs text-purple-200 whitespace-pre-wrap max-h-48 overflow-y-auto">{qa.candidateAnswer}</div>
                          </div>
                        </div>
                      ) : (
                        // Show answers stacked when only one is available
                        <div className="space-y-3">
                          {/* Ideal Answer */}
                          {qa.idealAnswer && (
                            <div className="bg-green-900/20 border border-green-700 rounded p-3">
                              <div className="text-xs font-semibold text-green-400 mb-1">✨ Ideal Answer (AI Generated)</div>
                              <div className="text-xs text-green-200 whitespace-pre-wrap">{qa.idealAnswer}</div>
                            </div>
                          )}
                          
                          {/* Candidate Answer */}
                          {qa.candidateAnswer ? (
                            <div className="bg-purple-900/20 border border-purple-700 rounded p-3">
                              <div className="text-xs font-semibold text-purple-400 mb-1">💬 Candidate Answer</div>
                              <div className="text-xs text-purple-200 whitespace-pre-wrap">{qa.candidateAnswer}</div>
                            </div>
                          ) : qa.idealAnswer ? (
                            <div className="bg-slate-600/50 rounded p-2 text-xs text-slate-400 italic">
                              Waiting for candidate answer...
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Score (Real-time) */}
                      {qa.loadingScore ? (
                        <div className="flex items-center gap-2 text-yellow-400 text-xs">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400" />
                          <span>Scoring answer...</span>
                        </div>
                      ) : qa.score !== undefined ? (
                        <div className="bg-blue-900/20 border border-blue-700 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-blue-400">AI Score</span>
                            <span className="text-lg font-bold text-blue-300">{qa.score}/10</span>
                          </div>
                          {qa.justification && (
                            <div className="text-xs text-blue-200 mt-1">{qa.justification}</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              LiveKit: {connected ? (
                <span className="text-green-400">Connected</span>
              ) : (
                <span className="text-red-400">Disconnected</span>
              )}{' '}
              | WebSocket: {wsConnected ? (
                <span className="text-green-400">Open (Deepgram Active)</span>
              ) : (
                <span className="text-yellow-400">Closed (Using Browser Speech Recognition)</span>
              )}{' '}
              | Speech Recognition: {speechRecognitionActive ? (
                <span className="text-green-400">Active</span>
              ) : (
                <span className="text-red-400">Inactive</span>
              )}
            </span>
          </div>
          {!wsConnected && connected && (
            <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700 rounded text-xs text-yellow-200">
              ⚠️ Backend WebSocket not available. The app is using browser speech recognition, which works fine for local transcription. 
              To enable Deepgram transcription (better accuracy, cross-participant transcripts), start the backend server: <code className="bg-slate-700 px-1 rounded">cd backend && npm start</code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


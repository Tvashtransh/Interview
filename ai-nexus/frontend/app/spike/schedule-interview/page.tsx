'use client'

import { useState } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ScheduleInterviewSpike() {
  const [jobDescription, setJobDescription] = useState<string>('')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [jdFileName, setJdFileName] = useState<string>('')
  const [jdText, setJdText] = useState<string>('')
  const [mockTranscript, setMockTranscript] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['text/plain', 'application/pdf', 'text/markdown']
    const validExtensions = ['.txt', '.pdf', '.md']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload .txt, .pdf, or .md file')
      return
    }

    setJdFile(file)
    setJdFileName(file.name)
    setError('')

    // Read file content
    if (file.type === 'text/plain' || fileExtension === '.txt' || fileExtension === '.md') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setJdText(text)
        setJobDescription(text)
      }
      reader.readAsText(file)
    } else if (file.type === 'application/pdf' || fileExtension === '.pdf') {
      // For PDF, we'll send the file to backend for processing
      setJdText('PDF file - will be processed by backend')
      setJobDescription('PDF file uploaded')
    }
  }

  // Remove file
  const removeFile = () => {
    setJdFile(null)
    setJdFileName('')
    setJdText('')
    setJobDescription('')
  }

  // Test analysis with mock transcript
  const testAnalysis = async () => {
    if (!jobDescription && !jdFile) {
      setError('Please upload a Job Description file or enter text')
      return
    }

    if (!mockTranscript.trim()) {
      setError('Please enter a mock transcript')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Prepare form data
      const formData = new FormData()
      
      if (jdFile) {
        formData.append('jobDescription', jdFile)
      } else if (jdText) {
        formData.append('jobDescriptionText', jdText)
      }
      
      formData.append('mockTranscript', mockTranscript)

      const response = await fetch('http://localhost:8000/api/analyze-mock', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Analysis failed')
      }

      const data = await response.json()
      setResult(data)
      console.log('✅ Analysis Result:', data)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze interview')
      console.error('❌ Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🧠 AI Analysis Pipeline - Spike Test</h1>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">1. Upload Job Description</h2>
          
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload JD File (.txt, .pdf, .md)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <span className="text-slate-400">
                      {jdFileName || 'Click to upload or drag and drop'}
                    </span>
                    <input
                      type="file"
                      accept=".txt,.pdf,.md,text/plain,application/pdf,text/markdown"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </label>
                {jdFileName && (
                  <button
                    onClick={removeFile}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Or Enter Text */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Or Enter JD Text Directly
              </label>
              <textarea
                value={jdText}
                onChange={(e) => {
                  setJdText(e.target.value)
                  setJobDescription(e.target.value)
                }}
                placeholder="Paste job description here..."
                className="w-full h-32 px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {jdFileName && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>File loaded: {jdFileName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">2. Enter Mock Transcript</h2>
          
          <textarea
            value={mockTranscript}
            onChange={(e) => setMockTranscript(e.target.value)}
            placeholder={`Example:
HR: Welcome to the interview. Can you tell me about yourself?
Candidate: Thank you. I'm a software engineer with 5 years of experience in full-stack development. I've worked with React, Node.js, and MongoDB.
HR: Great! Can you explain how you would design a scalable system?
Candidate: I would start by identifying the requirements, then design the architecture with microservices...`}
            className="w-full h-64 px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none font-mono text-sm"
          />
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <button
            onClick={testAnalysis}
            disabled={loading || (!jobDescription && !jdFile) || !mockTranscript.trim()}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Run AI Analysis Pipeline</span>
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400 mb-1">Error</h3>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">✅ Analysis Results</h2>
            
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Overall AI Score</h3>
                <div className="text-4xl font-bold text-blue-400">
                  {result.overallScore}/100
                </div>
              </div>

              {/* HR Summary */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">AI Summary (for HR)</h3>
                <p className="text-slate-300">{result.aiSummaryHR}</p>
              </div>

              {/* Candidate Summary */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Performance Summary (for Candidate)</h3>
                <p className="text-slate-300">{result.aiSummaryCandidate}</p>
              </div>

              {/* Q&A Breakdown */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Question-by-Question Breakdown</h3>
                <div className="space-y-4">
                  {result.qaBreakdown?.map((qa: any, idx: number) => (
                    <div key={idx} className="bg-slate-600 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-blue-400 mb-1">
                          Q: {qa.question}
                        </div>
                        <div className="text-sm text-slate-300 mb-2">
                          <span className="font-semibold">Candidate Answer:</span> {qa.candidateAnswer}
                        </div>
                        <div className="text-sm text-slate-300 mb-2">
                          <span className="font-semibold">Ideal Answer:</span> {qa.idealAnswer}
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-sm font-semibold">AI Score: </span>
                            <span className="text-lg font-bold text-green-400">
                              {qa.score}/10
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-slate-400 mt-2">
                          <span className="font-semibold">Justification:</span> {qa.justification}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON */}
              <details className="bg-slate-700 rounded-lg p-4">
                <summary className="cursor-pointer font-semibold mb-2">View Raw JSON</summary>
                <pre className="mt-2 text-xs bg-slate-900 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


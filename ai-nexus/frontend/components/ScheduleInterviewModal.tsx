'use client'

import { useState } from 'react'
import { X, Upload, Calendar, User, FileText } from 'lucide-react'

interface ScheduleInterviewModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function ScheduleInterviewModal({ onClose, onSuccess }: ScheduleInterviewModalProps) {
  const [candidateName, setCandidateName] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['text/plain', 'application/pdf', 'text/markdown']
    const validExtensions = ['.txt', '.pdf', '.md']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload .txt, .pdf, or .md file')
      return
    }

    setJdFile(file)
    setError('')

    // Read text files
    if (file.type === 'text/plain' || fileExtension === '.txt' || fileExtension === '.md') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setJdText(e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const handleSubmit = async () => {
    if (!candidateName || !candidateEmail || !scheduledAt) {
      setError('Please fill in all required fields')
      return
    }

    if (!jdFile && !jdText.trim()) {
      setError('Job Description is mandatory. Please upload a file or enter text.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // In production, this would call the backend API
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Interview scheduled:', {
        candidateName,
        candidateEmail,
        scheduledAt,
        jdFile: jdFile?.name,
        jdText: jdText.substring(0, 100)
      })

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Schedule Interview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Candidate Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Candidate Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter candidate name"
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Candidate Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              placeholder="candidate@example.com"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date & Time <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
            </div>
          </div>

          {/* Job Description Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Upload Job Description <span className="text-red-400">*</span>
              <span className="text-xs text-slate-500 ml-2">(.pdf, .txt, .md)</span>
            </label>
            <div className="space-y-3">
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <span className="text-slate-400">
                    {jdFile ? jdFile.name : 'Click to upload or drag and drop'}
                  </span>
                  <input
                    type="file"
                    accept=".txt,.pdf,.md,text/plain,application/pdf,text/markdown"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </label>

              <div className="text-sm text-slate-400">OR</div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter JD Text
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste job description here..."
                  className="w-full h-32 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Scheduling...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Schedule Interview
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


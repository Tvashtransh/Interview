'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, FileText, TrendingUp } from 'lucide-react'

interface Report {
  interviewId: string
  candidateName: string
  role: string
  date: string
  overallScore: number
  aiSummaryHR: string
  qaBreakdown: Array<{
    question: string
    candidateAnswer: string
    idealAnswer: string
    score: number
    justification: string
  }>
  fullTranscript: string
}

export default function HRReportView() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.interviewId as string
  const [report, setReport] = useState<Report | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    // Load report - in production, fetch from API
    const mockReport: Report = {
      interviewId,
      candidateName: 'John Doe',
      role: 'Senior Software Engineer',
      date: '2024-01-15',
      overallScore: 85,
      aiSummaryHR: 'The candidate demonstrates strong technical skills in full-stack development with 5 years of experience. They showed good understanding of system design principles and cloud platforms. However, they could improve on explaining complex concepts more clearly. Overall, a solid candidate who would be a good fit for the role.',
      qaBreakdown: [
        {
          question: 'Can you tell me about yourself?',
          candidateAnswer: 'I\'m a software engineer with 5 years of experience in full-stack development. I\'ve worked with React, Node.js, and MongoDB.',
          idealAnswer: 'An ideal answer would cover your professional background, key technical skills relevant to the role, major achievements, and what drives you in your career. It should be concise (2-3 minutes) and highlight how your experience aligns with the job requirements.',
          score: 8,
          justification: 'Candidate covered key points about experience and technologies. Could be more specific about achievements and alignment with role requirements.'
        },
        {
          question: 'How would you design a scalable system?',
          candidateAnswer: 'I would start by identifying requirements, then design with microservices, use load balancing, and implement caching.',
          idealAnswer: 'A scalable system design should include: 1) Requirements gathering (traffic, data volume, latency), 2) High-level architecture (microservices, API gateway), 3) Database design (sharding, replication), 4) Caching strategy (Redis, CDN), 5) Load balancing, 6) Monitoring and auto-scaling. Discuss trade-offs and specific technologies.',
          score: 7,
          justification: 'Candidate mentioned key concepts but lacked depth. Should have discussed specific technologies, trade-offs, and monitoring strategies.'
        }
      ],
      fullTranscript: 'HR: Welcome to the interview...\nCandidate: Thank you...'
    }
    setReport(mockReport)
  }, [interviewId])

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
          {/* Report Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Interview Scorecard</h1>
            <div className="flex gap-6 text-slate-400">
              <div>
                <span className="font-medium text-white">Candidate:</span> {report.candidateName}
              </div>
              <div>
                <span className="font-medium text-white">Role:</span> {report.role}
              </div>
              <div>
                <span className="font-medium text-white">Date:</span> {report.date}
              </div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8 text-center">
            <div className="text-sm text-blue-100 mb-2">Overall AI Score</div>
            <div className="text-6xl font-bold mb-2">{report.overallScore}/100</div>
            <div className="text-blue-100">
              {report.overallScore >= 80 ? 'Excellent' : 
               report.overallScore >= 60 ? 'Good' : 
               report.overallScore >= 40 ? 'Average' : 'Needs Improvement'}
            </div>
          </div>

          {/* AI Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              AI-Generated Summary
            </h2>
            <div className="bg-slate-700/50 rounded-lg p-6">
              <p className="text-slate-300 leading-relaxed">{report.aiSummaryHR}</p>
            </div>
          </div>

          {/* Q&A Breakdown */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Question-by-Question Breakdown
            </h2>
            <div className="space-y-6">
              {report.qaBreakdown.map((qa, idx) => (
                <div key={idx} className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-blue-400 mb-2">
                      Q: {qa.question}
                    </div>
                    <div className="text-sm text-slate-300 mb-3">
                      <span className="font-medium">Candidate Answer:</span> {qa.candidateAnswer}
                    </div>
                    <div className="text-sm text-slate-300 mb-3">
                      <span className="font-medium">Ideal Answer:</span> {qa.idealAnswer}
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <span className="text-sm font-medium">AI Score: </span>
                        <span className="text-2xl font-bold text-green-400">
                          {qa.score}/10
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">
                      <span className="font-medium">Justification:</span> {qa.justification}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Transcript */}
          <div>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-between transition-colors"
            >
              <span className="font-medium">Full Transcript</span>
              <span>{showTranscript ? '▼' : '▶'}</span>
            </button>
            {showTranscript && (
              <div className="mt-4 bg-slate-700/50 rounded-lg p-6 max-h-96 overflow-y-auto">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                  {report.fullTranscript}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


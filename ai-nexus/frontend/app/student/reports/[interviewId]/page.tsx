'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Award, Lightbulb, FileText } from 'lucide-react'

interface Report {
  interviewId: string
  role: string
  date: string
  overallScore: number
  aiSummaryCandidate: string
  qaBreakdown: Array<{
    question: string
    candidateAnswer: string
    idealAnswer: string
    score: number
    improvementTip: string
  }>
  fullTranscript: string
}

export default function StudentReportView() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.interviewId as string
  const [report, setReport] = useState<Report | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    // Load report - in production, fetch from API
    const mockReport: Report = {
      interviewId,
      role: 'Senior Software Engineer',
      date: '2024-01-15',
      overallScore: 85,
      aiSummaryCandidate: 'Great job on your interview! You demonstrated strong technical knowledge and experience. Your answers were clear and showed good understanding of the technologies mentioned. To improve further, try to provide more specific examples from your past projects and explain complex concepts in simpler terms. Keep practicing and you\'ll continue to excel!',
      qaBreakdown: [
        {
          question: 'Can you tell me about yourself?',
          candidateAnswer: 'I\'m a software engineer with 5 years of experience in full-stack development. I\'ve worked with React, Node.js, and MongoDB.',
          idealAnswer: 'An ideal answer would cover your professional background, key technical skills relevant to the role, major achievements, and what drives you in your career. It should be concise (2-3 minutes) and highlight how your experience aligns with the job requirements.',
          score: 8,
          improvementTip: 'Great answer! Next time, try to also mention a specific achievement or project that demonstrates your skills. For example, "I led a team that reduced API response time by 40%" or "I built a feature that increased user engagement by 25%".'
        },
        {
          question: 'How would you design a scalable system?',
          candidateAnswer: 'I would start by identifying requirements, then design with microservices, use load balancing, and implement caching.',
          idealAnswer: 'A scalable system design should include: 1) Requirements gathering (traffic, data volume, latency), 2) High-level architecture (microservices, API gateway), 3) Database design (sharding, replication), 4) Caching strategy (Redis, CDN), 5) Load balancing, 6) Monitoring and auto-scaling. Discuss trade-offs and specific technologies.',
          score: 7,
          improvementTip: 'Good start! To make your answer stronger, walk through a specific example. For instance, "For a social media app expecting 1M users, I would use a microservices architecture with an API gateway. For the database, I\'d use sharding with MongoDB and Redis for caching. I\'d implement horizontal scaling with Kubernetes..."'
        }
      ],
      fullTranscript: 'HR: Welcome to the interview...\nCandidate: Thank you...'
    }
    setReport(mockReport)
  }, [interviewId])

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
            <h1 className="text-3xl font-bold mb-2">Your Interview Report</h1>
            <div className="flex gap-6 text-slate-400">
              <div>
                <span className="font-medium text-white">Role:</span> {report.role}
              </div>
              <div>
                <span className="font-medium text-white">Date:</span> {report.date}
              </div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 mb-8 text-center">
            <div className="text-sm text-purple-100 mb-2">Your Performance Score</div>
            <div className="text-6xl font-bold mb-2">{report.overallScore}/100</div>
            <div className="text-purple-100">
              {report.overallScore >= 80 ? 'Excellent Work! 🎉' : 
               report.overallScore >= 60 ? 'Good Job! 👍' : 
               report.overallScore >= 40 ? 'Keep Practicing! 💪' : 'Room for Growth 📈'}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Performance Summary
            </h2>
            <div className="bg-slate-700/50 rounded-lg p-6">
              <p className="text-slate-300 leading-relaxed">{report.aiSummaryCandidate}</p>
            </div>
          </div>

          {/* Your Interview Breakdown */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Your Interview Breakdown</h2>
            <div className="space-y-6">
              {report.qaBreakdown.map((qa, idx) => (
                <div key={idx} className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-purple-400 mb-2">
                      Q: {qa.question}
                    </div>
                    <div className="text-sm text-slate-300 mb-3">
                      <span className="font-medium">Your Answer:</span> {qa.candidateAnswer}
                    </div>
                    <div className="text-sm text-slate-300 mb-3">
                      <span className="font-medium">What a Top-Scoring Answer Looks Like:</span> {qa.idealAnswer}
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <span className="text-sm font-medium">Your Score: </span>
                        <span className="text-2xl font-bold text-green-400">
                          {qa.score}/10
                        </span>
                      </div>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-blue-400 mb-1">Improvement Tip</div>
                          <div className="text-sm text-slate-300">{qa.improvementTip}</div>
                        </div>
                      </div>
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
              <span className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Full Transcript
              </span>
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


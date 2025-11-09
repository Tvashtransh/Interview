'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Calendar, TrendingUp, Users } from 'lucide-react'
import ScheduleInterviewModal from '@/components/ScheduleInterviewModal'

interface Interview {
  interviewId: string
  candidateName: string
  scheduledAt: string
  status: string
  overallScore?: number
}

export default function HRDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    averageScore: 0,
    activeCandidates: 0
  })

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'HR_Recruiter') {
      router.push('/auth')
      return
    }

    setUser(parsedUser)
    loadInterviews()
  }, [router])

  const loadInterviews = async () => {
    // Mock data for demo
    const mockInterviews: Interview[] = [
      {
        interviewId: 'int-001',
        candidateName: 'John Doe',
        scheduledAt: '2024-01-15T10:00:00Z',
        status: 'completed',
        overallScore: 85
      },
      {
        interviewId: 'int-002',
        candidateName: 'Jane Smith',
        scheduledAt: '2024-01-16T14:00:00Z',
        status: 'scheduled'
      }
    ]
    setInterviews(mockInterviews)
    
    // Calculate stats
    const completed = mockInterviews.filter(i => i.status === 'completed')
    const avgScore = completed.length > 0
      ? completed.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completed.length
      : 0
    
    setStats({
      totalInterviews: mockInterviews.length,
      completedInterviews: completed.length,
      averageScore: Math.round(avgScore),
      activeCandidates: new Set(mockInterviews.map(i => i.candidateName)).size
    })
  }

  const handleViewReport = (interviewId: string) => {
    router.push(`/hr/reports/${interviewId}`)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">HR Portal</h1>
              <p className="text-slate-400">Welcome back, {user.name}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('user')
                router.push('/auth')
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Interviews</p>
                <p className="text-3xl font-bold">{stats.totalInterviews}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Completed</p>
                <p className="text-3xl font-bold">{stats.completedInterviews}</p>
              </div>
              <FileText className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Average Score</p>
                <p className="text-3xl font-bold">{stats.averageScore}/100</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Active Candidates</p>
                <p className="text-3xl font-bold">{stats.activeCandidates}</p>
              </div>
              <Users className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Job Postings / Interviews List */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">Interviews</h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Schedule Interview
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {interviews.map((interview) => (
                  <tr key={interview.interviewId} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">{interview.candidateName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(interview.scheduledAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        interview.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400'
                          : interview.status === 'in-progress'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {interview.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {interview.overallScore ? (
                        <span className="font-semibold">{interview.overallScore}/100</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {interview.status === 'completed' ? (
                        <button
                          onClick={() => handleViewReport(interview.interviewId)}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          View Report
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/interviews/${interview.interviewId}`)}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Start Interview
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <ScheduleInterviewModal
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false)
            loadInterviews()
          }}
        />
      )}
    </div>
  )
}


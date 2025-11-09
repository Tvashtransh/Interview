'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, TrendingUp, Award, Clock } from 'lucide-react'

interface Interview {
  interviewId: string
  scheduledAt: string
  status: string
  overallScore?: number
  role?: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([])
  const [pastInterviews, setPastInterviews] = useState<Interview[]>([])
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    upcomingCount: 0
  })

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'Student_Candidate') {
      router.push('/auth')
      return
    }

    setUser(parsedUser)
    loadInterviews()
  }, [router])

  const loadInterviews = async () => {
    // Mock data for demo
    const mockUpcoming: Interview[] = [
      {
        interviewId: 'int-003',
        scheduledAt: '2024-01-20T10:00:00Z',
        status: 'scheduled',
        role: 'Senior Software Engineer'
      }
    ]

    const mockPast: Interview[] = [
      {
        interviewId: 'int-001',
        scheduledAt: '2024-01-10T10:00:00Z',
        status: 'completed',
        overallScore: 85,
        role: 'Full Stack Developer'
      },
      {
        interviewId: 'int-002',
        scheduledAt: '2024-01-05T14:00:00Z',
        status: 'completed',
        overallScore: 78,
        role: 'React Developer'
      }
    ]

    setUpcomingInterviews(mockUpcoming)
    setPastInterviews(mockPast)

    // Calculate stats
    const allCompleted = mockPast.filter(i => i.status === 'completed' && i.overallScore)
    const avgScore = allCompleted.length > 0
      ? allCompleted.reduce((sum, i) => sum + (i.overallScore || 0), 0) / allCompleted.length
      : 0
    const bestScore = allCompleted.length > 0
      ? Math.max(...allCompleted.map(i => i.overallScore || 0))
      : 0

    setStats({
      totalInterviews: mockPast.length,
      averageScore: Math.round(avgScore),
      bestScore,
      upcomingCount: mockUpcoming.length
    })
  }

  const handleViewReport = (interviewId: string) => {
    router.push(`/student/reports/${interviewId}`)
  }

  const handleStartInterview = (interviewId: string) => {
    router.push(`/interviews/${interviewId}`)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">My Dashboard</h1>
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
                <p className="text-sm text-slate-400 mb-1">Average Score</p>
                <p className="text-3xl font-bold">{stats.averageScore}/100</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Best Score</p>
                <p className="text-3xl font-bold">{stats.bestScore}/100</p>
              </div>
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Upcoming</p>
                <p className="text-3xl font-bold">{stats.upcomingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Upcoming Interviews */}
        {upcomingInterviews.length > 0 && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 mb-8">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold">Upcoming Interviews</h2>
            </div>
            <div className="p-6 space-y-4">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.interviewId}
                  className="bg-slate-700/50 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold">{interview.role || 'Interview'}</h3>
                    <p className="text-sm text-slate-400">
                      {new Date(interview.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartInterview(interview.interviewId)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Start Interview
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance History */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold">Performance History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {pastInterviews.map((interview) => (
                  <tr key={interview.interviewId} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">{interview.role || 'Interview'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(interview.scheduledAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {interview.overallScore ? (
                        <span className="font-semibold">{interview.overallScore}/100</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewReport(interview.interviewId)}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


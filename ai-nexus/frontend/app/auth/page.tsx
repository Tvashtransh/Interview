'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, User, LogIn } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'HR_Recruiter' | 'Student_Candidate' | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleLogin = () => {
    if (!selectedRole) {
      alert('Please select a role')
      return
    }

    // Mock authentication - store in localStorage
    const userData = {
      role: selectedRole,
      name: name || (selectedRole === 'HR_Recruiter' ? 'HR Recruiter' : 'Student Candidate'),
      email: email || `${selectedRole.toLowerCase().replace('_', '-')}@example.com`
    }
    
    localStorage.setItem('user', JSON.stringify(userData))
    
    // Redirect to appropriate dashboard
    if (selectedRole === 'HR_Recruiter') {
      router.push('/hr/dashboard')
    } else {
      router.push('/student/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI-NEXUS
          </h1>
          <p className="text-slate-400">From Subjective to Objective</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
            />
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
            />
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-4">
              Select Your Role
            </label>
            <div className="space-y-3">
              {/* HR Role */}
              <button
                onClick={() => setSelectedRole('HR_Recruiter')}
                className={`w-full p-4 border-2 rounded-lg transition-all ${
                  selectedRole === 'HR_Recruiter'
                    ? 'border-blue-500 bg-blue-500/20 shadow-lg'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedRole === 'HR_Recruiter' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'
                  }`}>
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">HR / Recruiter</div>
                    <div className="text-sm text-slate-400">Manage interviews, view scorecards</div>
                  </div>
                  {selectedRole === 'HR_Recruiter' && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>

              {/* Student Role */}
              <button
                onClick={() => setSelectedRole('Student_Candidate')}
                className={`w-full p-4 border-2 rounded-lg transition-all ${
                  selectedRole === 'Student_Candidate'
                    ? 'border-purple-500 bg-purple-500/20 shadow-lg'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedRole === 'Student_Candidate' ? 'bg-purple-500 text-white' : 'bg-slate-600 text-slate-300'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">Student / Candidate</div>
                    <div className="text-sm text-slate-400">Practice interviews, view feedback</div>
                  </div>
                  {selectedRole === 'Student_Candidate' && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={!selectedRole}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <LogIn className="w-5 h-5" />
            <span>Continue</span>
          </button>

          <p className="text-xs text-slate-500 text-center mt-4">
            Demo Mode: No real authentication required
          </p>
        </div>
      </div>
    </div>
  )
}


'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Users, Video, Brain } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI-NEXUS
          </h1>
          <p className="text-2xl text-slate-300 mb-2">From Subjective to Objective</p>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Transform interviews with AI-powered analysis, real-time transcription, and data-driven insights
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 mb-20">
          <Link
            href="/auth"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/spike/live-interview"
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Try Live Interview
          </Link>
          <Link
            href="/spike/schedule-interview"
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            Test AI Analysis
          </Link>
        </div>

        {/* Dual-Sided Value Prop */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
            <Users className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-2xl font-bold mb-4 text-white">For HR & Recruiters</h3>
            <ul className="space-y-2 text-slate-300">
              <li>✓ AI-generated scorecards and candidate assessments</li>
              <li>✓ Objective evaluation metrics</li>
              <li>✓ Question-by-question analysis</li>
              <li>✓ JD-aligned candidate matching</li>
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
            <Brain className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold mb-4 text-white">For Candidates</h3>
            <ul className="space-y-2 text-slate-300">
              <li>✓ Personalized performance feedback</li>
              <li>✓ Improvement tips and ideal answers</li>
              <li>✓ Performance history tracking</li>
              <li>✓ Practice interview opportunities</li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">1. Live Interview</h3>
              <p className="text-slate-400">Conduct interviews via LiveKit with real-time transcription</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">2. AI Analysis</h3>
              <p className="text-slate-400">AI analyzes responses against JD and generates ideal answers</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">3. Objective Reports</h3>
              <p className="text-slate-400">Get detailed scorecards and actionable insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

